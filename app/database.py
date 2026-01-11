"""
Conexión a Supabase usando SERVICE_ROLE_KEY.
Permite bypass completo de RLS para operaciones de escritura.
"""

import structlog
from supabase import create_client, Client

from app.config import settings

logger = structlog.get_logger()


class Database:
    """
    Cliente de base de datos Supabase.
    Usa SERVICE_ROLE_KEY para tener permisos completos sin RLS.
    """

    _client: Client | None = None

    @classmethod
    def get_client(cls) -> Client:
        """
        Obtiene el cliente de Supabase (singleton).
        Crea la conexión en la primera llamada.
        """
        if cls._client is None:
            logger.info(
                "Inicializando conexión a Supabase",
                url=settings.supabase_url[:30] + "...",
            )
            cls._client = create_client(
                settings.supabase_url,
                settings.supabase_service_role_key,
            )
            logger.info("Conexión a Supabase establecida")
        return cls._client

    @classmethod
    def reset_client(cls) -> None:
        """Resetea el cliente (útil para tests)."""
        cls._client = None


def get_supabase() -> Client:
    """
    Dependency para FastAPI.
    Retorna el cliente de Supabase.
    """
    return Database.get_client()


# === Operaciones de base de datos ===


async def upsert_products(products: list[dict], table: str = "products") -> dict:
    """
    Inserta o actualiza productos en la base de datos.
    Usa upsert para evitar duplicados basándose en external_id + supermarket.

    Args:
        products: Lista de productos a insertar/actualizar
        table: Nombre de la tabla (default: products)

    Returns:
        dict con estadísticas de la operación
    """
    client = Database.get_client()

    if not products:
        logger.warning("No hay productos para insertar")
        return {"inserted": 0, "errors": 0}

    try:
        # Upsert basado en la combinación única de external_id + supermarket
        response = (
            client.table(table)
            .upsert(
                products,
                on_conflict="external_id,supermarket",
            )
            .execute()
        )

        count = len(response.data) if response.data else 0
        logger.info(
            "Productos insertados/actualizados",
            count=count,
            table=table,
        )
        return {"inserted": count, "errors": 0}

    except Exception as e:
        logger.error(
            "Error al insertar productos",
            error=str(e),
            products_count=len(products),
        )
        return {"inserted": 0, "errors": len(products), "error_message": str(e)}


async def get_products_by_supermarket(supermarket: str, limit: int = 100) -> list[dict]:
    """
    Obtiene productos de un supermercado específico.

    Args:
        supermarket: Nombre del supermercado
        limit: Número máximo de productos a retornar

    Returns:
        Lista de productos
    """
    client = Database.get_client()

    try:
        response = (
            client.table("products")
            .select("*")
            .eq("supermarket", supermarket)
            .limit(limit)
            .execute()
        )
        return response.data or []

    except Exception as e:
        logger.error(
            "Error al obtener productos",
            supermarket=supermarket,
            error=str(e),
        )
        return []


async def health_check() -> bool:
    """
    Verifica la conexión a la base de datos.

    Returns:
        True si la conexión es exitosa
    """
    try:
        client = Database.get_client()
        # Intenta una query simple
        client.table("products").select("id").limit(1).execute()
        return True
    except Exception as e:
        logger.error("Health check fallido", error=str(e))
        return False
