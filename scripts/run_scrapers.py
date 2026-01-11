#!/usr/bin/env python3
"""
Script para ejecutar scrapers desde línea de comandos o cron jobs.
Puede ejecutarse independientemente de la API FastAPI.

Uso:
    python scripts/run_scrapers.py                    # Todos los scrapers
    python scripts/run_scrapers.py mercadona          # Solo Mercadona
    python scripts/run_scrapers.py carrefour mercadona # Varios supermercados
"""

import asyncio
import sys
from pathlib import Path

# Añadir el directorio raíz al path para imports
ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

import structlog
from dotenv import load_dotenv

from app.models.product import Supermarket
from app.services.scraper_service import get_scraper_service

# Cargar variables de entorno
load_dotenv()

# Configurar logging
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ],
)

logger = structlog.get_logger()


async def main(supermarkets: list[str] | None = None):
    """
    Función principal de ejecución de scrapers.

    Args:
        supermarkets: Lista de supermercados a scrapear. Si es None, ejecuta todos.
    """
    service = get_scraper_service()

    logger.info("=== Iniciando proceso de scraping ===")

    if supermarkets:
        # Ejecutar scrapers específicos
        for name in supermarkets:
            try:
                supermarket = Supermarket(name.lower())
                logger.info(f"Ejecutando scraper: {supermarket.value}")
                result = await service.run_scraper(supermarket)
                logger.info(result.summary)
            except ValueError:
                logger.error(f"Supermercado no válido: {name}")
                logger.info(f"Disponibles: {service.get_available_scrapers()}")
    else:
        # Ejecutar todos
        results = await service.run_all_scrapers()
        for result in results:
            logger.info(result.summary)

    logger.info("=== Proceso de scraping finalizado ===")


if __name__ == "__main__":
    # Obtener supermercados de argumentos de línea de comandos
    args = sys.argv[1:] if len(sys.argv) > 1 else None

    if args and args[0] in ["--help", "-h"]:
        print(__doc__)
        print("Supermercados disponibles:")
        for s in Supermarket:
            print(f"  - {s.value}")
        sys.exit(0)

    asyncio.run(main(args))
