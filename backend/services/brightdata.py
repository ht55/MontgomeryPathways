"""
backend/services/brightdata.py
Bright Data Web Unlocker wrapper.

Cache: file-based (data/cache.json) — persists across restarts, 30-day TTL.
If brightdata_token is not provided, falls back to cache only.
"""

import httpx
import json
import logging
import os
import time
from collections import defaultdict
from pathlib import Path

import redis as redis_client

from config import get_settings

logger = logging.getLogger(__name__)

BRIGHTDATA_BASE_URL = "https://api.brightdata.com/request"

SEARCH_QUERIES = {
    "jobs":        "jobs hiring Montgomery Alabama {career} no experience",
    "ban_the_box": "ban the box employers hiring felons Montgomery Alabama {career}",
    "workforce":   "workforce training programs Montgomery Alabama {career} free",
    "nonprofits":  "reentry support organizations Montgomery Alabama",
    "transit":     "Montgomery Area Transit System bus routes jobs",
}

# ── File-based cache ──────────────────────────────────────────
_CACHE_FILE        = Path(__file__).parent.parent / "data" / "cache.json"
_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30  # 30 days
_MEMORY_TTL        = 10800               # 3 hours in-memory

def _load_file_cache() -> dict:
    try:
        if _CACHE_FILE.exists():
            with open(_CACHE_FILE, "r") as f:
                data = json.load(f)
            logger.info(f"File cache loaded: {len(data)} entries")
            return data
    except Exception as e:
        logger.warning(f"Could not load file cache: {e}")
    return {}

def _save_file_cache(cache: dict) -> None:
    try:
        _CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(_CACHE_FILE, "w") as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        logger.warning(f"Could not save file cache: {e}")

_file_cache:   dict = _load_file_cache()
_memory_cache: dict[str, tuple[dict, float]] = {}

def _cache_key(career_interest: str, has_vehicle: bool, prior_conviction: bool) -> str:
    return f"{career_interest.lower().strip()}|{has_vehicle}|{prior_conviction}"

def _get_cached(key: str) -> dict[str, str] | None:
    if key in _file_cache:
        entry = _file_cache[key]
        if time.time() - entry.get("timestamp", 0) < _CACHE_TTL_SECONDS:
            logger.info(f"File cache HIT: {key}")
            return entry["data"]
        del _file_cache[key]
    if key in _memory_cache:
        result, ts = _memory_cache[key]
        if time.time() - ts < _MEMORY_TTL:
            logger.info(f"Memory cache HIT: {key}")
            return result
        del _memory_cache[key]
    return None

def _set_cache(key: str, result: dict[str, str]) -> None:
    _memory_cache[key] = (result, time.time())
    _file_cache[key] = {"data": result, "timestamp": time.time()}
    _save_file_cache(_file_cache)
    logger.info(f"Cache SET: {key}")

# ── Rate limiter ──────────────────────────────────────────────
_RATE_LIMIT_MAX      = 20
_RATE_LIMIT_WINDOW_S = 3600
_rate_limit_store: dict[str, list[float]] = defaultdict(list)

def _get_redis() -> redis_client.Redis | None:
    url = os.environ.get("REDIS_URL")
    if url:
        try:
            return redis_client.from_url(url, decode_responses=True)
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
    return None

def check_rate_limit(ip: str) -> tuple[bool, int]:
    r = _get_redis()

    if r is not None:
        try:
            key = f"rate:{ip}"
            pipe = r.pipeline()
            pipe.incr(key)
            pipe.expire(key, _RATE_LIMIT_WINDOW_S)
            count, _ = pipe.execute()
            if count > _RATE_LIMIT_MAX:
                return False, 0
            return True, _RATE_LIMIT_MAX - count
        except Exception as e:
            logger.warning(f"Redis rate limit error, falling back to memory: {e}")

    # メモリフォールバック
    now = time.time()
    window_start = now - _RATE_LIMIT_WINDOW_S
    _rate_limit_store[ip] = [t for t in _rate_limit_store[ip] if t > window_start]
    count = len(_rate_limit_store[ip])
    if count >= _RATE_LIMIT_MAX:
        return False, 0
    _rate_limit_store[ip].append(now)
    return True, _RATE_LIMIT_MAX - count - 1

# ── Bright Data fetch ─────────────────────────────────────────
async def search_web(query: str, token: str, zone: str) -> str:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            BRIGHTDATA_BASE_URL,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "zone": zone,
                "url": f"https://www.google.com/search?q={httpx.QueryParams({'q': query})}",
                "format": "raw",
            },
        )
        response.raise_for_status()
        return response.text


async def gather_montgomery_context(
    career_interest: str,
    has_vehicle: bool,
    prior_conviction: bool,
    brightdata_token: str | None = None,
) -> dict[str, str]:
    """
    Returns Montgomery context data.
    Priority: file cache → memory cache → live Bright Data fetch.
    If no token provided, returns cache only (empty dict if no cache).
    """
    import asyncio

    key = _cache_key(career_interest, has_vehicle, prior_conviction)
    cached = _get_cached(key)
    if cached is not None:
        return cached

    settings = get_settings()
    token = brightdata_token or settings.brightdata_api_token
    zone  = settings.brightdata_web_unlocker_zone

    if not token:
        logger.warning("No Bright Data token — returning empty context")
        return {}

    logger.info(f"Cache MISS — fetching live: {key}")

    queries = {
        "jobs":       SEARCH_QUERIES["jobs"].format(career=career_interest),
        "workforce":  SEARCH_QUERIES["workforce"].format(career=career_interest),
        "nonprofits": SEARCH_QUERIES["nonprofits"],
    }
    if prior_conviction:
        queries["ban_the_box"] = SEARCH_QUERIES["ban_the_box"].format(career=career_interest)
    if not has_vehicle:
        queries["transit"] = SEARCH_QUERIES["transit"]

    async def safe_search(k: str, query: str) -> tuple[str, str]:
        try:
            return k, await search_web(query, token, zone)
        except Exception as e:
            logger.warning(f"Bright Data failed for '{k}': {e}")
            return k, ""

    results = await asyncio.gather(*[safe_search(k, q) for k, q in queries.items()], return_exceptions=True)

    context: dict[str, str] = {}
    for item in results:
        if isinstance(item, BaseException):
            logger.error(f"Gather exception: {item}")
            continue
        k, value = item
        context[k] = value

    _set_cache(key, context)
    return context