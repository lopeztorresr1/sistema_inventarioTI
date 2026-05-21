package models

import "time"

// Empleado representa al colaborador que recibe y es responsable de los activos TI.
//
// CORRECCIÓN: los tags -;-> en las relaciones eran no estándar y podían romparse
// en actualizaciones de GORM. Se reemplazaron por el tag convencional, y la
// inserción en el handler usa Select() explícito para no intentar insertar los
// objetos de relación.
//
// Preload funciona normalmente con foreignKey estándar.
type Empleado struct {
	ID       uint   `gorm:"primaryKey"          json:"id"`
	Nombre   string `gorm:"size:100;not null"   json:"nombre"`
	Apellido string `gorm:"size:100;not null"   json:"apellido"`
	Cargo    string `gorm:"size:100"            json:"cargo"`
	Estado   bool   `gorm:"default:true;index"  json:"estado"` // true = activo

	// Relaciones — índice en las FKs para acelerar JOINs y Preloads
	SucursalID uint     `gorm:"not null;index"                  json:"sucursal_id"`
	Sucursal   Sucursal `gorm:"foreignKey:SucursalID"           json:"sucursal,omitempty"`

	GrupoID uint  `gorm:"not null;index"      json:"grupo_id"`
	Grupo   Grupo `gorm:"foreignKey:GrupoID"  json:"grupo,omitempty"`

	AreaID uint `gorm:"not null;index"     json:"area_id"`
	Area   Area `gorm:"foreignKey:AreaID"  json:"area,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
