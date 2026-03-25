"""
main.py
-------
FastAPI application entry point.
Registers routers, CORS, and startup checks.
Nothing else lives here.

Run:
    uvicorn main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from routers.navigator import router as navigator_router
from routers.generate_brief import router as generate_brief_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Validate config at startup — fail fast rather than at first request."""
    settings = get_settings()
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Gemini model: {settings.gemini_model}")
    logger.info(f"Bright Data zone: {settings.brightdata_web_unlocker_zone}")
    logger.info("✓ Backend ready")
    yield
    logger.info("Backend shutting down")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Montgomery City Intelligence — Backend",
        description="Resident Navigator API powered by Gemini + Bright Data",
        version="1.0.0",
        lifespan=lifespan,
        # Hide docs in production
        docs_url="/docs" if settings.environment == "development" else None,
        redoc_url=None,
    )

    # ── CORS ──────────────────────────────────────────────────
    # Never use "*" in production — enumerate origins explicitly.
    # Add staging/preview URLs to ALLOWED_ORIGINS in .env as needed.
    allowed_origins = [
        origin.strip()
        for origin in settings.allowed_origins.split(",")
        if origin.strip()
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["POST", "GET"],
        allow_headers=["Content-Type", "X-Gemini-Key", "X-Brightdata-Token"],
    )

    # ── Routers ───────────────────────────────────────────────
    app.include_router(navigator_router)
    app.include_router(generate_brief_router)

    # ── Health check ──────────────────────────────────────────
    @app.get("/health")
    def health():
        return {"status": "ok", "model": settings.gemini_model}

    return app


app = create_app()
