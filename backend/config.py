"""
config.py
---------
Single source of truth for all environment variables.
Never import os.environ directly elsewhere — always go through this module.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # ── Google Gemini ────────────────────────────────────────
    gemini_api_key:  str
    gemini_model:    str = "gemini-2.5-flash"

    # ── Bright Data ──────────────────────────────────────────
    brightdata_api_token:         str = ""
    brightdata_web_unlocker_zone: str = "unlocker1"

    # ── App Token (bot protection) ───────────────────────────
    # Set APP_TOKEN in Railway env vars to a random string
    # Same value goes in Vercel as NEXT_PUBLIC_APP_TOKEN
    app_token: str = ""

    # ── App ──────────────────────────────────────────────────
    environment:     str = "development"
    allowed_origins: str = "http://localhost:3000"

    class Config:
        env_file       = ".env"
        case_sensitive = False

@lru_cache
def get_settings() -> Settings:
    """Cached singleton — reads .env once at startup."""
    return Settings()