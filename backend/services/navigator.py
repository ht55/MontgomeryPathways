"""
backend/services/navigator.py
Orchestrates: Bright Data context → AI prompt → validated response.
"""

import logging
from schemas.navigator import NavigatorRequest, NavigatorResponse
from services.brightdata import gather_montgomery_context
from services.ai_provider import generate_json

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a compassionate but direct workforce counselor for Montgomery, Alabama.
You specialize in helping people who face real barriers to employment — criminal records, 
lack of education credentials, no vehicle, or simply not knowing where to start.

You provide specific, actionable, Montgomery-specific guidance. Zero platitudes.
You name real organizations, real phone numbers, real programs.
You respect the person's intelligence and lived experience.

You always return valid JSON matching the exact schema provided. No exceptions."""

_MAX_CHARS_PER_SECTION = 2_000
_MAX_SECTIONS          = 5

def _truncate_web_context(web_context: dict[str, str]) -> dict[str, str]:
    truncated = {}
    for key, content in web_context.items():
        if len(content) > _MAX_CHARS_PER_SECTION:
            logger.warning(f"Truncating web context '{key}': {len(content)} → {_MAX_CHARS_PER_SECTION} chars")
            truncated[key] = content[:_MAX_CHARS_PER_SECTION] + "\n[...truncated]"
        else:
            truncated[key] = content
    return truncated

def _build_user_prompt(request: NavigatorRequest, web_context: dict[str, str]) -> str:
    conviction_text = ""
    if request.prior_conviction:
        conviction_type = request.conviction_type or "unspecified"
        conviction_text = f"""
- Prior conviction: YES ({conviction_type})
  → Prioritize Ban the Box employers
  → Flag any licensing restrictions for this conviction type
  → Include reentry-specific support resources"""

    vehicle_text = (
        "Has vehicle: YES"
        if request.has_vehicle
        else "Has vehicle: NO → jobs must be bus-accessible (MATS routes)"
    )

    web_sections = "\n\n".join([
        f"=== {key.upper()} (live web data) ===\n{content}"
        for key, content in web_context.items()
        if content
    ]) or "No live web data available — use your knowledge of Montgomery, AL."

    return f"""RESIDENT PROFILE:
- Age: {request.age}
- ZIP code: {request.zip_code} (Montgomery, AL)
- Education: {request.education.value}
- Current income: {request.income_bracket.value}
- Career interest: {request.career_interest.value}
- {vehicle_text}{conviction_text}

LIVE WEB DATA FROM MONTGOMERY:
{web_sections}

Generate a personalized opportunity plan using this exact JSON schema:
{{
  "career_paths": [
    {{
      "title": "string",
      "salary_range": "string (e.g. $18–$24/hr)",
      "time_to_employment": "string (e.g. 6–8 weeks)",
      "demand_level": "High | Medium | Growing",
      "training_steps": [
        {{
          "step": 1,
          "description": "string",
          "duration": "string",
          "provider": "string (real Montgomery organization)",
          "cost": "string"
        }}
      ],
      "recidivism_reduction": "string (e.g. ↓ 34%)",
      "city_savings": "string (e.g. $28K/yr in avoided costs)"
    }}
  ],
  "support_resources": [
    {{
      "name": "string (real org name)",
      "type": "string",
      "phone": "string",
      "address": "string",
      "hours": "string",
      "relevance": "string (why specifically relevant to this person)"
    }}
  ],
  "action_plan": [
    {{
      "week": "string (e.g. Week 1–2)",
      "title": "string",
      "description": "string",
      "contact": "string or null"
    }}
  ]
}}

Rules:
- Exactly 3 career_paths
- Exactly 4–5 support_resources  
- Exactly 8 action_plan steps
- All organizations must be real and based in Montgomery, AL
- If prior_conviction=true, at least one career path must be explicitly Ban the Box friendly
- If has_vehicle=false, all job locations must be on MATS bus routes
- Be direct — this person needs real information, not motivation posters"""


async def get_navigator_plan(
    request: NavigatorRequest,
    gemini_key: str | None = None,
    brightdata_token: str | None = None,
) -> NavigatorResponse:
    logger.info(f"Navigator request: career={request.career_interest}, zip={request.zip_code}")

    # Step 1: Real-time web context (uses user's Bright Data token if provided)
    web_context = await gather_montgomery_context(
        career_interest=request.career_interest.value,
        has_vehicle=request.has_vehicle,
        prior_conviction=request.prior_conviction,
        brightdata_token=brightdata_token,
    )
    web_context = _truncate_web_context(web_context)

    # Step 2 & 3: Build prompt and call AI (uses user's Gemini key if provided)
    user_prompt = _build_user_prompt(request, web_context)
    raw_data = await generate_json(SYSTEM_PROMPT, user_prompt, gemini_key=gemini_key)

    return NavigatorResponse(**raw_data)