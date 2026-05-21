package handlers

import (
	"gestion-activos-ti/backend/internal/database"
	"gestion-activos-ti/backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateEmpleado(c *gin.Context) {
	var empleado models.Empleado
	if err := c.ShouldBindJSON(&empleado); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	// Select explícito para evitar insertar objetos de relación vacíos
	result := database.DB.
		Select("Nombre", "Apellido", "Cargo", "Estado", "SucursalID", "GrupoID", "AreaID").
		Create(&empleado)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo crear el empleado"})
		return
	}

	database.DB.Preload("Sucursal").Preload("Grupo").Preload("Area").First(&empleado, empleado.ID)
	c.JSON(http.StatusCreated, empleado)
}

func GetEmpleados(c *gin.Context) {
	var empleados []models.Empleado

	db := database.DB.Preload("Sucursal").Preload("Grupo").Preload("Area")

	// Filtro opcional: ?activo=true / ?activo=false
	if activo := c.Query("activo"); activo != "" {
		db = db.Where("estado = ?", activo == "true")
	}

	if err := db.Find(&empleados).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al consultar empleados"})
		return
	}
	c.JSON(http.StatusOK, empleados)
}

func UpdateEmpleado(c *gin.Context) {
	id := c.Param("id")
	var empleado models.Empleado
	if err := database.DB.First(&empleado, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Empleado no encontrado"})
		return
	}
	if err := c.ShouldBindJSON(&empleado); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Save(&empleado).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar empleado"})
		return
	}
	database.DB.Preload("Sucursal").Preload("Grupo").Preload("Area").First(&empleado, empleado.ID)
	c.JSON(http.StatusOK, empleado)
}

// DeleteEmpleado hace baja lógica. Si el empleado tiene activos asignados,
// devuelve advertencia pero no bloquea (el administrador debe desasignarlos primero).
func DeleteEmpleado(c *gin.Context) {
	id := c.Param("id")

	// Verificar si tiene asignaciones activas
	var asigCount int64
	database.DB.Model(&models.Asignacion{}).
		Where("empleado_id = ? AND estado = 'ACTIVA'", id).
		Count(&asigCount)

	if asigCount > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"error":      "El empleado tiene equipos asignados. Desasígnalos primero.",
			"asignaciones_activas": asigCount,
		})
		return
	}

	result := database.DB.Model(&models.Empleado{}).Where("id = ?", id).Update("estado", false)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo dar de baja al empleado"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Empleado no encontrado"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Empleado dado de baja exitosamente"})
}
