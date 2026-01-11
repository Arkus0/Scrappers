"""
Configuración centralizada del proyecto.
Usa pydantic-settings para validación y carga desde variables de entorno.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración de la aplicación cargada desde variables de entorno."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # === Supabase ===
    supabase_url: str
    supabase_service_role_key: str  # SERVICE_ROLE_KEY para bypass de RLS

    # === Aplicación ===
    app_name: str = "Scrappers"
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    log_level: str = "INFO"

    # === API ===
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_prefix: str = "/api/v1"

    # === Scraping ===
    scraping_timeout: int = 30  # segundos
    scraping_retry_attempts: int = 3
    scraping_batch_size: int = 100  # productos por lote para inserción

    # === Railway (se inyectan automáticamente) ===
    railway_environment: str | None = None
    port: int | None = None  # Railway inyecta PORT

    @property
    def is_production(self) -> bool:
        """Verifica si estamos en producción."""
        return self.app_env == "production"

    @property
    def effective_port(self) -> int:
        """Puerto efectivo considerando Railway."""
        return self.port or self.api_port


@lru_cache
def get_settings() -> Settings:
    """
    Obtiene la configuración de la aplicación.
    Usa lru_cache para singleton - se carga una sola vez.
    """
    return Settings()


# Alias para acceso rápido
settings = get_settings()
