# Módulo de Seguridad: IDS e IPS con Suricata en dc1

Este directorio contiene la solución completa de **Sistema de Detección y Prevención de Intrusos (IDS / IPS)** integrada en el servidor principal de la organización (`dc1`, IP `192.168.0.2`).

---

## 1. Arquitectura de la Solución

En esta infraestructura empresarial, el host `dc1` concentra los servicios nucleares de la red (Active Directory Samba DC, DNS autoritativo, RADIUS 802.1X, correo, proxy web y almacenamiento). 

La protección perimetral e interna se implementa mediante **Suricata** en dos modalidades operativas:

```text
                                [ Internet ]
                                     │
                             [ Router TP-Link ]
                               (192.168.0.1)
                                     │
    LAN 192.168.0.0/24 ──────────────┼──────────────────────────────
                                     │
                                     ▼
                ┌─────────────────────────────────────────┐
                │          Servidor dc1 (192.168.0.2)     │
                │                                         │
                │   [ Kernel Linux: nftables Firewall ]   │
                │             │               │           │
                │     (Modo IDS Pasivo)  (Modo IPS)       │
                │             │          NFQUEUE 0        │
                │             ▼               ▼           │
                │     ┌─────────────────────────────┐     │
                │     │    Suricata 7 (IDS / IPS)   │     │
                │     │ - homelab.rules             │     │
                │     │ - Hyperscan pattern match   │     │
                │     │ - Multi-threading nativo    │     │
                │     └──────────────┬──────────────┘     │
                │                    │                    │
                │           Alertas  │  Descarte (Drop)   │
                │                    ▼                    │
                │         /var/log/suricata/              │
                │         ├── fast.log                    │
                │         └── eve.json                    │
                │                                         │
                │   [ Servicios: AD, SMB, Web, Mail... ]  │
                └─────────────────────────────────────────┘
```

1. **Modo IDS (Intrusion Detection System)**:
   - Captura pasiva mediante motor de sockets `AF_PACKET`.
   - Inspecciona el tráfico promiscuo de la interfaz de red física (`eno1` / `$DHCP_INTERFACE`).
   - Genera alertas detalladas en `/var/log/suricata/fast.log` y `/var/log/suricata/eve.json` sin alterar el tráfico ni añadir latencia.

2. **Modo IPS (Intrusion Prevention System)**:
   - Inspección activa en línea mediante **NFQUEUE** (`queue num 0 bypass`) en el firewall `nftables`.
   - Cuando un paquete coincide con una regla de descarte (`drop`), Suricata emite un veredicto de bloqueo inmediato al kernel Netfilter, cortando el ataque en tiempo real.
   - El flag `bypass` asegura resiliencia de alta disponibilidad: si el servicio Suricata se detiene, la red continúa funcionando normalmente.

---

## 2. Archivos del Módulo

| Archivo | Propósito |
|---|---|
| `suricata.yaml` | Plantilla de configuración adaptada a la subred `192.168.0.0/24`, decodificación de protocolos (SMB, Kerberos, DNS, HTTP, TLS) y salidas de registro. |
| `rules/homelab.rules` | Firmas de detección para escaneos SYN/NULL/XMAS, sondeos a Active Directory (88/389/445), fuerza bruta SSH y pruebas de descarte en línea. |
| `setup.sh` | Script de aprovisionamiento automatizado e idempotente (paquetes Debian, configuración, validación de sintaxis y arranque). |
| `ips-toggle.sh` | Utilidad para alternar de forma transparente entre modo IDS y modo IPS en caliente. |
| `test-ids-ips.sh` | Batería de pruebas automatizadas para validar la detección y el bloqueo de amenazas simuladas. |

---

## 3. Guía de Uso Rápido

### Instalación y Puesta en Marcha (en dc1)
```bash
sudo bash server/suricata/setup.sh
```

### Alternar entre Modos Operativos
```bash
# Cambiar a modo IPS (Bloqueo activo en línea)
sudo bash server/suricata/ips-toggle.sh --ips

# Cambiar a modo IDS (Solo monitoreo y alertas)
sudo bash server/suricata/ips-toggle.sh --ids

# Ver estado actual, modo y últimas alertas
bash server/suricata/ips-toggle.sh --status
```

### Ejecución de Pruebas de Laboratorio
```bash
sudo bash server/suricata/test-ids-ips.sh
```

### Monitoreo de Alertas en Tiempo Real
```bash
# Formato tradicional rápido:
tail -f /var/log/suricata/fast.log

# Formato JSON estructurado (EVE):
tail -f /var/log/suricata/eve.json | jq 'select(.event_type=="alert") | {timestamp, alert: .alert.signature, src_ip, dest_port}'
```
