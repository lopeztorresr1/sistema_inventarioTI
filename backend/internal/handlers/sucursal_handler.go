package handlers

import (
	"gestion-activos-ti/backend/internal/database"
	"gestion-activos-ti/backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateSucursal(c *gin.Context) {
	var sucursal models.Sucursal
	if err := c.ShouldBindJSON(&sucursal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}
	if err := database.DB.Create(&sucursal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo crear la sucursal"})
		return
	}
	c.JSON(http.StatusCreated, sucursal)
}

func GetSucursales(c *gin.Context) {
	var sucursales []models.Sucursal
	if err := database.DB.Find(&sucursales).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener sucursales"})
		return
	}
	c.JSON(http.StatusOK, sucursales)
}

func UpdateSucursal(c *gin.Context) {
	id := c.Param("id")
	var sucursal models.Sucursal
	if err := database.DB.First(&sucursal, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sucursal no encontrada"})
		return
	}
	if err := c.ShouldBindJSON(&sucursal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}
	database.DB.Save(&sucursal)
	c.JSON(http.StatusOK, sucursal)
}

// DeleteSucursal bloquea el borrado si hay empleados o equipos vinculados,
// evitando romper la integridad referencial silenciosamente.
func DeleteSucursal(c *gin.Context) {
	id := c.Param("id")
	var sucursal models.Sucursal
	if err := database.DB.First(&sucursal, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sucursal no encontrada"})
		return
	}

	var empCount, eqCount int64
	database.DB.Model(&models.Empleado{}).Where("sucursal_id = ? AND estado = true", id).Count(&empCount)
	database.DB.Model(&models.Equipo{}).Where("sucursal_id = ? AND activo = true", id).Count(&eqCount)

	if empCount > 0 || eqCount > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"error":     "No se puede eliminar: la sucursal tiene registros activos asociados",
			"empleados": empCount,
			"equipos":   eqCount,
		})
		return
	}

	if err := database.DB.Delete(&sucursal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo eliminar la sucursal"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Sucursal eliminada correctamente"})
}
