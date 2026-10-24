#!/bin/bash
# ===================================================================
# install.sh — Instalador IT Unificado de dc1 (Samba AD + Docker Stack)
#
# Uso:
#   sudo bash install.sh             # instala todo de punta a punta
#   sudo bash install.sh --check     # diagnóstico sin cambios
#   sudo bash install.sh --yes       # modo desatendido
#   sudo bash install.sh --set-ip    # auto-configura la IP fija 192.168.0.2
# ===================================================================
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
exec bash "$DIR/server/bootstrap.sh" "$@"
