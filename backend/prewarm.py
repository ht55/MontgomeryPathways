#!/usr/bin/env python3
"""
prewarm.py
----------
Run this 30 minutes before judging starts.
Pre-warms the Bright Data cache with the most common demo combinations
so the first run for each judge is instant.

Usage:
  cd backend
  python prewarm.py                          # uses localhost:8000
  python prewarm.py https://your.railway.app # uses production
"""
import asyncio
import httpx
import sys

BASE_URL = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://localhost:8000"

# Most likely combos a judge will try
PROFILES = [
    {
        "label": "Marcus — Reentry, Trades, No vehicle",
        "age": 34, "zip_code": "36104",
        "education": "high_school", "income_bracket": "0",
        "career_interest": "construction",
        "has_vehicle": False, "prior_conviction": True,
        "conviction_type": "non-violent drug offense",
    },
    {
        "label": "Diane — Healthcare, Single parent",
        "age": 42, "zip_code": "36116",
        "education": "some_college", "income_bracket": "under_10k",
        "career_interest": "healthcare",
        "has_vehicle": True, "prior_conviction": False,
    },
    {
        "label": "Jordan — Tech, Recent grad",
        "age": 26, "zip_code": "36117",
        "education": "bachelors", "income_bracket": "under_20k",
        "career_interest": "technology",
        "has_vehicle": True, "prior_conviction": False,
    },
    {
        "label": "Extra — Logistics, No vehicle",
        "age": 29, "zip_code": "36104",
        "education": "ged", "income_bracket": "0",
        "career_interest": "logistics",
        "has_vehicle": False, "prior_conviction": False,
    },
    {
        "label": "Extra — Manufacturing, Prior conviction",
        "age": 38, "zip_code": "36110",
        "education": "high_school", "income_bracket": "under_10k",
        "career_interest": "manufacturing",
        "has_vehicle": True, "prior_conviction": True,
        "conviction_type": "felony",
    },
]

async def prewarm():
    print(f"🚀 Pre-warming cache at {BASE_URL}\n")
    async with httpx.AsyncClient(timeout=60.0) as client:
        for p in PROFILES:
            label = p.pop("label")
            print(f"  ⏳ {label}...")
            try:
                res = await client.post(f"{BASE_URL}/api/navigator", json=p)
                if res.status_code == 200:
                    print(f"  ✅ Cached!")
                else:
                    print(f"  ⚠️  Status {res.status_code}: {res.text[:100]}")
            except Exception as e:
                print(f"  ❌ Failed: {e}")
            # Small delay to avoid hammering
            await asyncio.sleep(2)

    print(f"\n✅ Pre-warm complete — all {len(PROFILES)} profiles cached for 3 hours")
    print("🎯 First demo run for each judge will be instant!")

asyncio.run(prewarm())