#!/bin/bash
# ===================================================================
# setup.sh — Instalador y configurador de Suricata (IDS/IPS) en dc1
# ===================================================================
# Uso:
#   sudo bash server/suricata/setup.sh           # auto-detecta interfaz
#   sudo bash server/suricata/setup.sh -i eno1   # especifica interfaz
# ===================================================================
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"

log()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
info() { printf '    %s\n' "$*"; }
ok()   { printf '    \033[32m✔\033[0m %s\n' "$*"; }
warn() { printf '    \033[33m! %s\033[0m\n' "$*"; }
die()  { printf '\n\033[31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

if [[ $EUID -ne 0 ]]; then
    die "Este script debe ejecutarse como root: sudo bash server/suricata/setup.sh"
fi

# Detectar interfaz
IFACE_ARG=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        -i|--interface) IFACE_ARG="$2"; shift 2 ;;
        -h|--help)
            echo "Uso: sudo bash $0 [-i <interfaz>]"
            exit 0
            ;;
        *) die "Argumento desconocido: $1" ;;
    esac
done

if [[ -n "$IFACE_ARG" ]]; then
    SURICATA_IFACE="$IFACE_ARG"
elif [[ -f "$ROOT/.env" ]] && grep -qE '^DHCP_INTERFACE=' "$ROOT/.env"; then
    SURICATA_IFACE="$(grep -E '^DHCP_INTERFACE=' "$ROOT/.env" | tail -1 | cut -d= -f2- | tr -d "\"\' ")"
fi

if [[ -z "${SURICATA_IFACE:-}" ]] || ! ip link show "$SURICATA_IFACE" >/dev/null 2>&1; then
    SURICATA_IFACE="$(ip -o -4 route get 192.168.0.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="dev") print $(i+1); exit}')"
fi
if [[ -z "${SURICATA_IFACE:-}" ]] || ! ip link show "$SURICATA_IFACE" >/dev/null 2>&1; then
    SURICATA_IFACE="$(ip -o -4 route show to default 2>/dev/null | awk '{print $5; exit}')"
fi
if [[ -z "${SURICATA_IFACE:-}" ]] || ! ip link show "$SURICATA_IFACE" >/dev/null 2>&1; then
    for d in /sys/class/net/*; do
        [[ -d "$d/device" ]] || continue
        local_dev="$(basename "$d")"
        [[ "$local_dev" =~ ^(lo|docker|veth|br-|virbr) ]] && continue
        SURICATA_IFACE="$local_dev"
        break
    done
fi
SURICATA_IFACE="${SURICATA_IFACE:-}"
[[ -n "$SURICATA_IFACE" ]] || die "no se pudo detectar una interfaz de red válida para Suricata"

log "[1/5] Verificando e instalando paquetes necesarios"
PKGS=()
command -v suricata        >/dev/null 2>&1 || PKGS+=(suricata)
command -v suricata-update >/dev/null 2>&1 || PKGS+=(suricata-update)
command -v jq              >/dev/null 2>&1 || PKGS+=(jq)

if [[ ${#PKGS[@]} -gt 0 ]]; then
    info "Instalando paquetes: ${PKGS[*]}..."
    apt-get update -qq
    env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "${PKGS[@]}"
    ok "Paquetes instalados"
else
    ok "Suricata y herramientas ya instaladas"
fi

log "[2/5] Desplegando reglas de seguridad del homelab"
mkdir -p /etc/suricata/rules /var/log/suricata /var/lib/suricata/rules
cp "$DIR/rules/homelab.rules" /etc/suricata/rules/homelab.rules
chmod 644 /etc/suricata/rules/homelab.rules
ok "Reglas personalizadas copiadas a /etc/suricata/rules/homelab.rules"

# Si no existe archivo de reglas globales, crear uno vacío para evitar warnings
if [[ ! -f /var/lib/suricata/rules/suricata.rules ]]; then
    touch /var/lib/suricata/rules/suricata.rules
fi

log "[3/5] Configurando suricata.yaml para la red local (interfaz: $SURICATA_IFACE)"
if [[ -f /etc/suricata/suricata.yaml ]]; then
    cp -a /etc/suricata/suricata.yaml "/etc/suricata/suricata.yaml.bak.$(date +%Y%m%d%H%M%S)"
fi

sed "s|@SURICATA_IFACE@|$SURICATA_IFACE|g" "$DIR/suricata.yaml" > /etc/suricata/suricata.yaml
chmod 640 /etc/suricata/suricata.yaml
ok "Configuración aplicada en /etc/suricata/suricata.yaml"

log "[4/5] Validando sintaxis de configuración y reglas"
if suricata -T -c /etc/suricata/suricata.yaml; then
    ok "Sintaxis de Suricata validada correctamente"
else
    die "La prueba de sintaxis de Suricata falló. Revisá la configuración."
fi

log "[5/5] Activando servicio en modo IDS (AF_PACKET en $SURICATA_IFACE)"
# Configurar /etc/default/suricata
cat <<EOF > /etc/default/suricata
# Configuración generada por setup.sh
RUN=yes
SURICATA_OPTS="-i $SURICATA_IFACE"
IFACE=$SURICATA_IFACE
EOF

systemctl daemon-reload
systemctl enable suricata >/dev/null 2>&1 || true
systemctl restart suricata

sleep 2
if systemctl is-active --quiet suricata; then
    ok "Suricata está activo y monitoreando en modo IDS pasivo"
else
    warn "Suricata no arrancó inmediatamente. Revisá: journalctl -u suricata -n 30"
fi

cat <<EOF

────────────────────────────────────────────────────────────────────────────────
 IDS / IPS SURICATA CONFIGURADO EXITOSAMENTE
────────────────────────────────────────────────────────────────────────────────
 • Modo activo        : IDS (Detección Pasiva en $SURICATA_IFACE)
 • Red protegida      : 192.168.0.0/24 (\$HOME_NET)
 • Log rápido         : /var/log/suricata/fast.log
 • Log estructurado   : /var/log/suricata/eve.json
 • Reglas homelab     : /etc/suricata/rules/homelab.rules

 Comandos de administración útiles:
   sudo bash server/suricata/ips-toggle.sh --ips     # Cambia a modo IPS (bloqueo en tiempo real)
   sudo bash server/suricata/ips-toggle.sh --ids     # Vuelve a modo IDS (solo alertas)
   bash server/suricata/ips-toggle.sh --status       # Consulta estado y últimas alertas
   sudo bash server/suricata/test-ids-ips.sh         # Ejecuta pruebas automáticas de IDS e IPS
────────────────────────────────────────────────────────────────────────────────
EOF
