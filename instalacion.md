# Guía de Instalación y Puesta en Marcha en Kali Linux (Laboratorio Portable)

Esta guía detalla los pasos exactos para instalar y ejecutar este proyecto en **Kali Linux** (o cualquier distribución derivada de Debian), en la rama **`pfinal`** (Modo Portable sin dependencias de Active Directory ni DNS).

---

## 1. Particularidades Importantes en Kali Linux

Antes de comenzar, tené en cuenta dos detalles propios de Kali Linux:
1. **Apache2 suele venir preinstalado:** Si el servicio `apache2` nativo de Kali está corriendo, ocupará el puerto `80`. Hay que detenerlo para que el contenedor Nginx pueda funcionar.
2. **Docker en Kali:** En Kali Linux **no** se debe agregar el repositorio externo de Debian de Docker, sino instalar directamente los paquetes oficiales del repositorio de Kali: `docker.io` y `docker-compose-v2`.
3. **Usuario por defecto:** En las versiones modernas de Kali, el usuario es `kali` (no `root`). Para ejecutar comandos de docker sin `sudo`, agregamos el usuario al grupo `docker`.

---

## 2. Método Rápido: Instalación Automática con Script (Recomendado)

El repositorio incluye el script `setup-portable.sh` especialmente adaptado para Kali Linux. Este script:
* Detecta que estás en Kali Linux.
* Detiene `apache2` si está activo para liberar el puerto 80.
* Instala `docker.io`, `docker-compose-v2`, `suricata` y `jq` desde los repositorios de Kali.
* Agrega al usuario `kali` al grupo `docker`.
* Configura **Suricata IDS** con las reglas del proyecto.
* Levanta todos los contenedores con `docker compose up -d`.

### Ejecución:
```bash
# 1. Asegurarte de estar en la rama pfinal
git checkout pfinal

# 2. Ejecutar el instalador con privilegios de root
sudo bash setup-portable.sh
```

Al finalizar, el script te mostrará en pantalla la dirección IP de tu máquina y la lista de todos los paneles web activos.

---

## 3. Método Manual en Kali Linux (Paso a Paso)

Si preferís realizar la instalación a mano en la terminal de Kali:

### Paso 1: Instalar Docker y dependencias oficiales de Kali
```bash
# Actualizar repositorios de Kali
sudo apt update

# Instalar Docker, Docker Compose y Suricata
sudo apt install -y docker.io docker-compose-v2 suricata suricata-update jq curl git

# Habilitar e iniciar el servicio de Docker
sudo systemctl enable --now docker

# Agregar tu usuario 'kali' al grupo docker
sudo usermod -aG docker $USER
```

### Paso 2: Liberar el puerto 80 (Apagar Apache nativo de Kali)
```bash
sudo systemctl stop apache2
sudo systemctl disable apache2 2>/dev/null || true
```

### Paso 3: Configurar el IDS/IPS Suricata
```bash
sudo bash server/suricata/setup.sh
```

### Paso 4: Levantar los servicios en Docker
```bash
# Generar variables de entorno de respaldo (si no existen)
cp -n .env.example .env

# Levantar todos los contenedores
docker compose up -d
```

---

## 4. Verificación y Acceso

### A. Comprobar que los contenedores estén corriendo
```bash
docker compose ps
```

### B. Averiguar tu IP en Kali Linux
```bash
hostname -I | awk '{print $1}'
```
*(Supongamos que tu IP es `192.168.1.45` o `10.0.2.15` si estás en una VM).*

### C. Probar los Servicios
Desde el navegador de Kali (Firefox) o desde cualquier equipo de la red LAN:
* **Portal Principal:** `http://localhost/` o `http://<TU_IP>/`
* **Webmail (Roundcube):** `http://<TU_IP>:8080/`
* **Archivos Web:** `http://<TU_IP>:8082/`
* **Métricas Grafana:** `http://<TU_IP>:3000/` (User: `admin` / Pass: `admin`)
* **Gestión Portainer:** `https://<TU_IP>:9443/`
* **Servidor de Impresión (CUPS):** `http://<TU_IP>:1631/`

---

## 5. Demostración de Seguridad: Suricata + OpenVAS en Kali

Como Kali Linux es una distribución especializada en ciberseguridad, tenés todo listo para hacer la demostración completa:

### 1. Monitorear las alertas del IDS en vivo:
En una terminal dejá corriendo:
```bash
sudo tail -f /var/log/suricata/fast.log
```

### 2. Probar la detección con Nmap desde Kali:
Abrí otra terminal y lanzá un escaneo contra tu propia IP o localhost:
```bash
nmap -sV --script vuln localhost
```
Verás cómo en la terminal de Suricata saltan las alertas de detección de sondeo.

### 3. Iniciar la consola de OpenVAS:
```bash
cd services/openvas
bash run.sh start
```
* **Acceso web:** `http://localhost:9392`
* **Credenciales:** Usuario `admin` / Contraseña `admin123`.

Al terminar la auditoría, liberás la memoria RAM con:
```bash
cd services/openvas
bash run.sh stop
```

---

## 6. Solución de Problemas en Kali Linux

* **Error: `permission denied while trying to connect to the Docker daemon socket`:**
  Ejecutá `newgrp docker` o cerrá sesión y volvé a entrar para que se aplique el grupo `docker` a tu usuario `kali`.
* **Error: `bind: address already in use` en puerto 80:**
  Verificá qué proceso ocupa el puerto con:
  ```bash
  sudo ss -tulpn | grep :80
  ```
  Si es Apache, detenelo con `sudo systemctl stop apache2`.
* **Si Kali está corriendo dentro de una Máquina Virtual (VirtualBox / VMware):**
  Para que otras computadoras físicas de tu red puedan entrar a tu Kali, configurá el adaptador de red de la máquina virtual en **Modo Puente (Bridged Adapter)** en lugar de NAT.
