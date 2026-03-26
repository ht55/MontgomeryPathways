"""
backend/routers/navigator.py
"""
import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import ValidationError
from schemas.navigator import NavigatorRequest, NavigatorResponse
from services.navigator import get_navigator_plan
from services.brightdata import check_rate_limit

router = APIRouter(prefix="/api/navigator", tags=["navigator"])
logger = logging.getLogger(__name__)

@router.post("", response_model=NavigatorResponse)
async def navigator(request: NavigatorRequest, http_request: Request) -> NavigatorResponse:
    client_ip = http_request.client.host if http_request.client else "unknown"
    allowed, _ = check_rate_limit(client_ip)

    if not allowed:
        logger.error(f"[RATE_LIMIT] IP {client_ip} hit Navigator rate limit")
        raise HTTPException(
            status_code=429,
            detail="Request limit reached.",
            headers={"Retry-After": "3600"},
        )

    gemini_key       = http_request.headers.get("X-Gemini-Key") or None
    brightdata_token = http_request.headers.get("X-Brightdata-Token") or None

    if not gemini_key:
        raise HTTPException(status_code=401, detail="Gemini API key required. Please add your key in the app settings.")

    try:
        return await get_navigator_plan(request, gemini_key=gemini_key, brightdata_token=brightdata_token)
    except ValidationError as e:
        raise HTTPException(status_code=502, detail=f"AI response validation failed: {e.error_count()} error(s).")
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        if "API_KEY_INVALID" in str(e) or "invalid" in str(e).lower():
            raise HTTPException(status_code=401, detail="Invalid Gemini API key.")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")