package handlers

import (
	"fmt"
	"gestion-activos-ti/backend/internal/database"
	"gestion-activos-ti/backend/internal/models"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// mu protege la generación de código de equipo contra condiciones de carrera.
var mu sync.Mutex

// GetEquipos soporta paginación (?page=1&limit=20) y filtros.
func GetEquipos(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	db := database.DB.Model(&models.Equipo{}).
		Preload("Modelo.Marca").
		Preload("Modelo.TipoEquipo").
		Preload("Sucursal")

	activo := c.DefaultQuery("activo", "true")
	db = db.Where("activo = ?", activo == "true")

	if sucursalID := c.Query("sucursal_id"); sucursalID != "" {
		db = db.Where("sucursal_id = ?", sucursalID)
	}
	if estado := c.Query("estado"); estado != "" {
		db = db.Where("estado = ?", estado)
	}
	if q := c.Query("q"); q != "" {
		query := "%" + q + "%"
		db = db.Where("serie LIKE ? OR codigo LIKE ? OR nombre LIKE ?", query, query, query)
	}

	var total int64
	db.Count(&total)

	var equipos []models.Equipo
	if err := db.Limit(limit).Offset(offset).Find(&equipos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar equipos"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  equipos,
		"total": total,
		"page":  page,
		"limit": limit,
		"pages": (int(total) + limit - 1) / limit,
	})
}

func GetDetalleEquipo(c *gin.Context) {
	id := c.Param("id")
	var equipo models.Equipo

	err := database.DB.
		Preload("Modelo.Marca").
		Preload("Modelo.TipoEquipo").
		Preload("Sucursal").
		First(&equipo, id).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Equipo no encontrado"})
		return
	}

	c.JSON(http.StatusOK, equipo)
}

// CreateEquipo genera el código de manera atómica para evitar duplicados concurrentes.
func CreateEquipo(c *gin.Context) {
	var equipo models.Equipo
	if err := c.ShouldBindJSON(&equipo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var sucursal models.Sucursal
		if err := tx.First(&sucursal, equipo.SucursalID).Error; err != nil {
			return &appError{Code: http.StatusBadRequest, Message: "Sucursal no válida"}
		}

		// Lock de aplicación: garantiza que el COUNT y el INSERT sean atómicos
		mu.Lock()
		defer mu.Unlock()

		var count int64
		tx.Model(&models.Equipo{}).Where("sucursal_id = ?", equipo.SucursalID).Count(&count)

		equipo.Codigo = fmt.Sprintf("%s-%04d", sucursal.Prefix, count+1)
		equipo.Activo = true
		equipo.Estado = "DISPONIBLE"

		return tx.Create(&equipo).Error
	})

	if err != nil {
		handleTransactionError(c, err)
		return
	}

	c.JSON(http.StatusCreated, equipo)
}

func UpdateEquipo(c *gin.Context) {
	id := c.Param("id")
	var equipo models.Equipo
	if err := database.DB.First(&equipo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Equipo no encontrado"})
		return
	}

	if err := c.ShouldBindJSON(&equipo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Save(&equipo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar equipo"})
		return
	}

	database.DB.Preload("Modelo.Marca").Preload("Modelo.TipoEquipo").Preload("Sucursal").
		First(&equipo, equipo.ID)
	c.JSON(http.StatusOK, equipo)
}

// BajaEquipo: baja lógica + cierre automático de asignación activa.
func BajaEquipo(c *gin.Context) {
	id := c.Param("id")

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var equipo models.Equipo
		if err := tx.First(&equipo, id).Error; err != nil {
			return err
		}

		if err := tx.Model(&equipo).Updates(map[string]interface{}{
			"activo": false,
			"estado": "BAJA",
		}).Error; err != nil {
			return err
		}

		// Si tiene asignación activa, la cerramos automáticamente
		var asignacion models.Asignacion
		res := tx.Where("equipo_id = ? AND estado = 'ACTIVA'", id).First(&asignacion)
		if res.Error == nil {
			ahora := time.Now()
			return tx.Model(&asignacion).Updates(map[string]interface{}{
				"fecha_devolucion": &ahora,
				"estado":           "FINALIZADA",
				"notas":            asignacion.Notas + " [CIERRE AUTOMÁTICO POR BAJA TÉCNICA]",
			}).Error
		} else if res.Error != gorm.ErrRecordNotFound {
			return res.Error
		}

		return nil
	})

	if err != nil {
		handleTransactionError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Equipo enviado a bajas correctamente"})
}

func ReactivarEquipo(c *gin.Context) {
	id := c.Param("id")
	var equipo models.Equipo

	if err := database.DB.First(&equipo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Equipo no encontrado"})
		return
	}

	if err := database.DB.Model(&equipo).Updates(map[string]interface{}{
		"activo": true,
		"estado": "DISPONIBLE",
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al reactivar el equipo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Equipo reactivado exitosamente", "data": equipo})
}

func GetHistorialEquipo(c *gin.Context) {
	equipoID := c.Param("id")
	var historial []models.Asignacion

	err := database.DB.
		Preload("Empleado.Area").
		Preload("Empleado.Sucursal").
		Where("equipo_id = ?", equipoID).
		Order("fecha_entrega DESC").
		Find(&historial).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al consultar historial"})
		return
	}

	c.JSON(http.StatusOK, historial)
}
