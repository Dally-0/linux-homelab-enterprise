#!/usr/bin/env python3
"""Backend Python profesional para firma digital PAdES (ISO 32000-2),
validación criptográfica, gestión de identidades/cuentas y CA institucional.
Universidad Privada Domingo Savio (UPDS) - Seguridad Informática.
"""

import base64
import datetime
import hashlib
import io
import json
import os
import re
import secrets
import shutil
import sys
from pathlib import Path

# Carga de paquetes del sistema si se descargaron localmente
PYLIB = os.path.expanduser("~/pylibs/usr/lib/python3/dist-packages")
if os.path.exists(PYLIB):
    sys.path.insert(0, PYLIB)

from flask import Flask, request, jsonify, send_file, session
from werkzeug.security import generate_password_hash, check_password_hash
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization.pkcs12 import (
    load_pkcs12,
    serialize_key_and_certificates,
)
from cryptography.x509.oid import NameOID
from endesive.pdf import cms, verify
import requests as http_requests  # para proxy al validador boliviano

# Módulos internos de Base de Datos y PKI
import db
import pki

# Rutas del entorno
BASE = Path(__file__).resolve().parent.parent  # web/
CERT_STORE = BASE / "backend" / "data" / "web_cert_store"
CERT_STORE.mkdir(parents=True, exist_ok=True)
PRACTICE_DIR = BASE.parent / "firma-digital"

# Inicializar Base de Datos SQLite y Autoridad Certificadora Institucional UPDS
db.init_db()
pki.ensure_ca()

app = Flask(__name__)

# Clave secreta persistente para mantener sesiones activas tras reinicios
SECRET_KEY_PATH = BASE / "backend" / "data" / ".flask_secret"
if not SECRET_KEY_PATH.exists():
    SECRET_KEY_PATH.parent.mkdir(parents=True, exist_ok=True)
    SECRET_KEY_PATH.write_text(secrets.token_hex(32))
    try:
        os.chmod(SECRET_KEY_PATH, 0o600)
    except Exception:
        pass
app.secret_key = SECRET_KEY_PATH.read_text().strip()
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True


def _format_fingerprint(cert):
    """Devuelve el fingerprint SHA-256 en formato hexadecimal legible."""
    try:
        raw_fp = cert.fingerprint(hashes.SHA256()).hex().upper()
        return ":".join(raw_fp[i:i+2] for i in range(0, len(raw_fp), 2))
    except Exception:
        return "N/D"


def _extract_name_attr(name, oid, default=""):
    try:
        attrs = name.get_attributes_for_oid(oid)
        if attrs:
            return attrs[0].value
    except Exception:
        pass
    return default


def _cert_to_dict(cert, source="session", has_private_key=False, token=None):
    """Convierte un objeto x509.Certificate en un diccionario descriptivo."""
    if cert is None:
        return None

    subj = cert.subject
    iss = cert.issuer

    try:
        nbf = cert.not_valid_before_utc.isoformat()
        na = cert.not_valid_after_utc.isoformat()
    except AttributeError:
        nbf = cert.not_valid_before.isoformat()
        na = cert.not_valid_after.isoformat()

    is_self_signed = (subj == iss)
    key_size = getattr(cert.public_key(), "key_size", 2048)

    return {
        "ok": True,
        "token": token,
        "source": source,
        "has_private_key": has_private_key,
        "is_self_signed": is_self_signed,
        "key_size": key_size,
        "serial_hex": hex(cert.serial_number)[2:].upper(),
        "fingerprint_sha256": _format_fingerprint(cert),
        "valid_from": nbf,
        "valid_to": na,
        "subject": {
            "cn": _extract_name_attr(subj, NameOID.COMMON_NAME, "Sin nombre"),
            "org": _extract_name_attr(subj, NameOID.ORGANIZATION_NAME, "UPDS"),
            "ou": _extract_name_attr(subj, NameOID.ORGANIZATIONAL_UNIT_NAME, "Seguridad Informatica"),
            "city": _extract_name_attr(subj, NameOID.LOCALITY_NAME, "La Paz"),
            "country": _extract_name_attr(subj, NameOID.COUNTRY_NAME, "BO"),
            "email": _extract_name_attr(subj, NameOID.EMAIL_ADDRESS, ""),
        },
        "issuer": {
            "cn": _extract_name_attr(iss, NameOID.COMMON_NAME, "Sin emisor"),
            "org": _extract_name_attr(iss, NameOID.ORGANIZATION_NAME, "UPDS"),
        },
    }


def _read_default_key_cert():
    kp = PRACTICE_DIR / "mi_llave_privada.pem"
    cp = PRACTICE_DIR / "mi_certificado.pem"
    if kp.exists() and cp.exists():
        try:
            key = serialization.load_pem_private_key(kp.read_bytes(), password=None)
            cert = x509.load_pem_x509_certificate(cp.read_bytes())
            return key, cert
        except Exception:
            pass
    return None, None


def get_current_user():
    """Retorna el registro del usuario autenticado en la sesión actual, o None."""
    uid = session.get("user_id")
    if not uid:
        return None
    return db.get_user_by_id(uid)


def user_to_dict(user):
    """Convierte el registro del usuario a un formato seguro para el frontend."""
    if not user:
        return None
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "organization": user["organization"],
        "unit": user["unit"],
        "city": user["city"],
        "country": user["country"],
        "serial_hex": user["serial_hex"],
        "fingerprint_sha256": user["fingerprint_sha256"],
        "valid_from": user["valid_from"],
        "valid_to": user["valid_to"],
        "created_at": user["created_at"],
        "has_p12": bool(user["p12_bytes"]),
        "p12_password": user.get("p12_password") or "",
    }


def make_selfsigned(cn, org, ou="Seguridad Informatica", city="La Paz", country="BO", email="", days=365, key_size=2048, password="ClaveFirma2026"):
    """Genera par de claves RSA y certificado X.509 v3 autofirmado temporal."""
    if not password or not str(password).strip():
        password = "ClaveFirma2026"

    try:
        ks = int(key_size)
        if ks not in (2048, 3072, 4096):
            ks = 2048
    except Exception:
        ks = 2048

    key = rsa.generate_private_key(public_exponent=65537, key_size=ks)

    try:
        now = datetime.datetime.now(datetime.timezone.utc)
    except AttributeError:
        now = datetime.datetime.utcnow()

    name_attrs = [
        x509.NameAttribute(NameOID.COUNTRY_NAME, country or "BO"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, city or "La Paz"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, org or "UPDS"),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, ou or "Seguridad Informatica"),
        x509.NameAttribute(NameOID.COMMON_NAME, cn or "Estudiante UPDS"),
    ]
    if email and str(email).strip():
        name_attrs.append(x509.NameAttribute(NameOID.EMAIL_ADDRESS, str(email).strip()))

    subject = issuer = x509.Name(name_attrs)

    try:
        days_i = int(days)
    except Exception:
        days_i = 365

    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now)
        .not_valid_after(now + datetime.timedelta(days=days_i))
        .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
        .add_extension(x509.KeyUsage(
            digital_signature=True, content_commitment=True, key_encipherment=False,
            data_encipherment=False, key_agreement=False, key_cert_sign=False,
            crl_sign=False, encipher_only=False, decipher_only=False), critical=True)
        .sign(key, hashes.SHA256())
    )

    key_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    cert_pem = cert.public_bytes(serialization.Encoding.PEM)

    from cryptography.hazmat.primitives import serialization as _ser
    try:
        p12_bytes = serialize_key_and_certificates(
            (cn or "Estudiante UPDS").encode(),
            key, cert, cas=None,
            encryption_algorithm=_ser.BestAvailableEncryption(password.encode()),
        )
    except Exception:
        p12_bytes = None

    return key, cert, key_pem, cert_pem, p12_bytes


@app.after_request
def _cors(resp):
    origin = request.headers.get("Origin", "")
    allowed = {
        "http://localhost:4321", "http://127.0.0.1:4321",
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:5000", "http://127.0.0.1:5000"
    }
    if origin in allowed:
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        resp.headers["Access-Control-Allow-Credentials"] = "true"
    return resp


# ============================================================================
# MIDDLEWARE DE AUTENTICACIÓN Y CONTROL DE ACCESO (SECURITY PROXY / GUARD)
# ============================================================================

PUBLIC_API_ENDPOINTS = {
    "/api/health",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/me",
    "/api/verify",
    "/api/validate_bo",
}

@app.before_request
def auth_security_middleware():
    """Middleware de seguridad:
    Garantiza que nadie pueda firmar, auditar o acceder a las APIs criptográficas
    sin haber creado una cuenta e iniciado sesión previamente.
    """
    # 1. Permitir peticiones preflight OPTIONS de CORS
    if request.method == "OPTIONS":
        return None

    path = request.path

    # 2. Permitir archivos estáticos del frontend (HTML, JS, CSS, imágenes)
    if not path.startswith("/api/"):
        return None

    # 3. Permitir endpoints públicos de autenticación y diagnóstico
    if path in PUBLIC_API_ENDPOINTS:
        return None

    # 4. Verificar sesión autenticada activa
    user = get_current_user()
    if not user:
        return jsonify({
            "ok": False,
            "error": "Acceso restringido: Debes registrarte e iniciar sesión para acceder a las funciones de firma y auditoría.",
            "code": "UNAUTHORIZED"
        }), 401

    return None


# ============================================================================
# ENDPOINTS DE SALUD Y DIAGNÓSTICO
# ============================================================================

@app.route("/api/health", methods=["GET", "POST"])
def health():
    curr = get_current_user()
    return jsonify({
        "status": "ok",
        "service": "UPDS PAdES Signer & Validator (PKI + Cloud Accounts)",
        "engine": "endesive + cryptography (Python 3)",
        "server_time": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "ca_ready": pki.CA_CERT_PATH.exists(),
        "authenticated": curr is not None,
        "user_email": curr["email"] if curr else None
    })


# ============================================================================
# ENDPOINTS DE AUTENTICACIÓN Y GESTIÓN DE CUENTAS CON CERTIFICADOS
# ============================================================================

@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    """Registra un nuevo usuario en el sistema:
    1. Valida datos de entrada y comprueba duplicados.
    2. Genera par de claves RSA (2048 bits).
    3. Emite Certificado X.509 v3 firmado por la CA Raíz UPDS.
    4. Cifra la clave privada con AES/Fernet y guarda todo en SQLite.
    5. Inicia la sesión automáticamente.
    """
    data = request.get_json(force=True, silent=True) or request.form
    email = str(data.get("email") or "").strip().lower()
    password = str(data.get("password") or "").strip()
    full_name = str(data.get("full_name") or data.get("name") or "").strip()
    organization = str(data.get("organization") or "Universidad Privada Domingo Savio").strip()
    unit = str(data.get("unit") or "Seguridad Informatica").strip()
    city = str(data.get("city") or "La Paz").strip()
    country = str(data.get("country") or "BO").strip()

    # Validaciones
    if not full_name or len(full_name) < 3:
        return jsonify({"ok": False, "error": "El nombre completo debe tener al menos 3 caracteres."}), 400

    if not email or "@" not in email or "." not in email:
        return jsonify({"ok": False, "error": "Proporcione un correo electrónico válido."}), 400

    if not password or len(password) < 6:
        return jsonify({"ok": False, "error": "La contraseña debe tener al menos 6 caracteres."}), 400

    if db.get_user_by_email(email):
        return jsonify({"ok": False, "error": "Ya existe una cuenta registrada con este correo electrónico."}), 409

    try:
        # Generar credencial X.509 firmada por la Autoridad Certificadora Institucional
        cred = pki.issue_user_credential(
            full_name=full_name,
            email=email,
            organization=organization,
            unit=unit,
            city=city,
            country=country,
            days=365,
            p12_password=password,
        )

        pwd_hash = generate_password_hash(password)
        user_id = db.create_user(
            email=email,
            password_hash=pwd_hash,
            full_name=full_name,
            organization=organization,
            unit=unit,
            city=city,
            country=country,
            cred=cred,
            p12_password=password,
        )

        # Iniciar sesión
        session["user_id"] = user_id
        session.pop("generated_cert_token", None)  # Limpiar cualquier certificado temporal previo

        # Auditoría de ciberseguridad
        db.log_audit(user_id, "REGISTER", "Cuenta creada y Certificado X.509 emitido por CA UPDS")

        user = db.get_user_by_id(user_id)
        return jsonify({
            "ok": True,
            "message": "¡Cuenta creada exitosamente! Tu certificado digital institucional ha sido emitido.",
            "user": user_to_dict(user),
        }), 201

    except Exception as e:
        return jsonify({"ok": False, "error": f"Error al generar certificado y cuenta: {e}"}), 500


@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    """Inicia sesión validando credenciales contra el hash almacenado."""
    data = request.get_json(force=True, silent=True) or request.form
    email = str(data.get("email") or "").strip().lower()
    password = str(data.get("password") or "").strip()

    if not email or not password:
        return jsonify({"ok": False, "error": "Debe ingresar correo y contraseña."}), 400

    user = db.get_user_by_email(email)
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"ok": False, "error": "Correo electrónico o contraseña incorrectos."}), 401

    session["user_id"] = user["id"]
    session.pop("generated_cert_token", None)

    db.log_audit(user["id"], "LOGIN", "Inicio de sesión exitoso")

    return jsonify({
        "ok": True,
        "message": f"Bienvenido de nuevo, {user['full_name']}.",
        "user": user_to_dict(user),
    })


@app.route("/api/auth/logout", methods=["POST", "GET"])
def auth_logout():
    """Cierra la sesión del usuario actual."""
    uid = session.get("user_id")
    if uid:
        db.log_audit(uid, "LOGOUT", "Cierre de sesión")
    session.clear()
    return jsonify({"ok": True, "message": "Sesión cerrada correctamente."})


@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    """Retorna la información del usuario autenticado y su certificado digital."""
    user = get_current_user()
    if not user:
        return jsonify({"authenticated": False, "user": None})
    return jsonify({
        "authenticated": True,
        "user": user_to_dict(user),
    })


@app.route("/api/auth/download_p12", methods=["GET"])
def auth_download_p12():
    """Descarga el contenedor PKCS#12 (.p12) que incluye clave privada, certificado y CA."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Debe iniciar sesión para descargar su certificado"}), 401

    if not user.get("p12_bytes"):
        return jsonify({"error": "No se encontró el contenedor PKCS#12"}), 404

    slug = re.sub(r"[^a-zA-Z0-9_-]", "_", user["full_name"]) or "mi"
    fname = f"certificado_{slug}.p12"

    db.log_audit(user["id"], "DOWNLOAD_P12", "Descarga de credencial PKCS#12")

    return send_file(
        io.BytesIO(user["p12_bytes"]),
        mimetype="application/x-pkcs12",
        as_attachment=True,
        download_name=fname,
    )


@app.route("/api/auth/download_cert", methods=["GET"])
def auth_download_cert():
    """Descarga el certificado público X.509 (.crt) del usuario."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Debe iniciar sesión para descargar su certificado público"}), 401

    slug = re.sub(r"[^a-zA-Z0-9_-]", "_", user["full_name"]) or "mi"
    fname = f"certificado_{slug}.crt"

    return send_file(
        io.BytesIO(user["cert_pem"].encode("utf-8")),
        mimetype="application/x-x509-ca-cert",
        as_attachment=True,
        download_name=fname,
    )


@app.route("/api/auth/download_ca", methods=["GET"])
def auth_download_ca():
    """Descarga el Certificado de la Autoridad Certificadora Raíz UPDS."""
    ca_pem = pki.get_ca_cert_pem()
    return send_file(
        io.BytesIO(ca_pem),
        mimetype="application/x-x509-ca-cert",
        as_attachment=True,
        download_name="CA_Raiz_UPDS.crt",
    )


@app.route("/api/auth/activity", methods=["GET"])
@app.route("/api/auth/audit", methods=["GET"])
def auth_activity():
    """Retorna la bitácora de auditoría de firmas del usuario autenticado."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "No autenticado"}), 401
    logs = db.get_user_audit_logs(user["id"], limit=20)
    return jsonify({"ok": True, "logs": logs})


# ============================================================================
# ENDPOINTS DE FIRMA DIGITAL Y CERTIFICADOS DE LABORATORIO
# ============================================================================

@app.route("/api/session_cert", methods=["GET"])
def get_session_cert():
    """Retorna información detallada de la identidad digital activa:
    Prioridad:
    1. Usuario registrado autenticado (Firma en la nube).
    2. Certificado generado temporalmente en sesión.
    3. Certificado predeterminado del laboratorio.
    """
    # 1. Usuario autenticado
    curr = get_current_user()
    if curr:
        try:
            cert = x509.load_pem_x509_certificate(curr["cert_pem"].encode("utf-8"))
            info = _cert_to_dict(cert, source="user_account", has_private_key=True)
            info["account_user"] = {
                "id": curr["id"],
                "email": curr["email"],
                "full_name": curr["full_name"],
            }
            info["download_cert"] = "/api/auth/download_cert"
            info["download_p12"] = "/api/auth/download_p12" if curr["p12_bytes"] else None
            return jsonify(info)
        except Exception as e:
            return jsonify({"ok": False, "error": str(e)}), 400

    # 2. Token generado en sesión temporal
    tok = session.get("generated_cert_token")
    if tok and (CERT_STORE / tok / "mi_certificado.pem").exists():
        d = CERT_STORE / tok
        try:
            cert = x509.load_pem_x509_certificate((d / "mi_certificado.pem").read_bytes())
            has_p12 = (d / "mi_certificado.p12").exists()
            info = _cert_to_dict(cert, source="session_generated", has_private_key=True, token=tok)
            info["download_cert"] = f"/api/download/{tok}/mi_certificado.pem"
            info["download_key"] = f"/api/download/{tok}/mi_llave_privada.pem"
            info["download_p12"] = f"/api/download/{tok}/mi_certificado.p12" if has_p12 else None
            return jsonify(info)
        except Exception as e:
            return jsonify({"ok": False, "error": str(e)}), 400

    # 3. Fallback al certificado predeterminado del laboratorio
    key, cert = _read_default_key_cert()
    if cert is not None:
        info = _cert_to_dict(cert, source="default_practice", has_private_key=(key is not None))
        return jsonify(info)

    return jsonify({"ok": False, "has_cert": False, "message": "No hay certificado activo en sesión"})


@app.route("/api/activate_default_cert", methods=["POST"])
def activate_default_cert():
    """Activa el certificado predeterminado del laboratorio UPDS en la sesión."""
    session.pop("generated_cert_token", None)
    key, cert = _read_default_key_cert()
    if cert is not None:
        info = _cert_to_dict(cert, source="default_practice", has_private_key=(key is not None))
        return jsonify(info)
    return jsonify({"ok": False, "error": "No se encontraron los archivos predeterminados del repositorio"}), 404


@app.route("/api/generate_cert", methods=["POST"])
def generate_cert():
    """Crea un certificado autofirmado X.509 v3 y archivo PKCS#12 con parámetros personalizados."""
    data = request.get_json(force=True, silent=True) or request.form
    cn = (data.get("cn") or "Estudiante UPDS").strip()
    org = (data.get("org") or "UPDS").strip()
    ou = (data.get("ou") or "Seguridad Informatica").strip()
    city = (data.get("city") or "La Paz").strip()
    country = (data.get("country") or "BO").strip()
    email = (data.get("email") or "").strip()
    days = data.get("days") or 365
    key_size = data.get("key_size") or 2048
    password = data.get("password") or "ClaveFirma2026"

    try:
        _key, cert, key_pem, cert_pem, p12_bytes = make_selfsigned(
            cn=cn, org=org, ou=ou, city=city, country=country, email=email,
            days=days, key_size=key_size, password=password
        )
    except Exception as e:
        return jsonify({"ok": False, "error": f"Error al generar certificado: {e}"}), 500

    token = secrets.token_hex(6)
    d = CERT_STORE / token
    d.mkdir(exist_ok=True)
    (d / "mi_llave_privada.pem").write_bytes(key_pem)
    (d / "mi_certificado.pem").write_bytes(cert_pem)
    if p12_bytes is not None:
        (d / "mi_certificado.p12").write_bytes(p12_bytes)

    session["generated_cert_token"] = token

    info = _cert_to_dict(cert, source="generated", has_private_key=True, token=token)
    info.update({
        "download_cert": f"/api/download/{token}/mi_certificado.pem",
        "download_key": f"/api/download/{token}/mi_llave_privada.pem",
        "download_p12": (f"/api/download/{token}/mi_certificado.p12" if p12_bytes else None),
        "has_p12": p12_bytes is not None,
    })
    return jsonify(info)


@app.route("/api/inspect_cert", methods=["POST"])
def inspect_cert():
    """Inspecciona un certificado (.pem, .crt, .p12) y devuelve sus metadatos sin firmar."""
    try:
        p12 = request.files.get("p12")
        if p12 and p12.filename:
            pwd = request.form.get("password", "").strip()
            pp = load_pkcs12(p12.read(), password=pwd.encode() if pwd else None)
            cert = getattr(pp, "cert", None)
            if hasattr(cert, "certificate"):
                cert = cert.certificate
            key = getattr(pp, "key", None)
            info = _cert_to_dict(cert, source="uploaded_p12", has_private_key=(key is not None))
            return jsonify(info)

        cert_file = request.files.get("cert")
        if cert_file and cert_file.filename:
            cert_bytes = cert_file.read()
            cert = x509.load_pem_x509_certificate(cert_bytes)
            key_file = request.files.get("key")
            has_key = bool(key_file and key_file.filename)
            info = _cert_to_dict(cert, source="uploaded_pem", has_private_key=has_key)
            return jsonify(info)

        return jsonify({"ok": False, "error": "No se proporcionó ningún archivo de certificado"}), 400
    except Exception as e:
        return jsonify({"ok": False, "error": f"Error al procesar el certificado: {e}"}), 400


@app.route("/api/download/<token>/<fname>", methods=["GET"])
def download(token, fname):
    d = CERT_STORE / token
    target = d / fname
    if not d.exists() or not target.exists():
        return jsonify({"error": "Archivo no encontrado"}), 404
    return send_file(target, as_attachment=True, download_name=fname)


@app.route("/api/sign", methods=["POST"])
def sign():
    """Endpoint principal de firma digital PAdES (ISO 32000-2).
    Soporta:
    - Certificado institucional del usuario autenticado (Cloud Sign).
    - Carga manual de PKCS#12 (.p12/.pfx) con contraseña.
    - Carga manual de par PEM (Certificado + Llave privada).
    - Certificado temporal de sesión o laboratorio.
    """
    pdf = request.files.get("pdf")
    if not pdf or not pdf.filename:
        return jsonify({"error": "Debe proporcionar un archivo PDF para firmar"}), 400

    pdf_bytes = pdf.read()
    if len(pdf_bytes) < 8 or not pdf_bytes.startswith(b"%PDF"):
        return jsonify({"error": "El archivo recibido no es un PDF válido o está corrupto"}), 400

    key = None
    cert = None
    othercerts = []
    signing_user = None

    cert_mode = request.form.get("cert_mode", "account").strip().lower()

    try:
        curr = get_current_user()
        if curr is not None:
            signing_user = curr

        # Modo 1: Carga manual explícita de archivo PKCS#12 (.p12 / .pfx)
        if cert_mode in ("p12", "pkcs12", "file") or (request.files.get("p12") and cert_mode != "account"):
            p12 = request.files.get("p12")
            if not p12 or not p12.filename:
                return jsonify({"error": "Debe proporcionar un archivo contenedor PKCS#12 (.p12 o .pfx)"}), 400

            pwd = request.form.get("password", "").strip()
            pwd_bytes = pwd.encode("utf-8") if pwd else None
            try:
                pp = load_pkcs12(p12.read(), password=pwd_bytes)
            except Exception as e_p12:
                return jsonify({
                    "error": f"No se pudo abrir el archivo .p12: Contraseña incorrecta o archivo dañado ({e_p12})"
                }), 400

            key = getattr(pp, "key", None)
            cert_obj = getattr(pp, "cert", None)
            if hasattr(cert_obj, "certificate"):
                cert = cert_obj.certificate
            else:
                cert = cert_obj

            if hasattr(pp, "additional_certificates") and pp.additional_certificates:
                for ac in pp.additional_certificates:
                    othercerts.append(ac.certificate if hasattr(ac, "certificate") else ac)

            if key is None:
                return jsonify({
                    "error": "El archivo .p12 no contiene una clave privada válida para realizar la firma digital."
                }), 400

            if cert is None:
                return jsonify({
                    "error": "El archivo .p12 no contiene un certificado X.509 válido."
                }), 400

        # Modo 2: Credencial del usuario autenticado en la plataforma (Cloud Sign)
        elif cert_mode == "account" and curr is not None:
            key = pki.decrypt_private_key(curr["encrypted_key"])
            cert = x509.load_pem_x509_certificate(curr["cert_pem"].encode("utf-8"))
            _, ca_cert = pki.ensure_ca()
            othercerts = [ca_cert]

        # Modo 3: Carga manual PEM (Cert + Key)
        if key is None:
            cf = request.files.get("cert")
            kf = request.files.get("key")
            if cf and kf and cf.filename and kf.filename:
                cert_bytes = cf.read()
                key_bytes = kf.read()
                kp = request.form.get("key_password", "").strip()
                pwd = kp.encode() if kp else None
                key = serialization.load_pem_private_key(key_bytes, password=pwd)
                cert = x509.load_pem_x509_certificate(cert_bytes)

        # Modo 4: Fallback a cuenta activa o certificado de sesión
        if key is None and curr is not None:
            key = pki.decrypt_private_key(curr["encrypted_key"])
            cert = x509.load_pem_x509_certificate(curr["cert_pem"].encode("utf-8"))
            _, ca_cert = pki.ensure_ca()
            othercerts = [ca_cert]

        if key is None:
            tok = session.get("generated_cert_token")
            if tok and (CERT_STORE / tok / "mi_llave_privada.pem").exists():
                d = CERT_STORE / tok
                key = serialization.load_pem_private_key((d / "mi_llave_privada.pem").read_bytes(), password=None)
                cert = x509.load_pem_x509_certificate((d / "mi_certificado.pem").read_bytes())
            else:
                key, cert = _read_default_key_cert()

        if key is None or cert is None:
            return jsonify({
                "error": "No se encontró una credencial criptográfica válida para firmar. "
                         "Selecciona tu archivo .p12 con su contraseña o usa tu cuenta institucional."
            }), 400

    except Exception as e:
        return jsonify({"error": f"Error cargando credencial criptográfica: {e}"}), 400

    # Metadatos de la firma
    reason = request.form.get("reason", "Firma digital de conformidad (UPDS)").strip()
    location = request.form.get("location", "La Paz, Bolivia").strip()
    contact = request.form.get("contact", "").strip()
    if not contact:
        contact = _extract_name_attr(cert.subject, NameOID.COMMON_NAME, "Estudiante UPDS")

    try:
        sigpage = int(request.form.get("sigpage", "0") or 0)
    except ValueError:
        sigpage = 0

    hash_algo = request.form.get("hash_algo", "sha256").lower().strip()
    if hash_algo not in ("sha256", "sha384", "sha512"):
        hash_algo = "sha256"

    # Configuración de firma visible vs invisible
    is_visual = request.form.get("visual_signature", "false").lower() in ("true", "1", "yes", "on")
    visual_pos = request.form.get("visual_position", "bottom-right")

    sig_box = None
    sig_img_path = None

    if is_visual:
        if visual_pos == "bottom-right":
            sig_box = (375, 40, 565, 115)
        elif visual_pos == "bottom-left":
            sig_box = (35, 40, 225, 115)
        elif visual_pos == "top-right":
            sig_box = (375, 725, 565, 800)
        elif visual_pos == "top-left":
            sig_box = (35, 725, 225, 800)
        elif visual_pos == "custom":
            try:
                cx = float(request.form.get("custom_x", 375))
                cy = float(request.form.get("custom_y", 40))
                cw = float(request.form.get("custom_w", 190))
                ch = float(request.form.get("custom_h", 75))
                sig_box = (cx, cy, cx + cw, cy + ch)
            except Exception:
                sig_box = (375, 40, 565, 115)
        else:
            sig_box = (375, 40, 565, 115)

        sig_img_file = request.files.get("signature_image")
        sig_b64 = request.form.get("signature_image_b64", "").strip()

        img_bytes = None
        if sig_img_file and sig_img_file.filename:
            img_bytes = sig_img_file.read()
        elif sig_b64:
            try:
                if "," in sig_b64:
                    sig_b64 = sig_b64.split(",", 1)[1]
                img_bytes = base64.b64decode(sig_b64)
            except Exception:
                img_bytes = None

        if img_bytes:
            tmp_img = CERT_STORE / f"sig_{secrets.token_hex(6)}.png"
            tmp_img.write_bytes(img_bytes)
            sig_img_path = str(tmp_img)

    now = datetime.datetime.now(datetime.timezone.utc)
    sig_field_name = f"Signature_{secrets.token_hex(4)}"
    signature_text = sig_img_path if sig_img_path else f"Firmado digitalmente: {contact}"

    udct = {
        "aligned": 8192,
        "sigflags": 3,
        "sigflagsft": 132,
        "sigpage": sigpage,
        "sigbutton": True,
        "sigfield": sig_field_name,
        "auto_sigfield": True,
        "signform": False,
        "sigandcertify": False,
        "signaturebox": sig_box,
        "signature": signature_text if sig_box else None,
        "signature_img": sig_img_path if sig_box else None,
        "contact": contact,
        "location": location,
        "signingdate": now.strftime("D:%Y%m%d%H%M%S+00'00'"),
        "reason": reason,
        "password": None,
        "text": {"wraptext": True, "fontsize": 8, "textalign": "left", "linespacing": 1.2},
    }

    try:
        signed = cms.sign(
            pdf_bytes, udct, key, cert, othercerts,
            algomd=hash_algo,
            timestampurl=None, ocspurl=None, ocspissuer=None
        )
    except Exception as e:
        if sig_img_path and os.path.exists(sig_img_path):
            try:
                os.remove(sig_img_path)
            except Exception:
                pass
        return jsonify({"error": f"Fallo criptográfico al firmar el PDF con endesive: {e}"}), 500

    if sig_img_path and os.path.exists(sig_img_path):
        try:
            os.remove(sig_img_path)
        except Exception:
            pass

    # Registro en bitácora de auditoría si fue firmado por un usuario registrado
    if signing_user:
        pdf_hash = hashlib.sha256(pdf_bytes).hexdigest()
        db.log_audit(
            signing_user["id"],
            "SIGN_PDF",
            f"Firma digital PAdES ({hash_algo.upper()}) · Motivo: {reason}",
            filename=pdf.filename,
            file_hash=pdf_hash,
        )

    out_bytes = pdf_bytes + signed
    orig_name = Path(pdf.filename).stem or "documento"
    out_name = f"{orig_name}_firmado.pdf"

    return send_file(
        io.BytesIO(out_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=out_name,
    )


@app.route("/api/verify", methods=["POST"])
def verify_doc():
    """Valida un PDF con firma digital PAdES embedded.
    Comprueba:
    1) Integridad física y lógica del documento (ByteRange / Hash).
    2) Validez de la firma digital (descifrado RSA / resumen CMS).
    3) Cadena de confianza (CA Raíz UPDS / Certificado acreditado).
    """
    pdf = request.files.get("pdf")
    if not pdf or not pdf.filename:
        return jsonify({"error": "Debe subir un PDF para auditar su firma"}), 400

    pdf_bytes = pdf.read()
    if len(pdf_bytes) < 8 or not pdf_bytes.startswith(b"%PDF"):
        return jsonify({"error": "El archivo proporcionado no es un PDF válido"}), 400

    cert_file = request.files.get("cert")
    trusted = []
    if cert_file and cert_file.filename:
        data = cert_file.read()
        if b"BEGIN CERTIFICATE" in data:
            trusted = [data]

    # Si no se pasó un certificado explícito para auditar, incluimos la CA Raíz UPDS
    # y el certificado del repositorio como ancla de confianza
    if not trusted:
        trusted = [pki.get_ca_cert_pem()]
        tok = session.get("generated_cert_token")
        if tok and (CERT_STORE / tok / "mi_certificado.pem").exists():
            trusted.append((CERT_STORE / tok / "mi_certificado.pem").read_bytes())
        elif (PRACTICE_DIR / "mi_certificado.pem").exists():
            trusted.append((PRACTICE_DIR / "mi_certificado.pem").read_bytes())

    try:
        res = verify(pdf_bytes, trusted)
    except Exception as e:
        return jsonify({"error": f"Error al analizar la estructura de firma del PDF: {e}"}), 500

    if not res:
        return jsonify({
            "ok": True,
            "has_signatures": False,
            "signatures": [],
            "message": "No se detectaron firmas digitales PAdES (/Sig /ByteRange) en el documento."
        })

    out = []
    for i, r in enumerate(res, 1):
        integrity, signature, certificate = (list(r) + [False, False, False])[:3]
        out.append({
            "index": i,
            "integrity": bool(integrity),
            "signature": bool(signature),
            "trusted": bool(certificate),
            "integrity_text": "INTEGRO (Sin modificaciones post-firma)" if integrity else "ALTERADO (Hash no coincide)",
            "signature_text": "VÁLIDA (Criptografía RSA correcta)" if signature else "CORRUPTA",
            "trust_text": "CONFIABLE (Cadena de confianza CA UPDS válida)" if certificate else "AUTOFIRMADO (Sin CA oficial cargada)",
            "explanation": (
                "Validación criptográfica completa y exitosa. El documento no ha sufrido alteraciones y fue firmado con un certificado respaldado por la CA Institucional."
                if (integrity and signature and certificate) else
                "El documento mantiene su integridad matemática inmutable pero carece de la cadena de confianza en la CA configurada."
                if (integrity and signature) else
                "Firma no válida o archivo modificado post-firma."
            )
        })

    return jsonify({"ok": True, "has_signatures": True, "signatures": out})


# ============================================================================
# PROXY AL VALIDADOR OFICIAL DE FIRMA DIGITAL BOLIVIANA (AGETIC)
# ============================================================================

BOLIVIAN_VALIDATOR_URL = "https://validar.firmadigital.bo/backend/validador/pdf"

@app.route("/api/validate_bo", methods=["POST"])
def validate_bolivian():
    """Proxy al validador oficial de firma digital del Estado Plurinacional de Bolivia
    (validar.firmadigital.bo / AGETIC).

    Envía el PDF firmado codificado en Base64 al servicio REST oficial y retorna
    los resultados de validación: autenticidad, cadena de confianza, vigencia,
    estado de revocación y datos del certificado firmante.
    """
    pdf = request.files.get("pdf")
    if not pdf or not pdf.filename:
        return jsonify({"error": "Debe subir un PDF para validar con el servicio oficial"}), 400

    pdf_bytes = pdf.read()
    if len(pdf_bytes) < 8 or not pdf_bytes.startswith(b"%PDF"):
        return jsonify({"error": "El archivo proporcionado no es un PDF válido"}), 400

    # Codificar en Base64 como lo requiere el API de AGETIC
    b64_pdf = base64.b64encode(pdf_bytes).decode("utf-8")
    payload = {
        "pdfFirmadoBase64": b64_pdf,
        "contrasenia": ""
    }

    try:
        resp = http_requests.post(
            BOLIVIAN_VALIDATOR_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        data = resp.json()
    except http_requests.exceptions.Timeout:
        return jsonify({
            "ok": False,
            "error": "El validador oficial de Bolivia (firmadigital.bo) no respondió a tiempo. Intente nuevamente."
        }), 504
    except http_requests.exceptions.ConnectionError:
        return jsonify({
            "ok": False,
            "error": "No se pudo conectar con el validador oficial de Bolivia (firmadigital.bo). Verifique su conexión a internet."
        }), 502
    except Exception as e:
        return jsonify({
            "ok": False,
            "error": f"Error al comunicarse con el validador oficial: {e}"
        }), 500

    # Registrar en bitácora si hay usuario autenticado
    curr = get_current_user()
    if curr:
        db.log_audit(
            curr["id"],
            "VALIDATE_BO",
            f"Validación oficial Bolivia · Resultado: {data.get('tipoRespuesta', 'N/D')}",
            filename=pdf.filename,
            file_hash=hashlib.sha256(pdf_bytes).hexdigest(),
        )

    return jsonify({
        "ok": True,
        "source": "firmadigital.bo",
        "raw": data,
    })


# Servir frontend estático compilado en producción
@app.route("/", methods=["GET"])
@app.route("/<path:path>", methods=["GET"])
def serve_frontend(path=""):
    dist = BASE / "frontend" / "dist"
    if path:
        target = dist / path
        if target.exists() and target.is_file():
            return send_file(target)
    if (dist / "index.html").exists():
        return send_file(dist / "index.html")
    return jsonify({
        "message": "Backend de Firma PAdES UPDS activo con gestión de identidades.",
        "api_docs": "Endpoints disponibles: /api/auth/*, /api/sign, /api/verify, /api/health",
        "frontend": "Para ver la interfaz, compile el frontend con 'npm run build' dentro de web/frontend o inicie 'npm run dev'."
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8090))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"🚀 Backend de Firma Digital UPDS activo en http://{host}:{port}")
    app.run(host=host, port=port, debug=False)
