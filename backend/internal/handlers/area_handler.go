package handlers

import (
	"gestion-activos-ti/backend/internal/database"
	"gestion-activos-ti/backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateArea(c *gin.Context) {
	var area models.Area
	if err := c.ShouldBindJSON(&area); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}
	if err := database.DB.Create(&area).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear área"})
		return
	}
	database.DB.Preload("Grupo.Sucursal").First(&area, area.ID)
	c.JSON(http.StatusCreated, area)
}

func GetAreas(c *gin.Context) {
	var areas []models.Area
	if err := database.DB.Preload("Grupo.Sucursal").Find(&areas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron obtener las áreas"})
		return
	}
	c.JSON(http.StatusOK, areas)
}

func UpdateArea(c *gin.Context) {
	id := c.Param("id")
	var area models.Area
	if err := database.DB.First(&area, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Área no encontrada"})
		return
	}
	if err := c.ShouldBindJSON(&area); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Save(&area)
	database.DB.Preload("Grupo.Sucursal").First(&area, area.ID)
	c.JSON(http.StatusOK, area)
}

// DeleteArea bloquea el borrado si hay empleados activos en el área.
func DeleteArea(c *gin.Context) {
	id := c.Param("id")
	var area models.Area
	if err := database.DB.First(&area, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Área no encontrada"})
		return
	}

	var empCount int64
	database.DB.Model(&models.Empleado{}).Where("area_id = ? AND estado = true", id).Count(&empCount)
	if empCount > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"error":     "No se puede eliminar: el área tiene empleados activos",
			"empleados": empCount,
		})
		return
	}

	if err := database.DB.Delete(&area).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo eliminar el área"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Área eliminada correctamente"})
}
