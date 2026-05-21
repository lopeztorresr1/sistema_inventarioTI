package models

import "time"

// Usuario representa a un operador del sistema (no un empleado de la empresa).
// Roles disponibles:
//   - ADMIN  → acceso total (crear, editar, eliminar, gestionar usuarios)
//   - VIEWER → solo lectura (puede consultar pero no modificar nada)
type Usuario struct {
	ID     uint   `gorm:"primaryKey"              json:"id"`
	Nombre string `gorm:"size:100;not null"       json:"nombre"`
	Email  string `gorm:"size:100;uniqueIndex;not null" json:"email"`

	// json:"-" oculta el hash en TODAS las respuestas JSON.
	Password string `gorm:"size:255;not null" json:"-"`

	Rol    string `gorm:"size:20;default:'VIEWER'" json:"rol"`
	Activo bool   `gorm:"default:true;index"       json:"activo"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
