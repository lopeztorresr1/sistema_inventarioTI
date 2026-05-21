package models

import (
	"time"
)

type Area struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	Nombre string `gorm:"size:100;not null" json:"nombre"`
	Estado bool   `gorm:"default:true" json:"estado"`

	// Añadimos index para mejorar la velocidad de los JOINs/Preloads
	GrupoID uint  `gorm:"not null;index" json:"grupo_id"`
	Grupo   Grupo `gorm:"foreignKey:GrupoID" json:"grupo,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
