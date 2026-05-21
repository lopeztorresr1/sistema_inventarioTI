package handlers

import (
	"gestion-activos-ti/backend/internal/database"
	"gestion-activos-ti/backend/internal/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func CreateReparacion(c *gin.Context) {
	var reparacion models.Reparacion
	if err := c.ShouldBindJSON(&reparacion); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var equipo models.Equipo
		if err := tx.First(&equipo, reparacion.EquipoID).Error; err != nil {
			return err
		}

		if equipo.Estado != "DISPONIBLE" {
			return &appError{
				Code:    http.StatusConflict,
				Message: "El equipo debe estar DISPONIBLE para ingresar a reparación. Estado actual: " + equipo.Estado,
			}
		}

		reparacion.FechaIngreso = time.Now()
		reparacion.Estado = "PROCESO"

		if err := tx.Create(&reparacion).Error; err != nil {
			return err
		}

		return tx.Model(&equipo).Update("estado", "REPARACION").Error
	})

	if err != nil {
		handleTransactionError(c, err)
		return
	}

	c.JSON(http.StatusCreated, reparacion)
}

// GetReparaciones lista todos los registros de reparación con datos del equipo.
func GetReparaciones(c *gin.Context) {
	var reparaciones []models.Reparacion

	db := database.DB.Preload("Equipo.Modelo.Marca").Preload("Equipo.Modelo.TipoEquipo")

	// Filtro opcional por estado: ?estado=PROCESO
	if estado := c.Query("estado"); estado != "" {
		db = db.Where("estado = ?", estado)
	}

	if err := db.Order("fecha_ingreso DESC").Find(&reparaciones).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener reparaciones"})
		return
	}

	c.JSON(http.StatusOK, reparaciones)
}

func FinalizarReparacion(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		Diagnostico string  `json:"diagnostico" binding:"required"`
		Solucion    string  `json:"solucion"`
		Costo       float64 `json:"costo"`
		Estado      string  `json:"estado" binding:"required,oneof=REPARADO IRREPARABLE"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos de cierre inválidos: " + err.Error()})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var reparacion models.Reparacion
		if err := tx.First(&reparacion, id).Error; err != nil {
			return err
		}

		if reparacion.Estado != "PROCESO" {
			return &appError{
				Code:    http.StatusBadRequest,
				Message: "Solo se pueden finalizar reparaciones en estado PROCESO",
			}
		}

		ahora := time.Now()
		reparacion.FechaSalida = &ahora
		reparacion.Diagnostico = input.Diagnostico
		reparacion.Solucion = input.Solucion
		reparacion.Costo = input.Costo
		reparacion.Estado = input.Estado

		if err := tx.Save(&reparacion).Error; err != nil {
			return err
		}

		nuevoEstado := "DISPONIBLE"
		if input.Estado == "IRREPARABLE" {
			nuevoEstado = "BAJA"
		}

		return tx.Model(&models.Equipo{}).Where("id = ?", reparacion.EquipoID).
			Update("estado", nuevoEstado).Error
	})

	if err != nil {
		handleTransactionError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reparación finalizada correctamente"})
}
