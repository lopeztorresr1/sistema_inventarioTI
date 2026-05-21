package handlers

import (
	"gestion-activos-ti/backend/internal/database"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetDashboardStats(c *gin.Context) {
	var activos, disponibles, asignados, enReparacion, responsables, marcas int64

	// Conteos principales — todos usan el mismo modelo base
	database.DB.Table("equipos").Where("activo = ?", true).Count(&activos)
	database.DB.Table("equipos").Where("activo = ? AND estado = ?", true, "DISPONIBLE").Count(&disponibles)
	database.DB.Table("equipos").Where("activo = ? AND estado = ?", true, "ASIGNADO").Count(&asignados)
	database.DB.Table("equipos").Where("activo = ? AND estado = ?", true, "REPARACION").Count(&enReparacion)
	database.DB.Table("marcas").Count(&marcas)

	// Empleados únicos con al menos una asignación ACTIVA
	database.DB.Table("asignacions").
		Where("estado = ? AND empleado_id IS NOT NULL AND empleado_id > 0", "ACTIVA").
		Distinct("empleado_id").
		Count(&responsables)

	// Stock disponible agrupado por categoría de equipo
	type StockCat struct {
		Nombre string `json:"nombre"`
		Stock  int64  `json:"stock"`
	}
	var stockByCat []StockCat

	err := database.DB.Table("equipos").
		Select("tipo_equipos.nombre as nombre, count(equipos.id) as stock").
		Joins("JOIN modelo_equipos ON equipos.modelo_equipo_id = modelo_equipos.id").
		Joins("JOIN tipo_equipos ON modelo_equipos.tipo_equipo_id = tipo_equipos.id").
		Where("equipos.activo = ? AND equipos.estado = ?", true, "DISPONIBLE").
		Group("tipo_equipos.nombre").
		Order("stock DESC").
		Scan(&stockByCat).Error

	if err != nil {
		// Usar log.Printf en lugar de println para que el logger lo capture correctamente
		log.Printf("[dashboard] error en query stock_categoria: %v", err)
		stockByCat = []StockCat{}
	}

	// Últimas 5 reparaciones en proceso para el panel de alertas
	type RepReciente struct {
		ID           uint   `json:"id"`
		EquipoNombre string `json:"equipo_nombre"`
		EquipoCodigo string `json:"equipo_codigo"`
		MotivoFalla  string `json:"motivo_falla"`
		FechaIngreso string `json:"fecha_ingreso"`
	}
	var repsRecientes []RepReciente

	database.DB.Table("reparacions").
		Select("reparacions.id, equipos.nombre as equipo_nombre, equipos.codigo as equipo_codigo, reparacions.motivo_falla, DATE_FORMAT(reparacions.fecha_ingreso, '%d/%m/%Y') as fecha_ingreso").
		Joins("JOIN equipos ON reparacions.equipo_id = equipos.id").
		Where("reparacions.estado = ?", "PROCESO").
		Order("reparacions.fecha_ingreso ASC"). // los más viejos primero (llevan más tiempo)
		Limit(5).
		Scan(&repsRecientes)

	c.JSON(http.StatusOK, gin.H{
		"equipos_activos":  activos,
		"disponibles":      disponibles,
		"asignados":        asignados,
		"en_reparacion":    enReparacion,
		"responsables":     responsables,
		"marcas_total":     marcas,
		"stock_categoria":  stockByCat,
		"reps_en_proceso":  repsRecientes,
	})
}
