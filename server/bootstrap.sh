#!/bin/bash
# ===================================================================
# bootstrap.sh — deja dc1 operativo de punta a punta (Debian 12/13)
#
# GUÍA DE USO
# -----------
#   sudo bash server/bootstrap.sh              # instala/provisiona/aplica todo
#   sudo bash server/bootstrap.sh --check      # solo diagnostica, no cambia nada
#   sudo bash server/bootstrap.sh --skip-ad    # sin provisionar el AD (ya existe)
#   sudo bash server/bootstrap.sh --yes        # sin confirmaciones (desatendido)
#   bash server/bootstrap.sh --help            # esta ayuda
#
# Es IDEMPOTENTE: detecta lo que ya está hecho y no lo repite. Se puede
# correr las veces que haga falta (por ejemplo después de un git pull).
#
# QUÉ HACE (en orden)
# -------------------
#   1. Preflight: root, IP fija .2, gateway, DNS, disco, RAM, docker.
#   2. Identidad: hostname dc1, /etc/hosts (sin 127.0.1.1), TZ Buenos Aires.
#   3. Paquetes base: samba(-ad-dc/-ad-provision), krb5, chrony, dnsutils,
#      acl/attr, smbclient, freeradius(+utils), restic, openssl, curl.
#   4. NTP: chrony con server/chrony.conf, systemd-timesyncd deshabilitado.
#   5. .env: server/gen-env.sh (secretos) + ADMIN_IPS_EXTRA con la IP desde
#      la que estás conectado (para no perder el SSH al aplicar el firewall).
#   6. AD: dc/provision.sh si no está provisionado, luego
#      dc/add-users-groups.sh y dc/password-policy.sh.
#   7. DNS local: /etc/resolv.conf → 127.0.0.1 (Samba) y verificación.
#   8. TLS del proxy + server/deploy.sh (firewall, sshd, chrony, RADIUS,
#      docker compose up -d --build).
#   9. Verificación: servicios nativos, contenedores, puertos, DNS, NTP.
#
# PENDIENTE DESPUÉS (manual, no lo puede hacer este script)
# --------------------------------------------------------
#   * APAGAR el DHCP del router TP-Link (si no, dos DHCP en la LAN).
#   * Router → Wireless → WPA2-Enterprise: RADIUS 192.168.0.2:1812,
#     password = RADIUS_SECRET de .env (ver clients/wifi.md).
#   * Registrar A de servicios si hace falta: sudo kinit administrator &&
#     sudo bash dc/dns-records.sh  (ver docs/publicar-servicios-admin.md).
#   * Clientes al dominio: clients/linux.md y clients/windows.md.
#
# SI ALGO SALE MAL
#   * SSH: deploy.sh comenta los ListenAddress que no existen en el host y
#     respalda sshd_config en /etc/ssh/sshd_config.bak.<ts>.
#   * Firewall: sudo nft list ruleset | menos; sudo nft flush table inet filter
#     para desactivar temporalmente (vuelve a aplicar con deploy.sh).
#   * Backup del smb.conf previo al provision: /etc/samba/smb.conf.bak.<ts>.
#   * Los secretos generados quedan en .env (chmod 600, en .gitignore).
# ===================================================================
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
HTTPS_URL="https://dc1.sudoers.lan"

CHECK_ONLY=0
SKIP_AD=0
ASSUME_YES=0
for arg in "$@"; do
    case "$arg" in
        -h|--help)  awk 'f && /^# =====/{exit} f{sub(/^# ?/,""); print} /^# =====/{f=1}' "$0"; exit 0 ;;
        --check)    CHECK_ONLY=1 ;;
        --skip-ad)  SKIP_AD=1 ;;
        -y|--yes)   ASSUME_YES=1 ;;
        *) echo "Opción desconocida: $arg (usá --help)" >&2; exit 2 ;;
    esac
done

log()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
info() { printf '    %s\n' "$*"; }
ok()   { printf '    \033[32m✔\033[0m %s\n' "$*"; }
warn() { printf '    \033[33m! %s\033[0m\n' "$*"; }
die()  { printf '\n\033[31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }
run()  { if [[ $CHECK_ONLY -eq 1 ]]; then info "[check] $*"; else "$@"; fi; }

# ─── Variables de red (alineadas con .env) ──────────────────────────
HOST_IP="192.168.0.2"
GATEWAY="192.168.0.1"
DOMAIN="sudoers.lan"
DC_FQDN="dc1"
IFACE_DEF="$(ip -o -4 route show to default 2>/dev/null | awk '{print $5; exit}')"
IFACE_DEF="${IFACE_DEF:-enp0s3}"

if [[ $CHECK_ONLY -eq 0 && $EUID -ne 0 ]]; then
    die "hay que ejecutarlo como root:  sudo bash server/bootstrap.sh"
fi

# ===================================================================
# 1. Preflight
# ===================================================================
log "[1/9] Preflight"
[[ -f "$ROOT/docker-compose.yml" ]] || die "no encuentro $ROOT/docker-compose.yml"
[[ -f "$ROOT/.env.example" ]]       || die "falta .env.example en $ROOT"
ok "repo en $ROOT"

CUR_IPS="$(ip -o -4 addr show | awk '{print $4}' | cut -d/ -f1)"
if printf '%s\n' "$CUR_IPS" | grep -Fxq "$HOST_IP"; then
    ok "IP $HOST_IP presente en $IFACE_DEF"
elif [[ $CHECK_ONLY -eq 1 ]]; then
    warn "la IP $HOST_IP NO está configurada (IPs: $(echo $CUR_IPS | tr '\n' ' '))"
    warn "aplicá primero:  sudo bash server/set-ip.sh --yes --commit"
else
    die "la IP $HOST_IP NO está configurada en este host (IPs: $(echo $CUR_IPS | tr '\n' ' ')).
       El DC se provisiona con --host-ip=$HOST_IP: si seguimos así, el AD queda roto.
       Aplicá primero:  sudo bash server/set-ip.sh --yes --commit"
fi

if ping -c1 -W2 "$GATEWAY" >/dev/null 2>&1; then ok "gateway $GATEWAY responde"
else warn "el gateway $GATEWAY no responde (¿bridge de la VM?)"; fi

if getent hosts deb.debian.org >/dev/null 2>&1; then ok "DNS/Internet OK"
else warn "sin resolución DNS externa: los 'apt install' y los pulls de Docker pueden fallar"; fi

AVAIL_KB="$(df --output=avail / | tail -1 | tr -d ' ')"
if [[ "${AVAIL_KB:-0}" -lt 5242880 ]]; then
    warn "quedan $((AVAIL_KB/1024)) MB libres en / (recomendado > 5 GB para imágenes Docker)"
else
    ok "disco libre: $((AVAIL_KB/1024/1024)) GB"
fi
info "RAM: $(free -m | awk '/^Mem:/{print $2}') MB — $(( $(free -m | awk '/^Mem:/{print $7}') )) MB disponibles"

command -v docker >/dev/null || die "docker no está instalado (docker.io + docker-compose-v2)"
docker compose version >/dev/null 2>&1 || die "falta el plugin 'docker compose' (paquete docker-compose-v2)"
ok "docker $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo '?') + compose"

if [[ -f /var/lib/samba/private/sam.ldb ]]; then
    ok "AD ya provisionado"
    AD_READY=1
else
    info "AD sin provisionar (se hará en el paso 6)"
    AD_READY=0
fi

if [[ $CHECK_ONLY -eq 1 ]]; then
    info "modo --check: no se modifica nada"
fi

# ===================================================================
# 2. Identidad del host
# ===================================================================
log "[2/9] Identidad del host"
if [[ "$(hostname -s)" != "$DC_FQDN" ]]; then
    run hostnamectl set-hostname "$DC_FQDN"
    info "hostname → $DC_FQDN"
else
    ok "hostname ya es $DC_FQDN"
fi

if [[ $CHECK_ONLY -eq 0 ]]; then
    cp -a /etc/hosts "/etc/hosts.bak.$(date +%Y%m%d%H%M%S)"
    # Samba exige que el nombre del DC NO resuelva a 127.0.0.1 ni 127.0.1.1.
    sed -i "/^127\.0\.1\.1[[:space:]]/d" /etc/hosts
    sed -i "\|${DC_FQDN}\.${DOMAIN}|d" /etc/hosts
    sed -i "\|^${HOST_IP}[[:space:]]|d" /etc/hosts
    # El hostname tiene que ir primero en /etc/hosts para que getent lo devuelva.
    sed -i "1i ${HOST_IP} ${DC_FQDN}.${DOMAIN} ${DC_FQDN}" /etc/hosts
fi
if getent hosts "$DC_FQDN.$DOMAIN" 2>/dev/null | grep -q "$HOST_IP"; then
    ok "$DC_FQDN.$DOMAIN → $HOST_IP"
else
    warn "$DC_FQDN.$DOMAIN no resuelve a $HOST_IP en /etc/hosts"
fi

run timedatectl set-timezone America/Argentina/Buenos_Aires
ok "timezone: $(timedatectl show -p Timezone --value 2>/dev/null || date +%Z)"

# ===================================================================
# 3. Paquetes base
# ===================================================================
log "[3/9] Paquetes base"
PKGS=()
command -v samba-tool       >/dev/null || PKGS+=(samba samba-ad-dc samba-ad-provision)
command -v kinit            >/dev/null || PKGS+=(krb5-user krb5-config)
command -v chronyd          >/dev/null || PKGS+=(chrony)
command -v dig              >/dev/null || PKGS+=(dnsutils)
command -v smbclient        >/dev/null || PKGS+=(smbclient)
command -v setfacl          >/dev/null || PKGS+=(acl)
command -v attr             >/dev/null || PKGS+=(attr)
command -v ntlm_auth        >/dev/null || PKGS+=(samba-common-bin)
command -v restic           >/dev/null || PKGS+=(restic)
command -v freeradius       >/dev/null || PKGS+=(freeradius)
command -v radclient        >/dev/null || PKGS+=(freeradius-utils)
command -v nft              >/dev/null || PKGS+=(nftables)
command -v curl             >/dev/null || PKGS+=(curl)
command -v openssl          >/dev/null || PKGS+=(openssl)
if [[ ${#PKGS[@]} -gt 0 ]]; then
    info "a instalar: ${PKGS[*]}"
    if [[ $CHECK_ONLY -eq 0 ]]; then
        run env DEBIAN_FRONTEND=noninteractive apt-get update -qq
        run env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "${PKGS[@]}"
    fi
else
    ok "todos los paquetes ya están instalados"
fi

# El paquete 'samba' arranca smbd/nmbd/winbind standalone y pelea con el DC.
if [[ $CHECK_ONLY -eq 0 ]]; then
    systemctl stop smbd nmbd winbind 2>/dev/null || true
    systemctl disable smbd nmbd winbind 2>/dev/null || true
    rm -f /run/samba/smbd.pid /run/samba/nmbd.pid /run/samba/winbindd.pid 2>/dev/null || true
fi

# ===================================================================
# 4. NTP (chrony) — Kerberos necesita reloj sincronizado
# ===================================================================
log "[4/9] NTP"
if [[ $CHECK_ONLY -eq 0 ]]; then
    if systemctl is-enabled systemd-timesyncd >/dev/null 2>&1; then
        systemctl disable --now systemd-timesyncd || true
        info "systemd-timesyncd deshabilitado (lo reemplaza chrony)"
    fi
    [[ -f /etc/chrony/chrony.conf ]] && cp -a /etc/chrony/chrony.conf "/etc/chrony/chrony.conf.bak.$(date +%Y%m%d%H%M%S)"
    cp "$DIR/chrony.conf" /etc/chrony/chrony.conf
    systemctl enable --now chrony
    systemctl restart chrony
fi
if systemctl is-active --quiet chrony; then
    ok "chrony activo ($(chronyc -n tracking 2>/dev/null | awk -F: '/Reference ID/{gsub(/^ +/,"",$2); print $2; exit}' || echo 'sin fuente aún'))"
else
    warn "chrony no está activo"
fi

# ===================================================================
# 5. .env + secretos + IPs de administración
# ===================================================================
log "[5/9] .env y secretos"
if [[ $CHECK_ONLY -eq 0 ]]; then
    bash "$DIR/gen-env.sh" >/dev/null
fi
[[ -f "$ROOT/.env" ]] || die "no se pudo crear .env"
ok ".env presente ($(stat -c %a "$ROOT/.env") $(stat -c %U "$ROOT/.env"))"

# IPs desde las que hay sesiones SSH abiertas + la sesión actual: si no están
# en admin_ips, el firewall (policy drop) cortaría el SSH al aplicarse.
mapfile -t ADMIN_EXTRA < <(
    {
        [[ -n "${SSH_CONNECTION:-}" ]] && echo "${SSH_CONNECTION%% *}"
        who 2>/dev/null | sed -n 's/.*(\([0-9][0-9.]*\)).*/\1/p'
    } | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | grep -vx "$HOST_IP" | sort -u
)
EXISTING_EXTRA="$(grep -E '^ADMIN_IPS_EXTRA=' "$ROOT/.env" | tail -1 | cut -d= -f2- | tr -d "\"'" || true)"
for ip in $EXISTING_EXTRA; do ADMIN_EXTRA+=("$ip"); done
mapfile -t ADMIN_EXTRA < <(printf '%s\n' "${ADMIN_EXTRA[@]:-}" | grep -E '^[0-9]' | sort -u)

if [[ ${#ADMIN_EXTRA[@]} -gt 0 ]]; then
    EXTRA_VAL="$(printf '%s ' "${ADMIN_EXTRA[@]}" | sed 's/ *$//')"
    if [[ $CHECK_ONLY -eq 0 ]]; then
        if grep -qE '^ADMIN_IPS_EXTRA=' "$ROOT/.env"; then
            sed -i "s|^ADMIN_IPS_EXTRA=.*|ADMIN_IPS_EXTRA=\"${EXTRA_VAL}\"|" "$ROOT/.env"
        else
            printf 'ADMIN_IPS_EXTRA="%s"\n' "$EXTRA_VAL" >> "$ROOT/.env"
        fi
    fi
    ok "ADMIN_IPS_EXTRA = ${EXTRA_VAL}"
    info "(esas IPs podrán entrar por SSH/Portainer/5432 además de .50–.52)"
else
    warn "no detecté IPs de sesión SSH para agregar a admin_ips"
fi

# ===================================================================
# 6. AD: provision + usuarios + política
# ===================================================================
log "[6/9] Active Directory (Samba nativo)"
if [[ $SKIP_AD -eq 1 ]]; then
    warn "--skip-ad: no se toca el AD"
elif [[ $AD_READY -eq 1 && $CHECK_ONLY -eq 0 ]]; then
    ok "ya provisionado: no se re-provisiona"
    if ! systemctl is-active --quiet samba-ad-dc; then
        run systemctl enable --now samba-ad-dc
        info "samba-ad-dc habilitado/arrancado"
    fi
elif [[ $CHECK_ONLY -eq 0 ]]; then
    info "provisionando el dominio (te va a pedir la password de administrator)"
    info "si la password no cumple complejidad (mayúscula+minúscula+número+símbolo, 8+) Samba la rechaza"
    bash "$DIR/../dc/provision.sh"
    AD_READY=1
fi

if [[ $CHECK_ONLY -eq 0 && $SKIP_AD -eq 0 && $AD_READY -eq 1 ]]; then
    info "usuarios y grupos del dominio (idempotente)"
    bash "$DIR/../dc/add-users-groups.sh" >/dev/null 2>&1 || warn "add-users-groups.sh devolvió error (revisar a mano)"
    bash "$DIR/../dc/password-policy.sh"  >/dev/null 2>&1 || warn "password-policy.sh devolvió error (revisar a mano)"
    ok "usuarios/grupos y política aplicados"
fi

if systemctl is-active --quiet samba-ad-dc; then
    ok "samba-ad-dc activo"
else
    warn "samba-ad-dc NO está activo (journalctl -u samba-ad-dc -n 50)"
fi

# ===================================================================
# 7. DNS local
# ===================================================================
log "[7/9] DNS del dominio"
if [[ $CHECK_ONLY -eq 0 && $SKIP_AD -eq 0 ]]; then
    if [[ -f /etc/resolv.conf ]] && ! grep -qE '^nameserver[[:space:]]+127\.0\.0\.1$' /etc/resolv.conf; then
        cp -a /etc/resolv.conf "/etc/resolv.conf.bak.$(date +%Y%m%d%H%M%S)"
        printf 'nameserver 127.0.0.1\nsearch %s\n' "$DOMAIN" > /etc/resolv.conf
        info "/etc/resolv.conf → 127.0.0.1 (Samba DNS)"
    fi
fi
if getent hosts "$DC_FQDN.$DOMAIN" | grep -q "$HOST_IP"; then
    ok "resolución de $DC_FQDN.$DOMAIN OK"
else
    warn "no resuelve $DC_FQDN.$DOMAIN (¿samba-ad-dc arriba? probá: dig +short $DC_FQDN.$DOMAIN @127.0.0.1)"
fi
if getent hosts deb.debian.org >/dev/null 2>&1; then
    ok "resolución externa (forwarder del DC) OK"
else
    warn "sin resolución externa: el DC no está reenviando a $GATEWAY"
    warn "los pulls de Docker pueden fallar; revisar 'dns forwarder' en smb.conf"
fi

# ─── Permisos de los shares ─────────────────────────────────────────
# /srv/samba/departamentos lo crea provision.sh como root:root 0755 →
# los usuarios del dominio pueden LEER pero no ESCRIBIR por SMB. Se le da
# el grupo AD srv-files (igual que valid users de dc/shares.conf).
if [[ $CHECK_ONLY -eq 0 && $SKIP_AD -eq 0 ]]; then
    for d in departamentos respaldo; do
        target="/srv/samba/$d"
        [[ -d "$target" ]] || continue
        if getent group "SUDOERS\\srv-files" >/dev/null 2>&1; then
            chgrp "SUDOERS\\srv-files" "$target"
            chmod 2770 "$target"
            info "$target → grupo SUDOERS\\srv-files, 2770 (lectura/escritura)"
        else
            warn "no resuelve el grupo 'SUDOERS\\srv-files': $target queda sin escritura para el dominio"
        fi
    done
fi

# ===================================================================
# 8. TLS + deploy (firewall, sshd, RADIUS, contenedores)
# ===================================================================
log "[8/9] TLS del proxy + server/deploy.sh"
if [[ ! -f "$ROOT/services/web/tls/server.crt" ]]; then
    info "generando CA interna + cert wildcard *.sudoers.lan"
    run bash "$ROOT/services/web/tls-gen.sh"
else
    ok "certs TLS ya existen"
fi

# Kea va a quedar sirviendo DHCP en la LAN: si el router sigue con su DHCP
# activo, hay DOS servidores y las IPs se pisan.
if [[ $CHECK_ONLY -eq 0 && $ASSUME_YES -eq 0 ]]; then
    echo
    warn "Kea (tso-dhcp) va a quedar sirviendo DHCP en 192.168.0.0/24."
    warn "Antes de continuar, APAGÁ el DHCP del router TP-Link:"
    warn "  router 192.168.0.1 → DHCP → Server → DHCP Server → Disable"
    read -rp "    ¿Ya está desactivado el DHCP del router? [s/N] " ans
    case "$ans" in
        s|S|si|SI|sí|SÍ) : ;;
        *) die "cancelado. Desactivá el DHCP del router y volvé a correr el script." ;;
    esac
fi

if [[ $CHECK_ONLY -eq 0 ]]; then
    bash "$DIR/deploy.sh"
else
    info "[check] se ejecutaría server/deploy.sh"
fi

# ===================================================================
# 9. Verificación
# ===================================================================
log "[9/9] Verificación"
[[ $CHECK_ONLY -eq 1 ]] && warn "modo --check: los chequeos de abajo reflejan el estado actual, no el final"

for svc in samba-ad-dc chrony nftables; do
    if systemctl is-active --quiet "$svc"; then ok "$svc activo"; else warn "$svc NO activo"; fi
done
if systemctl is-active --quiet freeradius; then ok "freeradius activo"; else warn "freeradius NO activo"; fi

info "contenedores:"
if [[ $CHECK_ONLY -eq 0 ]]; then
    docker compose -f "$ROOT/docker-compose.yml" ps --format '    {{.Name}}\t{{.Status}}' 2>/dev/null || true
fi

info "puertos clave en escucha:"
for p in 53 67 88 389 445 80 443 25 143 993 1631 9443 1812; do
    if ss -Htuln "sport = :$p" 2>/dev/null | grep -q .; then
        printf '     %-5s \033[32mOK\033[0m\n' "$p"
    else
        printf '     %-5s \033[31m--\033[0m\n' "$p"
    fi
done

info "DHCP (si dos servidores responden, hay que apagar el del router):"
if [[ $CHECK_ONLY -eq 0 ]]; then
    docker logs --tail 3 tso-dhcp 2>&1 | sed 's/^/     /' || true
fi

cat <<EOF

────────────────────────────────────────────────────────────
  dc1: $HOST_IP  ($DC_FQDN.$DOMAIN)

  Portal / proxy         $HTTPS_URL
  Webmail                https://webmail.$DOMAIN
  Archivos (web)         https://archivos.$DOMAIN
  Impresión              https://print.$DOMAIN
  Grafana                https://grafana.$DOMAIN
  Portainer              https://portainer.$DOMAIN:9443
  Prometheus/Alertmgr    ssh -L 9090:127.0.0.1:9090 -L 9093:127.0.0.1:9093 ...

  Credenciales: $ROOT/.env  (chmod 600)
    - administrator del AD: la que definiste en el provision
    - Grafana:  GRAFANA_ADMIN_USER / GRAFANA_ADMIN_PASSWORD
    - Archivos: FILES_ADMIN_USER / FILES_ADMIN_PASS
    - Correo:   MAIL_USERS (usuario:clave)

  PENDIENTE (manual):
    1. Apagar el DHCP del router TP-Link (si no, choca con Kea).
    2. WiFi 802.1X: router → WPA2-Enterprise, RADIUS 192.168.0.2:1812,
       password = RADIUS_SECRET (.env). Probar: sudo radtest -t mschap ...
    3. Registros DNS extra: sudo kinit administrator && sudo bash dc/dns-records.sh
    4. Clientes: clients/linux.md y clients/windows.md
    5. Backup: montar disco en /srv/backup y probar sudo bash server/backup.sh
────────────────────────────────────────────────────────────
EOF
