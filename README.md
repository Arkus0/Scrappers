# Scrappers

Motor de datos para **ShoppyJuan** - Extracción de precios de supermercados españoles.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         Railway                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    FastAPI Server                          │  │
│  │  /api/v1/scrape/mercadona  ──┐                            │  │
│  │  /api/v1/scrape/carrefour  ──┼──► ScraperService          │  │
│  │  /api/v1/scrape/all        ──┘         │                  │  │
│  └────────────────────────────────────────┼──────────────────┘  │
│                                           │                      │
│  ┌────────────────────────────────────────▼──────────────────┐  │
│  │                      Scrapers                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │  Mercadona   │  │  Carrefour   │  │    Día       │    │  │
│  │  │  (mercapi)   │  │ (playwright) │  │   (TODO)     │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │       Supabase        │
                    │     (PostgreSQL)      │
                    │   SERVICE_ROLE_KEY    │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │      ShoppyJuan       │
                    │    (Next.js App)      │
                    └───────────────────────┘
```

## Stack Tecnológico

- **Python 3.11+** - Lenguaje principal
- **FastAPI** - Framework web para API REST
- **Supabase** - Base de datos PostgreSQL
- **mercapi** - Cliente para API de Mercadona
- **Playwright** - Scraping de SPAs (Carrefour, etc.)
- **Railway** - Hosting con soporte de Cron Jobs

## Estructura del Proyecto

```
Scrappers/
├── app/
│   ├── __init__.py
│   ├── main.py           # Aplicación FastAPI
│   ├── config.py         # Configuración centralizada
│   ├── database.py       # Conexión a Supabase
│   ├── models/
│   │   └── product.py    # Modelos Pydantic
│   ├── scrapers/
│   │   ├── base.py       # Clase base abstracta
│   │   ├── mercadona.py  # Scraper Mercadona
│   │   └── carrefour.py  # Scraper Carrefour
│   └── services/
│       └── scraper_service.py  # Orquestador
├── scripts/
│   └── run_scrapers.py   # Script para cron jobs
├── tests/
├── Dockerfile
├── railway.toml
├── requirements.txt
└── pyproject.toml
```

## Instalación Local

### 1. Clonar y configurar entorno

```bash
git clone https://github.com/tu-org/scrappers.git
cd scrappers

# Crear entorno virtual
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Instalar Playwright browsers
playwright install chromium
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

### 3. Ejecutar servidor de desarrollo

```bash
# Con uvicorn directamente
uvicorn app.main:app --reload

# O con Python
python -m app.main
```

El servidor estará en: http://localhost:8000

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Info básica |
| GET | `/health` | Health check |
| GET | `/api/v1/status` | Estado del scraping |
| GET | `/api/v1/scrapers` | Lista de scrapers disponibles |
| POST | `/api/v1/scrape/{supermarket}` | Ejecutar scraper específico |
| POST | `/api/v1/scrape/all` | Ejecutar todos los scrapers |

### Ejemplos

```bash
# Ver scrapers disponibles
curl http://localhost:8000/api/v1/scrapers

# Ejecutar scraping de Mercadona (async)
curl -X POST http://localhost:8000/api/v1/scrape/mercadona

# Ejecutar scraping de Mercadona (sync, esperar resultado)
curl -X POST "http://localhost:8000/api/v1/scrape/mercadona?sync=true"

# Ejecutar todos los scrapers
curl -X POST http://localhost:8000/api/v1/scrape/all
```

## Ejecución via CLI (Cron Jobs)

```bash
# Ejecutar todos los scrapers
python scripts/run_scrapers.py

# Ejecutar solo Mercadona
python scripts/run_scrapers.py mercadona

# Ejecutar varios
python scripts/run_scrapers.py mercadona carrefour

# Ayuda
python scripts/run_scrapers.py --help
```

## Despliegue en Railway

### 1. Crear proyecto en Railway

```bash
railway login
railway init
```

### 2. Configurar variables de entorno

En Railway Dashboard > Variables:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
APP_ENV=production
DEBUG=false
```

### 3. Deploy

```bash
railway up
```

### 4. Configurar Cron Job

En Railway Dashboard > Settings > Cron:

```
# Ejecutar todos los días a las 3:00 AM
0 3 * * * python scripts/run_scrapers.py
```

## Base de Datos

### Tabla `products` en Supabase

```sql
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  external_id TEXT NOT NULL,
  supermarket TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  price DECIMAL(10,2) NOT NULL,
  price_per_unit DECIMAL(10,2),
  unit TEXT,
  category TEXT,
  subcategory TEXT,
  image_url TEXT,
  product_url TEXT,
  is_available BOOLEAN DEFAULT true,
  ean TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(external_id, supermarket)
);

-- Índices recomendados
CREATE INDEX idx_products_supermarket ON products(supermarket);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('spanish', name));
```

## Añadir Nuevo Scraper

1. Crear archivo en `app/scrapers/nuevo_super.py`
2. Heredar de `BaseScraper`
3. Implementar `scrape()` como generador asíncrono
4. Registrar en `app/scrapers/__init__.py`
5. Añadir al diccionario `SCRAPERS` en `scraper_service.py`

```python
# app/scrapers/dia.py
from app.scrapers.base import BaseScraper
from app.models.product import Supermarket

class DiaScraper(BaseScraper):
    @property
    def supermarket(self) -> Supermarket:
        return Supermarket.DIA

    @property
    def name(self) -> str:
        return "Dia"

    async def scrape(self):
        # Implementación del scraping
        yield ProductCreate(...)
```

## Licencia

MIT
