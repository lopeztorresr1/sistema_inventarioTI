package models

import "time"

// Reparacion registra el ciclo de vida de un equipo en taller técnico.
//
// MEJORAS:
//   - Índice en EquipoID para historial por equipo.
//   - Índice en Estado para filtrar PROCESO / REPARADO / IRREPARABLE eficientemente.
//     El dashboard y GetReparaciones filtran siempre por estado.
type Reparacion struct {
	ID       uint   `gorm:"primaryKey"           json:"id"`
	EquipoID uint   `gorm:"not null;index"        json:"equipo_id"`
	Equipo   Equipo `gorm:"foreignKey:EquipoID"  json:"equipo,omitempty"`

	FechaIngreso time.Time  `json:"fecha_ingreso"`
	FechaSalida  *time.Time `json:"fecha_salida"` // NULL mientras siga en proceso

	MotivoFalla       string  `gorm:"type:text;not null"  json:"motivo_falla"`
	Diagnostico       string  `gorm:"type:text"           json:"diagnostico"`
	Solucion          string  `gorm:"type:text"           json:"solucion"`
	Costo             float64 `gorm:"default:0"           json:"costo"`
	ProveedorServicio string  `gorm:"size:100"            json:"proveedor_servicio"`

	// Estado: PROCESO | REPARADO | IRREPARABLE
	Estado string `gorm:"size:20;default:'PROCESO';index" json:"estado"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
