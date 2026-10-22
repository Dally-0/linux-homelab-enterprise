#!/bin/bash
# ===================================================================
# gen-env.sh — crea/completa el .env del stack con secretos aleatorios
#
# GUÍA DE USO
# -----------
#   bash server/gen-env.sh            # crea .env desde .env.example y
#                                     # completa lo que esté vacío/ejemplo
#   bash server/gen-env.sh --show     # además imprime los valores generados
#   bash server/gen-env.sh --force    # rota TODOS los secretos (¡recrea
#                                     # contenedores! cambia claves de BD,
#                                     # Grafana, webmail, RADIUS, restic)
#
# No requiere root (el .env vive en el repo y está en .gitignore).
# Es idempotente: los valores ya definidos NO se tocan (salvo --force).
#
# QUÉ COMPLETA
#   RADIUS_SECRET, ROUNDCUBE_DES_KEY, GF_SECRET_KEY, GRAFANA_ADMIN_PASSWORD,
#   RESTIC_PASSWORD, POSTGRES_PASSWORD, CUPS_ADMIN_PASS, FILES_ADMIN_PASS,
#   MAIL_USERS, FILES_USERS, FILES_GID (a partir de /srv/samba/departamentos).
#
# IMPORTANTE
#   - Guardá los valores que imprime: RESTIC_PASSWORD sin ella = backups
#     irrecuperables; GRAFANA_ADMIN_PASSWORD no se puede recuperar del .env
#     una vez que el volumen ya está inicializado con otra.
#   - Tras generarlo:  sudo bash server/deploy.sh
# ===================================================================
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
ENV_FILE="$ROOT/.env"
EXAMPLE="$ROOT/.env.example"
SHOW=0
FORCE=0

for arg in "$@"; do
    case "$arg" in
        -h|--help)  awk 'f && /^# =====/{exit} f{sub(/^# ?/,""); print} /^# =====/{f=1}' "$0"; exit 0 ;;
        --show)     SHOW=1 ;;
        --force)    FORCE=1 ;;
        *) echo "Opción desconocida: $arg (usá --help)" >&2; exit 2 ;;
    esac
done

command -v openssl >/dev/null || { echo "ERROR: falta openssl" >&2; exit 1; }
[[ -f "$EXAMPLE" ]] || { echo "ERROR: no existe $EXAMPLE" >&2; exit 1; }

rand()   { openssl rand -hex "$1"; }
randpw() { openssl rand -base64 "$1" | tr -d '/+=' | cut -c1-"$1"; }

CREATED=0
if [[ ! -f "$ENV_FILE" ]]; then
    cp "$EXAMPLE" "$ENV_FILE"
    CREATED=1
    echo "==> .env creado desde .env.example"
fi

# Devuelve el valor actual de una clave (vacío si no está o es de ejemplo).
get_val() {
    local key="$1" val
    val="$(grep -E "^${key}=" "$ENV_FILE" | tail -1 | cut -d= -f2- || true)"
    val="${val%\"}"; val="${val#\"}"; val="${val%\'}"; val="${val#\'}"
    printf '%s' "$val"
}

is_placeholder() {
    case "$1" in
        ""|*Cambiar*|*CambiarMe*|*CambiarEstaClave*) return 0 ;;
        *) return 1 ;;
    esac
}

# set_val CLAVE VALOR → reemplaza (o agrega) la línea, respetando el resto.
set_val() {
    local key="$1" val="$2"
    if grep -qE "^${key}=" "$ENV_FILE"; then
        # usa | como separador: los secretos pueden tener / + =
        sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
    else
        # El .env puede no terminar en newline: garantizarlo antes de agregar.
        if [ -n "$(tail -c 1 "$ENV_FILE")" ]; then printf '\n' >> "$ENV_FILE"; fi
        printf '%s=%s\n' "$key" "$val" >> "$ENV_FILE"
    fi
}

GEN_KEYS=()

# fill CLAVE [generador]: genera solo si está vacío o es placeholder.
fill() {
    local key="$1" gen="${2:-hex32}" cur new
    cur="$(get_val "$key")"
    if [[ $FORCE -eq 0 ]] && ! is_placeholder "$cur"; then
        return 0
    fi
    case "$gen" in
        hex16) new="$(rand 16)" ;;
        hex32) new="$(rand 32)" ;;
        pw)    new="$(randpw 18)" ;;
        mailpw) new="Correo$(openssl rand -hex 4)" ;;
        *)     new="$(rand 32)" ;;
    esac
    set_val "$key" "$new"
    GEN_KEYS+=("$key")
}

fill RADIUS_SECRET                hex16
fill ROUNDCUBE_DES_KEY            hex32
fill GF_SECRET_KEY                hex32
fill GRAFANA_ADMIN_PASSWORD       pw
fill RESTIC_PASSWORD              hex32
fill POSTGRES_PASSWORD            hex32
fill CUPS_ADMIN_PASS              hex32
fill FILES_ADMIN_PASS             hex32

# Cuentas de correo / web de archivos: mismo formato "user:pass user2:pass2".
# Se generan claves legibles (>= 12) para poder tipearlas en Roundcube.
cur_mail="$(get_val MAIL_USERS)"
if [[ $FORCE -eq 1 ]] || is_placeholder "$cur_mail" || [[ "$cur_mail" != *:* ]]; then
    p1="$(randpw 6)"; p2="$(randpw 6)"
    set_val MAIL_USERS "joaquin:Corr${p1} david:Corr${p2}"
    set_val FILES_USERS "joaquin:Corr${p1} david:Corr${p2}"
    GEN_KEYS+=("MAIL_USERS/FILES_USERS")
fi

# FILES_GID: gid del grupo dueño de los shares (lo crea dc/provision.sh).
if is_placeholder "$(get_val FILES_GID)" && [[ -d /srv/samba/departamentos ]]; then
    set_val FILES_GID "$(stat -c %g /srv/samba/departamentos)"
    GEN_KEYS+=("FILES_GID")
fi

chmod 600 "$ENV_FILE"
echo "==> .env listo: $ENV_FILE ($(grep -c . "$ENV_FILE") líneas)"

if [[ ${#GEN_KEYS[@]} -gt 0 ]]; then
    echo
    echo "   Secretos generados (guardalos en un gestor de claves):"
    if [[ $SHOW -eq 1 || $CREATED -eq 1 ]]; then
        for k in "${GEN_KEYS[@]}"; do
            if [[ "$k" == */* ]]; then
                printf '   %-26s %s\n' "$k" "$(get_val MAIL_USERS)"
            else
                printf '   %-26s %s\n' "$k" "$(get_val "$k")"
            fi
        done
    else
        echo "   (usá 'bash server/gen-env.sh --show' para verlos)"
    fi
fi

echo
echo "   Siguiente paso:  sudo bash server/bootstrap.sh"
echo "   (o solo los contenedores:  sudo docker compose up -d --build)"
