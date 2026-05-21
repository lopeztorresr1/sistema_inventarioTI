package handlers

import (
	"errors"
	"gestion-activos-ti/backend/internal/database"
	"gestion-activos-ti/backend/internal/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// ─── CRUD de Usuarios ────────────────────────────────────────────────────────

func GetUsuarios(c *gin.Context) {
	var usuarios []models.Usuario
	if err := database.DB.Find(&usuarios).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener usuarios"})
		return
	}
	c.JSON(http.StatusOK, usuarios)
}

// CreateUsuario crea un nuevo usuario del sistema.
// Solo puede ejecutarlo un ADMIN (protegido con AdminOnly en main.go).
func CreateUsuario(c *gin.Context) {
	var input struct {
		Nombre   string `json:"nombre"   binding:"required"`
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
		Rol      string `json:"rol"      binding:"required,oneof=ADMIN VIEWER"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var count int64
	database.DB.Model(&models.Usuario{}).Where("email = ?", input.Email).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "El correo ya está registrado"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al procesar contraseña"})
		return
	}

	usuario := models.Usuario{
		Nombre:   input.Nombre,
		Email:    input.Email,
		Password: string(hashed),
		Rol:      input.Rol,
		Activo:   true,
	}
	if err := database.DB.Create(&usuario).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear usuario"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Usuario creado correctamente", "id": usuario.ID})
}

// UpdateUsuario permite cambiar nombre, email y rol. No toca la contraseña.
func UpdateUsuario(c *gin.Context) {
	id := c.Param("id")
	var usuario models.Usuario
	if err := database.DB.First(&usuario, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		return
	}

	var input struct {
		Nombre string `json:"nombre"`
		Email  string `json:"email" binding:"omitempty,email"`
		Rol    string `json:"rol"   binding:"omitempty,oneof=ADMIN VIEWER"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if input.Nombre != "" {
		updates["nombre"] = input.Nombre
	}
	if input.Email != "" {
		updates["email"] = input.Email
	}
	if input.Rol != "" {
		updates["rol"] = input.Rol
	}

	if err := database.DB.Model(&usuario).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar usuario"})
		return
	}
	database.DB.First(&usuario, id)
	c.JSON(http.StatusOK, usuario)
}

// ToggleUsuario activa o desactiva un usuario (baja lógica).
func ToggleUsuario(c *gin.Context) {
	id := c.Param("id")

	// No permitir que el admin se desactive a sí mismo
	callerID, _ := c.Get("user_id")
	if fmt_id := id; fmt_id == callerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "No puedes desactivar tu propia cuenta"})
		return
	}

	var usuario models.Usuario
	if err := database.DB.First(&usuario, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		return
	}

	nuevoEstado := !usuario.Activo
	if err := database.DB.Model(&usuario).Update("activo", nuevoEstado).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo cambiar el estado"})
		return
	}

	msg := "Usuario activado"
	if !nuevoEstado {
		msg = "Usuario desactivado"
	}
	c.JSON(http.StatusOK, gin.H{"message": msg, "activo": nuevoEstado})
}

// ResetPassword permite al admin establecer una nueva contraseña para cualquier usuario.
func ResetPassword(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		NewPassword string `json:"new_password" binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "La contraseña debe tener al menos 8 caracteres"})
		return
	}

	var usuario models.Usuario
	if err := database.DB.First(&usuario, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al procesar contraseña"})
		return
	}

	if err := database.DB.Model(&usuario).Update("password", string(hashed)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar contraseña"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Contraseña actualizada correctamente"})
}

// ChangeOwnPassword permite a cualquier usuario cambiar su propia contraseña
// verificando primero la actual.
func ChangeOwnPassword(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var input struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password"     binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var usuario models.Usuario
	if err := database.DB.First(&usuario, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(usuario.Password), []byte(input.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "La contraseña actual es incorrecta"})
		return
	}

	hashed, _ := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	database.DB.Model(&usuario).Update("password", string(hashed))
	c.JSON(http.StatusOK, gin.H{"message": "Contraseña actualizada"})
}

// ─── Sesiones ────────────────────────────────────────────────────────────────

// RegisterSession registra el inicio de sesión de un usuario.
// Se llama internamente desde el handler de Login.
func RegisterSession(db *gorm.DB, usuarioID uint, ip string) {
	session := models.Sesion{
		UsuarioID: usuarioID,
		IP:        ip,
		LoginAt:   time.Now(),
		Activa:    true,
	}
	db.Create(&session)
}

// CloseSession registra el cierre de sesión y marca la sesión como inactiva.
func CloseSession(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var sesion models.Sesion
	err := database.DB.
		Where("usuario_id = ? AND activa = true", userID).
		Order("login_at DESC").
		First(&sesion).Error

	if err == nil {
		ahora := time.Now()
		database.DB.Model(&sesion).Updates(map[string]interface{}{
			"logout_at": &ahora,
			"activa":    false,
		})
	}
	c.JSON(http.StatusOK, gin.H{"message": "Sesión cerrada"})
}

// GetSesiones devuelve el historial de sesiones de un usuario específico.
func GetSesiones(c *gin.Context) {
	usuarioID := c.Param("id")
	var sesiones []models.Sesion
	database.DB.
		Where("usuario_id = ?", usuarioID).
		Order("login_at DESC").
		Limit(20).
		Find(&sesiones)
	c.JSON(http.StatusOK, sesiones)
}

// GetSessionsOnline devuelve los usuarios con sesión activa en este momento.
func GetSessionsOnline(c *gin.Context) {
	type OnlineUser struct {
		SesionID  uint      `json:"sesion_id"`
		UsuarioID uint      `json:"usuario_id"`
		Nombre    string    `json:"nombre"`
		Email     string    `json:"email"`
		Rol       string    `json:"rol"`
		IP        string    `json:"ip"`
		LoginAt   time.Time `json:"login_at"`
		// Minutos conectado calculado en Go para no depender de funciones SQL específicas
		MinutosConectado int64 `json:"minutos_conectado"`
	}

	var sesiones []models.Sesion
	database.DB.Preload("Usuario").
		Where("activa = true").
		Order("login_at ASC").
		Find(&sesiones)

	result := make([]OnlineUser, 0, len(sesiones))
	for _, s := range sesiones {
		result = append(result, OnlineUser{
			SesionID:         s.ID,
			UsuarioID:        s.UsuarioID,
			Nombre:           s.Usuario.Nombre,
			Email:            s.Usuario.Email,
			Rol:              s.Usuario.Rol,
			IP:               s.IP,
			LoginAt:          s.LoginAt,
			MinutosConectado: int64(time.Since(s.LoginAt).Minutes()),
		})
	}
	c.JSON(http.StatusOK, result)
}

// DeleteUsuario elimina permanentemente un usuario (solo ADMIN).
func DeleteUsuario(c *gin.Context) {
	id := c.Param("id")
	callerID, _ := c.Get("user_id")

	// Convertir callerID (float64 desde JWT claims) a string para comparar
	if callerIDStr := fmt_uint(callerID); callerIDStr == id {
		c.JSON(http.StatusForbidden, gin.H{"error": "No puedes eliminar tu propia cuenta"})
		return
	}

	var usuario models.Usuario
	if err := database.DB.First(&usuario, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar usuario"})
		}
		return
	}

	// Cerrar sesiones activas antes de borrar
	database.DB.Model(&models.Sesion{}).
		Where("usuario_id = ? AND activa = true", id).
		Updates(map[string]interface{}{"activa": false})

	if err := database.DB.Delete(&usuario).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo eliminar el usuario"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Usuario eliminado"})
}

// fmt_uint convierte el user_id del JWT (float64) a string para comparar con Param("id")
func fmt_uint(v interface{}) string {
	switch val := v.(type) {
	case float64:
		return strconv.Itoa(int(val))
	case uint:
		return strconv.Itoa(int(val))
	}
	return ""
}
