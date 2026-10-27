#!/bin/bash
# ==============================================================================
# run.sh — Gestor de ciclo de vida de OpenVAS / Greenbone Community
# ==============================================================================
# Uso:
#   sudo bash run.sh start         # Descarga imágenes y levanta OpenVAS
#   sudo bash run.sh create-admin  # Crea o restablece la clave del usuario admin
#   sudo bash run.sh stop          # Detiene y libera la memoria RAM
#   sudo bash run.sh logs          # Muestra los registros de arranque y sincronización
#   sudo bash run.sh status        # Verifica el estado de los contenedores
# ==============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE="docker compose -f $DIR/docker-compose.yml"

log()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[32m✔\033[0m %s\n' "$*"; }
info() { printf '    %s\n' "$*"; }
die()  { printf '\n\033[31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

ACTION="${1:-help}"

case "$ACTION" in
    start|up)
        log "Iniciando Greenbone Community Edition (OpenVAS)..."
        $COMPOSE up -d
        ok "Contenedores iniciados en segundo plano."
        info "La consola web estará disponible en: http://localhost:9392 (o http://<IP>:9392)"
        info "Credenciales recomendadas: admin / admin123"
        info "Para crear/verificar la contraseña de admin ejecuta:"
        info "  sudo bash run.sh create-admin"
        info "Nota: Al arrancar por primera vez, OpenVAS sincroniza las firmas (NVTs); puede demorar unos minutos."
        ;;

    stop|down)
        log "Deteniendo OpenVAS y liberando memoria RAM..."
        $COMPOSE down
        ok "Servicios de OpenVAS detenidos correctamente."
        ;;

    status)
        log "Estado de los servicios de OpenVAS:"
        $COMPOSE ps
        if ss -tulpn 2>/dev/null | grep -q ":9392"; then
            ok "El puerto 9392 está activo y escuchando."
        else
            info "El puerto 9392 aún no está abierto o los contenedores se están iniciando."
        fi
        ;;

    logs)
        $COMPOSE logs -f
        ;;

    create-admin)
        log "Creando o restableciendo usuario admin en GVMD..."
        $COMPOSE exec -u gvmd gvmd gvmd --user=admin --new-password=admin123 2>/dev/null || \
        $COMPOSE exec -u gvmd gvmd gvmd --create-user=admin --new-password=admin123 2>/dev/null || true
        ok "Usuario 'admin' configurado con contraseña 'admin123'."
        ;;

    *)
        echo "Uso: sudo bash $0 {start|stop|status|logs|create-admin}"
        exit 1
        ;;
esac
