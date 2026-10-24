# Análisis y Laboratorio Comparativo: Snort 3 vs Suricata

Este directorio contiene la configuración y reglas de **Snort 3** preparadas para la infraestructura `192.168.0.0/24`, sirviendo como contraparte comparativa frente a **Suricata** en cumplimiento con los requerimientos técnicos de la **Actividad 8**.

---

## 1. Tabla Comparativa Técnica: Suricata vs Snort 3

| Criterio Técnico | Suricata (Implementación Nativa en dc1) | Snort 3 (Cisco Talos) |
|---|---|---|
| **Arquitectura de Procesos** | Multi-hilo nativo (*multi-threading* real). Distribuye paquetes y flujos entre todos los núcleos de CPU disponibles mediante afinidad de CPU. | Multi-hilo por hilos de control y paquetes (*packet processing threads*), superando la limitación monohilo histórica de Snort 2. |
| **Motor de Coincidencia de Patrones** | Soporte nativo de **Intel Hyperscan**, Aho-Corasick y SPM. Optimizado para inspección de alto rendimiento en gigabit+. | Soporte de Hyperscan y regex avanzado mediante nuevo motor DAQ. |
| **Modo de Operación IPS (Prevención)** | Integración directa con el kernel Linux mediante **NFQUEUE** (`libnetfilter_queue`) y `nftables`. Soporta flag `bypass` de alta resiliencia. | Requiere el subsistema DAQ (*Data Acquisition*) con módulos `nfq` o `afpacket` en línea. |
| **Decodificación de Protocolos** | Decodificación profunda y nativa de **SMB, Kerberos, DCERPC, DNS, TLS, HTTP/1, HTTP/2**. Ideal para entornos con Active Directory y Samba. | Amplia cobertura HTTP/TCP/UDP. Decodificación SMB y protocolos Microsoft tradicionalmente más dependiente de preprocesadores. |
| **Formato de Registro y Salida** | Formato **EVE JSON** nativo unificado (alertas, anomalías, transacciones HTTP, metadatos TLS/DNS, descartes drop). Integrable directamente con SIEM, Logstash o Zabbix. | Soporte nativo JSON en Snort 3 (`alert_json`), además del tradicional formato binario Unified2 (Snort 2) y logs en texto rápido. |
| **Soporte y Empaquetado en Debian** | **Paquete oficial de primera clase** en Debian 12 (Bookworm) y Debian 13 (Trixie) (`apt install suricata suricata-update`). | No se encuentra empaquetado en los repositorios oficiales de Debian 12/13 (Snort 2 fue discontinuado y Snort 3 debe compilarse o desplegarse vía contenedor Docker). |
| **Lenguaje de Configuración** | Sintaxis **YAML** (`suricata.yaml`), estandarizada y legible. | Sintaxis **Lua** (`snort.lua`), altamente modular y extensible mediante scripts. |

---

## 2. Justificación de Selección en la Infraestructura dc1

Para este homelab empresarial, **Suricata** fue seleccionado como el motor principal de seguridad perimetral e interna debido a:
1. **Disponibilidad nativa en Debian:** Se instala y actualiza limpiamente a través de APT sin dependencias externas complejas.
2. **Inspección de Active Directory:** Su capacidad para decodificar tráfico Kerberos (88), LDAP (389) y SMB (445) permite detectar ataques como Kerberoasting, enumeración de usuarios y transferencias sospechosas de archivos hacia los shares del dominio.
3. **Resiliencia con `nftables`:** La integración con `queue num 0 bypass` previene interrupciones catastróficas en los servicios corporativos si el demonio se reinicia.

---

## 3. Ejecución de Snort 3 en Contenedor (Laboratorio)

Para verificar y probar Snort 3 de forma aislada en el entorno:
```bash
docker compose -f services/snort/docker-compose.snort.yml up -d
docker logs -f tso-snort3
```
