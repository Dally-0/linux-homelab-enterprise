# TSO-II-final — Infraestructura IT Empresarial (100% Linux)

Infraestructura IT completa para una organización sobre una máquina física con **Debian 12 / 13 (Trixie)**:
* **Active Directory DC:** Samba 4 **NATIVO** (`dc1.sudoers.lan`, IP fija `192.168.0.2`).
* **Servicios de Red y Aplicaciones:** Contenedores Docker (Kea DHCP en `host network`, Nginx Proxy HTTPS con CA interna, Correo Postfix+Dovecot, PostgreSQL, Impresión CUPS, Gestor de Archivos Web y Portainer).
* **Seguridad y Defensa:** Firewall stateful `nftables`, SSH endurecido, FreeRADIUS (WiFi WPA2-Enterprise 802.1X) y motor **IDS/IPS Suricata 7** acoplado al kernel con `NFQUEUE` (*Fail-Open*).
* **Monitoreo:** Servidor físico Zabbix dedicado (`192.168.0.3`) + agentes en hosts.

Red única plana: **`192.168.0.0/24`** — Servidor `192.168.0.2`, Router/Gateway TP-Link `192.168.0.1`.

---

## Métodos de Instalación por Scripts

El repositorio soporta **dos modalidades de despliegue**:
1. **Un solo script maestro automatizado (`install.sh`)**: ideal para desplegar todo de punta a punta sin intervención manual.
2. **Scripts modulares paso a paso**: ideal si prefieres ejecutar y supervisar cada componente de forma individual (Red $\rightarrow$ Host $\rightarrow$ AD $\rightarrow$ Docker $\rightarrow$ IDS/IPS).

---

### Preparación Inicial en la Máquina Limpia (Debian 12/13)

Conecta el servidor por cable directo al router (`192.168.0.1`) e instala `git` y `curl`:

```bash
sudo apt update && sudo apt install -y git curl sudo
mkdir -p ~/repos && cd ~/repos
git clone https://github.com/Joaquinfr87/linux-homelab-enterprise.git
cd linux-homelab-enterprise
git checkout main
```

---

### Opción A: Instalación Todo en Uno (Script Maestro)

El instalador `install.sh` es **idempotente** (detecta lo que ya existe y no lo duplica).

```bash
# 1. Diagnóstico previo (comprueba disco, RAM, red sin realizar cambios)
sudo bash install.sh --check

# 2. Instalación completa desatendida con IP automática y modo IPS en línea:
sudo bash install.sh --set-ip --ips
```

#### Flags disponibles en `install.sh`:
* `--set-ip`: Configura automáticamente la IP fija `192.168.0.2`, gateway `192.168.0.1` y `/etc/hosts`.
* `--ips`: Activa el modo IPS activo en línea (bloqueo en tiempo real vía Netfilter `NFQUEUE`).
* `--skip-ids`: Omite la instalación del IDS/IPS Suricata (solo despliega AD y servicios Docker).
* `--skip-ad`: Omite la provisión de Active Directory (si el dominio ya fue aprovisionado).
* `--yes` / `-y`: Modo desatendido sin preguntas de confirmación.
* `--check`: Solo diagnóstico y validación de prerrequisitos.

Al finalizar, las contraseñas generadas y el resumen quedan guardados en `/root/informe-instalacion-it.txt`.

---

### Opción B: Instalación Modular por Scripts Separados

Si prefieres ejecutar cada etapa de manera independiente y controlada, sigue este flujo ordenado:

#### Paso 1: Configurar IP fija e Identidad de Red
Configura `192.168.0.2/24`, gateway `192.168.0.1`, hostname `dc1` y `/etc/hosts` con rollback de seguridad:
```bash
# Aplica la IP fija permanentemente
sudo bash server/set-ip.sh --yes --commit
```

#### Paso 2: Generar Secretos y Archivo `.env`
Genera contraseñas aleatorias seguras, certificados TLS con CA interna y vincula tu IP actual al firewall:
```bash
bash server/gen-env.sh
```

#### Paso 3: Aprovisionar Active Directory Nativo (Samba 4)
Instala Samba 4, aprovisiona el reino `SUDOERS.LAN`, genera `/etc/krb5.conf`, crea los shares en `/srv/samba/`, crea los usuarios/grupos y fija la política de contraseñas:
```bash
# Provisión del dominio
sudo bash dc/provision.sh

# Carga de grupos organizacionales y usuarios iniciales (idempotente)
sudo bash dc/add-users-groups.sh

# Endurecimiento de política de contraseñas
sudo bash dc/password-policy.sh
```

#### Paso 4: Desplegar Firewall, Host y Servicios Docker
Aplica el firewall `nftables`, SSH endurecido, servidor NTP `chrony`, FreeRADIUS y levanta todos los contenedores:
```bash
sudo bash server/deploy.sh
```

#### Paso 5: Instalar y Activar el IDS/IPS (Suricata 7)
Instala Suricata, compila las firmas `homelab.rules` y activa el modo de prevención en línea con Netfilter:
```bash
# Instalación base y configuración de Suricata 7
sudo bash server/suricata/setup.sh

# Activar modo IPS activo en línea (NFQUEUE con Fail-Open bypass)
sudo bash server/suricata/ips-toggle.sh --ips
```

#### Paso 6: Verificación y Pruebas
Comprueba que todos los componentes responden correctamente:
```bash
# Verificación de Active Directory y Kerberos
sudo samba-tool domain info 127.0.0.1
kinit administrator && klist

# Verificación de servicios Docker
docker compose ps

# Comprobación de estado del IPS
sudo bash server/suricata/ips-toggle.sh --status

# Batería de pruebas automatizada IDS vs IPS
sudo bash server/suricata/test-ids-ips.sh
```

---

### Paso Manual Crítico en el Router (TP-Link TL-WR850N)

Una vez que el servidor esté activo, accede a la interfaz web del router en `http://192.168.0.1`:
1. **Desactivar el DHCP del router:** Ve a **DHCP** $\rightarrow$ **DHCP Settings** $\rightarrow$ Seleccionar **Disable** $\rightarrow$ Guardar.  
   *(Kea DHCP en `dc1` es ahora el único encargado de asignar IPs en el rango `192.168.0.100 - .199`).*
2. **(Opcional) WiFi WPA2-Enterprise:** Ve a **Wireless** $\rightarrow$ **Wireless Security** $\rightarrow$ **WPA/WPA2-Enterprise** $\rightarrow$ IP RADIUS: `192.168.0.2`, Puerto: `1812`, Secreto: consultar en `.env` (`RADIUS_SECRET`).

---

### Resumen de Accesos Rápidos

| Servicio | URL / Host | Acceso |
|---|---|---|
| **Portal Web Intranet** | `https://dc1.sudoers.lan` | Certificado CA interna |
| **Portainer (Docker UI)** | `https://portainer.sudoers.lan:9443` | Cuenta admin configurada al primer ingreso |
| **Webmail Roundcube** | `https://webmail.sudoers.lan` | Cuentas AD (`joaquin`, `david`, `nicolas`) |
| **Archivos Web (FileBrowser)** | `https://archivos.sudoers.lan` | Shares de `/srv/samba/` |
| **Impresión CUPS** | `https://print.sudoers.lan` | Usuario y clave CUPS de `.env` |
| **Monitoreo Zabbix** | `http://zabbix.sudoers.lan` | Servidor físico dedicado `192.168.0.3` |
| **Shares de Archivos SMB** | `\\dc1.sudoers.lan\departamentos` | Credenciales de usuario AD |

---

## Documentación Detallada

* **[`docs/guia-uso-servicios.md`](docs/guia-uso-servicios.md)** — Manual de uso y administración de cada servicio.
* **[`docs/arquitectura.md`](docs/arquitectura.md)** — Fuente de verdad del diseño arquitectónico, plan IP y fases.
* **[`docs/presentacion-a8.html`](docs/presentacion-a8.html)** — Presentación interactiva en diapositivas sobre IDS/IPS (Actividad 8).
* **[`AGENTS.md`](AGENTS.md)** — Contexto técnico sintetizado para asistentes de IA.
