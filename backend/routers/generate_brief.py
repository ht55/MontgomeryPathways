# backend/routers/generate_brief.py

import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from services.ai_provider import _get_client
from services.brightdata import check_rate_limit
from config import get_settings

router = APIRouter()
logger = logging.getLogger(__name__)

class BriefRequest(BaseModel):
    trainingIncrease: float
    employerIncentiveIncrease: float
    transportSupportIncrease: float
    safetyImprovement: float
    affordableHousing: float
    schoolQuality: float
    horizon: int
    projectedRecidivismRate: float
    costSaved: float
    taxRevenueGain: float
    opportunityGapReduction: float
    youngAdultRetentionRate: float
    householdFormationRate: int
    longTermTaxBaseGrowth: float
    netROI: float

def fmt_dollars(n: float) -> str:
    if abs(n) >= 1_000_000:
        return f"${n / 1_000_000:.1f}M"
    if abs(n) >= 1_000:
        return f"${n / 1_000:.0f}K"
    return f"${n:.0f}"

@router.post("/api/generate-brief")
async def generate_brief(req: BriefRequest, http_request: Request):
    client_ip = http_request.client.host if http_request.client else "unknown"
    allowed, remaining = check_rate_limit(client_ip)

    if not allowed:
        logger.error(f"[RATE_LIMIT] IP {client_ip} hit Generate Brief rate limit")
        raise HTTPException(
            status_code=429,
            detail="Request limit reached. Please contact hirokotakano525@gmail.com and I'll restore access immediately. 🙏.",
            headers={"Retry-After": "3600"},
        )

    logger.info(f"Generate Brief request from {client_ip} — {remaining} requests remaining this hour")

    settings = get_settings()
    client = _get_client()

    prompt = f"""You are a senior policy advisor for Montgomery, Alabama. Generate a concise executive policy brief (3-4 paragraphs) based on this simulation:

Time Horizon: {req.horizon} years

Policy Inputs:
- Training Investment: {req.trainingIncrease}%  | Employer Incentives: {req.employerIncentiveIncrease}%  | Transport Support: {req.transportSupportIncrease}%
- Safety Improvement: {req.safetyImprovement}%  | Affordable Housing: {req.affordableHousing}%          | School Quality: {req.schoolQuality}%

Projected Outcomes:
- Recidivism Rate: {req.projectedRecidivismRate * 100:.1f}%
- Incarceration Cost Saved: {fmt_dollars(req.costSaved)}
- Tax Revenue Gain: {fmt_dollars(req.taxRevenueGain)}
- Opportunity Gap Reduction: {req.opportunityGapReduction:.1f}%
- Youth Retention Rate: {req.youngAdultRetentionRate * 100:.1f}%
- New Households Formed: {req.householdFormationRate:,}
- Long-term Tax Base Growth: {fmt_dollars(req.longTermTaxBaseGrowth)}
- Net City ROI: {fmt_dollars(req.netROI)}

Focus on equity, long-term economic resilience, and the compounding value of investing in marginalized populations. Be specific, data-driven, and forward-looking.
Write in plain paragraphs only. Do NOT use markdown, headers, or memo format (no To/From/Date/Subject lines). Start directly with the policy analysis."""

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
    )
    return {"brief": response.text}
