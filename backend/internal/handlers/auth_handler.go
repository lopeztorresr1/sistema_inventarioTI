package handlers

import (
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"gestion-activos-ti/backend/internal/database"
	"gestion-activos-ti/backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// ─────────────────────────────────────────────
// JWT SECRET CENTRALIZADA
// ─────────────────────────────────────────────
func jwtSecret() []byte {
	secret := os.Getenv("JWT_SECRET")

	// Fallback seguro si Docker no carga .env
	if secret == "" {
		secret = "ClaveSREntornoFallbackSegura2026"
	}

	return []byte(secret)
}

// ─────────────────────────────────────────────
// RESPUESTA LOGIN
// ─────────────────────────────────────────────
type LoginResponse struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
	Email  string `json:"email"`
	Rol    string `json:"rol"`
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
func Login(c *gin.Context) {

	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Credenciales inválidas",
		})
		return
	}

	var usuario models.Usuario

	if err := database.DB.
		Where("email = ?", input.Email).
		First(&usuario).Error; err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Credenciales incorrectas",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error interno",
		})
		return
	}

	// Validar password
	if err := bcrypt.CompareHashAndPassword(
		[]byte(usuario.Password),
		[]byte(input.Password),
	); err != nil {

		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Credenciales incorrectas",
		})
		return
	}

	// ─────────────────────────────────────────────
	// CREACIÓN DEL JWT
	// ─────────────────────────────────────────────
	claims := jwt.MapClaims{
		"user_id": float64(usuario.ID),
		"rol":     strings.ToUpper(strings.TrimSpace(usuario.Rol)),
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString(jwtSecret())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error al generar token",
		})
		return
	}

	// ─────────────────────────────────────────────
	// CREAR SESIÓN
	// ─────────────────────────────────────────────
	database.DB.Create(&models.Sesion{
		UsuarioID: usuario.ID,
		IP:        c.ClientIP(),
		LoginAt:   time.Now(),
		Activa:    true,
	})

	// ─────────────────────────────────────────────
	// RESPUESTA
	// ─────────────────────────────────────────────
	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": LoginResponse{
			ID:     usuario.ID,
			Nombre: usuario.Nombre,
			Email:  usuario.Email,
			Rol:    strings.ToUpper(strings.TrimSpace(usuario.Rol)),
		},
	})
}

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
func Register(c *gin.Context) {

	var input struct {
		Nombre   string `json:"nombre" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
		Rol      string `json:"rol"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	var count int64

	database.DB.
		Model(&models.Usuario{}).
		Where("email = ?", input.Email).
		Count(&count)

	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"error": "El email ya está registrado",
		})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(input.Password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error al procesar contraseña",
		})
		return
	}

	rol := strings.ToUpper(strings.TrimSpace(input.Rol))

	if rol == "" {
		rol = "EDITOR"
	}

	usuario := models.Usuario{
		Nombre:   input.Nombre,
		Email:    input.Email,
		Password: string(hashedPassword),
		Rol:      rol,
	}

	if err := database.DB.Create(&usuario).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error al crear usuario",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Usuario creado correctamente",
	})
}
