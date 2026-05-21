package main

import (
	"gestion-activos-ti/backend/internal/database"
	"gestion-activos-ti/backend/internal/handlers"
	"gestion-activos-ti/backend/internal/middleware"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Validar variables de entorno obligatorias al arrancar
	requiredEnvVars := []string{"JWT_SECRET", "DB_DSN"}
	for _, v := range requiredEnvVars {
		if os.Getenv(v) == "" {
			log.Fatalf("Variable de entorno requerida no definida: %s", v)
		}
	}

	// 2. Conectar a la base de datos
	database.Connect()

	// 3. Inicializar Gin
	r := gin.Default()

	// 4. CORS dinámico desde variable de entorno
	// Ejemplo en .env: ALLOWED_ORIGINS=http://localhost:5173,https://mi-app.com
	rawOrigins := os.Getenv("ALLOWED_ORIGINS")
	allowedOrigins := strings.Split(rawOrigins, ",")
	if len(allowedOrigins) == 0 || allowedOrigins[0] == "" {
		allowedOrigins = []string{"http://localhost:5173"} // fallback solo para desarrollo
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	v1 := r.Group("/api/v1")
	{
		// --- Rutas PÚBLICAS (sin autenticación) ---
		auth := v1.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
		}

		// --- Rutas PROTEGIDAS (requieren JWT válido) ---
		protected := v1.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// Sucursales y Estructura
			protected.POST("/sucursales", handlers.CreateSucursal)
			protected.GET("/sucursales", handlers.GetSucursales)
			protected.PUT("/sucursales/:id", handlers.UpdateSucursal)
			protected.DELETE("/sucursales/:id", handlers.DeleteSucursal)

			protected.POST("/grupos", handlers.CreateGrupo)
			protected.GET("/grupos", handlers.GetGrupos)
			protected.PUT("/grupos/:id", handlers.UpdateGrupo)
			protected.DELETE("/grupos/:id", handlers.DeleteGrupo)

			protected.POST("/areas", handlers.CreateArea)
			protected.GET("/areas", handlers.GetAreas)
			protected.PUT("/areas/:id", handlers.UpdateArea)
			protected.DELETE("/areas/:id", handlers.DeleteArea)

			// Catálogo de Hardware
			protected.POST("/tipos-equipo", handlers.CreateTipoEquipo)
			protected.GET("/tipos-equipo", handlers.GetTiposEquipo)
			protected.PUT("/tipos-equipo/:id", handlers.UpdateTipoEquipo)
			protected.DELETE("/tipos-equipo/:id", handlers.DeleteTipoEquipo)

			protected.POST("/marcas", handlers.CreateMarca)
			protected.GET("/marcas", handlers.GetMarcas)
			protected.PUT("/marcas/:id", handlers.UpdateMarca)
			protected.DELETE("/marcas/:id", handlers.DeleteMarca)

			protected.POST("/modelos", handlers.CreateModeloEquipo)
			protected.GET("/modelos", handlers.GetModelosEquipo)
			protected.PUT("/modelos/:id", handlers.UpdateModeloEquipo)
			protected.DELETE("/modelos/:id", handlers.DeleteModeloEquipo)

			// Gestión de Personal
			protected.POST("/empleados", handlers.CreateEmpleado)
			protected.GET("/empleados", handlers.GetEmpleados)
			protected.PUT("/empleados/:id", handlers.UpdateEmpleado)
			protected.DELETE("/empleados/:id", handlers.DeleteEmpleado)
			protected.GET("/empleados/:id/activos", handlers.GetAsignacionesByEmpleado)
			protected.GET("/empleados/:id/historial", handlers.GetHistorialEmpleado)

			// Gestión de Equipos (Inventario)
			protected.POST("/equipos", handlers.CreateEquipo)
			protected.GET("/equipos", handlers.GetEquipos) // soporta ?page=1&limit=20
			protected.GET("/equipos/:id", handlers.GetDetalleEquipo)
			protected.PUT("/equipos/:id", handlers.UpdateEquipo)
			protected.DELETE("/equipos/:id/baja", handlers.BajaEquipo)
			protected.PATCH("/equipos/:id/reactivar", handlers.ReactivarEquipo)
			protected.PUT("/equipos/:id/desasignar", handlers.DesasignarEquipo)
			protected.GET("/equipos/:id/historial", handlers.GetHistorialEquipo)

			// Movimientos y Asignaciones
			protected.POST("/asignaciones", handlers.CreateAsignacion)
			protected.GET("/asignaciones", handlers.GetAsignaciones)
			protected.PUT("/asignaciones/:id/finalizar", handlers.FinalizarAsignacion)

			// Mantenimiento
			protected.POST("/reparaciones", handlers.CreateReparacion)
			protected.GET("/reparaciones", handlers.GetReparaciones)
			protected.PUT("/reparaciones/:id/finalizar", handlers.FinalizarReparacion)

			// Dashboard
			protected.GET("/dashboard/stats", handlers.GetDashboardStats)

			// Sesiones (cierre propio + cambio de contraseña propio — cualquier usuario)
			protected.POST("/auth/logout", handlers.CloseSession)
			protected.PUT("/auth/change-password", handlers.ChangeOwnPassword)

			// Usuarios en línea (cualquier admin puede verlos)
			protected.GET("/usuarios/online", middleware.AdminOnly(), handlers.GetSessionsOnline)

			// Gestión completa de usuarios — solo ADMIN
			protected.GET("/usuarios", middleware.AdminOnly(), handlers.GetUsuarios)
			protected.POST("/usuarios", middleware.AdminOnly(), handlers.CreateUsuario)
			protected.PUT("/usuarios/:id", middleware.AdminOnly(), handlers.UpdateUsuario)
			protected.PATCH("/usuarios/:id/toggle", middleware.AdminOnly(), handlers.ToggleUsuario)
			protected.PUT("/usuarios/:id/reset-password", middleware.AdminOnly(), handlers.ResetPassword)
			protected.DELETE("/usuarios/:id", middleware.AdminOnly(), handlers.DeleteUsuario)
			protected.GET("/usuarios/:id/sesiones", middleware.AdminOnly(), handlers.GetSesiones)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
