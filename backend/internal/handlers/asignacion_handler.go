package handlers

import (
	"gestion-activos-ti/backend/internal/database"
	"gestion-activos-ti/backend/internal/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// CreateAsignacion registra la asignación y precarga la estructura exacta orientada a objetos que espera React
func GetAsignaciones(c *gin.Context) {
	// 1. Usamos un mapa genérico temporal para capturar el JSON de React sin que Gin tire un 400
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos en la petición"})
		return
	}

	// 2. Extraer y validar manualmente los campos indispensables obligatorios
	empIDRaw, ok1 := body["empleado_id"]
	eqIDRaw, ok2 := body["equipo_id"]

	if !ok1 || !ok2 || empIDRaw == nil || eqIDRaw == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Faltan campos obligatorios: empleado_id y equipo_id son requeridos"})
		return
	}

	// 3. Conversión segura de tipos de datos (de float64 de JavaScript a uint de Go)
	var empID, eqID uint
	if f, ok := empIDRaw.(float64); ok {
		empID = uint(f)
	}
	if f, ok := eqIDRaw.(float64); ok {
		eqID = uint(f)
	}

	// Capturar notas de forma segura si existen en el formulario
	var notasStr string
	if n, ok := body["notas"].(string); ok {
		notasStr = n
	}

	// 4. Instanciar el modelo base asignando las propiedades limpias
	var asignacion models.Asignacion
	asignacion.EmpleadoID = empID
	asignacion.EquipoID = eqID
	asignacion.Notas = notasStr
	asignacion.FechaEntrega = time.Now()
	asignacion.Estado = "ACTIVA"

	// Iniciamos Transacción manual en MySQL
	tx := database.DB.Begin()

	// Verificar si el equipo existe y está DISPONIBLE
	var equipo models.Equipo
	if err := tx.First(&equipo, asignacion.EquipoID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Equipo no encontrado"})
		return
	}

	if equipo.Estado != "DISPONIBLE" {
		tx.Rollback()
		c.JSON(http.StatusConflict, gin.H{"error": "El equipo no está disponible para asignación (Estado actual: " + equipo.Estado + ")"})
		return
	}

	// Guardar el registro base en la tabla (GORM usará de forma automática `asignacions`)
	if err := tx.Create(&asignacion).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al registrar la asignación en la base de datos"})
		return
	}

	// Actualizar el estado del equipo de cómputo a ASIGNADO
	if err := tx.Model(&equipo).Update("estado", "ASIGNADO").Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar estado del equipo"})
		return
	}

	// Si todo salió bien, guardamos los cambios definitivamente
	tx.Commit()

	// 5. PRECARGA ANIDADA DIRECTA: Traer todos los objetos para que React pinte la responsiva
	// Usamos exactamente las mismas relaciones para que 'equipoSel' y 'empleadoSel' se rellenen
	if err := database.DB.
		Preload("Equipo.Modelo.Marca").
		Preload("Equipo.Modelo.TipoEquipo").
		Preload("Empleado.Area").
		First(&asignacion, asignacion.ID).Error; err != nil {
		println("⚠️ Detalle no crítico al precargar relaciones de la responsiva:", err.Error())
	}

	// Enviamos el objeto con la estructura anidada exacta que tu Frontend ya sabe leer
	c.JSON(http.StatusCreated, gin.H{
		"message": "Asignación realizada con éxito",
		"data":    asignacion,
	})
}

// GetAsignaciones permite ver quién tiene qué (Trazabilidad) con relaciones completas
func CreateAsignacion(c *gin.Context) {
	// 1. Usamos un mapa genérico temporal para capturar el JSON de React de forma flexible
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos en la petición"})
		return
	}

	// 2. Extraer y validar manualmente los campos indispensables obligatorios
	empIDRaw, ok1 := body["empleado_id"]
	eqIDRaw, ok2 := body["equipo_id"]

	if !ok1 || !ok2 || empIDRaw == nil || eqIDRaw == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Faltan campos obligatorios: empleado_id y equipo_id son requeridos"})
		return
	}

	// 3. Conversión segura de tipos de datos (de float64 de JavaScript a uint de Go)
	var empID, eqID uint
	if f, ok := empIDRaw.(float64); ok {
		empID = uint(f)
	}
	if f, ok := eqIDRaw.(float64); ok {
		eqID = uint(f)
	}

	// Capturar notas de forma segura si existen en el formulario
	var notasStr string
	if n, ok := body["notas"].(string); ok {
		notasStr = n
	}

	// 4. Instanciar el modelo base asignando las propiedades limpias
	var asignacion models.Asignacion
	asignacion.EmpleadoID = empID
	asignacion.EquipoID = eqID
	asignacion.Notas = notasStr
	asignacion.FechaEntrega = time.Now()
	asignacion.Estado = "ACTIVA"

	// Iniciamos Transacción manual en MySQL
	tx := database.DB.Begin()

	// Verificar si el equipo existe y está DISPONIBLE
	var equipo models.Equipo
	if err := tx.First(&equipo, asignacion.EquipoID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Equipo no encontrado"})
		return
	}

	if equipo.Estado != "DISPONIBLE" {
		tx.Rollback()
		c.JSON(http.StatusConflict, gin.H{"error": "El equipo no está disponible para asignación (Estado actual: " + equipo.Estado + ")"})
		return
	}

	// Guardar el registro base en la tabla
	if err := tx.Create(&asignacion).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al registrar la asignación"})
		return
	}

	// Actualizar el estado del equipo de cómputo a ASIGNADO
	if err := tx.Model(&equipo).Update("estado", "ASIGNADO").Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar estado del equipo"})
		return
	}

	// Guardamos los cambios definitivamente en la base de datos
	tx.Commit()

	// ─────────────────────────────────────────────────────────────────
	// SOLUCIÓN AQUÍ: Consulta externa post-commit para forzar el Preload
	// ─────────────────────────────────────────────────────────────────
	// Creamos una estructura limpia para volver a leer desde la BD con la sesión global de GORM
	var asignacionCompleta models.Asignacion
	if err := database.DB.
		Preload("Equipo").
		Preload("Equipo.Modelo").
		Preload("Equipo.Modelo.Marca").
		Preload("Equipo.Modelo.TipoEquipo").
		Preload("Empleado").
		Preload("Empleado.Area").
		First(&asignacionCompleta, asignacion.ID).Error; err != nil {

		// Si por alguna razón falla el preload, usamos el objeto básico para no romper el flujo
		println("⚠️ Error al precargar relaciones tras el commit:", err.Error())
		c.JSON(http.StatusCreated, gin.H{
			"message": "Asignación realizada con éxito",
			"data":    asignacion,
		})
		return
	}

	// Enviamos el objeto completamente poblado que React necesita para el modal/impresión imediata
	c.JSON(http.StatusCreated, gin.H{
		"message": "Asignación realizada con éxito",
		"data":    asignacionCompleta,
	})
}

// FinalizarAsignacion cierra el ciclo mediante el ID de la ASIGNACIÓN
func FinalizarAsignacion(c *gin.Context) {
	id := c.Param("id")
	var asignacion models.Asignacion

	tx := database.DB.Begin()

	if err := tx.First(&asignacion, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Asignación no encontrada"})
		return
	}

	if asignacion.Estado == "FINALIZADA" {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Esta asignación ya fue finalizada anteriormente"})
		return
	}

	ahora := time.Now()
	asignacion.FechaDevolucion = &ahora
	asignacion.Estado = "FINALIZADA"

	if err := tx.Save(&asignacion).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al cerrar asignación"})
		return
	}

	if err := tx.Model(&models.Equipo{}).Where("id = ?", asignacion.EquipoID).
		Update("estado", "DISPONIBLE").Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al liberar el equipo"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Equipo devuelto y disponible nuevamente"})
}

// DesasignarEquipoPorIDEquipo permite desasignar directamente usando el ID del EQUIPO
func DesasignarEquipo(c *gin.Context) {
	equipoID := c.Param("id")
	var asignacion models.Asignacion

	tx := database.DB.Begin()

	// 1. Buscar la asignación ACTIVA vinculada a este equipo
	err := tx.Where("equipo_id = ? AND estado = 'ACTIVA'", equipoID).First(&asignacion).Error
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "No se encontró una asignación activa para este equipo"})
		return
	}

	// 2. Finalizar la asignación
	ahora := time.Now()
	if err := tx.Model(&asignacion).Updates(map[string]interface{}{
		"fecha_devolucion": &ahora,
		"estado":           "FINALIZADA",
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al finalizar el registro de asignación"})
		return
	}

	// 3. Cambiar estado del equipo a DISPONIBLE
	if err := tx.Model(&models.Equipo{}).Where("id = ?", equipoID).Update("estado", "DISPONIBLE").Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al liberar el equipo"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Equipo desasignado exitosamente"})
}

func GetAsignacionesByEmpleado(c *gin.Context) {
	empleadoID := c.Param("id")
	var asignaciones []models.Asignacion

	err := database.DB.
		Preload("Equipo").
		Preload("Equipo.Modelo").
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
		Preload("Equipo").
		Preload("Equipo.Modelo").
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
type appError struct {
	Code    int
	Message string
}

func (e *appError) Error() string { return e.Message }

func handleTransactionError(c *gin.Context, err error) {
	c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
}
