<p align="left">
  <img src="simulator.png" height="150" alt="App Screenshot 1" />
  <img src="navigator.png" height="150" alt="App Screenshot 2" />
</p>

# 🏙️ Montgomery Pathways
### AI-Powered Policy Simulation & Resident Opportunity Platform

> *"Cities grow. And when they do, some people move forward — and some get left further behind.*
> *Montgomery Pathways exists to close that gap, from both sides at once."*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-montgomery.ht55.dev-orange)](https://montgomery.ht55.dev/dashboard)

---

## Why This Exists

When Meta announced its $800M data center in Montgomery, Alabama, the city entered a new era of growth. But rapid economic development has a shadow side — it tends to leave behind the people who need opportunity most: formerly incarcerated residents, low-income families, young adults without clear career paths.

Montgomery already has a 32% recidivism rate, 17% poverty rate, and one of the highest youth out-migration rates in the South. The question isn't whether the city will grow — it's *who* that growth will include.

Montgomery Pathways is built to answer that question with data, not guesswork.

---

## What It Does

Two tools. One mission.

### 🎛️ City Intelligence Simulator (`/dashboard`)
A real-time policy simulation engine for city planners and decision-makers.

Adjust 6 policy levers — Training Investment, Employer Incentives, Transport Support, Safety Improvement, Affordable Housing, School Quality — across 5–20 year horizons and watch the projected outcomes update instantly:

- Recidivism Rate reduction
- Incarceration Cost Savings
- Tax Revenue Gain
- Opportunity Gap reduction
- Youth Retention Rate
- New Households formed
- Long-term Tax Base Growth
- Net City ROI

Hit **Generate Brief** and receive a Gemini-powered executive policy brief grounded in the simulation data — ready for a city council presentation.

### 🧭 Resident Navigator (`/navigator`)
A personalized opportunity planner for Montgomery residents — and for the case workers and social workers who support them.

Enter a resident profile: age, ZIP, education, income, career interest, transportation access, and prior conviction status — and receive:

- 2–3 tailored career pathways with real wage data and realistic timelines
- Real local support resources scraped live from Montgomery orgs via Bright Data
- Conviction-aware: finds employers with **Ban-the-Box policies** in Montgomery
- A week-by-week **8-week action plan** with real phone numbers — not generic web links

**Three demo profiles are ready to go — no setup needed:**
- **Marcus, 34** — Recently released, no vehicle, skilled trades interest
- **Diane, 52** — Single parent, stable job seeker, healthcare
- **Jordan, 26** — Recent grad, considering leaving Montgomery, tech interest

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   DATA LAYER                        │
│  Bright Data Web Unlocker → brightdata.py           │
│  scrape-baselines.ts → simulation-constants.ts      │
│  (auto-generated from Census, BLS, HUD, AL DOC)     │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                   API LAYER                         │
│  FastAPI (Python) — deployed on Railway             │
│  routers/ → generate_brief.py, navigator.py         │
│  services/ → ai_provider.py, brightdata.py          │
│  File-based cache (30-day TTL)                      │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                   AI LAYER                          │
│  Gemini 2.5 Flash (user-supplied API key)           │
│  Context-rich prompts include live Montgomery data  │
│  Generates: Executive Policy Briefs                 │
│             8-week Resident Action Plans            │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                   UI LAYER                          │
│  Next.js — deployed on Vercel                       │
│  Custom CircularGauge UI (GaugePanel.tsx)           │
│  Real-time simulation hooks (useSimulation.ts)      │
│  Demo profile bar (DemoProfileBar.tsx)              │
└─────────────────────────────────────────────────────┘
```

---

## Simulation Engine

The dashboard simulation is not a black box. It's built on real data such as [City of Montgomery Open Data](https://opendata.montgomeryal.gov/) and many others:

| Variable | Value | Source |
|---|---|---|
| Population | 224,980 | U.S. Census ACS 2023 |
| Median Income | $60,739 | U.S. Census ACS 2023 |
| Poverty Rate | 17.0% | U.S. Census ACS 2023 |
| Recidivism Rate | 32% | Alabama DOC Annual Report 2023 |
| Incarceration Cost | $28,600/yr | Vera Institute |
| Youth Retention | 48% | IRS SOI Migration Data |
| Unemployment | 5.2% | BLS LAUS |
| Median 2BR Rent | $1,050 | HUD FMR 2024 |

All simulation math is deterministic and auditable in `frontend/services/engine/`.

---

## Running Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # add your GEMINI_API_KEY
uvicorn main:app --reload

# Frontend
cd frontend
npm install
cp .env.local.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

### Environment Variables

**Backend `.env`**
```
GEMINI_API_KEY=your_key
BRIGHTDATA_API_TOKEN=your_token  # optional — app uses cache without it
BRIGHTDATA_WEB_UNLOCKER_ZONE=unlocker1
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend `.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### (Optional) Refresh Bright Data cache
```bash
cd backend
python prewarm.py  # requires backend running on localhost:8000
```
Without a `BRIGHTDATA_API_TOKEN`, the app uses `data/cache.json` automatically.

### (Optional) Refresh scraped baselines
```bash
cd frontend
npx ts-node services/engine/scrape-baselines.ts
```

---

## Challenge Coverage

| Challenge Area | How It's Addressed |
|---|---|
| **Workforce & Economic Growth** | Navigator matches residents to careers + training pathways; Simulator quantifies workforce investment ROI |
| **Civic Access & Communication** | Plain-language AI briefs translate complex policy data for residents and officials alike |
| **Public Safety & Emergency Response** | Recidivism simulation models the public safety impact of upstream investment |
| **Smart Cities & Infrastructure** | Real-time data pipeline (Bright Data) + simulation engine = infrastructure for evidence-based governance |

---

## Commercialization Pathway

1. **Municipal SaaS** — License the City Intelligence Simulator to city governments ($15–40K/yr). Montgomery itself is the first potential customer.
2. **Workforce Development Grants** — The Resident Navigator qualifies for federal Second Chance Act funding and DOL workforce development grants.
3. **Replication** — The architecture is city-agnostic. Every city with a Census API and a Bright Data zone can run their own instance. Birmingham, Selma, and Mobile are natural next deployments.

---

## The Philosophy Behind This

Before writing a single line of code, I spent time researching Montgomery's real data, talking with mentors and residents. One question guided every design decision:

**How do you build a system that shows difficult truths — without crushing hope?**

The answer was two tools, intentionally in the same platform. Because the city and its residents are part of the same equation. Sustainable growth only works when both sides can see the full picture.

---

## Built By

**ht55** — Solo submission  
*GenAI Works WorldWide Vibe Hackathon 2026 — Sponsored by Bright Data*

---

*Built with care for Montgomery, Alabama — a city on the edge of something great.*