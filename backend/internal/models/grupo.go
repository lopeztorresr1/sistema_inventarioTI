package models

import (
	"time"
)

type Grupo struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	Nombre string `gorm:"size:100;not null" json:"nombre"`
	Estado bool   `gorm:"default:true" json:"estado"`

	// Relación con Sucursal
	SucursalID uint     `gorm:"not null" json:"sucursal_id"`
	Sucursal   Sucursal `gorm:"foreignKey:SucursalID" json:"sucursal,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
