"""
Scraper para Carrefour usando Playwright.
Carrefour tiene una SPA que requiere renderizado JavaScript.
"""

from decimal import Decimal
from typing import AsyncGenerator

import structlog

from app.scrapers.base import BaseScraper
from app.models.product import ProductCreate, Supermarket
from app.config import settings

logger = structlog.get_logger()

# URLs base de Carrefour España
CARREFOUR_BASE_URL = "https://www.carrefour.es"
CARREFOUR_API_URL = "https://www.carrefour.es/search-api/query/v1/search"


class CarrefourScraper(BaseScraper):
    """
    Scraper para Carrefour España.
    Usa Playwright para manejar la SPA y extraer datos.
    """

    @property
    def supermarket(self) -> Supermarket:
        return Supermarket.CARREFOUR

    @property
    def name(self) -> str:
        return "Carrefour"

    def __init__(self):
        super().__init__()
        self._browser = None
        self._context = None
        self._page = None

    async def setup(self) -> None:
        """Inicializa Playwright y el navegador."""
        try:
            from playwright.async_api import async_playwright

            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                ],
            )
            self._context = await self._browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
            )
            self._page = await self._context.new_page()
            self._log_progress("Playwright inicializado")

        except ImportError:
            self._log_error(
                "Playwright no está instalado. Ejecuta: "
                "pip install playwright && playwright install chromium"
            )
            raise

    async def teardown(self) -> None:
        """Cierra el navegador y limpia recursos."""
        if self._page:
            await self._page.close()
        if self._context:
            await self._context.close()
        if self._browser:
            await self._browser.close()
        if hasattr(self, "_playwright"):
            await self._playwright.stop()

        self._page = None
        self._context = None
        self._browser = None
        self._log_progress("Recursos de Playwright liberados")

    async def scrape(self) -> AsyncGenerator[ProductCreate, None]:
        """
        Extrae productos de Carrefour.
        Navega por las categorías principales y extrae productos.
        """
        if not self._page:
            raise RuntimeError("Browser no inicializado. Usa 'async with' o llama setup()")

        categories = await self._get_categories()

        for category in categories:
            async for product in self._scrape_category(category):
                yield product

    async def _get_categories(self) -> list[dict]:
        """
        Obtiene las categorías principales de Carrefour.

        Returns:
            Lista de categorías con URLs
        """
        self._log_progress("Obteniendo categorías...")

        # TODO: Implementar navegación real al menú de categorías
        # Por ahora retornamos categorías de ejemplo
        example_categories = [
            {"name": "Alimentación", "url": f"{CARREFOUR_BASE_URL}/supermercado/alimentacion"},
            {"name": "Bebidas", "url": f"{CARREFOUR_BASE_URL}/supermercado/bebidas"},
            {"name": "Frescos", "url": f"{CARREFOUR_BASE_URL}/supermercado/frescos"},
            {"name": "Congelados", "url": f"{CARREFOUR_BASE_URL}/supermercado/congelados"},
            {"name": "Limpieza", "url": f"{CARREFOUR_BASE_URL}/supermercado/limpieza-hogar"},
        ]

        return example_categories

    async def _scrape_category(self, category: dict) -> AsyncGenerator[ProductCreate, None]:
        """
        Extrae productos de una categoría específica.

        Args:
            category: Dict con name y url de la categoría

        Yields:
            ProductCreate para cada producto
        """
        category_name = category.get("name", "Unknown")
        category_url = category.get("url", "")

        self._log_progress(f"Scrapeando categoría: {category_name}")

        try:
            # Navegar a la categoría
            await self._page.goto(category_url, timeout=self.timeout * 1000)
            await self._page.wait_for_load_state("networkidle")

            # TODO: Implementar scroll infinito y paginación

            # Extraer productos de la página
            products = await self._extract_products_from_page(category_name)

            for product in products:
                yield product

        except Exception as e:
            self._log_error(
                f"Error en categoría {category_name}",
                url=category_url,
                error=str(e),
            )

    async def _extract_products_from_page(self, category: str) -> list[ProductCreate]:
        """
        Extrae productos de la página actual.

        Args:
            category: Nombre de la categoría actual

        Returns:
            Lista de ProductCreate
        """
        products = []

        try:
            # Selectores típicos de Carrefour (pueden cambiar)
            # TODO: Ajustar selectores según estructura real del HTML
            product_cards = await self._page.query_selector_all("[data-product-id]")

            for card in product_cards:
                product = await self._parse_product_card(card, category)
                if product:
                    products.append(product)

            self._log_progress(
                f"Productos extraídos de página",
                count=len(products),
                category=category,
            )

        except Exception as e:
            self._log_error("Error extrayendo productos", error=str(e))

        return products

    async def _parse_product_card(self, card, category: str) -> ProductCreate | None:
        """
        Parsea una tarjeta de producto del DOM.

        Args:
            card: Elemento Playwright del producto
            category: Categoría actual

        Returns:
            ProductCreate o None si falla el parseo
        """
        try:
            # TODO: Ajustar selectores según estructura real
            product_id = await card.get_attribute("data-product-id")
            name = await card.query_selector(".product-card__title")
            name_text = await name.inner_text() if name else ""

            price_elem = await card.query_selector(".product-card__price")
            price_text = await price_elem.inner_text() if price_elem else "0"

            # Parsear precio (formato: "1,99 €")
            price = self._parse_price(price_text)

            image = await card.query_selector("img")
            image_url = await image.get_attribute("src") if image else None

            return ProductCreate(
                external_id=str(product_id),
                supermarket=Supermarket.CARREFOUR,
                name=name_text.strip(),
                price=price,
                category=category,
                image_url=image_url,
                product_url=f"{CARREFOUR_BASE_URL}/p/{product_id}",
                is_available=True,
            )

        except Exception as e:
            self._log_error("Error parseando producto", error=str(e))
            return None

    def _parse_price(self, price_text: str) -> Decimal:
        """
        Parsea texto de precio a Decimal.
        Maneja formatos como "1,99 €", "12,50€", etc.
        """
        try:
            # Limpiar el texto: quitar €, espacios, y convertir coma a punto
            cleaned = price_text.replace("€", "").replace(" ", "").replace(",", ".").strip()
            return Decimal(cleaned)
        except (ValueError, TypeError):
            return Decimal("0")
