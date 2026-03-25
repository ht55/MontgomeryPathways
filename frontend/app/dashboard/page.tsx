// frontend/app/dashboard/page.tsx

"use client"
import { useState } from "react"
import { AppSidebar }    from "@/layout/AppSidebar"
import { GaugePanel }    from "@/components/dashboard/GaugePanel"
import { MetricsColumn } from "@/components/dashboard/MetricsColumn"
import { PolicyBrief }   from "@/components/dashboard/PolicyBrief"
import { useSimulation }  from "@/hooks/useSimulation"
import { usePolicyBrief } from "@/hooks/usePolicyBrief"
import { useApiKeys }     from "@/hooks/useApiKeys"
import { ApiKeysModal }   from "@/components/ui/ApiKeysModal"
import { HORIZONS }      from "@/types/simulation"
import "@/styles/components/dashboard.css"
import "@/styles/components/gauge.css"
import "@/styles/components/metrics.css"
import "@/styles/components/policy-brief.css"
import "@/styles/components/sidebar.css"

export default function DashboardPage() {
  const { inputs, setInputs, horizon, setHorizon, result } = useSimulation()
  const { summary, loading, generate } = usePolicyBrief(inputs, result, horizon)
  const { keys, saveKeys } = useApiKeys()
  const [showKeyModal, setShowKeyModal] = useState(false)

  const handleGenerate = () => {
    if (!keys.geminiKey) { setShowKeyModal(true); return }
    generate(keys.geminiKey)
  }

  return (
    <div className="dashboard">
      <AppSidebar activePage="dashboard" />
      <main className="dashboard__main">
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

        <div className="dashboard__core">
          <div className="dashboard__left">
            <GaugePanel inputs={inputs} onChange={setInputs} />
            <PolicyBrief summary={summary} loading={loading} horizon={horizon} onGenerate={handleGenerate} />
          </div>
          <MetricsColumn result={result} horizon={horizon} />
        </div>
      </main>

      {showKeyModal && (
        <ApiKeysModal
          onSave={(g, b) => { saveKeys(g, b); setShowKeyModal(false); generate(g) }}
          onClose={() => setShowKeyModal(false)}
        />
      )}
    </div>
  )
}
