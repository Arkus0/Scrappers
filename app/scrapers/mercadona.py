"""
Scraper para Mercadona usando la librería mercapi.
mercapi proporciona acceso a la API interna de Mercadona.
"""

from decimal import Decimal
from typing import AsyncGenerator

import structlog

from app.scrapers.base import BaseScraper
from app.models.product import ProductCreate, Supermarket

logger = structlog.get_logger()


class MercadonaScraper(BaseScraper):
    """
    Scraper para Mercadona.
    Usa mercapi para acceder a la API de Mercadona.
    """

    @property
    def supermarket(self) -> Supermarket:
        return Supermarket.MERCADONA

    @property
    def name(self) -> str:
        return "Mercadona"

    def __init__(self):
        super().__init__()
        self._client = None

    async def setup(self) -> None:
        """Inicializa el cliente de mercapi."""
        try:
            from mercapi import Mercapi

            self._client = Mercapi()
            self._log_progress("Cliente Mercapi inicializado")
        except ImportError:
            self._log_error("mercapi no está instalado. Ejecuta: pip install mercapi")
            raise

    async def teardown(self) -> None:
        """Limpia recursos."""
        self._client = None

    async def scrape(self) -> AsyncGenerator[ProductCreate, None]:
        """
        Extrae productos de Mercadona.

        La API de Mercadona organiza productos por categorías.
        Iteramos por todas las categorías para obtener el catálogo completo.
        """
        if not self._client:
            raise RuntimeError("Cliente no inicializado. Usa 'async with' o llama setup()")

        try:
            # Obtener todas las categorías
            categories = await self._get_categories()

            for category in categories:
                async for product in self._scrape_category(category):
                    yield product

        except Exception as e:
            self._log_error("Error durante scraping", error=str(e))
            raise

    async def _get_categories(self) -> list[dict]:
        """
        Obtiene la lista de categorías de Mercadona.

        Returns:
            Lista de categorías con sus IDs
        """
        # TODO: Implementar obtención real de categorías desde mercapi
        # Por ahora retornamos una lista de ejemplo
        self._log_progress("Obteniendo categorías...")

        # Estructura esperada de mercapi para categorías
        # La implementación real dependerá de la versión de mercapi
        return []

    async def _scrape_category(self, category: dict) -> AsyncGenerator[ProductCreate, None]:
        """
        Extrae productos de una categoría específica.

        Args:
            category: Diccionario con información de la categoría

        Yields:
            ProductCreate para cada producto encontrado
        """
        category_name = category.get("name", "Unknown")
        category_id = category.get("id")

        self._log_progress(f"Scrapeando categoría: {category_name}")

        try:
            # TODO: Implementar llamada real a mercapi
            # products = await self._client.get_products(category_id)
            products = []  # Placeholder

            for raw_product in products:
                product = self._parse_product(raw_product, category_name)
                if product:
                    yield product

        except Exception as e:
            self._log_error(
                f"Error en categoría {category_name}",
                category_id=category_id,
                error=str(e),
            )

    def _parse_product(self, raw: dict, category: str) -> ProductCreate | None:
        """
        Convierte un producto raw de la API a ProductCreate.

        Args:
            raw: Datos crudos del producto de la API
            category: Nombre de la categoría

        Returns:
            ProductCreate o None si no se puede parsear
        """
        try:
            # Mapeo de campos de mercapi a nuestro modelo
            # Los nombres exactos de campos dependerán de la versión de mercapi
            return ProductCreate(
                external_id=str(raw.get("id", "")),
                supermarket=Supermarket.MERCADONA,
                name=raw.get("name", raw.get("display_name", "")),
                brand=raw.get("brand", None),
                price=Decimal(str(raw.get("price", {}).get("value", 0))),
                price_per_unit=self._extract_price_per_unit(raw),
                unit=raw.get("price", {}).get("unit", None),
                category=category,
                image_url=raw.get("thumbnail", raw.get("image_url")),
                product_url=self._build_product_url(raw.get("id")),
                is_available=raw.get("available", True),
                ean=raw.get("ean", None),
            )
        except Exception as e:
            self._log_error(
                "Error parseando producto",
                product_id=raw.get("id"),
                error=str(e),
            )
            return None

    def _extract_price_per_unit(self, raw: dict) -> Decimal | None:
        """Extrae el precio por unidad si está disponible."""
        try:
            unit_price = raw.get("price_per_unit") or raw.get("unit_price")
            if unit_price:
                return Decimal(str(unit_price))
            return None
        except (ValueError, TypeError):
            return None

    def _build_product_url(self, product_id: str | None) -> str | None:
        """Construye la URL del producto en la web de Mercadona."""
        if product_id:
            return f"https://tienda.mercadona.es/product/{product_id}"
        return None
