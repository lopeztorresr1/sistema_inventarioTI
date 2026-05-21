package models

import (
	"time"
)

type Sucursal struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Nombre    string    `gorm:"size:100;not null" json:"nombre"`
	Prefix    string    `gorm:"size:5;unique;not null" json:"prefix"` // ej: LEF, TOR
	Direccion string    `json:"direccion"`
	Telefono  string    `json:"telefono"`
	Estado    bool      `gorm:"default:true" json:"estado"` // Activo/Inactivo
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
