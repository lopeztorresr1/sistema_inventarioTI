package handlers

import (
	"gestion-activos-ti/backend/internal/database"
	"gestion-activos-ti/backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateGrupo(c *gin.Context) {
	var grupo models.Grupo
	if err := c.ShouldBindJSON(&grupo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}
	if err := database.DB.Create(&grupo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear grupo"})
		return
	}
	database.DB.Preload("Sucursal").First(&grupo, grupo.ID)
	c.JSON(http.StatusCreated, grupo)
}

func GetGrupos(c *gin.Context) {
	var grupos []models.Grupo
	if err := database.DB.Preload("Sucursal").Find(&grupos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron obtener los grupos"})
		return
	}
	c.JSON(http.StatusOK, grupos)
}

func UpdateGrupo(c *gin.Context) {
	id := c.Param("id")
	var grupo models.Grupo
	if err := database.DB.First(&grupo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Grupo no encontrado"})
		return
	}
	if err := c.ShouldBindJSON(&grupo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Save(&grupo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar grupo"})
		return
	}
	database.DB.Preload("Sucursal").First(&grupo, grupo.ID)
	c.JSON(http.StatusOK, grupo)
}

// DeleteGrupo bloquea el borrado si hay áreas vinculadas al grupo.
func DeleteGrupo(c *gin.Context) {
	id := c.Param("id")
	var grupo models.Grupo
	if err := database.DB.First(&grupo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Grupo no encontrado"})
		return
	}

	var areaCount int64
	database.DB.Model(&models.Area{}).Where("grupo_id = ?", id).Count(&areaCount)
	if areaCount > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"error":  "No se puede eliminar: el grupo tiene áreas asociadas",
			"areas": areaCount,
		})
		return
	}

	if err := database.DB.Delete(&grupo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo eliminar el grupo"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Grupo eliminado correctamente"})
}
