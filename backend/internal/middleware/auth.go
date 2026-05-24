package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware valida el JWT en cada ruta protegida.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		// Permitir preflight CORS
		if c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		authHeader := c.GetHeader("Authorization")

		println("👉 HEADER RECIBIDO DESDE FRONTEND:", "["+authHeader+"]")

		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Token requerido",
			})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)

		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Formato inválido. Use: Bearer <token>",
			})
			return
		}

		tokenString := parts[1]

		// JWT SECRET
		secretKey := os.Getenv("JWT_SECRET")

		if secretKey == "" {
			secretKey = "ClaveSREntornoFallbackSegura2026"
		}

		secret := []byte(secretKey)

		// ─────────────────────────────────────────────
		// CORRECCIÓN JWT v5
		// ─────────────────────────────────────────────
		claims := jwt.MapClaims{}

		token, err := jwt.ParseWithClaims(
			tokenString,
			claims,
			func(t *jwt.Token) (interface{}, error) {

				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}

				return secret, nil
			},
		)

		if err != nil {
			println("❌ ERROR JWT:", err.Error())

			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Token inválido: " + err.Error(),
			})
			return
		}

		if !token.Valid {
			println("❌ TOKEN INVÁLIDO")

			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Token inválido",
			})
			return
		}

		// ─────────────────────────────────────────────
		// EXTRACCIÓN SEGURA DE CLAIMS
		// ─────────────────────────────────────────────

		var userID uint

		if val, ok := claims["user_id"].(float64); ok {
			userID = uint(val)
		}

		var rol string

		if val, ok := claims["rol"].(string); ok {
			rol = strings.ToUpper(strings.TrimSpace(val))
		}

		// Guardar datos en contexto
		c.Set("user_id", userID)
		c.Set("rol", rol)

		c.Next()
	}
}

// AdminOnly restringe acceso a ADMIN
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {

		if c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		rol, exists := c.Get("rol")

		rolStr, ok := rol.(string)

		if !exists || !ok || rolStr != "ADMIN" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Acceso restringido a administradores",
			})
			return
		}

		c.Next()
	}
}
