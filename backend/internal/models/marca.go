package models

import "time"

type Marca struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Nombre    string    `gorm:"size:50;unique;not null" json:"nombre"` // ej: Dell, Lenovo, HP
	Estado    bool      `gorm:"default:true" json:"estado"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
