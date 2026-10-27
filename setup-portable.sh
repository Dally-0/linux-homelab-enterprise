#!/bin/bash
# ==============================================================================
# setup-portable.sh — Instalador y Desplegador Automático del Laboratorio Portable
# ==============================================================================
# Rama: pfinal (Modo Portable sin DNS ni Samba AD obligatorio)
#
# Uso:
#   sudo bash setup-portable.sh
# ==============================================================================
set -euo pipefail

# Colores y formato
CLR_RESET="\033[0m"
CLR_BOLD="\033[1m"
CLR_GREEN="\033[32m"
CLR_YELLOW="\033[33m"
CLR_RED="\033[31m"
CLR_CYAN="\033[36m"

log()  { printf "\n${CLR_BOLD}${CLR_CYAN}==> %s${CLR_RESET}\n" "$*"; }
ok()   { printf "    ${CLR_GREEN}✔${CLR_RESET} %s\n" "$*"; }
info() { printf "    %s\n" "$*"; }
warn() { printf "    ${CLR_YELLOW}! %s${CLR_RESET}\n" "$*"; }
die()  { printf "\n${CLR_RED}ERROR: %s${CLR_RESET}\n" "$*" >&2; exit 1; }

DIR="$(cd "$(dirname "$0")" && pwd)"

# 1. Verificación de privilegios de root
if [[ $EUID -ne 0 ]]; then
    die "Este script debe ejecutarse con privilegios de root: sudo bash $0"
fi

echo -e "${CLR_BOLD}══════════════════════════════════════════════════════════════════════${CLR_RESET}"
echo -e "${CLR_BOLD}   DESPLIEGUE DEL LABORATORIO DE SEGURIDAD PORTABLE (RAMA PFINAL)    ${CLR_RESET}"
echo -e "${CLR_BOLD}══════════════════════════════════════════════════════════════════════${CLR_RESET}"

# 2. Detección de la distribución Linux
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME=$ID
    OS_VERSION=$VERSION_ID
    ok "Sistema operativo detectado: $NAME ($VERSION)"
else
    warn "No se pudo identificar la distribución. Asumiendo entorno basado en Debian."
    OS_NAME="debian"
fi

# 3. Instalación de paquetes básicos del sistema
log "[1/5] Verificando e instalando dependencias básicas del sistema..."
apt-get update -qq

PKGS=(curl jq git net-tools iproute2 ca-certificates gnupg lsb-release)
TO_INSTALL=()
for p in "${PKGS[@]}"; do
    if ! dpkg -s "$p" >/dev/null 2>&1; then
        TO_INSTALL+=("$p")
    fi
done

if [[ ${#TO_INSTALL[@]} -gt 0 ]]; then
    apt-get install -y --no-install-recommends "${TO_INSTALL[@]}"
    ok "Paquetes base instalados: ${TO_INSTALL[*]}"
else
    ok "Todos los paquetes base ya están instalados."
fi

# 4. Verificación e Instalación de Docker y Docker Compose
log "[2/5] Verificando Docker Engine y Docker Compose..."

# En Kali Linux, resolver posible conflicto con Apache nativo que suele venir activo en puerto 80
if systemctl is-active --quiet apache2 2>/dev/null; then
    warn "Apache2 está activo en el puerto 80 nativo de Kali. Deteniéndolo para evitar conflictos con el contenedor Nginx..."
    systemctl stop apache2
    systemctl disable apache2 2>/dev/null || true
    ok "Apache2 detenido y deshabilitado."
fi

if ! command -v docker >/dev/null 2>&1; then
    warn "Docker no está instalado. Instalando paquetes compatibles con tu distribución..."
    if [[ "$OS_NAME" == "kali" ]]; then
        info "Detectado Kali Linux: utilizando paquetes oficiales docker.io y docker-compose-v2 de Kali..."
        apt-get update -qq
        apt-get install -y docker.io docker-compose-v2 || apt-get install -y docker.io docker-compose-plugin || apt-get install -y docker.io docker-compose
        systemctl enable --now docker
        ok "Docker instalado y activado en Kali Linux."
    else
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/$OS_NAME/gpg -o /etc/apt/keyrings/docker.asc
        chmod a+r /etc/apt/keyrings/docker.asc

        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/$OS_NAME \
          $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
          tee /etc/apt/sources.list.d/docker.list > /dev/null

        apt-get update -qq
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        systemctl enable --now docker
        ok "Docker Engine y Docker Compose instalados con éxito."
    fi
else
    # Asegurarse de que el servicio esté corriendo (en Kali a veces está instalado pero apagado)
    systemctl enable --now docker
    ok "Docker ya está instalado y activo: $(docker --version)"
fi

# Agregar usuario kali al grupo docker si existe
if id "kali" >/dev/null 2>&1; then
    usermod -aG docker kali || true
    ok "Usuario 'kali' agregado al grupo docker."
fi

if ! docker compose version >/dev/null 2>&1; then
    # Si docker compose v2 no está, intentar instalar plugin o alias
    if apt-get install -y docker-compose-v2 2>/dev/null || apt-get install -y docker-compose-plugin 2>/dev/null; then
        ok "Plugin Docker Compose v2 instalado."
    else
        warn "Docker Compose v2 no detectado directamente. Verificando comando docker-compose clásico..."
    fi
else
    ok "Docker Compose v2 disponible: $(docker compose version)"
fi

# 5. Instalación y configuración de Suricata IDS/IPS
log "[3/5] Configurando el motor IDS/IPS (Suricata)..."
if ! command -v suricata >/dev/null 2>&1; then
    info "Instalando paquetes de Suricata..."
    apt-get install -y --no-install-recommends suricata suricata-update
fi

# Ejecutar el instalador de reglas de Suricata del repo
bash "$DIR/server/suricata/setup.sh"
ok "Suricata IDS configurado y activo con reglas personalizadas."

# 6. Preparación de variables de entorno (.env)
log "[4/5] Verificando variables de entorno..."
if [[ ! -f "$DIR/.env" ]]; then
    if [[ -f "$DIR/.env.example" ]]; then
        cp "$DIR/.env.example" "$DIR/.env"
        chmod 600 "$DIR/.env"
        ok "Archivo .env generado a partir de .env.example."
    fi
else
    ok "Archivo .env existente detectado."
fi

# Generar directorios necesarios
mkdir -p "$DIR/services/filemanager/data/departamentos" "$DIR/services/filemanager/data/respaldo"
mkdir -p /srv/samba/departamentos /srv/samba/respaldo 2>/dev/null || true
mkdir -p /var/log/suricata
touch /var/log/suricata/eve.json /var/log/suricata/fast.log
chmod 666 /var/log/suricata/eve.json /var/log/suricata/fast.log 2>/dev/null || true

# Generar certificados TLS para el proxy web si no existen
if [[ ! -f "$DIR/services/web/tls/server.crt" ]]; then
    info "Generando certificados TLS para Nginx (*.sudoers.lan)..."
    bash "$DIR/services/web/tls-gen.sh"
    ok "Certificados TLS generados en services/web/tls/."
fi

# 7. Despliegue de los Contenedores Docker
log "[5/5] Levantando y construyendo los contenedores de la infraestructura..."
cd "$DIR"
docker compose up -d --build

ok "Todos los servicios Docker están en ejecución."

# 8. Detección de IP y Resumen Final
LAN_IP="$(ip -o -4 route show to default 2>/dev/null | awk '{print $9; exit}')"
if [[ -z "$LAN_IP" ]]; then
    LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
fi
LAN_IP="${LAN_IP:-127.0.0.1}"

cat <<EOF

${CLR_BOLD}${CLR_GREEN}══════════════════════════════════════════════════════════════════════${CLR_RESET}
${CLR_BOLD}${CLR_GREEN}   ¡LABORATORIO DE SEGURIDAD PORTABLE DESPLEGADO EXITOSAMENTE!       ${CLR_RESET}
${CLR_BOLD}${CLR_GREEN}══════════════════════════════════════════════════════════════════════${CLR_RESET}

  ${CLR_BOLD}Dirección IP detectada en tu red:${CLR_RESET} ${CLR_CYAN}http://${LAN_IP}/${CLR_RESET}

  ${CLR_BOLD}Acceso a Servicios (Desde tu PC o cualquier equipo de la LAN):${CLR_RESET}
    • ${CLR_BOLD}Portal Web Principal :${CLR_RESET} http://${LAN_IP}/ (o https://${LAN_IP}/)
    • ${CLR_BOLD}Uyuni Way Web (Vite) :${CLR_RESET} ${CLR_CYAN}http://${LAN_IP}:8085/${CLR_RESET} (Web independiente React)
    • ${CLR_BOLD}Webmail (Roundcube)  :${CLR_RESET} http://${LAN_IP}:8080/
    • ${CLR_BOLD}Archivos Web         :${CLR_RESET} http://${LAN_IP}:8082/
    • ${CLR_BOLD}Métricas (Grafana)   :${CLR_RESET} http://${LAN_IP}:3000/  (admin / admin)
    • ${CLR_BOLD}Gestión Docker       :${CLR_RESET} https://${LAN_IP}:9443/
    • ${CLR_BOLD}Impresión (CUPS)     :${CLR_RESET} http://${LAN_IP}:1631/

  ${CLR_BOLD}Monitoreo Gráfico y Consola IDS/IPS:${CLR_RESET}
    • ${CLR_BOLD}GUI de Alertas (EveBox):${CLR_RESET} ${CLR_CYAN}http://${LAN_IP}:5636/${CLR_RESET} (Panel visual de Suricata)
    • Ver alertas por terminal : ${CLR_YELLOW}sudo tail -f /var/log/suricata/fast.log${CLR_RESET}
    • Cambiar a Modo IPS (drop): ${CLR_YELLOW}sudo bash server/suricata/ips-toggle.sh --ips${CLR_RESET}
    • Probar detección/bloqueo : ${CLR_YELLOW}sudo bash server/suricata/test-ids-ips.sh${CLR_RESET}

  ${CLR_BOLD}Auditoría de Vulnerabilidades (OpenVAS):${CLR_RESET}
    • Iniciar escáner OpenVAS  : ${CLR_YELLOW}cd services/openvas && bash run.sh start${CLR_RESET}
    • Consola de OpenVAS       : http://${LAN_IP}:9392/  (admin / admin123)
    • Detener OpenVAS          : ${CLR_YELLOW}cd services/openvas && bash run.sh stop${CLR_RESET}

${CLR_BOLD}══════════════════════════════════════════════════════════════════════${CLR_RESET}
EOF
