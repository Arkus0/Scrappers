"""Scrapers para diferentes supermercados."""

from app.scrapers.base import BaseScraper
from app.scrapers.mercadona import MercadonaScraper
from app.scrapers.carrefour import CarrefourScraper

__all__ = ["BaseScraper", "MercadonaScraper", "CarrefourScraper"]
