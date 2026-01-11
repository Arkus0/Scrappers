"""
Aplicación FastAPI principal.
Expone endpoints HTTP para gestionar el scraping.
"""

from contextlib import asynccontextmanager
from typing import Annotated

import structlog
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import settings
from app.database import health_check
from app.models.product import ScrapingResult, ScrapingStatus, Supermarket
from app.services.scraper_service import ScraperService, get_scraper_service

# Configurar logging estructurado
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación."""
    logger.info(
        "Iniciando aplicación",
        version=__version__,
        environment=settings.app_env,
    )

    # Verificar conexión a la base de datos al inicio
    if not await health_check():
        logger.warning("No se pudo conectar a la base de datos al inicio")

    yield

    logger.info("Cerrando aplicación")


# Crear aplicación FastAPI
app = FastAPI(
    title="Scrappers API",
    description="Motor de datos para ShoppyJuan - Scraping de supermercados españoles",
    version=__version__,
    lifespan=lifespan,
)

# Configurar CORS (ajustar origins en producción)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else [
        "https://shoppyjuan.com",
        "https://*.shoppyjuan.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === Type Aliases para Dependencies ===
ScraperServiceDep = Annotated[ScraperService, Depends(get_scraper_service)]


# === Endpoints ===


@app.get("/", tags=["Health"])
async def root():
    """Endpoint raíz - información básica."""
    return {
        "name": settings.app_name,
        "version": __version__,
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health():
    """Health check completo."""
    db_ok = await health_check()

    return {
        "status": "healthy" if db_ok else "degraded",
        "version": __version__,
        "environment": settings.app_env,
        "database": "connected" if db_ok else "disconnected",
    }


@app.get("/api/v1/status", response_model=ScrapingStatus, tags=["Scraping"])
async def get_status(service: ScraperServiceDep) -> ScrapingStatus:
    """Obtiene el estado actual del sistema de scraping."""
    return service.status


@app.get("/api/v1/scrapers", tags=["Scraping"])
async def list_scrapers(service: ScraperServiceDep):
    """Lista los supermercados disponibles para scraping."""
    return {
        "available": service.get_available_scrapers(),
        "count": len(service.get_available_scrapers()),
    }


@app.post(
    "/api/v1/scrape/{supermarket}",
    response_model=ScrapingResult,
    tags=["Scraping"],
)
async def scrape_supermarket(
    supermarket: Supermarket,
    service: ScraperServiceDep,
    background_tasks: BackgroundTasks,
    sync: bool = False,
) -> ScrapingResult | dict:
    """
    Ejecuta el scraping de un supermercado específico.

    Args:
        supermarket: Supermercado a scrapear (mercadona, carrefour, etc.)
        sync: Si es True, espera a que termine. Si es False (default), ejecuta en background.

    Returns:
        ScrapingResult si sync=True, o mensaje de confirmación si sync=False
    """
    if service.is_running:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya hay un scraping en ejecución. Espera a que termine.",
        )

    if supermarket.value not in service.get_available_scrapers():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe scraper para {supermarket.value}",
        )

    if sync:
        # Ejecución síncrona - esperar resultado
        result = await service.run_scraper(supermarket)
        return result
    else:
        # Ejecución en background
        background_tasks.add_task(service.run_scraper, supermarket)
        return {
            "message": f"Scraping de {supermarket.value} iniciado en background",
            "status": "accepted",
        }


@app.post("/api/v1/scrape/all", tags=["Scraping"])
async def scrape_all(
    service: ScraperServiceDep,
    background_tasks: BackgroundTasks,
    sync: bool = False,
) -> list[ScrapingResult] | dict:
    """
    Ejecuta el scraping de todos los supermercados disponibles.

    Args:
        sync: Si es True, espera a que termine. Si es False (default), ejecuta en background.
    """
    if service.is_running:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya hay un scraping en ejecución.",
        )

    if sync:
        results = await service.run_all_scrapers()
        return results
    else:
        background_tasks.add_task(service.run_all_scrapers)
        return {
            "message": "Scraping de todos los supermercados iniciado en background",
            "status": "accepted",
            "scrapers": service.get_available_scrapers(),
        }


# === Entry point para desarrollo ===

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.effective_port,
        reload=settings.debug,
    )
