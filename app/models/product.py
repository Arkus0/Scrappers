"""
Modelos Pydantic para productos y resultados de scraping.
Estos modelos definen la estructura de datos que manejamos.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict


class Supermarket(str, Enum):
    """Supermercados soportados."""

    MERCADONA = "mercadona"
    CARREFOUR = "carrefour"
    DIA = "dia"
    ALCAMPO = "alcampo"
    LIDL = "lidl"
    EROSKI = "eroski"


class ProductCreate(BaseModel):
    """Modelo para crear/actualizar un producto en la DB."""

    model_config = ConfigDict(str_strip_whitespace=True)

    external_id: str = Field(..., description="ID único del producto en el supermercado")
    supermarket: Supermarket = Field(..., description="Supermercado de origen")
    name: str = Field(..., min_length=1, max_length=500, description="Nombre del producto")
    brand: str | None = Field(None, max_length=200, description="Marca del producto")
    price: Decimal = Field(..., ge=0, description="Precio actual en euros")
    price_per_unit: Decimal | None = Field(None, ge=0, description="Precio por unidad (kg, L, etc)")
    unit: str | None = Field(None, max_length=50, description="Unidad de medida (kg, L, unidad)")
    category: str | None = Field(None, max_length=200, description="Categoría del producto")
    subcategory: str | None = Field(None, max_length=200, description="Subcategoría")
    image_url: str | None = Field(None, description="URL de la imagen del producto")
    product_url: str | None = Field(None, description="URL del producto en la web")
    is_available: bool = Field(True, description="Si el producto está disponible")
    ean: str | None = Field(None, max_length=20, description="Código EAN/barras")

    def to_db_dict(self) -> dict:
        """Convierte el modelo a diccionario para inserción en DB."""
        data = self.model_dump(exclude_none=True)
        # Convertir Decimal a float para JSON
        if "price" in data:
            data["price"] = float(data["price"])
        if "price_per_unit" in data:
            data["price_per_unit"] = float(data["price_per_unit"])
        # Convertir enum a string
        if "supermarket" in data:
            data["supermarket"] = data["supermarket"].value
        # Añadir timestamp de actualización
        data["updated_at"] = datetime.utcnow().isoformat()
        return data


class Product(ProductCreate):
    """Modelo completo de producto (incluye campos de DB)."""

    id: int = Field(..., description="ID en la base de datos")
    created_at: datetime = Field(..., description="Fecha de creación")
    updated_at: datetime = Field(..., description="Última actualización")


class ScrapingResult(BaseModel):
    """Resultado de una operación de scraping."""

    supermarket: Supermarket
    success: bool
    products_found: int = 0
    products_inserted: int = 0
    products_updated: int = 0
    errors: int = 0
    duration_seconds: float = 0.0
    error_message: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    @property
    def summary(self) -> str:
        """Resumen legible del resultado."""
        if self.success:
            return (
                f"[{self.supermarket.value}] OK: "
                f"{self.products_found} encontrados, "
                f"{self.products_inserted} insertados "
                f"en {self.duration_seconds:.1f}s"
            )
        return f"[{self.supermarket.value}] ERROR: {self.error_message}"


class ScrapingStatus(BaseModel):
    """Estado actual del sistema de scraping."""

    is_running: bool = False
    current_supermarket: str | None = None
    last_run: datetime | None = None
    last_results: list[ScrapingResult] = []
