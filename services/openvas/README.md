# Módulo de Auditoría de Vulnerabilidades: OpenVAS / Greenbone

Este directorio contiene la solución empaquetada de **Greenbone Community Edition (OpenVAS)** integrada en la infraestructura para la realización de auditorías de seguridad perimetral e interna.

---

## 1. ¿Por qué corre de forma modular e independiente?
OpenVAS es una suite de escaneo de vulnerabilidades de grado empresarial que incluye múltiples microservicios (GSA Web, GVMD Daemon, OSPD Scanner, PostgreSQL, Redis y Notus). 
- **Consumo de memoria:** Requiere entre 3 GB y 6 GB de RAM durante la sincronización y escaneo activo.
- **Aislamiento:** Al contar con su propio `docker-compose.yml`, se levanta **únicamente cuando se realiza una auditoría** y se apaga al terminar, garantizando que el servidor principal no sufra degradación de rendimiento.

---

## 2. Puesta en Marcha Rápida

### Iniciar OpenVAS:
```bash
cd services/openvas
bash run.sh start
```

Una vez que los contenedores arranquen, la consola web de gestión estará disponible en:
* **URL:** `http://<IP_DEL_SERVIDOR>:9392` o `http://localhost:9392`
* **Usuario:** `admin`
* **Contraseña:** `admin123`

### Detener OpenVAS (Liberar memoria RAM):
```bash
cd services/openvas
bash run.sh stop
```

---

## 3. Flujo de Auditoría contra la Infraestructura del Homelab

1. **Crear Target:** En la interfaz de Greenbone (**Configuration** → **Targets**):
   * Nombre: `dc1-Homelab`
   * IP del Host: La IP de tu servidor (ej. `192.168.1.45` o `192.168.0.2`).
   * Port List: `All IANA assigned TCP` o `All TCP and Nmap top 100 UDP`.
2. **Crear Tarea de Escaneo:** En **Scans** → **Tasks**:
   * Asignar el Target creado.
   * Perfil de escaneo: `Full and Fast`.
3. **Lanzar la auditoría y verificar la defensa:**
   * Mientras OpenVAS audita, abrí una terminal en el servidor:
     ```bash
     sudo tail -f /var/log/suricata/fast.log
     ```
   * Verás cómo Suricata detecta y registra el escaneo activo con la firma:
     `[HOMELAB-IDS-ALERT] Escaneo de vulnerabilidades: OpenVAS / Greenbone detectado`.
