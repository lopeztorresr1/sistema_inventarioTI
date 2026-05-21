package models

import "time"

// Sesion registra cada inicio y cierre de sesión de un usuario del sistema.
// Permite saber quién está conectado en este momento, desde qué IP
// y cuánto tiempo lleva conectado.
type Sesion struct {
	ID        uint    `gorm:"primaryKey"          json:"id"`
	UsuarioID uint    `gorm:"not null;index"      json:"usuario_id"`
	Usuario   Usuario `gorm:"foreignKey:UsuarioID" json:"usuario,omitempty"`

	IP       string     `gorm:"size:45"  json:"ip"` // IPv4 o IPv6
	LoginAt  time.Time  `gorm:"index"    json:"login_at"`
	LogoutAt *time.Time `               json:"logout_at"` // NULL si aún está activa

	// Activa = true mientras el usuario no haya hecho logout explícito
	// Se pone en false también cuando el token expira (el interceptor de axios
	// redirige al login y llama a /auth/logout).
	Activa bool `gorm:"default:true;index" json:"activa"`
}
