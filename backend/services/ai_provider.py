"""
services/ai_provider.py
-----------------------
Abstract AI provider interface.
Current implementation: Gemini 3 Flash (free tier).
Future swap: change PROVIDER = "gemini" → "claude" and done.

Design principle: routers and other services never import google-genai directly.
All AI calls go through this module exclusively.
"""

import json
import logging
from google import genai
from config import get_settings

logger = logging.getLogger(__name__)


def _get_client(gemini_key: str | None = None) -> genai.Client:
    settings = get_settings()
    key = gemini_key or settings.gemini_api_key
    return genai.Client(api_key=key)


async def generate_json(system_prompt: str, user_prompt: str, gemini_key: str | None = None) -> dict:
    """
    Call the AI model and return parsed JSON.
    Instructs the model to return only valid JSON — no markdown fences.

    Raises:
        ValueError: if the model returns unparseable JSON.
        Exception: on API errors (let the router handle HTTP response codes).
    """
    settings = get_settings()
    client = _get_client(gemini_key)

    full_prompt = f"""{system_prompt}

CRITICAL: Respond with valid JSON only. No markdown fences, no preamble, no explanation.

{user_prompt}"""

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=full_prompt,
    )

    raw = response.text.strip()

    # Strip accidental markdown fences if model disobeys
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error(f"AI returned invalid JSON: {e}\nRaw response:\n{raw[:500]}")
        raise ValueError(f"AI returned invalid JSON: {e}")
