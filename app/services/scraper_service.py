"""
Servicio orquestador de scrapers.
Coordina la ejecución de scrapers y la persistencia en base de datos.
"""

import asyncio
from datetime import datetime
from typing import Type

import structlog

from app.scrapers.base import BaseScraper
from app.scrapers.mercadona import MercadonaScraper
from app.scrapers.carrefour import CarrefourScraper
from app.models.product import ProductCreate, ScrapingResult, ScrapingStatus, Supermarket
from app.database import upsert_products
from app.config import settings

logger = structlog.get_logger()


# Registro de scrapers disponibles
SCRAPERS: dict[Supermarket, Type[BaseScraper]] = {
    Supermarket.MERCADONA: MercadonaScraper,
    Supermarket.CARREFOUR: CarrefourScraper,
}


class ScraperService:
    """
    Servicio principal de orquestación de scrapers.
    Gestiona la ejecución y almacenamiento de datos.
    """

    def __init__(self):
        self._status = ScrapingStatus()
        self._lock = asyncio.Lock()

    @property
    def status(self) -> ScrapingStatus:
        """Estado actual del servicio."""
        return self._status

    @property
    def is_running(self) -> bool:
        """Indica si hay un scraping en ejecución."""
        return self._status.is_running

    def get_available_scrapers(self) -> list[str]:
        """Lista de supermercados con scraper disponible."""
        return [s.value for s in SCRAPERS.keys()]

    async def run_scraper(self, supermarket: Supermarket) -> ScrapingResult:
        """
        Ejecuta el scraper de un supermercado específico.

        Args:
            supermarket: Supermercado a scrapear

        Returns:
            ScrapingResult con el resultado de la operación
        """
        if supermarket not in SCRAPERS:
            return ScrapingResult(
                supermarket=supermarket,
                success=False,
                error_message=f"No existe scraper para {supermarket.value}",
            )

        async with self._lock:
            if self._status.is_running:
                return ScrapingResult(
                    supermarket=supermarket,
                    success=False,
                    error_message="Ya hay un scraping en ejecución",
                )

            self._status.is_running = True
            self._status.current_supermarket = supermarket.value

        try:
            scraper_class = SCRAPERS[supermarket]
            result = await self._execute_scraper(scraper_class())
            return result

        finally:
            async with self._lock:
                self._status.is_running = False
                self._status.current_supermarket = None
                self._status.last_run = datetime.utcnow()

    async def run_all_scrapers(self) -> list[ScrapingResult]:
        """
        Ejecuta todos los scrapers disponibles secuencialmente.

        Returns:
            Lista de ScrapingResult, uno por cada supermercado
        """
        results = []

        for supermarket in SCRAPERS.keys():
            logger.info(f"Iniciando scraping de {supermarket.value}")
            result = await self.run_scraper(supermarket)
            results.append(result)

            # Log del resultado
            if result.success:
                logger.info(result.summary)
            else:
                logger.error(result.summary)

        self._status.last_results = results
        return results

    async def _execute_scraper(self, scraper: BaseScraper) -> ScrapingResult:
        """
        Ejecuta un scraper y persiste los productos.

        Args:
            scraper: Instancia del scraper a ejecutar

        Returns:
            ScrapingResult con estadísticas
        """
        start_time = datetime.utcnow()
        products_buffer: list[dict] = []
        products_found = 0
        products_inserted = 0
        errors = 0

        try:
            async with scraper:
                async for product in scraper.scrape():
                    products_found += 1
                    products_buffer.append(product.to_db_dict())

                    # Flush del buffer cuando alcanza el tamaño de lote
                    if len(products_buffer) >= settings.scraping_batch_size:
                        result = await upsert_products(products_buffer)
                        products_inserted += result.get("inserted", 0)
                        errors += result.get("errors", 0)
                        products_buffer = []

                # Flush final del buffer
                if products_buffer:
                    result = await upsert_products(products_buffer)
                    products_inserted += result.get("inserted", 0)
                    errors += result.get("errors", 0)

            duration = (datetime.utcnow() - start_time).total_seconds()

            return ScrapingResult(
                supermarket=scraper.supermarket,
                success=True,
                products_found=products_found,
                products_inserted=products_inserted,
                errors=errors,
                duration_seconds=duration,
            )

        except Exception as e:
            duration = (datetime.utcnow() - start_time).total_seconds()
            logger.error(
                f"Error en scraper {scraper.name}",
                error=str(e),
                products_found=products_found,
            )

            return ScrapingResult(
                supermarket=scraper.supermarket,
                success=False,
                products_found=products_found,
                products_inserted=products_inserted,
                errors=errors + 1,
                duration_seconds=duration,
                error_message=str(e),
            )


# Instancia singleton del servicio
_service_instance: ScraperService | None = None


def get_scraper_service() -> ScraperService:
    """
    Obtiene la instancia singleton del servicio.
    Para usar como dependency en FastAPI.
    """
    global _service_instance
    if _service_instance is None:
        _service_instance = ScraperService()
    return _service_instance
