// frontend/components/dashboard/PolicyBrief.tsx

"use client"

import type { TimeHorizon } from "@/types/simulation.ts"
import "@/styles/components/policy-brief.css"

type Props = {
  summary: string
  loading: boolean
  horizon: TimeHorizon
  onGenerate: () => void
}

/**
 * Executive Policy Brief panel.
 * Receives summary text and loading state — knows nothing about the API.
 */
export function PolicyBrief({ summary, loading, horizon, onGenerate }: Props) {
  return (
    <div className="policy-brief">
      <div className="policy-brief__header">
        <div>
          <h3 className="policy-brief__title">Executive Policy Brief</h3>
          <p className="policy-brief__subtitle">
            AI-generated · {horizon}-year horizon
          </p>
        </div>
        <button className="gen-btn" onClick={onGenerate} disabled={loading}>
          {loading ? <DotPulse /> : <><span className="gen-btn__icon">⚡</span><span className="gen-btn__label">Generate Brief</span></>}
          <span className="gen-btn__shimmer" />
        </button>
      </div>
      <div className="policy-brief__divider" />
      <div className={`policy-brief__body policy-brief__body--${summary ? "filled" : "empty"}`}>
        {loading
          ? "Analyzing policy parameters..."
          : summary || `Adjust the levers above and click "Generate Brief" to receive an AI-powered executive policy analysis for Montgomery's ${horizon}-year outlook.`
        }
      </div>
    </div>
  )
}

function DotPulse() {
  return (
    <span className="dot-pulse">
      <span className="dot-pulse__dot" />
      <span className="dot-pulse__dot" />
      <span className="dot-pulse__dot" />
    </span>
  )
}
