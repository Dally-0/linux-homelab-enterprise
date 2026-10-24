-- ===================================================================
-- snort.lua — Configuración de referencia de Snort 3 para el homelab
-- ===================================================================

-- Definición de variables de red
HOME_NET = '192.168.0.0/24'
EXTERNAL_NET = '!$HOME_NET'
HTTP_PORTS = '80, 443'
SSH_PORTS = '22'

-- Configuración de decodificadores e inspectores
stream = {}
stream_tcp = {}
stream_ip = {}
stream_icmp = {}

-- Inspector HTTP
http_inspect = {
    request_depth = 0,
    response_depth = 0
}

-- Módulos de salida / alertas
alert_fast = {
    file = true,
    packet = false
}

alert_json = {
    file = true,
    fields = 'timestamp action class dir dst_addr dst_port proto rule src_addr src_port'
}

-- Configuración de reglas IPS
ips = {
    enable_builtin_rules = true,
    include = 'rules/local.rules'
}
