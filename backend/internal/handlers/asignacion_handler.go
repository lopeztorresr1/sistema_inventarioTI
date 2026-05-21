package handlers

import (
	"errors"
	"gestion-activos-ti/backend/internal/database"
	"gestion-activos-ti/backend/internal/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// finalizarAsignacionTx es la lógica compartida para cerrar una asignación activa.
// Recibe una transacción ya iniciada para poder usarse desde múltiples handlers.
func finalizarAsignacionTx(tx *gorm.DB, asignacion *models.Asignacion) error {
	if asignacion.Estado == "FINALIZADA" {
		return errors.New("la asignación ya fue finalizada")
	}

	ahora := time.Now()
	if err := tx.Model(asignacion).Updates(map[string]interface{}{
		"fecha_devolucion": &ahora,
		"estado":           "FINALIZADA",
	}).Error; err != nil {
		return err
	}

	if err := tx.Model(&models.Equipo{}).Where("id = ?", asignacion.EquipoID).
		Update("estado", "DISPONIBLE").Error; err != nil {
		return err
	}

	return nil
}

func CreateAsignacion(c *gin.Context) {
	var asignacion models.Asignacion
	if err := c.ShouldBindJSON(&asignacion); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var equipo models.Equipo
		if err := tx.First(&equipo, asignacion.EquipoID).Error; err != nil {
			return err
		}

		if equipo.Estado != "DISPONIBLE" {
			return &appError{
				Code:    http.StatusConflict,
				Message: "El equipo no está disponible (estado actual: " + equipo.Estado + ")",
			}
		}

		asignacion.FechaEntrega = time.Now()
		asignacion.Estado = "ACTIVA"

		if err := tx.Create(&asignacion).Error; err != nil {
			return err
		}

		return tx.Model(&equipo).Update("estado", "ASIGNADO").Error
	})

	if err != nil {
		handleTransactionError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Asignación registrada exitosamente",
		"data":    asignacion,
	})
}

func GetAsignaciones(c *gin.Context) {
	var asignaciones []models.Asignacion
	if err := database.DB.
		Preload("Equipo.Modelo.Marca").
		Preload("Equipo.Modelo.TipoEquipo").
		Preload("Empleado.Area").
		Find(&asignaciones).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener asignaciones"})
		return
	}
	c.JSON(http.StatusOK, asignaciones)
}

// FinalizarAsignacion cierra una asignación por su propio ID.
func FinalizarAsignacion(c *gin.Context) {
	id := c.Param("id")
	var asignacion models.Asignacion

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&asignacion, id).Error; err != nil {
			return err
		}
		return finalizarAsignacionTx(tx, &asignacion)
	})

	if err != nil {
		handleTransactionError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Equipo devuelto y disponible nuevamente"})
}

// DesasignarEquipo cierra la asignación activa de un equipo usando el ID del equipo.
// Comparte la lógica con FinalizarAsignacion a través de finalizarAsignacionTx.
func DesasignarEquipo(c *gin.Context) {
	equipoID := c.Param("id")
	var asignacion models.Asignacion

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("equipo_id = ? AND estado = 'ACTIVA'", equipoID).
			First(&asignacion).Error; err != nil {
			return err
		}
		return finalizarAsignacionTx(tx, &asignacion)
	})

	if err != nil {
		handleTransactionError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Equipo desasignado exitosamente"})
}

func GetAsignacionesByEmpleado(c *gin.Context) {
	empleadoID := c.Param("id")
	var asignaciones []models.Asignacion

	err := database.DB.
		Preload("Equipo.Modelo.Marca").
		Preload("Equipo.Modelo.TipoEquipo").
		Where("empleado_id = ? AND estado = 'ACTIVA'", empleadoID).
		Find(&asignaciones).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al consultar activos del empleado"})
		return
	}

	c.JSON(http.StatusOK, asignaciones)
}

func GetHistorialEmpleado(c *gin.Context) {
	empleadoID := c.Param("id")
	var historial []models.Asignacion

	err := database.DB.
		Preload("Equipo.Modelo.Marca").
		Preload("Equipo.Modelo.TipoEquipo").
		Where("empleado_id = ?", empleadoID).
		Order("fecha_entrega DESC").
		Find(&historial).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al consultar historial"})
		return
	}

	c.JSON(http.StatusOK, historial)
}

// --- Helpers de error ---

// appError permite devolver un código HTTP específico desde dentro de una transacción.
type appError struct {
	Code    int
	Message string
}

func (e *appError) Error() string { return e.Message }

func handleTransactionError(c *gin.Context, err error) {
	var appErr *appError
	if errors.As(err, &appErr) {
		c.JSON(appErr.Code, gin.H{"error": appErr.Message})
		return
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Registro no encontrado"})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
}
