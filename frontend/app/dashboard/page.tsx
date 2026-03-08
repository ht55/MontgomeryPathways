// frontend/app/dashboard/page.tsx

"use client"

import { AppSidebar }    from "@/layout/AppSidebar"
import { GaugePanel }    from "@/components/dashboard/GaugePanel"
import { MetricsColumn } from "@/components/dashboard/MetricsColumn"
import { PolicyBrief }   from "@/components/dashboard/PolicyBrief"
import { useSimulation }  from "@/hooks/useSimulation"
import { usePolicyBrief } from "@/hooks/usePolicyBrief"
import { HORIZONS }      from "@/types/simulation"

import "@/styles/components/dashboard.css"
import "@/styles/components/gauge.css"
import "@/styles/components/metrics.css"
import "@/styles/components/policy-brief.css"
import "@/styles/components/sidebar.css"

/**
 * Dashboard page — orchestration only.
 * No business logic. No inline styles. No API calls.
 * If this file grows beyond ~60 lines, something is in the wrong place.
 */
export default function DashboardPage() {
  const { inputs, setInputs, horizon, setHorizon, result } = useSimulation()
  const { summary, loading, generate } = usePolicyBrief(inputs, result, horizon)

  return (
    <div className="dashboard">
      <AppSidebar activePage="dashboard" />

      <main className="dashboard__main">

        {/* Header */}
        <div className="dashboard__header">
          <div>
            <h2 className="dashboard__title">Policy Simulation Dashboard</h2>
            <p className="dashboard__subtitle">
              Adjust levers · Forecast outcomes · Generate AI policy brief
            </p>
          </div>

          <div className="horizon-selector">
            <span className="horizon-selector__label">Time Horizon</span>
              <div className="horizon-selector__buttons">
                {HORIZONS.map(h => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    className={`horizon-btn${horizon === h ? " horizon-btn--active" : ""}`}
                  >
                    {h}yr
                  </button>
                ))}
              </div>
          </div>
        </div>

        {/* Core layout */}
        <div className="dashboard__core">
          <div className="dashboard__left">
            <GaugePanel inputs={inputs} onChange={setInputs} />
            <PolicyBrief summary={summary} loading={loading} horizon={horizon} onGenerate={generate} />
          </div>
          <MetricsColumn result={result} horizon={horizon} />
        </div>

      </main>
    </div>
  )
}
