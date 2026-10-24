# TSO-II-final — Infraestructura IT (Linux)

Infraestructura IT de la organización sobre **una sola máquina Debian**:
**AD DC con Samba 4** (nativo, fuera de Docker) + el resto de servicios en
**contenedores Docker** (heredados del lab `TSO-II`). Clientes Linux
(SSSD + AD) con unas pocas Windows para contabilidad/marketing.

Red: **una sola red `192.168.0.0/24`** — server `192.168.0.2`, gateway router `192.168.0.1`

## Documentación

**Toda la documentación vive en [`docs/`](docs/README.md).**

- **[`docs/guia-uso-servicios.md`](docs/guia-uso-servicios.md)** — **Guía completa de uso de todos los servicios (portal, AD, webmail, archivos, print, wifi, zabbix, IDS/IPS).**
- **[`docs/ids-ips.md`](docs/ids-ips.md)** — diseño, arquitectura y laboratorio de IDS / IPS (Suricata / Snort).
- **[`docs/publicar-servicios-admin.md`](docs/publicar-servicios-admin.md)** — publicación de subdominios y proxy.
- **[`AGENTS.md`](AGENTS.md)** — contexto resumido para agentes de IA.

## Arranque rápido

```bash
# Diagnóstico sin cambios
sudo bash install.sh --check

# Instalación completa unificada (AD, DNS, FreeRADIUS, Docker, Suricata IDS/IPS)
sudo bash install.sh
```

## Repos relacionados

- [`../TSO-II`](../TSO-II) — laboratorio original (servicios base: dhcp, mail, web, database, print, portainer).