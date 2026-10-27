FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema necesarias para criptografía y manipulación de imágenes/PDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar backend y frontend dist
COPY backend /app/backend
COPY frontend /app/frontend

WORKDIR /app/backend

ENV PORT=8090
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1

EXPOSE 8090

CMD ["python", "main.py"]
