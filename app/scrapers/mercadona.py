"""
Scraper para Mercadona usando Playwright + API.

Estrategia:
1. Playwright abre la web y establece una sesión válida
2. Interceptamos las llamadas a la API o extraemos cookies
3. Usamos esas cookies para hacer requests directos a la API

Esto bypasea la protección anti-bot de Mercadona.
"""

import asyncio
import json
from decimal import Decimal
from typing import AsyncGenerator

import structlog

from app.scrapers.base import BaseScraper
from app.models.product import ProductCreate, Supermarket

logger = structlog.get_logger()

# Configuración
MERCADONA_BASE_URL = "https://tienda.mercadona.es"
MERCADONA_API_BASE = "https://tienda.mercadona.es/api"
DEFAULT_POSTAL_CODE = "28001"  # Madrid centro


class MercadonaScraper(BaseScraper):
    """
    Scraper para Mercadona usando Playwright para sesión + API para datos.
    """

    def __init__(self, postal_code: str = DEFAULT_POSTAL_CODE):
        super().__init__()
        self.postal_code = postal_code
        self._playwright = None
        self._browser = None
        self._context = None
        self._page = None
        self._products_seen: set[str] = set()
        self._api_data: dict = {}  # Cache de datos interceptados

    @property
    def supermarket(self) -> Supermarket:
        return Supermarket.MERCADONA

    @property
    def name(self) -> str:
        return "Mercadona"

    async def setup(self) -> None:
        """Inicializa Playwright y establece sesión con Mercadona."""
        try:
            from playwright.async_api import async_playwright

            self._playwright = await async_playwright().start()

            # Lanzar navegador
            self._browser = await self._playwright.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-blink-features=AutomationControlled",
                ],
            )

            # Crear contexto con user agent realista
            self._context = await self._browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
                locale="es-ES",
            )

            self._page = await self._context.new_page()

            # Interceptar respuestas de la API para capturar datos
            self._page.on("response", self._handle_response)

            # Navegar a la tienda y establecer código postal
            await self._establish_session()

            self._log_progress("Sesión establecida con Mercadona")

        except ImportError:
            raise RuntimeError(
                "Playwright no instalado. Ejecuta:\n"
                "pip install playwright && playwright install chromium"
            )
        except Exception as e:
            self._log_error("Error inicializando Playwright", error=str(e))
            raise

    async def _handle_response(self, response):
        """Intercepta respuestas de la API para capturar datos."""
        url = response.url
        if "/api/categories" in url and response.status == 200:
            try:
                data = await response.json()
                # Guardar en cache
                if "/api/categories/" in url and url.count("/") > 5:
                    # Es detalle de categoría
                    cat_id = url.split("/api/categories/")[1].rstrip("/")
                    self._api_data[f"cat_{cat_id}"] = data
                else:
                    # Es lista de categorías
                    self._api_data["categories"] = data
            except Exception:
                pass

    async def _establish_session(self) -> None:
        """
        Establece una sesión válida con Mercadona.
        Acepta cookies y configura código postal.
        """
        self._log_progress("Conectando con tienda.mercadona.es...")

        # Ir a la página principal
        await self._page.goto(MERCADONA_BASE_URL, wait_until="networkidle")
        await asyncio.sleep(2)

        # Aceptar cookies si aparece el banner
        try:
            accept_btn = self._page.locator("button:has-text('Aceptar')")
            if await accept_btn.count() > 0:
                await accept_btn.first.click()
                self._log_progress("Cookies aceptadas")
                await asyncio.sleep(1)
        except Exception:
            pass

        # Introducir código postal si lo pide
        try:
            # Buscar input de código postal
            postal_input = self._page.locator("input[type='text']").first
            if await postal_input.is_visible():
                await postal_input.fill(self.postal_code)
                await asyncio.sleep(0.5)

                # Buscar botón de confirmar
                confirm_btn = self._page.locator("button:has-text('Continuar'), button:has-text('Confirmar')")
                if await confirm_btn.count() > 0:
                    await confirm_btn.first.click()
                    self._log_progress(f"Código postal {self.postal_code} configurado")
                    await asyncio.sleep(2)
        except Exception as e:
            self._log_progress(f"No se requirió código postal: {e}")

        # Navegar a categorías para verificar que funciona
        await self._page.goto(f"{MERCADONA_BASE_URL}/categories", wait_until="networkidle")
        await asyncio.sleep(2)

    async def teardown(self) -> None:
        """Cierra recursos de Playwright."""
        if self._page:
            await self._page.close()
        if self._context:
            await self._context.close()
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()

        self._page = None
        self._context = None
        self._browser = None
        self._playwright = None
        self._products_seen.clear()
        self._api_data.clear()

    async def scrape(self) -> AsyncGenerator[ProductCreate, None]:
        """
        Extrae productos navegando por categorías.
        """
        if not self._page:
            raise RuntimeError("Playwright no inicializado")

        self._log_progress("Iniciando extracción de productos")

        # Obtener categorías
        categories = await self._get_categories()
        self._log_progress(f"Encontradas {len(categories)} categorías")

        for category in categories:
            async for product in self._process_category(category):
                yield product

        self._log_progress(
            "Extracción completada",
            total_products=len(self._products_seen),
        )

    async def _get_categories(self) -> list[dict]:
        """Obtiene categorías desde la página o API interceptada."""
        # Primero intentar desde datos interceptados
        if "categories" in self._api_data:
            data = self._api_data["categories"]
            if isinstance(data, dict) and "results" in data:
                return data["results"]
            elif isinstance(data, list):
                return data

        # Si no, hacer request directo desde el contexto del navegador
        try:
            response = await self._page.request.get(f"{MERCADONA_API_BASE}/categories/")
            if response.ok:
                data = await response.json()
                if isinstance(data, dict) and "results" in data:
                    return data["results"]
                elif isinstance(data, list):
                    return data
        except Exception as e:
            self._log_error("Error obteniendo categorías", error=str(e))

        return []

    async def _process_category(
        self,
        category: dict,
        parent_name: str = "",
    ) -> AsyncGenerator[ProductCreate, None]:
        """Procesa una categoría recursivamente."""
        cat_id = category.get("id")
        cat_name = category.get("name", "Sin nombre")
        full_name = f"{parent_name} > {cat_name}" if parent_name else cat_name

        # Si tiene subcategorías inline
        if "categories" in category and category["categories"]:
            for subcat in category["categories"]:
                async for product in self._process_category(subcat, full_name):
                    yield product
            return

        # Obtener detalle de la categoría
        self._log_progress(f"Procesando: {full_name}")

        try:
            detail = await self._fetch_category_detail(cat_id)
            if not detail:
                return

            # Procesar subcategorías
            if "categories" in detail and detail["categories"]:
                for subcat in detail["categories"]:
                    async for product in self._process_category(subcat, full_name):
                        yield product

            # Procesar productos
            if "products" in detail and detail["products"]:
                for raw in detail["products"]:
                    product = self._parse_product(raw, full_name)
                    if product and product.external_id not in self._products_seen:
                        self._products_seen.add(product.external_id)
                        yield product

            await asyncio.sleep(0.2)  # Rate limiting

        except Exception as e:
            self._log_error(f"Error en categoría {cat_name}", error=str(e))

    async def _fetch_category_detail(self, category_id) -> dict | None:
        """Obtiene detalle de categoría usando el contexto de Playwright."""
        cache_key = f"cat_{category_id}"
        if cache_key in self._api_data:
            return self._api_data[cache_key]

        try:
            response = await self._page.request.get(
                f"{MERCADONA_API_BASE}/categories/{category_id}/"
            )
            if response.ok:
                data = await response.json()
                self._api_data[cache_key] = data
                return data
            else:
                self._log_error(
                    f"Error HTTP en categoría {category_id}",
                    status=response.status,
                )
        except Exception as e:
            self._log_error(f"Error obteniendo categoría {category_id}", error=str(e))

        return None

    def _parse_product(self, raw: dict, category: str) -> ProductCreate | None:
        """Convierte producto de la API a ProductCreate."""
        try:
            product_id = str(raw.get("id", ""))
            if not product_id:
                return None

            # Nombre
            name = raw.get("display_name") or raw.get("name", "")
            packaging = raw.get("packaging", "")
            if packaging and packaging not in name:
                name = f"{name} {packaging}".strip()

            if not name:
                return None

            # Precios
            price_info = raw.get("price_instructions", {})
            price = Decimal(str(price_info.get("unit_price", 0)))

            ref_price = price_info.get("reference_price")
            price_per_unit = Decimal(str(ref_price)) if ref_price else None

            ref_format = price_info.get("reference_format", "")
            unit = ref_format.replace("€/", "") if ref_format else None

            # Imagen
            thumbnail = raw.get("thumbnail", "")
            image_url = thumbnail.replace("_300.", "_600.") if thumbnail else None

            # EAN y marca
            ean = raw.get("ean") or raw.get("gtin")
            brand = self._extract_brand(raw, name)

            return ProductCreate(
                external_id=product_id,
                supermarket=Supermarket.MERCADONA,
                name=name,
                brand=brand,
                price=price,
                price_per_unit=price_per_unit,
                unit=unit,
                category=category,
                image_url=image_url,
                product_url=f"{MERCADONA_BASE_URL}/product/{product_id}",
                is_available=True,
                ean=ean,
            )

        except Exception as e:
            self._log_error("Error parseando producto", error=str(e))
            return None

    def _extract_brand(self, raw: dict, name: str) -> str | None:
        """Extrae marca del producto."""
        mercadona_brands = [
            "Hacendado", "Deliplus", "Bosque Verde",
            "Compy", "Solcare", "Pollix",
        ]

        brand = raw.get("brand") or raw.get("manufacturer")
        if brand:
            return brand

        name_lower = name.lower()
        for mb in mercadona_brands:
            if mb.lower() in name_lower:
                return mb

        return None


# === Test ===

async def test_mercadona_scraper():
    """Prueba el scraper."""
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.dev.ConsoleRenderer(),
        ],
    )

    print("Probando MercadonaScraper con Playwright...")
    print("-" * 50)

    scraper = MercadonaScraper()
    count = 0
    max_products = 30

    try:
        async with scraper:
            async for product in scraper.scrape():
                count += 1
                print(f"[{count}] {product.name} - {product.price}€")
                if count >= max_products:
                    print(f"\n(Limitado a {max_products} productos)")
                    break

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return

    print("-" * 50)
    print(f"Total: {count} productos")


if __name__ == "__main__":
    asyncio.run(test_mercadona_scraper())
