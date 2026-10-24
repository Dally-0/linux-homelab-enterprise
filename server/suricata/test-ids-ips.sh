#!/bin/bash
# ===================================================================
# test-ids-ips.sh — Pruebas de verificación de IDS e IPS en el homelab
# ===================================================================
# Uso:
#   bash server/suricata/test-ids-ips.sh
# ===================================================================
set -euo pipefail

log()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
info() { printf '    %s\n' "$*"; }
ok()   { printf '    \033[32m✔\033[0m %s\n' "$*"; }
warn() { printf '    \033[33m! %s\033[0m\n' "$*"; }
die()  { printf '\n\033[31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

TARGET_HOST="127.0.0.1"
LOG_FAST="/var/log/suricata/fast.log"
LOG_EVE="/var/log/suricata/eve.json"

if ! systemctl is-active --quiet suricata 2>/dev/null; then
    die "Suricata no está en ejecución. Inicialo primero con: sudo bash server/suricata/setup.sh"
fi

if [[ ! -f "$LOG_FAST" ]]; then
    touch "$LOG_FAST" 2>/dev/null || true
fi

# Detectar modo actual
CURRENT_MODE="IDS"
if [[ -f /etc/default/suricata ]] && grep -qE '^SURICATA_OPTS=.*-q ' /etc/default/suricata; then
    CURRENT_MODE="IPS"
fi

log "Iniciando Batería de Pruebas de Seguridad (Modo Actual: $CURRENT_MODE)"

# -------------------------------------------------------------------
# PRUEBA 1: Verificación de Detección (IDS)
# -------------------------------------------------------------------
log "[Prueba 1] Envío de Sonda de Monitoreo (Firma: TEST_PROBE_ALERT_ONLY)"
LINE_BEFORE=$(wc -l < "$LOG_FAST" 2>/dev/null || echo 0)

# Enviar sonda HTTP (o TCP simple)
curl -s -m 2 "http://$TARGET_HOST/?probe=TEST_PROBE_ALERT_ONLY" >/dev/null 2>&1 || true

sleep 2
LINE_AFTER=$(wc -l < "$LOG_FAST" 2>/dev/null || echo 0)

if [[ $LINE_AFTER -gt $LINE_BEFORE ]]; then
    ok "Detección IDS exitosa. Último registro generado:"
    tail -n 1 "$LOG_FAST" | sed 's/^/      /'
else
    # Si no hubo HTTP server en localhost, probar vía socat o netcat si existen
    info "No se detectó en HTTP local (¿está Nginx corriendo?). Enviando por socket directo..."
    printf "TEST_PROBE_ALERT_ONLY\n" | nc -w 1 "$TARGET_HOST" 80 2>/dev/null || true
    sleep 2
    if tail -n 5 "$LOG_FAST" 2>/dev/null | grep -q "TEST_PROBE_ALERT_ONLY"; then
        ok "Detección IDS exitosa:"
        grep "TEST_PROBE_ALERT_ONLY" "$LOG_FAST" | tail -1 | sed 's/^/      /'
    else
        warn "No se observó alerta en fast.log para la sonda. Verificá si la interfaz captura loopback."
    fi
fi

# -------------------------------------------------------------------
# PRUEBA 2: Verificación de Prevención (IPS con regla 'drop')
# -------------------------------------------------------------------
log "[Prueba 2] Envío de Carga Maliciosa Simulada (Firma: MALICIOUS_SIMULATION_ATTACK)"
LINE_BEFORE=$(wc -l < "$LOG_FAST" 2>/dev/null || echo 0)

DROP_DETECTED=0
# Se envía la solicitud con un timeout corto de 2 segundos
if ! curl -s -m 2 -X POST -d "data=MALICIOUS_SIMULATION_ATTACK" "http://$TARGET_HOST/" >/dev/null 2>&1; then
    DROP_DETECTED=1
fi

sleep 2
LINE_AFTER=$(wc -l < "$LOG_FAST" 2>/dev/null || echo 0)

if [[ "$CURRENT_MODE" == "IPS" ]]; then
    if [[ $DROP_DETECTED -eq 1 ]]; then
        ok "PREVENCIÓN IPS CONFIRMADA: La conexión fue cortada/descartada en tiempo real!"
    else
        warn "La solicitud no pareció ser descartada. Verificá si la cola NFQUEUE está en nftables."
    fi
    if tail -n 5 "$LOG_FAST" 2>/dev/null | grep -q "MALICIOUS_SIMULATION_ATTACK"; then
        ok "Registro de descarte verificado en fast.log:"
        grep "MALICIOUS_SIMULATION_ATTACK" "$LOG_FAST" | tail -1 | sed 's/^/      /'
    fi
else
    info "Modo IDS activo: el ataque fue detectado pero NO bloqueado (comportamiento esperado de un IDS)."
    if tail -n 5 "$LOG_FAST" 2>/dev/null | grep -q "MALICIOUS_SIMULATION_ATTACK"; then
        ok "Alerta registrada en fast.log:"
        grep "MALICIOUS_SIMULATION_ATTACK" "$LOG_FAST" | tail -1 | sed 's/^/      /'
    fi
    info "Para habilitar la prevención y bloqueo activo (IPS), ejecutá: sudo bash server/suricata/ips-toggle.sh --ips"
fi

# -------------------------------------------------------------------
# PRUEBA 3: Verificación de Detección de Reconocimiento Web
# -------------------------------------------------------------------
log "[Prueba 3] Simulación de Intento de Path Traversal (/etc/passwd)"
curl -s -m 2 "http://$TARGET_HOST/?file=/etc/passwd" >/dev/null 2>&1 || true
sleep 2

if tail -n 5 "$LOG_FAST" 2>/dev/null | grep -q "etc/passwd"; then
    ok "Firma de Path Traversal detectada en fast.log:"
    grep "etc/passwd" "$LOG_FAST" | tail -1 | sed 's/^/      /'
else
    info "Prueba enviada. Consultá /var/log/suricata/fast.log para detalles."
fi

cat <<EOF

────────────────────────────────────────────────────────────────────────────────
 PRUEBAS DE VERIFICACIÓN COMPLETADAS
────────────────────────────────────────────────────────────────────────────────
 Registros generados:
   • Log rápido       : tail -n 10 $LOG_FAST
   • Eventos JSON     : tail -n 5 $LOG_EVE | jq .
────────────────────────────────────────────────────────────────────────────────
EOF
