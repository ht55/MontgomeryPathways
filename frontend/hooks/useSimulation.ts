"use client"

import { useState, useMemo } from "react"
import { runSimulation } from "@/services/engine/simulator"
import {
  DEFAULT_INPUTS,
  type SimulationInput,
  type SimulationOutput,
  type TimeHorizon,
} from "@/types/simulation"

type UseSimulationReturn = {
  inputs: SimulationInput
  setInputs: (patch: Partial<SimulationInput>) => void
  horizon: TimeHorizon
  setHorizon: (h: TimeHorizon) => void
  result: SimulationOutput
}

/**
 * Encapsulates all simulation state and memoized calculation.
 * page.tsx becomes unaware of how the math works.
 */
export function useSimulation(): UseSimulationReturn {
  const [inputs, setInputsRaw] = useState<SimulationInput>(DEFAULT_INPUTS)
  const [horizon, setHorizon]  = useState<TimeHorizon>(10)

  // Partial update — callers only pass the key they changed
  const setInputs = (patch: Partial<SimulationInput>) =>
    setInputsRaw(prev => ({ ...prev, ...patch }))

  const result = useMemo(
    () => runSimulation(inputs, horizon),
    [inputs, horizon],
  )

  return { inputs, setInputs, horizon, setHorizon, result }
}
