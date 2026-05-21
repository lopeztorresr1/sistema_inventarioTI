package handlers

import (
	"gestion-activos-ti/backend/internal/database"
	"gestion-activos-ti/backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ─── TIPOS DE EQUIPO ────────────────────────────────────────────────────────

func CreateTipoEquipo(c *gin.Context) {
	var tipo models.TipoEquipo
	if err := c.ShouldBindJSON(&tipo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Create(&tipo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear tipo de equipo"})
		return
	}
	c.JSON(http.StatusCreated, tipo)
}

func GetTiposEquipo(c *gin.Context) {
	var tipos []models.TipoEquipo
	if err := database.DB.Find(&tipos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener tipos de equipo"})
		return
	}
	c.JSON(http.StatusOK, tipos)
}

func UpdateTipoEquipo(c *gin.Context) {
	id := c.Param("id")
	var tipo models.TipoEquipo
	if err := database.DB.First(&tipo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tipo de equipo no encontrado"})
		return
	}
	if err := c.ShouldBindJSON(&tipo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Save(&tipo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar"})
		return
	}
	c.JSON(http.StatusOK, tipo)
}

// DeleteTipoEquipo hace baja lógica. Bloquea si existen modelos activos vinculados.
func DeleteTipoEquipo(c *gin.Context) {
	id := c.Param("id")

	var modeloCount int64
	database.DB.Model(&models.ModeloEquipo{}).Where("tipo_equipo_id = ?", id).Count(&modeloCount)
	if modeloCount > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "No se puede desactivar: hay modelos vinculados a este tipo",
			"modelos": modeloCount,
		})
		return
	}

	result := database.DB.Model(&models.TipoEquipo{}).Where("id = ?", id).Update("estado", false)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo dar de baja"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Categoría dada de baja correctamente"})
}

// ─── MODELOS DE EQUIPO ───────────────────────────────────────────────────────

func CreateModeloEquipo(c *gin.Context) {
	var modelo models.ModeloEquipo
	if err := c.ShouldBindJSON(&modelo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Select explícito para evitar insertar objetos de relación
	if err := database.DB.Select("Nombre", "MarcaID", "TipoEquipoID").Create(&modelo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear modelo"})
		return
	}
	database.DB.Preload("TipoEquipo").Preload("Marca").First(&modelo, modelo.ID)
	c.JSON(http.StatusCreated, modelo)
}

func GetModelosEquipo(c *gin.Context) {
	var modelos []models.ModeloEquipo
	if err := database.DB.Preload("TipoEquipo").Preload("Marca").Find(&modelos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, modelos)
}

func UpdateModeloEquipo(c *gin.Context) {
	id := c.Param("id")
	var modelo models.ModeloEquipo
	if err := database.DB.First(&modelo, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Modelo no encontrado"})
		return
	}
	if err := c.ShouldBindJSON(&modelo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Save(&modelo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar modelo"})
		return
	}
	database.DB.Preload("TipoEquipo").Preload("Marca").First(&modelo, modelo.ID)
	c.JSON(http.StatusOK, modelo)
}

// DeleteModeloEquipo bloquea el borrado si hay equipos usando ese modelo.
func DeleteModeloEquipo(c *gin.Context) {
	id := c.Param("id")

	var equipoCount int64
	database.DB.Model(&models.Equipo{}).Where("modelo_equipo_id = ? AND activo = true", id).Count(&equipoCount)
	if equipoCount > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "No se puede eliminar: hay equipos activos con este modelo",
			"equipos": equipoCount,
		})
		return
	}

	if err := database.DB.Delete(&models.ModeloEquipo{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo eliminar el modelo"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Modelo eliminado correctamente"})
}

// ─── MARCAS ──────────────────────────────────────────────────────────────────

func CreateMarca(c *gin.Context) {
	var marca models.Marca
	if err := c.ShouldBindJSON(&marca); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Create(&marca).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear marca"})
		return
	}
	c.JSON(http.StatusCreated, marca)
}

func GetMarcas(c *gin.Context) {
	var marcas []models.Marca
	if err := database.DB.Find(&marcas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener marcas"})
		return
	}
	c.JSON(http.StatusOK, marcas)
}

func UpdateMarca(c *gin.Context) {
	id := c.Param("id")
	var marca models.Marca
	if err := database.DB.First(&marca, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Marca no encontrada"})
		return
	}
	if err := c.ShouldBindJSON(&marca); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Save(&marca).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar marca"})
		return
	}
	c.JSON(http.StatusOK, marca)
}

// DeleteMarca bloquea si hay modelos vinculados.
func DeleteMarca(c *gin.Context) {
	id := c.Param("id")

	var modeloCount int64
	database.DB.Model(&models.ModeloEquipo{}).Where("marca_id = ?", id).Count(&modeloCount)
	if modeloCount > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "No se puede eliminar: hay modelos vinculados a esta marca",
			"modelos": modeloCount,
		})
		return
	}

	if err := database.DB.Delete(&models.Marca{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo eliminar"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Marca eliminada"})
}
