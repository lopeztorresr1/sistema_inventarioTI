FROM golang:latest AS builder

WORKDIR /app

# Copiamos todo el proyecto
COPY . .

WORKDIR /app/backend

# Habilitamos la descarga automática de la versión de Go que pide tu archivo
ENV GOTOOLCHAIN=local+auto

# Descargamos las dependencias
RUN go mod download

# RUTA CORREGIDA: Apuntamos directo a tu carpeta api
RUN go build -o main ./cmd/api/main.go 

# Etapa final limpia y ligera
FROM alpine:latest
RUN apk --no-cache add ca-certificates libc6-compat

WORKDIR /root/
COPY --from=builder /app/backend/main .

EXPOSE 8080
CMD ["./main"]