#!/bin/sh
set -e

# ==============================================================================
# entrypoint.sh — Inicio seguro de Nginx para el Banco / Intranet
# Verifica y asegura certificados TLS automáticos para evitar caídas de Nginx.
# ==============================================================================

TLS_DIR="/etc/nginx/tls"
mkdir -p "$TLS_DIR"

if [ ! -s "$TLS_DIR/server.crt" ] || [ ! -s "$TLS_DIR/server.key" ]; then
    echo "=> [TSO-WEB] No se encontraron certificados TLS en $TLS_DIR. Generando certificados autofirmados automáticos..."
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout "$TLS_DIR/server.key" \
        -out "$TLS_DIR/server.crt" \
        -subj "/C=BO/O=BANCO SUDOERS/CN=*.sudoers.lan" \
        -addext "subjectAltName=DNS:sudoers.lan,DNS:*.sudoers.lan,DNS:localhost,IP:192.168.100.85,IP:192.168.0.2,IP:127.0.0.1" 2>/dev/null || true
    chmod 644 "$TLS_DIR/server.crt" 2>/dev/null || true
    chmod 600 "$TLS_DIR/server.key" 2>/dev/null || true
    echo "=> [TSO-WEB] Certificados TLS generados exitosamente."
fi

echo "=> [TSO-WEB] Validando sintaxis de configuración de Nginx..."
nginx -t

echo "=> [TSO-WEB] Sintaxis válida. Iniciando servidor web..."
exec "$@"
