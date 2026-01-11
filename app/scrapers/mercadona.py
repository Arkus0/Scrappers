"""
Scraper para Mercadona usando su API pública.

La API de Mercadona está disponible en tienda.mercadona.es/api/
Requiere un código postal válido en las cookies para funcionar.

Endpoints principales:
- GET /api/categories/ - Lista de categorías (nivel 1 y 2)
- GET /api/categories/{id}/ - Detalle con subcategorías/productos
- GET /api/products/{id}/ - Detalle de producto
"""

import asyncio
from decimal import Decimal
from typing import AsyncGenerator

import httpx
import structlog

from app.scrapers.base import BaseScraper
from app.models.product import ProductCreate, Supermarket
from app.config import settings

logger = structlog.get_logger()

# Configuración de la API de Mercadona
MERCADONA_API_BASE = "https://tienda.mercadona.es/api"

# Código postal por defecto (Madrid centro - zona con servicio)
# Puedes cambiarlo por cualquier CP con servicio de Mercadona online
DEFAULT_POSTAL_CODE = "28001"

# Headers para simular un navegador real
DEFAULT_HEADERS = {
    "Accept": "application/json",
    "Accept-Language": "es-ES,es;q=0.9",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Origin": "https://tienda.mercadona.es",
    "Referer": "https://tienda.mercadona.es/",
}


class MercadonaScraper(BaseScraper):
    """
    Scraper para Mercadona usando la API oficial.

    La API requiere autenticación via cookies con un código postal válido.
    Los productos se organizan en categorías con hasta 3 niveles de anidación.
    """

    def __init__(self, postal_code: str = DEFAULT_POSTAL_CODE):
        super().__init__()
        self.postal_code = postal_code
        self._client: httpx.AsyncClient | None = None
        self._products_seen: set[str] = set()  # Evitar duplicados

    @property
    def supermarket(self) -> Supermarket:
        return Supermarket.MERCADONA

    @property
    def name(self) -> str:
        return "Mercadona"

    async def setup(self) -> None:
        """Inicializa el cliente HTTP con las cookies necesarias."""
        cookies = {
            "postal_code": self.postal_code,
            # Cookie adicional que Mercadona espera
            "_session": "true",
        }

        self._client = httpx.AsyncClient(
            base_url=MERCADONA_API_BASE,
            headers=DEFAULT_HEADERS,
            cookies=cookies,
            timeout=httpx.Timeout(self.timeout),
            follow_redirects=True,
        )

        # Verificar que la API responde
        try:
            response = await self._client.get("/categories/")
            response.raise_for_status()
            self._log_progress(
                "Cliente HTTP inicializado",
                postal_code=self.postal_code,
            )
        except httpx.HTTPError as e:
            self._log_error("Error conectando con API de Mercadona", error=str(e))
            raise RuntimeError(f"No se pudo conectar a la API de Mercadona: {e}")

    async def teardown(self) -> None:
        """Cierra el cliente HTTP."""
        if self._client:
            await self._client.aclose()
            self._client = None
        self._products_seen.clear()

    async def scrape(self) -> AsyncGenerator[ProductCreate, None]:
        """
        Extrae todos los productos de Mercadona.

        Estrategia:
        1. Obtener categorías de nivel superior
        2. Para cada categoría, obtener subcategorías
        3. Para cada subcategoría con productos, extraerlos
        """
        if not self._client:
            raise RuntimeError("Cliente no inicializado. Usa 'async with' o llama setup()")

        self._log_progress("Iniciando extracción de productos")

        # Obtener árbol de categorías
        categories = await self._fetch_categories()
        self._log_progress(f"Encontradas {len(categories)} categorías principales")

        for category in categories:
            async for product in self._process_category(category):
                yield product

        self._log_progress(
            "Extracción completada",
            total_products=len(self._products_seen),
        )

    async def _fetch_categories(self) -> list[dict]:
        """
        Obtiene las categorías principales de la API.

        Returns:
            Lista de categorías con id, name, y categories (subcategorías)
        """
        try:
            response = await self._client.get("/categories/")
            response.raise_for_status()
            data = response.json()

            # La respuesta es un objeto con "results" que contiene las categorías
            if isinstance(data, dict) and "results" in data:
                return data["results"]
            # O puede ser directamente una lista
            elif isinstance(data, list):
                return data
            else:
                self._log_error("Formato de respuesta inesperado", data_type=type(data).__name__)
                return []

        except httpx.HTTPError as e:
            self._log_error("Error obteniendo categorías", error=str(e))
            return []

    async def _process_category(
        self,
        category: dict,
        parent_name: str = "",
    ) -> AsyncGenerator[ProductCreate, None]:
        """
        Procesa una categoría recursivamente.

        Las categorías pueden tener:
        - Subcategorías (categories)
        - Productos directamente (products)

        Args:
            category: Datos de la categoría
            parent_name: Nombre de la categoría padre (para breadcrumb)
        """
        cat_id = category.get("id")
        cat_name = category.get("name", "Sin nombre")
        full_name = f"{parent_name} > {cat_name}" if parent_name else cat_name

        self._log_progress(f"Procesando: {full_name}")

        # Si tiene subcategorías inline, procesarlas
        if "categories" in category and category["categories"]:
            for subcategory in category["categories"]:
                async for product in self._process_category(subcategory, full_name):
                    yield product
            return

        # Si no tiene subcategorías inline, hacer fetch del detalle
        try:
            detail = await self._fetch_category_detail(cat_id)

            if not detail:
                return

            # Procesar subcategorías del detalle
            if "categories" in detail and detail["categories"]:
                for subcategory in detail["categories"]:
                    async for product in self._process_category(subcategory, full_name):
                        yield product

            # Procesar productos del detalle
            if "products" in detail and detail["products"]:
                for raw_product in detail["products"]:
                    product = self._parse_product(raw_product, full_name)
                    if product and product.external_id not in self._products_seen:
                        self._products_seen.add(product.external_id)
                        yield product

            # Pequeña pausa para no sobrecargar la API
            await asyncio.sleep(0.1)

        except Exception as e:
            self._log_error(
                f"Error procesando categoría {cat_name}",
                category_id=cat_id,
                error=str(e),
            )

    async def _fetch_category_detail(self, category_id: int | str) -> dict | None:
        """
        Obtiene el detalle de una categoría específica.

        Args:
            category_id: ID de la categoría

        Returns:
            Detalle de la categoría con productos/subcategorías
        """
        try:
            response = await self._client.get(f"/categories/{category_id}/")
            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                self._log_progress(f"Categoría {category_id} no encontrada (404)")
            else:
                self._log_error(
                    f"Error HTTP en categoría {category_id}",
                    status_code=e.response.status_code,
                )
            return None

        except httpx.HTTPError as e:
            self._log_error(f"Error de red en categoría {category_id}", error=str(e))
            return None

    def _parse_product(self, raw: dict, category: str) -> ProductCreate | None:
        """
        Convierte un producto de la API al modelo ProductCreate.

        Estructura típica de producto en la API:
        {
            "id": "12345",
            "display_name": "Leche entera",
            "packaging": "Brick 1L",
            "price_instructions": {
                "unit_price": 0.89,
                "reference_price": 0.89,
                "reference_format": "€/L",
                "total_units": 1,
                "unit_size": 1,
                "size_format": "L"
            },
            "thumbnail": "https://...",
            "limit": 99,
            "categories": [...],
            "badges": {
                "is_water": false,
                "requires_age_check": false
            }
        }
        """
        try:
            product_id = str(raw.get("id", ""))
            if not product_id:
                return None

            # Extraer nombre (puede venir en varios campos)
            name = raw.get("display_name") or raw.get("name", "")
            packaging = raw.get("packaging", "")
            if packaging and packaging not in name:
                name = f"{name} {packaging}".strip()

            if not name:
                return None

            # Extraer precios
            price_info = raw.get("price_instructions", {})
            price = Decimal(str(price_info.get("unit_price", 0)))

            # Precio por unidad de referencia (€/kg, €/L, etc.)
            ref_price = price_info.get("reference_price")
            price_per_unit = Decimal(str(ref_price)) if ref_price else None

            # Unidad de referencia
            ref_format = price_info.get("reference_format", "")  # "€/kg", "€/L", etc.
            unit = ref_format.replace("€/", "") if ref_format else None

            # Imagen
            thumbnail = raw.get("thumbnail", "")
            # A veces viene con tamaño, queremos la versión grande
            image_url = thumbnail.replace("_300.", "_600.") if thumbnail else None

            # EAN (a veces viene en el detalle del producto)
            ean = raw.get("ean") or raw.get("gtin")

            # Marca (Mercadona tiene marca propia "Hacendado", "Deliplus", etc.)
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
                product_url=f"https://tienda.mercadona.es/product/{product_id}",
                is_available=True,  # Si está en la API, está disponible
                ean=ean,
            )

        except Exception as e:
            self._log_error(
                "Error parseando producto",
                product_id=raw.get("id"),
                error=str(e),
            )
            return None

    def _extract_brand(self, raw: dict, name: str) -> str | None:
        """
        Intenta extraer la marca del producto.

        Mercadona tiene varias marcas propias conocidas.
        """
        # Marcas propias de Mercadona
        mercadona_brands = [
            "Hacendado",
            "Deliplus",
            "Bosque Verde",
            "Compy",
            "Solcare",
            "Pollix",
        ]

        # Buscar marca explícita en los datos
        brand = raw.get("brand") or raw.get("manufacturer")
        if brand:
            return brand

        # Intentar detectar marca propia en el nombre
        name_lower = name.lower()
        for mb in mercadona_brands:
            if mb.lower() in name_lower:
                return mb

        return None


# === Función de utilidad para testing ===

async def test_mercadona_scraper():
    """Función para probar el scraper manualmente."""
    import sys

    # Configurar logging para consola
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.dev.ConsoleRenderer(),
        ],
    )

    print("Probando MercadonaScraper...")
    print("-" * 50)

    scraper = MercadonaScraper()
    count = 0
    max_products = 50  # Limitar para test

    try:
        async with scraper:
            async for product in scraper.scrape():
                count += 1
                print(f"[{count}] {product.name} - {product.price}€")

                if count >= max_products:
                    print(f"\n(Limitado a {max_products} productos para test)")
                    break

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

    print("-" * 50)
    print(f"Total productos extraídos: {count}")


if __name__ == "__main__":
    asyncio.run(test_mercadona_scraper())
