// frontend/lib/demo-profiles.ts
//
// Three sample profiles for hackathon demos.
// Each showcases a different aspect of the Navigator system.
// Import and use in the Navigator page as quick-fill buttons.

import type { NavigatorRequest } from "@/hooks/useNavigator"

export interface DemoProfile {
  id: string
  label: string          
  emoji: string
  tagline: string        
  profile: NavigatorRequest
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "reentry",
    label: "Marcus, 34",
    emoji: "🔄",
    tagline: "Recently released · No vehicle · Trades interest",
    profile: {
      age: 34,
      zip_code: "36104",                        
      education: "ged",
      income_bracket: "0",
      career_interest: "trades",
      has_vehicle: false,
      prior_conviction: true,
      conviction_type: "non-violent drug offense",
    },
  },
  {
    id: "workforce",
    label: "Diane, 42",
    emoji: "💼",
    tagline: "Single parent · Stable job seeker · Healthcare interest",
    profile: {
      age: 42,
      zip_code: "36116",                        
      education: "some_college",
      income_bracket: "under_10k",
      career_interest: "healthcare",
      has_vehicle: true,
      prior_conviction: false,
      conviction_type: undefined,
    },
  },
  {
    id: "retention",
    label: "Jordan, 24",
    emoji: "🎓",
    tagline: "Recent grad · Considering leaving Montgomery · Tech interest",
    profile: {
      age: 24,
      zip_code: "36117",                      
      education: "bachelors",
      income_bracket: "under_35k",
      career_interest: "technology",
      has_vehicle: true,
      prior_conviction: false,
      conviction_type: undefined,
    },
  },
]
