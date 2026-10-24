#!/bin/bash
# ===================================================================
# ips-toggle.sh — Alternador entre Modo IDS (Detección) y Modo IPS (Prevención)
# ===================================================================
# Uso:
#   sudo bash server/suricata/ips-toggle.sh --ids     # Monitoreo pasivo (AF_PACKET)
#   sudo bash server/suricata/ips-toggle.sh --ips     # Bloqueo en línea (NFQUEUE + nftables)
#   bash server/suricata/ips-toggle.sh --status       # Ver estado actual y alertas
# ===================================================================
set -euo pipefail

log()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
info() { printf '    %s\n' "$*"; }
ok()   { printf '    \033[32m✔\033[0m %s\n' "$*"; }
warn() { printf '    \033[33m! %s\033[0m\n' "$*"; }
die()  { printf '\n\033[31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

MODE="${1:-}"

get_iface() {
    local iface=""
    if [[ -f /etc/default/suricata ]]; then
        iface="$(grep -E '^IFACE=' /etc/default/suricata | cut -d= -f2- | tr -d "\"\' ")"
    fi
    if [[ -z "$iface" ]]; then
        iface="$(ip -o -4 route show to default 2>/dev/null | awk '{print $5; exit}')"
    fi
    echo "${iface:-eno1}"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        die "Para cambiar de modo se requieren privilegios de root: sudo bash $0 $MODE"
    fi
}

has_nft_queue() {
    nft list chain inet filter input 2>/dev/null | grep -q "queue num 0"
}

remove_nft_queue() {
    # Eliminar cualquier regla de queue num 0 de la cadena input
    if has_nft_queue; then
        local handles
        handles="$(nft -a list chain inet filter input 2>/dev/null | grep "queue num 0" | awk '{print $NF}')"
        for h in $handles; do
            nft delete rule inet filter input handle "$h" 2>/dev/null || true
        done
        info "Regla NFQUEUE retirada de nftables"
    fi
}

add_nft_queue() {
    if ! has_nft_queue; then
        # Se inserta en la cadena input con bypass (para no cortar la red si Suricata se apaga)
        nft insert rule inet filter input queue num 0 bypass
        info "Regla insertada en nftables: 'queue num 0 bypass'"
    else
        info "Regla NFQUEUE ya presente en nftables"
    fi
}

case "$MODE" in
    --ids)
        check_root
        SURICATA_IFACE="$(get_iface)"
        log "Cambiando Suricata a MODO IDS (Detección Pasiva)"

        remove_nft_queue

        cat <<EOF > /etc/default/suricata
RUN=yes
SURICATA_OPTS="-i $SURICATA_IFACE"
IFACE=$SURICATA_IFACE
EOF
        systemctl daemon-reload
        systemctl restart suricata
        sleep 2
        ok "Modo IDS activo en interfaz $SURICATA_IFACE (las firmas con acción 'drop' solo alertarán)"
        ;;

    --ips)
        check_root
        SURICATA_IFACE="$(get_iface)"
        log "Cambiando Suricata a MODO IPS (Prevención en Línea)"

        add_nft_queue

        cat <<EOF > /etc/default/suricata
RUN=yes
SURICATA_OPTS="-q 0"
IFACE=$SURICATA_IFACE
EOF
        systemctl daemon-reload
        systemctl restart suricata
        sleep 2
        ok "Modo IPS activo mediante NFQUEUE 0 (las firmas con acción 'drop' descartarán paquetes en tiempo real)"
        ;;

    --status|"")
        log "Estado de la Solución de Seguridad (IDS / IPS)"
        if systemctl is-active --quiet suricata; then
            ok "Servicio Suricata: ACTIVO"
        else
            warn "Servicio Suricata: INACTIVO o DETENIDO"
        fi

        CURRENT_OPTS=""
        [[ -f /etc/default/suricata ]] && CURRENT_OPTS="$(grep -E '^SURICATA_OPTS=' /etc/default/suricata | cut -d= -f2- | tr -d "\"\'")"

        if [[ "$CURRENT_OPTS" == *"-q "* ]]; then
            info "Modo Operativo Actual: [ IPS - Prevención Activa en Línea (NFQUEUE) ]"
        else
            info "Modo Operativo Actual: [ IDS - Detección Pasiva (AF_PACKET) ]"
        fi

        if has_nft_queue; then
            ok "Hook de Kernel (nftables NFQUEUE): PRESENTE"
        else
            info "Hook de Kernel (nftables NFQUEUE): NO PRESENTE (tráfico no interceptado por cola)"
        fi

        echo
        info "Últimas 5 alertas registradas en /var/log/suricata/fast.log:"
        if [[ -f /var/log/suricata/fast.log && -s /var/log/suricata/fast.log ]]; then
            tail -n 5 /var/log/suricata/fast.log | sed 's/^/      /'
        else
            info "  (Sin alertas registradas aún)"
        fi
        echo
        ;;

    *)
        echo "Uso: sudo bash $0 {--ids | --ips | --status}"
        exit 1
        ;;
esac
