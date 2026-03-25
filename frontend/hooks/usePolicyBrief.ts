"use client"
import { useState } from "react"
import type { SimulationInput, SimulationOutput, TimeHorizon } from "@/types/simulation"

type UsePolicyBriefReturn = {
  summary: string; loading: boolean
  generate: (geminiKey: string) => Promise<void>
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export function usePolicyBrief(
  inputs: SimulationInput, result: SimulationOutput, horizon: TimeHorizon,
): UsePolicyBriefReturn {
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)

  const generate = async (geminiKey: string) => {
    if (loading) return
    setLoading(true); setSummary("")
    try {
      const res = await fetch(`${API_BASE}/api/generate-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Gemini-Key": geminiKey },
        body: JSON.stringify({
          trainingIncrease:          inputs.trainingIncrease,
          employerIncentiveIncrease: inputs.employerIncentiveIncrease,
          transportSupportIncrease:  inputs.transportSupportIncrease,
          safetyImprovement:         inputs.safetyImprovement,
          affordableHousing:         inputs.affordableHousing,
          schoolQuality:             inputs.schoolQuality,
          horizon,
          projectedRecidivismRate:   result.projectedRecidivismRate,
          costSaved:                 result.costSaved,
          taxRevenueGain:            result.taxRevenueGain,
          opportunityGapReduction:   result.opportunityGapReduction,
          youngAdultRetentionRate:   result.youngAdultRetentionRate,
          householdFormationRate:    result.householdFormationRate,
          longTermTaxBaseGrowth:     result.longTermTaxBaseGrowth,
          netROI:                    result.netROI,
        }),
      })
      if (res.status === 429) { setSummary("⚠️ Request limit reached."); return }
      if (res.status === 401) { setSummary("⚠️ Invalid Gemini API key. Please check your key in settings."); return }
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      setSummary(data.brief ?? "No response.")
    } catch (e) {
      setSummary("Connection error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return { summary, loading, generate }
}