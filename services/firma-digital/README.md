# Plataforma Web de Firma Digital PAdES — UPDS

Servicio institucional de autenticación, emisión de certificados digitales X.509 v3 y firma/validación criptográfica avanzada de documentos PDF (PAdES ISO 32000-2).

- **Repositorio de Referencia**: [https://github.com/Joaquinfr87/a5-firmado-digital](https://github.com/Joaquinfr87/a5-firmado-digital)
- **Puerto de Escucha**: `8090/tcp`
- **Contenedor**: `tso-firma-digital`

---

## 🏛️ Arquitectura y Componentes

1. **Frontend (Astro 5)**:
   - Interfaz web con portal *Auth Gate* (Zero Trust), visualización de certificados, pad HTML5 Canvas para rúbricas táctiles y validador semafórico en 3 niveles.
   - Pre-compilado en producción dentro de `frontend/dist/` y servido por Flask.

2. **Backend (Python 3 / Flask)**:
   - API criptográfica que gestiona:
     - **CA Raíz UPDS**: Par de claves RSA de 4096 bits para firmar los certificados de usuarios.
     - **Emisión X.509 v3**: Genera certificados de 2048 bits con Distinguished Name institucional.
     - **Custodia en Reposo**: Claves privadas cifradas con Fernet (AES-128-CBC + HMAC-SHA256) en SQLite (`app.db`).
     - **Firma PAdES**: Adición incremental (*Incremental Update*) de bloques CMS (*SignedData*) con hash SHA-256 sin romper firmas previas.
     - **Auditoría Inmutable**: Registro de hashes SHA-256 de documentos procesados para garantizar el no repudio.

3. **Volumen de Persistencia**:
   - `firma_data` montado en `/app/backend/data` para preservar la base de datos SQLite, las llaves de la CA y las credenciales maestras.
