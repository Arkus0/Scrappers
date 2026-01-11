# ===================================
# Scrappers - Motor de datos ShoppyJuan
# Multi-stage build para imagen optimizada
# ===================================

FROM python:3.11-slim as base

# Variables de entorno de Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# ===================================
# Stage: Dependencies
# ===================================
FROM base as deps

# Instalar dependencias del sistema para Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Dependencias de Playwright/Chromium
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libgtk-3-0 \
    # Utilidades
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instalar Playwright y sus navegadores
RUN playwright install chromium && playwright install-deps chromium

# ===================================
# Stage: Production
# ===================================
FROM deps as production

# Crear usuario no-root por seguridad
RUN useradd --create-home --shell /bin/bash appuser

# Copiar código de la aplicación
COPY --chown=appuser:appuser app/ ./app/
COPY --chown=appuser:appuser scripts/ ./scripts/

# Cambiar a usuario no-root
USER appuser

# Puerto por defecto (Railway inyecta PORT)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Comando por defecto: iniciar servidor FastAPI
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
