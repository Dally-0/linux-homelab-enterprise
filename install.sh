#!/bin/bash
# ===================================================================
# install.sh — Instalador IT Unificado de dc1 (Samba AD + Docker Stack + IDS/IPS)
#
# Uso:
#   sudo bash install.sh             # instala todo de punta a punta (incluye IDS/IPS)
#   sudo bash install.sh --check     # diagnóstico sin cambios
#   sudo bash install.sh --ips       # instala y activa modo IPS en línea (bloqueo activo)
#   sudo bash install.sh --skip-ids  # omite la instalación del IDS/IPS Suricata
#   sudo bash install.sh --skip-ad   # omite la provisión de Active Directory
#   sudo bash install.sh --yes       # modo desatendido
#   sudo bash install.sh --set-ip    # auto-configura la IP fija 192.168.0.2
#   sudo bash install.sh -i <interfaz> # fuerza la interfaz de red (ej. eth0, eno1)
# ===================================================================
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
exec bash "$DIR/server/bootstrap.sh" "$@"
