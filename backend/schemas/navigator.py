"""
schemas/navigator.py
--------------------
Pydantic models for the Resident Navigator feature.
These are the single source of truth for request/response shapes.
The frontend TypeScript types in types/navigator.ts should mirror these exactly.
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

# ── Enums ─────────────────────────────────────────────────────

class EducationLevel(str, Enum):
    NO_DIPLOMA   = "no_diploma"
    GED          = "ged"
    HIGH_SCHOOL  = "high_school"
    SOME_COLLEGE = "some_college"
    ASSOCIATES   = "associates"
    BACHELORS    = "bachelors"
    MASTERS      = "masters"
    DOCTORAL     = "doctoral"

class IncomeBracket(str, Enum):
    ZERO          = "0"           
    UNDER_10K     = "under_10k"   
    UNDER_20K     = "under_20k"  
    UNDER_35K     = "under_35k"   
    UNDER_50K     = "under_50k"   
    UNDER_75K     = "under_75k"   
    ABOVE_75K     = "above_75k" 

class CareerInterest(str, Enum):
    CONSTRUCTION  = "construction"
    HEALTHCARE    = "healthcare"
    TECHNOLOGY    = "technology"
    LOGISTICS     = "logistics"
    FOOD_SERVICE  = "food_service"
    RETAIL        = "retail"
    MANUFACTURING = "manufacturing"
    EDUCATION     = "education"
    TRADES        = "trades"

# ── Request ───────────────────────────────────────────────────

class NavigatorRequest(BaseModel):
    age:              int              = Field(..., ge=16, le=75)
    zip_code:         str              = Field(..., min_length=5, max_length=5)
    education:        EducationLevel
    income_bracket:   IncomeBracket
    career_interest:  CareerInterest
    has_vehicle:      bool
    prior_conviction: bool
    conviction_type:  Optional[str]   = None   # only sent if prior_conviction=True

# ── Response shapes ───────────────────────────────────────────

class TrainingStep(BaseModel):
    step:        int
    description: str
    duration:    str      # e.g. "3 weeks"
    provider:    str      # e.g. "Lawson State Community College"
    cost:        str      # e.g. "Free (Pell Grant eligible)"

class CareerPath(BaseModel):
    title:               str
    salary_range:        str    # e.g. "$18–$24/hr"
    time_to_employment:  str    # e.g. "6–8 weeks"
    demand_level:        str    # "High" | "Medium" | "Growing"
    training_steps:      list[TrainingStep]
    recidivism_reduction: str   # e.g. "↓ 34%"
    city_savings:        str    # e.g. "$28K/yr in avoided costs"

class SupportResource(BaseModel):
    name:      str
    type:      str    # e.g. "Workforce Development"
    phone:     str
    address:   str
    hours:     str
    relevance: str    # why this resource is relevant to this specific person

class ActionStep(BaseModel):
    week:        str   # e.g. "Week 1–2"
    title:       str
    description: str
    contact:     Optional[str] = None

class NavigatorResponse(BaseModel):
    career_paths:      list[CareerPath]      # always 3
    support_resources: list[SupportResource] # always 4–5
    action_plan:       list[ActionStep]      # always 8 steps
