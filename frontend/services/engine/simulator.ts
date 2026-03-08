// frontend/services/engine/simulator.ts

import type { SimulationInput, SimulationOutput, TimeHorizon } from "@/types/simulation"
import {
  BASE_RECIDIVISM_RATE,
  TARGET_POPULATION,
  AVERAGE_INCARCERATION_COST,
  AVERAGE_ANNUAL_TAX,
  BASELINE_RETENTION_RATE,
  YOUNG_ADULT_POPULATION,
  AVG_HOUSEHOLD_SIZE,
  LIFETIME_TAX_CONTRIBUTION,
  CHILD_GENERATION_MULTIPLIER,
  EMPLOYMENT_CONVERSION_RATE,
} from "./simulation-constants"

// ── Time-horizon compounding multipliers ─────────────────────────────────────
// Unchanged from original — these are model parameters, not data constants
const HORIZON_MULTIPLIERS: Record<TimeHorizon, {
  cost: number
  population: number
  tax: number
  longterm: number
}> = {
   5: { cost: 1.0, population: 1.0, tax: 1.0,  longterm: 0.30 },
  10: { cost: 1.8, population: 1.6, tax: 2.2,  longterm: 0.65 },
  15: { cost: 2.6, population: 2.3, tax: 3.8,  longterm: 0.85 },
  20: { cost: 3.5, population: 3.0, tax: 5.8,  longterm: 1.00 },
}

/**
 * Core policy simulation engine.
 * Pure deterministic function — no side effects, no React dependencies.
 * All baseline constants are now sourced from real Montgomery open data.
 * See simulation-constants.ts for citations.
 */
export function runSimulation(
  input: SimulationInput,
  horizon: TimeHorizon,
): SimulationOutput {
  const hm = HORIZON_MULTIPLIERS[horizon]

  // Normalize sliders to 0–1
  const training  = input.trainingIncrease / 100
  const employer  = input.employerIncentiveIncrease / 100
  const transport = input.transportSupportIncrease / 100
  const safety    = input.safetyImprovement / 100
  const housing   = input.affordableHousing / 100
  const school    = input.schoolQuality / 100

  // Recidivism — employer incentive weighted highest (0.20)
  const recidivismReduction = Math.min(
    0.15 * training + 0.20 * employer + 0.10 * transport,
    0.45, // hard cap
  )
  const projectedRecidivismRate = BASE_RECIDIVISM_RATE * (1 - recidivismReduction)
  const avoidedCases = (BASE_RECIDIVISM_RATE - projectedRecidivismRate) * TARGET_POPULATION

  // Fiscal outcomes
  const costSaved         = avoidedCases * AVERAGE_INCARCERATION_COST * horizon * hm.cost
  const additionalWorkers = avoidedCases * EMPLOYMENT_CONVERSION_RATE
  const taxRevenueGain    = additionalWorkers * AVERAGE_ANNUAL_TAX * horizon * hm.tax

  // Opportunity gap index (0–60)
  const opportunityGapReduction = Math.min(
    (0.5 * training + 0.3 * employer + 0.2 * transport) * 100,
    60,
  )

  // Youth retention — housing weighted highest (0.40)
  const retentionBoost = 0.35 * safety + 0.40 * housing + 0.25 * school
  const youngAdultRetentionRate = Math.min(
    BASELINE_RETENTION_RATE * (1 + retentionBoost),
    0.85,
  )
  const additionalRetained     = (youngAdultRetentionRate - BASELINE_RETENTION_RATE) * YOUNG_ADULT_POPULATION * hm.population
  const householdFormationRate = Math.round(additionalRetained / AVG_HOUSEHOLD_SIZE)
  const longTermTaxBaseGrowth  = additionalRetained * LIFETIME_TAX_CONTRIBUTION * CHILD_GENERATION_MULTIPLIER * hm.longterm

  const netROI = costSaved + taxRevenueGain + longTermTaxBaseGrowth

  return {
    projectedRecidivismRate,
    costSaved,
    taxRevenueGain,
    opportunityGapReduction,
    youngAdultRetentionRate,
    householdFormationRate,
    longTermTaxBaseGrowth,
    netROI,
  }
}
