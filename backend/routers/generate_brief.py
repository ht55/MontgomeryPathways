# backend/routers/generate_brief.py

import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from config import get_settings
import google.generativeai as genai

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
    # Accept key from header (user-supplied) or fall back to env var
    gemini_key = http_request.headers.get("X-Gemini-Key") or get_settings().gemini_api_key

    if not gemini_key:
        raise HTTPException(status_code=401, detail="Gemini API key required.")

    try:
        genai.configure(api_key=gemini_key)
        client = genai.GenerativeModel(get_settings().gemini_model)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Gemini API key.")

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

Write in plain paragraphs only. Do NOT use markdown, headers, or memo format (no To/From/Date/Subject lines). Start directly with the policy analysis. Focus on equity, long-term economic resilience, and the compounding value of investing in marginalized populations."""

    try:
        response = client.generate_content(prompt)
        return {"brief": response.text}
    except Exception as e:
        if "API_KEY_INVALID" in str(e) or "invalid" in str(e).lower():
            raise HTTPException(status_code=401, detail="Invalid Gemini API key.")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")