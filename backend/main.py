"""
main.py
-------
FastAPI application entry point.
Registers routers, CORS, and startup checks.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    settings = get_settings()
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Gemini model: {settings.gemini_model}")
    logger.info(f"Bright Data zone: {settings.brightdata_web_unlocker_zone}")
    logger.info(f"App token protection: {'enabled' if settings.app_token else 'disabled'}")
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
        docs_url="/docs" if settings.environment == "development" else None,
        redoc_url=None,
    )

    # ── CORS ──────────────────────────────────────────────────
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
        allow_headers=["Content-Type", "X-Gemini-Key", "X-Brightdata-Token", "X-App-Token"],
    )

    # ── App Token middleware (bot protection) ─────────────────
    @app.middleware("http")
    async def verify_app_token(request: Request, call_next):
        settings = get_settings()
        # Skip token check if not configured (local dev) or health check
        if not settings.app_token or request.url.path == "/health":
            return await call_next(request)
        token = request.headers.get("X-App-Token")
        if token != settings.app_token:
            logger.warning(f"[BOT_BLOCK] Invalid app token from {request.client.host}")
            return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
        return await call_next(request)

    # ── Routers ───────────────────────────────────────────────
    app.include_router(navigator_router)
    app.include_router(generate_brief_router)

    # ── Health check ──────────────────────────────────────────
    @app.get("/health")
    def health():
        return {"status": "ok", "model": get_settings().gemini_model}

    return app

app = create_app()