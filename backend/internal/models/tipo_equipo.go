package models

import "time"

type TipoEquipo struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Nombre    string    `gorm:"size:50;unique;not null" json:"nombre"` // ej: Laptop, Monitor, Mouse
	Estado    bool      `gorm:"default:true" json:"estado"`            // True = Activo, False = Baja
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
