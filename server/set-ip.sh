#!/bin/bash
# ===================================================================
# set-ip.sh — IP fija para el host dc1 (por defecto 192.168.0.2/24)
#
# GUÍA DE USO
# -----------
#   sudo bash server/set-ip.sh                  # auto-detecta interfaz y aplica (pide confirmación)
#   sudo bash server/set-ip.sh -i eth0          # fuerza la interfaz eth0
#   sudo bash server/set-ip.sh --yes --commit   # automatizable: aplica y NO vuelve a DHCP
#   sudo bash server/set-ip.sh --yes            # sin preguntar, con rollback automático
#   sudo bash server/set-ip.sh --dry-run        # muestra qué haría, no toca nada
#   sudo bash server/set-ip.sh --force          # re-aplica aunque ya esté puesta
#   sudo bash server/set-ip.sh --rollback       # vuelve a la config guardada (DHCP)
#   bash server/set-ip.sh --help                # esta ayuda
#
# Variables de entorno (opcionales, sobreescriben los defaults):
#   IFACE=<auto>  IP=192.168.0.2  PREFIX=24  GATEWAY=192.168.0.1
#   DNS=192.168.0.1     # resolver tras el cambio (.1 hasta que el DC sirva DNS)
#   ROLLBACK_SECS=300   # rollback automático si no se confirma
#   STATE=/var/lib/tso-set-ip
#
# QUÉ HACE
# --------
#   1. Auto-detecta la interfaz física/activa conectada a la red local
#      (o acepta -i / IFACE=<interfaz> para cualquier hardware o VM).
#   2. Detecta el gestor de red (ifupdown en Debian server, NetworkManager
#      en desktop/laptop, o netplan).
#   3. Valida que la IP esté libre (ICMP + ARP).
#   4. Respalda la configuración previa en STATE.
#   5. Programa un ROLLBACK AUTOMÁTICO (systemd-run) a los ROLLBACK_SECS:
#      si no confirmás, la máquina vuelve sola a DHCP. Pensado para no
#      quedar afuera por SSH.
#   6. Aplica la IP fija estática, configura resolver DNS y verifica
#      que el gateway responda.
#
# CONFIRMAR (cancela el rollback)
#   sudo touch /run/tso-ip-ok && sudo systemctl stop tso-ip-rollback.timer
#
# SI PERDÉS LA CONEXIÓN
#   Esperá ROLLBACK_SECS segundos (300 por defecto: vuelve solo a DHCP) o:
#   sudo bash server/set-ip.sh --rollback
# ===================================================================
set -euo pipefail

SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ─── Defaults (override por entorno) ───
IFACE="${IFACE:-}"
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
COMMIT=0
FORCE=0

usage() {
    cat <<EOF
set-ip.sh — IP fija para el host dc1 (por defecto 192.168.0.2/24)

GUÍA DE USO
-----------
  sudo bash server/set-ip.sh                  # auto-detecta interfaz y aplica (pide confirmación)
  sudo bash server/set-ip.sh -i eth0          # fuerza la interfaz eth0
  sudo bash server/set-ip.sh --yes --commit   # automatizable: aplica y confirma sin rollback
  sudo bash server/set-ip.sh --yes            # sin preguntar, con rollback a los 300s si falla
  sudo bash server/set-ip.sh --dry-run        # muestra qué haría, no toca nada
  sudo bash server/set-ip.sh --force          # re-aplica aunque ya esté puesta
  sudo bash server/set-ip.sh --rollback       # vuelve a la config guardada (DHCP)
  bash server/set-ip.sh --help                # esta ayuda

Opciones:
  -i, --iface, --interface <NIC>  interfaz de red (por defecto: auto-detectada)
  --ip <IP>                       IP objetivo (por defecto: 192.168.0.2)
  --gateway <GW>                  puerta de enlace (por defecto: 192.168.0.1)
  --dns <DNS>                     servidor DNS (por defecto: 192.168.0.1)
  --prefix <PREFIX>               máscara CIDR (por defecto: 24)
  --rollback-secs <SECS>          segundos antes del rollback (por defecto: 300)
  --commit                        confirma inmediatamente y cancela el rollback
  --dry-run                       simulación sin cambios
  -y, --yes                       asume confirmación afirmativa
  --force                         re-aplica aunque la IP ya coincida
  --rollback                      revierte a la configuración previa guardada
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)     usage; exit 0 ;;
        --dry-run)     DRY_RUN=1; shift ;;
        -y|--yes)      ASSUME_YES=1; shift ;;
        --commit)      COMMIT=1; shift ;;
        --force)       FORCE=1; shift ;;
        --rollback)    DO_ROLLBACK=1; shift ;;
        -i|--iface|--interface)
            [[ $# -ge 2 ]] || { echo "ERROR: falta el argumento para $1" >&2; exit 2; }
            IFACE="$2"; shift 2 ;;
        --iface=*|--interface=*)
            IFACE="${1#*=}"; shift ;;
        --ip)
            [[ $# -ge 2 ]] || { echo "ERROR: falta el argumento para $1" >&2; exit 2; }
            IP="$2"; shift 2 ;;
        --ip=*)
            IP="${1#*=}"; shift ;;
        --gateway)
            [[ $# -ge 2 ]] || { echo "ERROR: falta el argumento para $1" >&2; exit 2; }
            GATEWAY="$2"; shift 2 ;;
        --gateway=*)
            GATEWAY="${1#*=}"; shift ;;
        --dns)
            [[ $# -ge 2 ]] || { echo "ERROR: falta el argumento para $1" >&2; exit 2; }
            DNS="$2"; shift 2 ;;
        --dns=*)
            DNS="${1#*=}"; shift ;;
        --prefix)
            [[ $# -ge 2 ]] || { echo "ERROR: falta el argumento para $1" >&2; exit 2; }
            PREFIX="$2"; shift 2 ;;
        --prefix=*)
            PREFIX="${1#*=}"; shift ;;
        --rollback-secs)
            [[ $# -ge 2 ]] || { echo "ERROR: falta el argumento para $1" >&2; exit 2; }
            ROLLBACK_SECS="$2"; shift 2 ;;
        --rollback-secs=*)
            ROLLBACK_SECS="${1#*=}"; shift ;;
        *) echo "Opción desconocida: $1 (usá --help)" >&2; exit 2 ;;
    esac
done

log()  { echo "$*"; }
die()  { echo "ERROR: $*" >&2; exit 1; }
run()  {
    if [[ $DRY_RUN -eq 1 ]]; then echo "    [dry-run] $*"; else "$@"; fi
}

list_available_ifaces() {
    ip -br link show 2>/dev/null | awk '{print $1}' | tr '\n' ' '
}

# ─── Detección automática de la interfaz ────────────────────────────
detect_interface() {
    # 1. Si ya se definió explícitamente por variable o argumento
    if [[ -n "${IFACE:-}" ]]; then
        if ip link show "$IFACE" >/dev/null 2>&1; then
            return 0
        else
            die "no existe la interfaz '$IFACE' en este equipo. Interfaces disponibles: $(list_available_ifaces)"
        fi
    fi

    # 2. Si existe .env y define DHCP_INTERFACE (no vacío ni '*')
    if [[ -f "$ROOT/.env" ]]; then
        local env_iface
        env_iface="$(grep -E '^DHCP_INTERFACE=' "$ROOT/.env" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d "\"\' ")"
        if [[ -n "$env_iface" && "$env_iface" != "*" ]] && ip link show "$env_iface" >/dev/null 2>&1; then
            IFACE="$env_iface"
            return 0
        fi
    fi

    # 3. Interfaz con ruta hacia el gateway configurado ($GATEWAY, ej. 192.168.0.1)
    local cand=""
    cand="$(ip -o -4 route get "$GATEWAY" 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="dev") print $(i+1); exit}')"
    if [[ -n "$cand" ]] && ip link show "$cand" >/dev/null 2>&1; then
        IFACE="$cand"
        return 0
    fi

    # 4. Interfaz de la ruta por defecto
    cand="$(ip -o -4 route show to default 2>/dev/null | awk '{print $5; exit}')"
    if [[ -z "$cand" ]]; then
        cand="$(awk '$2=="00000000" {print $1; exit}' /proc/net/route 2>/dev/null || true)"
    fi
    if [[ -n "$cand" ]] && ip link show "$cand" >/dev/null 2>&1; then
        IFACE="$cand"
        return 0
    fi

    # 5. Interfaz que ya posea una IP en la misma subred (ej: 192.168.0.X)
    local net_pfx="${IP%.*}."
    cand="$(ip -o -4 addr show 2>/dev/null | awk -v pfx="$net_pfx" '$4 ~ ("^" pfx) {print $2; exit}')"
    if [[ -n "$cand" ]] && ip link show "$cand" >/dev/null 2>&1; then
        IFACE="$cand"
        return 0
    fi

    # 6. Interfaz física disponible en el sistema (excluyendo virtuales)
    local phys_ifaces=()
    for d in /sys/class/net/*; do
        [[ -d "$d" ]] || continue
        local name
        name="$(basename "$d")"
        [[ -d "$d/device" ]] || continue
        [[ "$name" =~ ^(lo|docker|veth|br-|virbr|tun|tap|tailscale|wg) ]] && continue
        phys_ifaces+=("$name")
    done

    # Preferir si está UP o carrier=1
    for ifc in "${phys_ifaces[@]}"; do
        local state carrier
        state="$(cat "/sys/class/net/$ifc/operstate" 2>/dev/null || true)"
        carrier="$(cat "/sys/class/net/$ifc/carrier" 2>/dev/null || true)"
        if [[ "$state" == "up" || "$carrier" == "1" ]]; then
            IFACE="$ifc"
            return 0
        fi
    done

    # Preferir ethernet (en*, eth*) sobre wifi
    for ifc in "${phys_ifaces[@]}"; do
        if [[ "$ifc" =~ ^(en|eth) ]]; then
            IFACE="$ifc"
            return 0
        fi
    done

    if [[ ${#phys_ifaces[@]} -gt 0 ]]; then
        IFACE="${phys_ifaces[0]}"
        return 0
    fi

    die "no se pudo auto-detectar la interfaz de red en este equipo. Interfaces disponibles: $(list_available_ifaces). Especificala con: --iface <interfaz>"
}

# ─── Detección del gestor de red ────────────────────────────────────
detect_backend() {
    # 1. Si NetworkManager está activo y gestiona esta interfaz:
    if systemctl is-active --quiet NetworkManager 2>/dev/null && command -v nmcli >/dev/null 2>&1; then
        local nm_state
        nm_state="$(nmcli -t -f DEVICE,STATE dev status 2>/dev/null | awk -F: -v dev="$IFACE" '$1==dev {print $2; exit}')"
        if [[ "$nm_state" == "connected" || "$nm_state" == "connecting" ]]; then
            echo "networkmanager"
            return 0
        fi
    fi

    # 2. Si existe netplan con configuración activa
    if command -v netplan >/dev/null 2>&1 && compgen -G "/etc/netplan/*.yaml" >/dev/null 2>&1; then
        echo "netplan"
        return 0
    fi

    # 3. ifupdown (estándar Debian)
    if command -v ifup >/dev/null 2>&1; then
        echo "ifupdown"
        return 0
    fi

    # 4. Fallback iproute2
    echo "iproute2"
}

get_nm_connection() {
    local dev="$1"
    local conn
    conn="$(nmcli -t -f DEVICE,CONNECTION dev status 2>/dev/null | awk -F: -v d="$dev" '$1==d {print $2; exit}')"
    if [[ -z "$conn" ]]; then
        conn="$(nmcli -t -f NAME,DEVICE con show --active 2>/dev/null | awk -F: -v d="$dev" '$2==d {print $1; exit}')"
    fi
    echo "$conn"
}

# ─── Rollback ────────────────────────────────────────────────────────
rollback_networkmanager() {
    local conn
    conn="$(cat "$STATE/nm_conn" 2>/dev/null || true)"
    [[ -n "$conn" ]] || conn="$(get_nm_connection "$IFACE")"
    [[ -n "$conn" ]] || die "no se encontró conexión de NetworkManager para restaurar en $IFACE"

    local method
    method="$(cat "$STATE/nm_method.orig" 2>/dev/null || echo "auto")"
    local addr
    addr="$(cat "$STATE/nm_addresses.orig" 2>/dev/null || true)"
    local gw
    gw="$(cat "$STATE/nm_gateway.orig" 2>/dev/null || true)"
    local dns
    dns="$(cat "$STATE/nm_dns.orig" 2>/dev/null || true)"

    log "==> Restaurando NetworkManager en conexión '$conn' ..."
    if [[ "$method" == "auto" || -z "$method" ]]; then
        nmcli con mod "$conn" ipv4.method auto ipv4.addresses "" ipv4.gateway "" ipv4.dns "" 2>/dev/null || true
    else
        nmcli con mod "$conn" ipv4.method "$method" ipv4.addresses "$addr" ipv4.gateway "$gw" ipv4.dns "$dns" 2>/dev/null || true
    fi
    nmcli con up "$conn" 2>/dev/null || true
}

rollback_ifupdown() {
    [[ -f "$STATE/interfaces.orig" ]] || die "No hay respaldo en $STATE/interfaces.orig"
    log "==> Volviendo a la configuración original en /etc/network/interfaces ..."
    cp -a "$STATE/interfaces.orig" /etc/network/interfaces
    [[ -f "$STATE/resolv.conf.orig" ]] && cp -a "$STATE/resolv.conf.orig" /etc/resolv.conf || true
    command -v dhcpcd >/dev/null 2>&1 && dhcpcd -k "$IFACE" 2>/dev/null || true
    command -v dhclient >/dev/null 2>&1 && dhclient -r "$IFACE" 2>/dev/null || true
    ip addr flush dev "$IFACE" scope global || true
    ifup --force "$IFACE" || true
}

rollback_netplan() {
    log "==> Eliminando configuración estática de netplan ..."
    rm -f /etc/netplan/99-tso-static.yaml
    netplan apply 2>/dev/null || true
}

rollback_iproute2() {
    log "==> Limpiando dirección estática de $IFACE (iproute2) ..."
    ip addr flush dev "$IFACE" scope global || true
    command -v dhclient >/dev/null 2>&1 && dhclient "$IFACE" 2>/dev/null || command -v dhcpcd >/dev/null 2>&1 && dhcpcd "$IFACE" 2>/dev/null || true
}

rollback() {
    local iface="${IFACE:-}"
    [[ -f "$STATE/iface" ]] && iface="$(cat "$STATE/iface" 2>/dev/null || echo "$iface")"
    local backend="${BACKEND:-}"
    [[ -f "$STATE/backend" ]] && backend="$(cat "$STATE/backend" 2>/dev/null || echo "$backend")"

    [[ -n "$iface" ]] && IFACE="$iface"

    log "==> Aplicando rollback de IP en interfaz: ${IFACE:-desconocida} (backend: ${backend:-desconocido}) ..."

    case "$backend" in
        networkmanager) rollback_networkmanager ;;
        netplan)        rollback_netplan ;;
        ifupdown)       rollback_ifupdown ;;
        *)
            if [[ -f "$STATE/interfaces.orig" ]]; then
                rollback_ifupdown
            elif [[ -f "$STATE/nm_conn" ]]; then
                rollback_networkmanager
            else
                rollback_iproute2
            fi
            ;;
    esac

    logger -t tso-set-ip "rollback aplicado en ${IFACE:-desconocida} (vuelve a DHCP)"
    log "    Listo. IP actual:"
    ip -4 -br a show "${IFACE:-}" 2>/dev/null || ip -4 -br a
}

# ─── Validaciones previas ───────────────────────────────────────────
[[ $EUID -eq 0 || $DRY_RUN -eq 1 ]] || die "ejecutar con sudo (root). Ver: bash $0 --help"
[[ $DO_ROLLBACK -eq 1 ]] && { rollback; exit 0; }

detect_interface
BACKEND="$(detect_backend)"

log "==> Interfaz seleccionada: $IFACE"
log "==> Gestor de red detectado: $BACKEND"

for bin in ip ping; do
    command -v "$bin" >/dev/null || die "falta el binario '$bin'"
done

if [[ "$BACKEND" == "ifupdown" ]]; then
    for bin in ifup ifdown; do
        command -v "$bin" >/dev/null || die "el backend ifupdown requiere el binario '$bin'"
    done
elif [[ "$BACKEND" == "networkmanager" ]]; then
    command -v nmcli >/dev/null || die "el backend NetworkManager requiere 'nmcli'"
elif [[ "$BACKEND" == "netplan" ]]; then
    command -v netplan >/dev/null || die "el backend netplan requiere 'netplan'"
fi

[[ "$IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "IP inválida: $IP"

CUR_IP="$(ip -4 -br a show "$IFACE" 2>/dev/null | awk '{print $3}' | cut -d/ -f1 || true)"
CUR_CIDR="$(ip -4 -br a show "$IFACE" 2>/dev/null | awk '{print $3}' || true)"
log "==> Estado actual: $IFACE = ${CUR_CIDR:-sin IP}  →  objetivo: $IP/$PREFIX (gw $GATEWAY)"

# Ya configurada: no se toca nada y se evita reprogramar rollback innecesario.
if [[ "$CUR_CIDR" == "$IP/$PREFIX" && $FORCE -eq 0 && $DRY_RUN -eq 0 ]]; then
    log "==> La IP $IP/$PREFIX ya está configurada en $IFACE. Nada que hacer."
    ip -4 -br a show "$IFACE"
    ip r | awk '/^default/{print "    " $0}'
    log "    (usá --force para re-aplicar, o --rollback para volver a DHCP)"
    exit 0
fi

# ─── [1/6] IP libre ─────────────────────────────────────────────────
log "==> [1/6] Verificando que $IP esté libre ..."
if [[ "$CUR_CIDR" != "$IP/$PREFIX" ]]; then
    # 1º ARP: una entrada con MAC (lladdr) = otro equipo la está usando.
    if ip neigh show "$IP" dev "$IFACE" 2>/dev/null | grep -qE 'lladdr +[0-9a-fA-F:]{17}'; then
        ip neigh show "$IP" dev "$IFACE" | sed 's/^/    /'
        die "$IP ya está en uso (hay MAC en la tabla ARP). No se cambia nada."
    fi
    # 2º ICMP: por si el otro equipo todavía no está en la tabla ARP
    if ping -c1 -W1 "$IP" >/dev/null 2>&1; then
        die "$IP ya responde a ping (¿el dc1 físico o equipo está encendido?). No se cambia nada."
    fi
    # Limpiar residuo FAILED/INCOMPLETE que dejó nuestro propio ping
    ip neigh del "$IP" dev "$IFACE" 2>/dev/null || true
    log "    libre (sin MAC en ARP ni respuesta ICMP)"
else
    log "    ya está configurada en esta interfaz"
fi

# ─── [2/6] Respaldos ────────────────────────────────────────────────
log "==> [2/6] Respaldando config en $STATE ..."
if [[ $DRY_RUN -eq 0 ]]; then
    mkdir -p "$STATE"
    echo "$IFACE" > "$STATE/iface"
    echo "$BACKEND" > "$STATE/backend"

    if [[ "$BACKEND" == "networkmanager" ]]; then
        nm_conn="$(get_nm_connection "$IFACE")"
        echo "$nm_conn" > "$STATE/nm_conn"
        if [[ ! -f "$STATE/nm_method.orig" ]]; then
            nmcli -g ipv4.method con show "$nm_conn" > "$STATE/nm_method.orig" 2>/dev/null || true
            nmcli -g ipv4.addresses con show "$nm_conn" > "$STATE/nm_addresses.orig" 2>/dev/null || true
            nmcli -g ipv4.gateway con show "$nm_conn" > "$STATE/nm_gateway.orig" 2>/dev/null || true
            nmcli -g ipv4.dns con show "$nm_conn" > "$STATE/nm_dns.orig" 2>/dev/null || true
            log "    respaldo de conexión NetworkManager '$nm_conn' en $STATE"
        fi
    elif [[ "$BACKEND" == "ifupdown" ]]; then
        if [[ -f "$STATE/interfaces.orig" ]]; then
            log "    ya existe respaldo previo (se conserva): $STATE/interfaces.orig"
        else
            [[ -f /etc/network/interfaces ]] && cp -a /etc/network/interfaces "$STATE/interfaces.orig"
            [[ -f /etc/resolv.conf ]] && cp -a /etc/resolv.conf "$STATE/resolv.conf.orig"
            log "    respaldo: $STATE/interfaces.orig"
        fi
    elif [[ "$BACKEND" == "netplan" ]]; then
        touch "$STATE/netplan.saved"
        log "    respaldo netplan registrado en $STATE"
    fi
fi

# ─── [3/6] Rollback automático ──────────────────────────────────────
log "==> [3/6] Programando rollback automático (${ROLLBACK_SECS}s) ..."
if [[ $DRY_RUN -eq 0 ]]; then
    cat > "$STATE/rollback.sh" <<EOS
#!/bin/bash
# Rollback automático de set-ip.sh — se cancela con: touch $OK_FLAG
[ -f "$OK_FLAG" ] && exit 0
if [[ -f "$SCRIPT_PATH" ]]; then
    bash "$SCRIPT_PATH" --rollback
else
    backend="\$(cat "$STATE/backend" 2>/dev/null || echo "ifupdown")"
    if [[ "\$backend" == "ifupdown" && -f "$STATE/interfaces.orig" ]]; then
        cp -a "$STATE/interfaces.orig" /etc/network/interfaces
        [ -f "$STATE/resolv.conf.orig" ] && cp -a "$STATE/resolv.conf.orig" /etc/resolv.conf
        ip addr flush dev "$IFACE" scope global 2>/dev/null || true
        ifup --force "$IFACE" 2>/dev/null || true
    elif [[ "\$backend" == "networkmanager" ]]; then
        nm_conn="\$(cat "$STATE/nm_conn" 2>/dev/null || echo "$IFACE")"
        nmcli con mod "\$nm_conn" ipv4.method auto ipv4.addresses "" ipv4.gateway "" ipv4.dns "" 2>/dev/null || true
        nmcli con up "\$nm_conn" 2>/dev/null || true
    fi
fi
logger -t tso-set-ip "ROLLBACK automático ejecutado para $IFACE"
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
    echo "Se va a configurar $IP/$PREFIX en $IFACE (gw $GATEWAY, dns $DNS, gestor: $BACKEND)."
    echo "La sesión SSH actual (${CUR_IP:-sin IP}) SE CORTA: reconectar a $IP."
    read -rp "Escribí SI para continuar: " ans
    [[ "$ans" == "SI" || "$ans" == "si" || "$ans" == "s" || "$ans" == "S" ]] || die "cancelado por el usuario (nada modificado)"
fi

# ─── [5/6] Configuración estática + aplicación ──────────────────────
log "==> [5/6] Aplicando configuración estática ($BACKEND) ..."
if [[ $DRY_RUN -eq 0 ]]; then
    case "$BACKEND" in
        networkmanager)
            nm_conn="$(get_nm_connection "$IFACE")"
            [[ -n "$nm_conn" ]] || die "no se encontró conexión de NetworkManager para $IFACE"
            nmcli con mod "$nm_conn" ipv4.addresses "$IP/$PREFIX" ipv4.gateway "$GATEWAY" ipv4.dns "$DNS" ipv4.method manual
            nmcli con up "$nm_conn"
            logger -t tso-set-ip "IP fija aplicada vía NetworkManager: $IP/$PREFIX en $IFACE (conn $nm_conn)"
            ;;
        ifupdown)
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
            command -v dhcpcd >/dev/null 2>&1 && dhcpcd -k "$IFACE" 2>/dev/null || true
            command -v dhclient >/dev/null 2>&1 && dhclient -r "$IFACE" 2>/dev/null || true
            ifdown --force "$IFACE" 2>/dev/null || true
            ip addr flush dev "$IFACE" scope global || true
            ifup "$IFACE"
            printf 'nameserver %s\n' "$DNS" > /etc/resolv.conf
            logger -t tso-set-ip "IP fija aplicada vía ifupdown: $IP/$PREFIX en $IFACE (gw $GATEWAY)"
            ;;
        netplan)
            cat > /etc/netplan/99-tso-static.yaml <<EOF
network:
  version: 2
  ethernets:
    $IFACE:
      dhcp4: no
      addresses:
        - $IP/$PREFIX
      routes:
        - to: default
          via: $GATEWAY
      nameservers:
        addresses:
          - $DNS
EOF
            netplan apply
            logger -t tso-set-ip "IP fija aplicada vía netplan: $IP/$PREFIX en $IFACE (gw $GATEWAY)"
            ;;
        *)
            command -v dhcpcd >/dev/null 2>&1 && dhcpcd -k "$IFACE" 2>/dev/null || true
            command -v dhclient >/dev/null 2>&1 && dhclient -r "$IFACE" 2>/dev/null || true
            ip addr flush dev "$IFACE" scope global || true
            ip addr add "$IP/$PREFIX" dev "$IFACE"
            ip link set "$IFACE" up
            ip route add default via "$GATEWAY" dev "$IFACE" 2>/dev/null || ip route replace default via "$GATEWAY" dev "$IFACE"
            printf 'nameserver %s\n' "$DNS" > /etc/resolv.conf
            logger -t tso-set-ip "IP fija aplicada vía iproute2: $IP/$PREFIX en $IFACE (gw $GATEWAY)"
            ;;
    esac
else
    log "    [dry-run] no se modifican archivos ni interfaces del sistema"
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

# ─── Confirmación automática (--commit) ─────────────────────────────
if [[ $COMMIT -eq 1 && $DRY_RUN -eq 0 ]]; then
    mkdir -p /run
    touch "$OK_FLAG"
    systemctl stop "$UNIT.timer" 2>/dev/null || true
    systemctl reset-failed "$UNIT.service" 2>/dev/null || true
    log "==> --commit: cambio confirmado (rollback automático cancelado)"
    exit 0
fi

cat <<EOF

────────────────────────────────────────────────────────────
IP objetivo: $IP/$PREFIX  (gw $GATEWAY, dns $DNS, iface $IFACE)

  • Si tenés red y todo OK, cancelá el rollback:
        sudo touch $OK_FLAG && sudo systemctl stop $UNIT.timer
  • Si perdiste la conexión, esperá ${ROLLBACK_SECS}s (vuelve solo a DHCP) o:
        sudo bash server/set-ip.sh --rollback
  • Reconectar SSH a:  ssh $(id -un 1000 2>/dev/null || echo root)@$IP
────────────────────────────────────────────────────────────
EOF
