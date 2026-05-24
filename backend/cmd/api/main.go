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
		// ─── RUTAS PÚBLICAS (SIN AUTENTICACIÓN) ──────────────────────────────
		auth := v1.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
		}

		// ─── RUTAS PROTEGIDAS (REQUIEREN JWT VÁLIDO) ─────────────────────────
		protected := v1.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// 🔓 ACCESIBLES POR CUALQUIER ROL (ADMIN y VIEWER)
			// Dashboard y Consultas Globales
			protected.GET("/dashboard/stats", handlers.GetDashboardStats)
			protected.GET("/sucursales", handlers.GetSucursales)
			protected.GET("/grupos", handlers.GetGrupos)
			protected.GET("/areas", handlers.GetAreas)
			protected.GET("/tipos-equipo", handlers.GetTiposEquipo)
			protected.GET("/marcas", handlers.GetMarcas)
			protected.GET("/modelos", handlers.GetModelosEquipo)

			// Consulta de Personal e Inventario
			protected.GET("/empleados", handlers.GetEmpleados)
			protected.GET("/empleados/:id/activos", handlers.GetAsignacionesByEmpleado)
			protected.GET("/empleados/:id/historial", handlers.GetHistorialEmpleado)
			protected.GET("/equipos", handlers.GetEquipos)
			protected.GET("/equipos/:id", handlers.GetDetalleEquipo)
			protected.GET("/equipos/:id/historial", handlers.GetHistorialEquipo)
			protected.GET("/asignaciones", handlers.GetAsignaciones)
			protected.GET("/reparaciones", handlers.GetReparaciones)

			// Acciones de Perfil Propio
			protected.POST("/auth/logout", handlers.CloseSession)
			protected.PUT("/auth/change-password", handlers.ChangeOwnPassword)

			// 🔒 EXCLUSIVAS PARA ADMINISTRADORES (Inyección explícita del middleware)
			admin := middleware.AdminOnly()
			{
				// Estructura y Catálogos (Escritura)
				protected.POST("/sucursales", admin, handlers.CreateSucursal)
				protected.PUT("/sucursales/:id", admin, handlers.UpdateSucursal)
				protected.DELETE("/sucursales/:id", admin, handlers.DeleteSucursal)

				protected.POST("/grupos", admin, handlers.CreateGrupo)
				protected.PUT("/grupos/:id", admin, handlers.UpdateGrupo)
				protected.DELETE("/grupos/:id", admin, handlers.DeleteGrupo)

				protected.POST("/areas", admin, handlers.CreateArea)
				protected.PUT("/areas/:id", admin, handlers.UpdateArea)
				protected.DELETE("/areas/:id", admin, handlers.DeleteArea)

				protected.POST("/tipos-equipo", admin, handlers.CreateTipoEquipo)
				protected.PUT("/tipos-equipo/:id", admin, handlers.UpdateTipoEquipo)
				protected.DELETE("/tipos-equipo/:id", admin, handlers.DeleteTipoEquipo)

				protected.POST("/marcas", admin, handlers.CreateMarca)
				protected.PUT("/marcas/:id", admin, handlers.UpdateMarca)
				protected.DELETE("/marcas/:id", admin, handlers.DeleteMarca)

				protected.POST("/modelos", admin, handlers.CreateModeloEquipo)
				protected.PUT("/modelos/:id", admin, handlers.UpdateModeloEquipo)
				protected.DELETE("/modelos/:id", admin, handlers.DeleteModeloEquipo)

				// Gestión de Operaciones y Personal
				protected.POST("/empleados", admin, handlers.CreateEmpleado)
				protected.PUT("/empleados/:id", admin, handlers.UpdateEmpleado)
				protected.DELETE("/empleados/:id", admin, handlers.DeleteEmpleado)

				// Gestión de Inventario (Mutaciones)
				protected.POST("/equipos", admin, handlers.CreateEquipo)
				protected.PUT("/equipos/:id", admin, handlers.UpdateEquipo)
				protected.DELETE("/equipos/:id/baja", admin, handlers.BajaEquipo)
				protected.PATCH("/equipos/:id/reactivar", admin, handlers.ReactivarEquipo)
				protected.PUT("/equipos/:id/desasignar", admin, handlers.DesasignarEquipo)

				// Flujos de Negocio (Asignaciones y Taller)
				protected.POST("/asignaciones", admin, handlers.CreateAsignacion)
				protected.PUT("/asignaciones/:id/finalizar", admin, handlers.FinalizarAsignacion)
				protected.POST("/reparaciones", admin, handlers.CreateReparacion)
				protected.PUT("/reparaciones/:id/finalizar", admin, handlers.FinalizarReparacion)

				// Control de Usuarios y Auditoría de Sesiones
				protected.GET("/usuarios/online", admin, handlers.GetSessionsOnline)
				protected.GET("/usuarios", admin, handlers.GetUsuarios)
				protected.POST("/usuarios", admin, handlers.CreateUsuario)
				protected.PUT("/usuarios/:id", admin, handlers.UpdateUsuario)
				protected.PATCH("/usuarios/:id/toggle", admin, handlers.ToggleUsuario)
				protected.PUT("/usuarios/:id/reset-password", admin, handlers.ResetPassword)
				protected.DELETE("/usuarios/:id", admin, handlers.DeleteUsuario)
				protected.GET("/usuarios/:id/sesiones", admin, handlers.GetSesiones)
			}
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
