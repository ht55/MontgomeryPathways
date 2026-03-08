"""
backend/services/brightdata.py
----------------------
Bright Data Web Unlocker wrapper.
Handles all real-time web data retrieval for the Navigator feature.

Cache strategy:
- Same career_interest + prior_conviction + has_vehicle combo → reuse for 1 hour
- Avoids redundant Bright Data API calls during demos / hackathon judging

Rate limiting:
- Disabled for hackathon demo — re-enable for production
"""

import httpx
import logging
import time
from collections import defaultdict
from config import get_settings

logger = logging.getLogger(__name__)

BRIGHTDATA_BASE_URL = "https://api.brightdata.com/request"

# ── Search query templates ────────────────────────────────────
SEARCH_QUERIES = {
    "jobs":        "jobs hiring Montgomery Alabama {career} no experience",
    "ban_the_box": "ban the box employers hiring felons Montgomery Alabama {career}",
    "workforce":   "workforce training programs Montgomery Alabama {career} free",
    "nonprofits":  "reentry support organizations Montgomery Alabama",
    "transit":     "Montgomery Area Transit System bus routes jobs",
}

# ── In-memory cache ───────────────────────────────────────────
# Key: (career_interest, has_vehicle, prior_conviction)
# Value: (result_dict, timestamp)
_cache: dict[tuple, tuple[dict[str, str], float]] = {}
_CACHE_TTL_SECONDS = 3600  # 1 hour

def _cache_key(career_interest: str, has_vehicle: bool, prior_conviction: bool) -> tuple:
    return (career_interest.lower().strip(), has_vehicle, prior_conviction)

def _get_cached(key: tuple) -> dict[str, str] | None:
    if key not in _cache:
        return None
    result, timestamp = _cache[key]
    if time.time() - timestamp > _CACHE_TTL_SECONDS:
        del _cache[key]
        logger.info(f"Cache expired for key: {key}")
        return None
    logger.info(f"Cache HIT for key: {key}")
    return result

def _set_cache(key: tuple, result: dict[str, str]) -> None:
    _cache[key] = (result, time.time())
    logger.info(f"Cache SET for key: {key} ({len(_cache)} entries total)")

# ── Rate limiter ──────────────────────────────────────────────
# Max requests per IP per window
_RATE_LIMIT_MAX      = 50
_RATE_LIMIT_WINDOW_S = 3600  # 1 hour

# ip → list of timestamps
_rate_limit_store: dict[str, list[float]] = defaultdict(list)

def check_rate_limit(ip: str) -> tuple[bool, int]:
    # Disabled for hackathon demo — re-enable for production
    return True, 999

# ── Bright Data fetch ─────────────────────────────────────────

async def search_web(query: str) -> str:
    """Run a search via Bright Data Web Unlocker. Returns raw text."""
    settings = get_settings()

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            BRIGHTDATA_BASE_URL,
            headers={
                "Authorization": f"Bearer {settings.brightdata_api_token}",
                "Content-Type": "application/json",
            },
            json={
                "zone": settings.brightdata_web_unlocker_zone,
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
) -> dict[str, str]:
    """
    Gather real-time Montgomery-specific data for a resident profile.
    Returns cached result if available (TTL: 1 hour).
    Runs targeted searches in parallel for efficiency.
    Gracefully degrades — if a search fails, returns empty string for that key.
    """
    import asyncio

    # ── Cache check ───────────────────────────────────────────
    key = _cache_key(career_interest, has_vehicle, prior_conviction)
    cached = _get_cached(key)
    if cached is not None:
        return cached

    # ── Build queries ─────────────────────────────────────────
    queries = {
        "jobs":      SEARCH_QUERIES["jobs"].format(career=career_interest),
        "workforce": SEARCH_QUERIES["workforce"].format(career=career_interest),
        "nonprofits": SEARCH_QUERIES["nonprofits"],
    }
    if prior_conviction:
        queries["ban_the_box"] = SEARCH_QUERIES["ban_the_box"].format(career=career_interest)
    if not has_vehicle:
        queries["transit"] = SEARCH_QUERIES["transit"]

    # ── Parallel fetch ────────────────────────────────────────
    async def safe_search(key: str, query: str) -> tuple[str, str]:
        try:
            result = await search_web(query)
            return key, result
        except Exception as e:
            logger.warning(f"Bright Data search failed for '{key}': {e}")
            return key, ""

    raw_results = await asyncio.gather(
        *[safe_search(k, q) for k, q in queries.items()],
        return_exceptions=True,
    )

    context: dict[str, str] = {}
    for item in raw_results:
        if isinstance(item, BaseException):
            logger.error(f"Unexpected gather exception: {item}")
            continue
        k, value = item
        context[k] = value

    # ── Store in cache ────────────────────────────────────────
    _set_cache(key, context)
    return context
