"use client"
import { useState } from "react"
import type { SimulationInput, SimulationOutput, TimeHorizon } from "@/types/simulation"

type UsePolicyBriefReturn = {
  summary: string
  loading: boolean
  generate: () => Promise<void>
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

const RATE_LIMIT_MSG =
  "⚠️ Request limit reached (10/hour). " +
  "Please contact hirokotakano525@gmail.com and I'll restore access immediately. 🙏"

export function usePolicyBrief(
  inputs: SimulationInput,
  result: SimulationOutput,
  horizon: TimeHorizon,
): UsePolicyBriefReturn {
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (loading) return
    setLoading(true)
    setSummary("")
    try {
      const res = await fetch(`${API_BASE}/api/generate-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      if (res.status === 429) { setSummary(RATE_LIMIT_MSG); return }
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      setSummary(data.brief ?? "No response.")
    } catch (e) {
      setSummary("Connection error. Please try again.")
      console.error("[usePolicyBrief]", e)
    } finally {
      setLoading(false)
    }
  }

  return { summary, loading, generate }
}
