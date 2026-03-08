// frontend/components/dashboard/MetricsColumn.tsx

import { fmtDollars, fmtPercent } from "@/lib/format"
import type { SimulationOutput, TimeHorizon } from "@/types/simulation"
import "@/styles/components/metrics.css"

type Props = {
  result: SimulationOutput
  horizon: TimeHorizon
}

type MetricVariant = "reentry" | "longterm" | "gold"

type MetricDef = {
  label: string
  value: string
  sub: string
  variant: MetricVariant
  fill?: number
}

/**
 * Right-column: 8 outcome metrics grouped by Reentry / Long-term.
 * Read-only — receives pre-calculated result, formats for display only.
 */
export function MetricsColumn({ result, horizon }: Props) {
  const reentryMetrics: MetricDef[] = [
    { label: "Recidivism Rate",   value: fmtPercent(result.projectedRecidivismRate * 100), sub: "↓ from 32.0%",         variant: "reentry",  fill: result.projectedRecidivismRate },
    { label: "Cost Saved",        value: fmtDollars(result.costSaved),                     sub: "avoided incarceration", variant: "reentry"  },
    { label: "Tax Revenue Gain",  value: fmtDollars(result.taxRevenueGain),                sub: "from employment",       variant: "reentry"  },
    { label: "Opportunity Gap ↓", value: fmtPercent(result.opportunityGapReduction),       sub: "index improvement",     variant: "reentry",  fill: result.opportunityGapReduction / 100 },
  ]

  const longtermMetrics: MetricDef[] = [
    { label: "Youth Retention", value: fmtPercent(result.youngAdultRetentionRate * 100), sub: "ages 25–35 staying",    variant: "longterm", fill: result.youngAdultRetentionRate },
    { label: "New Households",  value: result.householdFormationRate.toLocaleString(),   sub: "families retained",     variant: "longterm" },
    { label: "Tax Base Growth", value: fmtDollars(result.longTermTaxBaseGrowth),         sub: "lifetime contribution", variant: "longterm" },
    { label: "Net City ROI",    value: fmtDollars(result.netROI),                        sub: "total projected return",variant: "gold"     },
  ]

  return (
    <div className="metrics-column">
      <GroupLabel label={`Reentry · ${horizon}yr`} variant="reentry" />
      {reentryMetrics.map((m, i) => <MetricTile key={m.label} {...m} index={i} />)}
      <GroupLabel label={`Long-term · ${horizon}yr`} variant="longterm" />
      {longtermMetrics.map((m, i) => <MetricTile key={m.label} {...m} index={i} />)}
    </div>
  )
}

// ── Private sub-components ────────────────────────────────────

function GroupLabel({ label, variant }: { label: string; variant: "reentry" | "longterm" }) {
  return (
    <div className={`metrics-column__group-label metrics-column__group-label--${variant}`}>
      <span className="metrics-column__group-label-dot" />
      <span className="metrics-column__group-label-text">{label}</span>
      <span className="metrics-column__group-label-line" />
    </div>
  )
}

function MetricTile({ label, value, sub, variant, fill, index }: MetricDef & { index: number }) {
  return (
    <div
      className={`metric-tile metric-tile--${variant}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="metric-tile__header">
        <span className="metric-tile__label">{label}</span>
        <span className="metric-tile__sub">{sub}</span>
      </div>
      <span className={`metric-tile__value metric-tile__value--${variant}`}>{value}</span>
      {fill !== undefined && (
        <div className="metric-tile__bar-track">
          <div
            className={`metric-tile__bar-fill metric-tile__bar-fill--${variant}`}
            style={{ width: `${Math.min(fill * 100, 100)}%` }}
          />
        </div>
      )}
      <span className={`metric-tile__corner metric-tile__corner--${variant}`} />
    </div>
  )
}
