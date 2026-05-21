package database

import (
	"fmt"
	"log"
	"os"

	"gestion-activos-ti/backend/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
	// La DSN se lee de la variable de entorno DB_DSN.
	// Formato MySQL: user:password@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True&loc=Local
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		log.Fatal("Variable de entorno DB_DSN no definida")
	}

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		// En producción cambia a logger.Silent o logger.Warn
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatal("Error al conectar a la base de datos: ", err)
	}

	// AutoMigrate es aceptable en desarrollo.
	// En producción se recomienda reemplazarlo por golang-migrate con archivos .sql versionados.
	err = DB.AutoMigrate(
		&models.Sucursal{},
		&models.Grupo{},
		&models.Area{},
		&models.TipoEquipo{},
		&models.ModeloEquipo{},
		&models.Marca{},
		&models.Empleado{},
		&models.Equipo{},
		&models.Asignacion{},
		&models.Reparacion{},
		&models.Usuario{},
		&models.Sesion{},
	)
	if err != nil {
		log.Fatal("Error al migrar la base de datos: ", err)
	}

	fmt.Println("Conexión exitosa y tablas migradas")
}
