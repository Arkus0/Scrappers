#!/bin/bash
# Script de inicio para Railway

# Instalar navegadores de Playwright si no están
playwright install chromium --with-deps 2>/dev/null || true

# Iniciar la aplicación FastAPI
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
