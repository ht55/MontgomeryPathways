"""
backend/routers/navigator.py
Thin layer — input validation, error handling, HTTP response only.
Zero business logic here.
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
    """
    Generate a personalised opportunity plan for a Montgomery resident.
    Orchestrates:
    - Rate limiting (10 requests/IP/hour)
    - Real-time job/resource data via Bright Data (cached 1hr)
    - AI-powered plan generation via Gemini
    - Pydantic validation of the response
    """
    client_ip = http_request.client.host if http_request.client else "unknown"
    allowed, remaining = check_rate_limit(client_ip)

    if not allowed:
        logger.error(f"[RATE_LIMIT] IP {client_ip} hit Navigator rate limit")
        raise HTTPException(
            status_code=429,
            detail="Request limit reached. Please contact hirokotakano525@gmail.com and I'll restore access immediately. 🙏",
            headers={"Retry-After": "3600"},
        )

    logger.info(f"Navigator request from {client_ip} — {remaining} requests remaining this hour")

    try:
        return await get_navigator_plan(request)
    except ValidationError as e:
        raise HTTPException(
            status_code=502,
            detail=f"AI response validation failed: {e.error_count()} error(s). Try again.",
        )
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
