"""
Clase base abstracta para todos los scrapers.
Define el contrato que deben cumplir todos los scrapers de supermercados.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import AsyncGenerator

import structlog

from app.models.product import ProductCreate, ScrapingResult, Supermarket
from app.config import settings

logger = structlog.get_logger()


class BaseScraper(ABC):
    """
    Clase base para scrapers de supermercados.
    Todos los scrapers deben heredar de esta clase e implementar sus métodos abstractos.
    """

    def __init__(self):
        self.timeout = settings.scraping_timeout
        self.retry_attempts = settings.scraping_retry_attempts
        self._start_time: datetime | None = None

    @property
    @abstractmethod
    def supermarket(self) -> Supermarket:
        """Identificador del supermercado."""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Nombre legible del supermercado."""
        pass

    @abstractmethod
    async def scrape(self) -> AsyncGenerator[ProductCreate, None]:
        """
        Método principal de scraping.
        Debe ser un generador asíncrono que yield productos uno a uno.
        Esto permite procesar productos en streaming sin cargar todo en memoria.

        Yields:
            ProductCreate: Producto extraído
        """
        pass

    async def run(self) -> ScrapingResult:
        """
        Ejecuta el scraping completo y retorna el resultado.
        Este método no debe ser sobrescrito, contiene la lógica común.
        """
        self._start_time = datetime.utcnow()
        products_found = 0
        errors = 0

        logger.info(f"Iniciando scraping de {self.name}")

        try:
            async for product in self.scrape():
                products_found += 1
                if products_found % 100 == 0:
                    logger.info(
                        f"Progreso {self.name}",
                        products_found=products_found,
                    )

            duration = (datetime.utcnow() - self._start_time).total_seconds()

            logger.info(
                f"Scraping de {self.name} completado",
                products_found=products_found,
                duration_seconds=duration,
            )

            return ScrapingResult(
                supermarket=self.supermarket,
                success=True,
                products_found=products_found,
                duration_seconds=duration,
            )

        except Exception as e:
            duration = (datetime.utcnow() - self._start_time).total_seconds()
            logger.error(
                f"Error en scraping de {self.name}",
                error=str(e),
                products_found=products_found,
            )

            return ScrapingResult(
                supermarket=self.supermarket,
                success=False,
                products_found=products_found,
                errors=errors + 1,
                duration_seconds=duration,
                error_message=str(e),
            )

    async def setup(self) -> None:
        """
        Configuración inicial antes del scraping.
        Override en subclases si necesitan inicialización (ej: Playwright browser).
        """
        pass

    async def teardown(self) -> None:
        """
        Limpieza después del scraping.
        Override en subclases si necesitan cerrar recursos.
        """
        pass

    async def __aenter__(self):
        """Context manager: setup."""
        await self.setup()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager: teardown."""
        await self.teardown()
        return False

    def _log_progress(self, message: str, **kwargs) -> None:
        """Helper para logging con contexto del scraper."""
        logger.info(message, scraper=self.name, **kwargs)

    def _log_error(self, message: str, **kwargs) -> None:
        """Helper para logging de errores."""
        logger.error(message, scraper=self.name, **kwargs)
