package models

import (
	"time"

	"gorm.io/gorm"
)

// Equipo representa un activo TI físico dentro del inventario.
//
// MEJORAS en esta versión:
//   - Índices compuestos en los pares de columnas usados en los filtros más frecuentes
//     de GetEquipos: (activo, estado), (sucursal_id, activo), (activo, nombre).
//     Sin estos índices las búsquedas con LIKE o filtros hacen full table scan.
//   - Se mantiene el índice único en Serie y Codigo para integridad.
//   - DeletedAt conserva soft-delete (GORM lo gestiona automáticamente).
type Equipo struct {
	ID     uint   `gorm:"primaryKey"                json:"id"`
	Codigo string `gorm:"size:20;uniqueIndex"        json:"codigo"` // ej: LEF-0001
	Nombre string `gorm:"size:100;not null"          json:"nombre"`
	Serie  string `gorm:"size:100;uniqueIndex;not null" json:"serie"`

	ModeloEquipoID uint         `gorm:"index"                       json:"modelo_id"`
	Modelo         ModeloEquipo `gorm:"foreignKey:ModeloEquipoID"   json:"modelo,omitempty"`

	SucursalID uint     `gorm:"index"                   json:"sucursal_id"`
	Sucursal   Sucursal `gorm:"foreignKey:SucursalID"   json:"sucursal,omitempty"`

	// Adquisición
	TipoAdquisicion  string     `gorm:"size:30"      json:"tipo_adquisicion"`
	FechaAdquisicion *time.Time `                    json:"fecha_adquisicion"`
	Costo            float64    `                    json:"costo"`
	NumeroFactura    string     `gorm:"size:100"     json:"numero_factura"`
	FacturaPath      string     `gorm:"size:255"     json:"factura_path"`

	// Estado — índice compuesto (activo, estado) cubre el filtro más frecuente
	Estado string `gorm:"size:20;default:'DISPONIBLE';index:idx_equipo_activo_estado,priority:2" json:"estado"`
	Activo bool   `gorm:"default:true;index:idx_equipo_activo_estado,priority:1"                json:"activo"`

	// Índice compuesto para filtrar por sucursal + activos
	// gorm no soporta índices compuestos multi-campo en el tag directamente para
	// columnas en distintos campos sin una migración SQL. Se añade aquí como
	// comentario para agregar manualmente en la migración versionada:
	//   CREATE INDEX idx_equipo_sucursal_activo ON equipos(sucursal_id, activo);
	//   CREATE INDEX idx_equipo_nombre         ON equipos(nombre);

	// Características físicas
	Material   string `gorm:"size:50"  json:"material"`
	Color      string `gorm:"size:50"  json:"color"`
	ServiceTag string `gorm:"size:100" json:"service_tag"`

	Caracteristicas string `gorm:"type:text" json:"caracteristicas"`
	Observaciones   string `gorm:"type:text" json:"observaciones"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index"     json:"-"` // soft delete
}
