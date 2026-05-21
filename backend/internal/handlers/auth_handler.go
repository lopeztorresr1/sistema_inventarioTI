package handlers

import (
	"errors"
	"gestion-activos-ti/backend/internal/database"
	"gestion-activos-ti/backend/internal/models"
	"net/http"
	"os"

	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func jwtSecret() []byte {
	return []byte(os.Getenv("JWT_SECRET"))
}

// LoginResponse es el DTO de respuesta del login.
// Omite el campo Password para no exponerlo nunca en la respuesta.
type LoginResponse struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
	Email  string `json:"email"`
	Rol    string `json:"rol"`
}

func Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email y contraseña son requeridos"})
		return
	}

	var usuario models.Usuario
	if err := database.DB.Where("email = ?", input.Email).First(&usuario).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Mismo mensaje para email y contraseña: no revelar si el email existe
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciales incorrectas"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error interno"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(usuario.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciales incorrectas"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": usuario.ID,
		"rol":     usuario.Rol,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(jwtSecret())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo generar el token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": LoginResponse{
			ID:     usuario.ID,
			Nombre: usuario.Nombre,
			Email:  usuario.Email,
			Rol:    usuario.Rol,
		},
	})
}

func Register(c *gin.Context) {
	var input struct {
		Nombre   string `json:"nombre"   binding:"required"`
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
		Rol      string `json:"rol"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar si el email ya existe
	var count int64
	database.DB.Model(&models.Usuario{}).Where("email = ?", input.Email).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "El email ya está registrado"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al procesar contraseña"})
		return
	}

	rol := input.Rol
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear usuario"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Usuario creado correctamente"})
}
