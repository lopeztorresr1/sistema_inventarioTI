package models

import "time"

// Asignacion registra la entrega formal de un Equipo a un Empleado.
//
// MEJORAS:
//   - Índice en EquipoID + Estado: cubre la query más crítica del sistema
//     ("dame la asignación ACTIVA del equipo X"), usada en DesasignarEquipo,
//     BajaEquipo y CreateReparacion.
//   - Índice en EmpleadoID: cubre GetAsignacionesByEmpleado y GetHistorialEmpleado.
//   - Índice en Estado: cubre GetAsignaciones filtrado y el COUNT del dashboard.
type Asignacion struct {
	ID uint `gorm:"primaryKey" json:"id"`

	EquipoID uint   `gorm:"not null;index:idx_asig_equipo_estado,priority:1" json:"equipo_id"`
	Equipo   Equipo `gorm:"foreignKey:EquipoID"                              json:"equipo,omitempty"`

	EmpleadoID uint     `gorm:"not null;index"             json:"empleado_id"`
	Empleado   Empleado `gorm:"foreignKey:EmpleadoID"      json:"empleado,omitempty"`

	FechaEntrega    time.Time  `json:"fecha_entrega"`
	FechaDevolucion *time.Time `json:"fecha_devolucion"` // NULL mientras esté activa

	Notas           string `gorm:"type:text" json:"notas"`
	ActaFirmadaPath string `gorm:"size:255"  json:"acta_firmada_path"`

	// Estado: ACTIVA | FINALIZADA
	// Índice compuesto con EquipoID — la query WHERE equipo_id = ? AND estado = 'ACTIVA'
	// se ejecuta en O(log n) en lugar de full scan.
	Estado string `gorm:"size:20;default:'ACTIVA';index:idx_asig_equipo_estado,priority:2;index:idx_asig_estado" json:"estado"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
