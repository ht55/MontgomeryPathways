"use client"
import { useState } from "react"

export type EducationLevel =
  | "no_diploma" | "ged" | "high_school"
  | "some_college" | "associates"
  | "bachelors" | "masters" | "doctoral"

export type IncomeBracket =
  | "0" | "under_10k" | "under_20k" | "under_35k"
  | "under_50k" | "under_75k" | "above_75k"

export type CareerInterest =
  | "construction" | "healthcare" | "technology" | "logistics"
  | "food_service" | "retail" | "manufacturing" | "education" | "trades"

export type NavigatorRequest = {
  age:              number
  zip_code:         string
  education:        EducationLevel
  income_bracket:   IncomeBracket
  career_interest:  CareerInterest
  has_vehicle:      boolean
  prior_conviction: boolean
  conviction_type?: string
}

export type TrainingStep = {
  step: number; description: string; duration: string; provider: string; cost: string
}

export type CareerPath = {
  title: string; salary_range: string; time_to_employment: string
  demand_level: string; training_steps: TrainingStep[]
  recidivism_reduction: string; city_savings: string
}

export type SupportResource = {
  name: string; type: string; phone: string; address: string; hours: string; relevance: string
}

export type ActionStep = {
  week: string; title: string; description: string; contact?: string | null
}

export type NavigatorResponse = {
  career_paths: CareerPath[]; support_resources: SupportResource[]; action_plan: ActionStep[]
}

const API_BASE = ""

type UseNavigatorReturn = {
  result:   NavigatorResponse | null
  loading:  boolean
  error:    string | null
  generate: (request: NavigatorRequest, geminiKey: string, brightdataToken?: string) => Promise<void>
}

export function useNavigator(): UseNavigatorReturn {
  const [result,  setResult]  = useState<NavigatorResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const generate = async (request: NavigatorRequest, geminiKey: string, brightdataToken?: string) => {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch(`${API_BASE}/api/navigator`, {
        method: "POST",
        headers: {
          "Content-Type":    "application/json",
          "X-Gemini-Key":    geminiKey,

          ...(brightdataToken ? { "X-Brightdata-Token": brightdataToken } : {}),
        },
        body: JSON.stringify(request),
      })

      if (res.status === 429) throw new Error("⚠️ Request limit reached.")
      if (res.status === 401) throw new Error("⚠️ Invalid Gemini API key. Please check your key in settings.")
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }))
        throw new Error(err.detail ?? `HTTP ${res.status}`)
      }
      setResult(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return { result, loading, error, generate }
}