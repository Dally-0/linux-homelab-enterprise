#!/bin/bash
# ===================================================================
# set-ip.sh — IP fija para el host dc1 (por defecto 192.168.0.2/24)
#
# GUÍA DE USO
# -----------
#   sudo bash server/set-ip.sh              # aplica la IP fija (pide confirmación)
#   sudo bash server/set-ip.sh --yes        # sin confirmación (para automatizar)
#   sudo bash server/set-ip.sh --dry-run    # muestra qué haría, no toca nada
#   sudo bash server/set-ip.sh --rollback   # vuelve a la config guardada (DHCP)
#   bash server/set-ip.sh --help            # esta ayuda
#
# Variables de entorno (opcionales, sobreescriben los defaults):
#   IFACE=enp0s3  IP=192.168.0.2  PREFIX=24  GATEWAY=192.168.0.1
#   DNS=192.168.0.1     # resolver tras el cambio (.1 hasta que el DC sirva DNS)
#   ROLLBACK_SECS=300   # rollback automático si no se confirma
#   STATE=/var/lib/tso-set-ip
#
# QUÉ HACE
# --------
#   1. Valida que la IP esté libre (ICMP + ARP) y que el gestor de red sea
#      ifupdown (Debian puro). Aborta si hay NetworkManager/netplan.
#   2. Respalda /etc/network/interfaces y /etc/resolv.conf en STATE.
#   3. Escribe `iface <IFACE> inet static` con address/gateway.
#   4. Programa un ROLLBACK AUTOMÁTICO (systemd-run) a los ROLLBACK_SECS:
#      si no confirmás, la máquina vuelve sola a DHCP. Pensado para no
#      quedar afuera por SSH.
#   5. Aplica (dhcpcd -k + ifdown/ifup), fija /etc/resolv.conf y verifica
#      que el gateway responda.
#
# CONFIRMAR (cancela el rollback)
#   sudo touch /run/tso-ip-ok && sudo systemctl stop tso-ip-rollback.timer
#
# SI PERDÉS LA CONEXIÓN
#   Esperá ROLLBACK_SECS segundos (300 por defecto: vuelve solo a DHCP) o,
#   desde la consola de la VM:  sudo bash server/set-ip.sh --rollback
#
# NOTAS
#   - La sesión SSH a la IP vieja se corta: reconectar a la IP nueva.
#   - .2 está fuera del pool DHCP del router (.100–.199): no se reparte.
#   - Si el dc1 físico vuelve a la LAN con .2, hay conflicto: solo uno.
#   - FreeRADIUS/router esperan que el DC esté en .2 (ver AGENTS.md).
# ===================================================================
set -euo pipefail

# ─── Defaults (override por entorno) ───
IFACE="${IFACE:-enp0s3}"
IP="${IP:-192.168.0.2}"
PREFIX="${PREFIX:-24}"
GATEWAY="${GATEWAY:-192.168.0.1}"
DNS="${DNS:-192.168.0.1}"
ROLLBACK_SECS="${ROLLBACK_SECS:-300}"
STATE="${STATE:-/var/lib/tso-set-ip}"
OK_FLAG=/run/tso-ip-ok
UNIT=tso-ip-rollback

DRY_RUN=0
ASSUME_YES=0
DO_ROLLBACK=0

usage() {
    awk 'f && /^# =====/{exit} f{sub(/^# ?/,""); print} /^# =====/{f=1}' "$0"
}

for arg in "$@"; do
    case "$arg" in
        -h|--help)     usage; exit 0 ;;
        --dry-run)     DRY_RUN=1 ;;
        -y|--yes)      ASSUME_YES=1 ;;
        --rollback)    DO_ROLLBACK=1 ;;
        *) echo "Opción desconocida: $arg (usá --help)" >&2; exit 2 ;;
    esac
done

log()  { echo "$*"; }
die()  { echo "ERROR: $*" >&2; exit 1; }
run()  {
    if [[ $DRY_RUN -eq 1 ]]; then echo "    [dry-run] $*"; else "$@"; fi
}

# ─── Rollback ────────────────────────────────────────────────────────
rollback() {
    [[ -f "$STATE/interfaces.orig" ]] || die "No hay respaldo en $STATE/interfaces.orig"
    log "==> Volviendo a la configuración original (DHCP) ..."
    cp -a "$STATE/interfaces.orig" /etc/network/interfaces
    [[ -f "$STATE/resolv.conf.orig" ]] && cp -a "$STATE/resolv.conf.orig" /etc/resolv.conf || true
    dhcpcd -k "$IFACE" 2>/dev/null || true
    ip addr flush dev "$IFACE" scope global || true
    ifup --force "$IFACE" || true
    ip -br a show "$IFACE"
    logger -t tso-set-ip "rollback aplicado en $IFACE (vuelve a DHCP)"
    log "    Listo. IP actual:"
    ip -4 -br a show "$IFACE"
}

# ─── Validaciones previas ───────────────────────────────────────────
[[ $EUID -eq 0 ]] || die "ejecutar con sudo (root). Ver: bash $0 --help"
[[ $DO_ROLLBACK -eq 1 ]] && { rollback; exit 0; }

for bin in ip ifup ifdown dhcpcd ping; do
    command -v "$bin" >/dev/null || die "falta el binario '$bin'"
done

# Solo ifupdown: si hay NetworkManager/netplan, esta config no se aplicaría.
if command -v nmcli >/dev/null 2>&1 || systemctl is-active --quiet NetworkManager 2>/dev/null; then
    die "NetworkManager está presente: configurá la IP con 'nmcli con mod' (este script asume ifupdown)."
fi
if command -v netplan >/dev/null 2>&1; then
    die "netplan está presente: configurá la IP en /etc/netplan/*.yaml (este script asume ifupdown)."
fi

ip link show "$IFACE" >/dev/null 2>&1 || die "no existe la interfaz $IFACE"
[[ "$IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "IP inválida: $IP"

CUR_IP="$(ip -4 -br a show "$IFACE" | awk '{print $3}')"
log "==> Estado actual: $IFACE = ${CUR_IP:-sin IP}  →  objetivo: $IP/$PREFIX (gw $GATEWAY)"

# ─── [1/6] IP libre ─────────────────────────────────────────────────
log "==> [1/6] Verificando que $IP esté libre ..."
if [[ "$CUR_IP" != "$IP/$PREFIX" ]]; then
    if ping -c1 -W1 "$IP" >/dev/null 2>&1; then
        die "$IP ya responde en la red (¿el dc1 físico está encendido?). No se cambia nada."
    fi
    if ip neigh show "$IP" 2>/dev/null | grep -q .; then
        die "hay una entrada ARP para $IP. No se cambia nada."
    fi
    log "    libre (sin respuesta ICMP/ARP)"
else
    log "    ya está configurada en esta interfaz"
fi

# ─── [2/6] Respaldos ────────────────────────────────────────────────
log "==> [2/6] Respaldando config en $STATE ..."
if [[ $DRY_RUN -eq 0 ]]; then
    mkdir -p "$STATE"
    # El respaldo NO se pisa en re-ejecuciones: --rollback siempre vuelve a
    # la config original (DHCP), no a una IP fija anterior.
    if [[ -f "$STATE/interfaces.orig" ]]; then
        log "    ya existe respaldo previo (se conserva): $STATE/interfaces.orig"
    else
        cp -a /etc/network/interfaces "$STATE/interfaces.orig"
        [[ -f /etc/resolv.conf ]] && cp -a /etc/resolv.conf "$STATE/resolv.conf.orig"
        log "    respaldo: $STATE/interfaces.orig"
    fi
fi

# ─── [3/6] Rollback automático ──────────────────────────────────────
log "==> [3/6] Programando rollback automático (${ROLLBACK_SECS}s) ..."
if [[ $DRY_RUN -eq 0 ]]; then
    cat > "$STATE/rollback.sh" <<EOS
#!/bin/bash
# Rollback automático de set-ip.sh — se cancela con: touch $OK_FLAG
[ -f $OK_FLAG ] && exit 0
cp -a $STATE/interfaces.orig /etc/network/interfaces
[ -f $STATE/resolv.conf.orig ] && cp -a $STATE/resolv.conf.orig /etc/resolv.conf
dhcpcd -k $IFACE 2>/dev/null || true
ip addr flush dev $IFACE scope global || true
ifup --force $IFACE || true
logger -t tso-set-ip "ROLLBACK automático: $IFACE vuelve a DHCP"
EOS
    chmod 0750 "$STATE/rollback.sh"
    systemctl stop "$UNIT.timer" 2>/dev/null || true
    rm -f "$OK_FLAG"
    systemd-run --on-active="$ROLLBACK_SECS" --unit="$UNIT" "$STATE/rollback.sh" >/dev/null
    log "    activo: systemctl list-timers $UNIT.timer"
fi

# ─── [4/6] Confirmación ─────────────────────────────────────────────
if [[ $ASSUME_YES -eq 0 && $DRY_RUN -eq 0 ]]; then
    echo
    echo "Se va a configurar $IP/$PREFIX en $IFACE (gw $GATEWAY, dns $DNS)."
    echo "La sesión SSH actual (${CUR_IP:-sin IP}) SE CORTA: reconectar a $IP."
    read -rp "Escribí SI para continuar: " ans
    [[ "$ans" == "SI" ]] || die "cancelado por el usuario (nada modificado)"
fi

# ─── [5/6] Config estática + aplicación ─────────────────────────────
log "==> [5/6] Escribiendo config estática y aplicando ..."
if [[ $DRY_RUN -eq 0 ]]; then
    cat > /etc/network/interfaces <<EOF
# This file describes the network interfaces available on your system
# and how to activate them. For more information, see interfaces(5).
# Generado por server/set-ip.sh — IP fija de dc1 (servidor/DC)

source /etc/network/interfaces.d/*

auto lo
iface lo inet loopback

auto $IFACE
iface $IFACE inet static
    address $IP/$PREFIX
    gateway $GATEWAY
EOF
    dhcpcd -k "$IFACE" 2>/dev/null || true
    ifdown --force "$IFACE" 2>/dev/null || true
    ip addr flush dev "$IFACE" scope global || true
    ifup "$IFACE"
    printf 'nameserver %s\n' "$DNS" > /etc/resolv.conf
    logger -t tso-set-ip "IP fija aplicada: $IP/$PREFIX en $IFACE (gw $GATEWAY)"
else
    log "    [dry-run] no se modifica /etc/network/interfaces ni /etc/resolv.conf"
fi

# ─── [6/6] Verificación ─────────────────────────────────────────────
log "==> [6/6] Verificando ..."
if [[ $DRY_RUN -eq 0 ]]; then
    ip -4 -br a show "$IFACE"
    ip r | grep -q '^default' && log "    ruta default: $(ip r | awk '/^default/{print; exit}')" \
        || log "    AVISO: sin ruta default"
    if ping -c2 -W2 "$GATEWAY" >/dev/null 2>&1; then
        log "    gateway $GATEWAY responde OK"
    else
        log "    AVISO: el gateway $GATEWAY NO responde (¿cable/bridge?)"
    fi
fi

cat <<EOF

────────────────────────────────────────────────────────────
IP objetivo: $IP/$PREFIX  (gw $GATEWAY, dns $DNS)

  • Si tenés red y todo OK, cancelá el rollback:
        sudo touch $OK_FLAG && sudo systemctl stop $UNIT.timer
  • Si perdiste la conexión, esperá ${ROLLBACK_SECS}s (vuelve solo a DHCP) o:
        sudo bash server/set-ip.sh --rollback
  • Reconectar SSH a:  ssh $(id -un 1000 2>/dev/null || echo root)@$IP
────────────────────────────────────────────────────────────
EOF
