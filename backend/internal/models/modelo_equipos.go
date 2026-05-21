package models

import "time"

// ModeloEquipo es el catálogo de modelos de hardware (ej: Dell Latitude 5540).
//
// CORRECCIÓN: los tags -;-> en Marca y TipoEquipo se reemplazaron por foreignKey
// estándar. El handler usa Select() para insertar solo los campos escalares
// (Nombre, MarcaID, TipoEquipoID) y evitar que GORM intente insertar los objetos
// de relación anidados.
type ModeloEquipo struct {
	ID     uint   `gorm:"primaryKey"        json:"id"`
	Nombre string `gorm:"size:100;not null" json:"nombre"`

	MarcaID uint  `gorm:"not null;index"                                            json:"marca_id"`
	Marca   Marca `gorm:"foreignKey:MarcaID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"marca,omitempty"`

	TipoEquipoID uint       `gorm:"not null;index"                                                    json:"tipo_equipo_id"`
	TipoEquipo   TipoEquipo `gorm:"foreignKey:TipoEquipoID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"tipo_equipo,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
