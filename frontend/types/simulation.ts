export type SimulationInput = {
  trainingIncrease: number          // 0–30 (%)
  employerIncentiveIncrease: number // 0–30 (%)
  transportSupportIncrease: number  // 0–30 (%)
  safetyImprovement: number         // 0–30 (%)
  affordableHousing: number         // 0–30 (%)
  schoolQuality: number             // 0–30 (%)
}

export type SimulationOutput = {
  projectedRecidivismRate: number   // 0–1
  costSaved: number                 // dollars
  taxRevenueGain: number            // dollars
  opportunityGapReduction: number   // 0–60 (index %)
  youngAdultRetentionRate: number   // 0–1
  householdFormationRate: number    // count
  longTermTaxBaseGrowth: number     // dollars
  netROI: number                    // dollars
}

export type TimeHorizon = 5 | 10 | 15 | 20

export const DEFAULT_INPUTS: SimulationInput = {
  trainingIncrease: 10,
  employerIncentiveIncrease: 10,
  transportSupportIncrease: 10,
  safetyImprovement: 10,
  affordableHousing: 10,
  schoolQuality: 10,
}

export const HORIZONS: TimeHorizon[] = [5, 10, 15, 20]
