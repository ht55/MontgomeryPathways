// frontend/components/dashboard/GaugePanel.tsx

"use client"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { CircularGauge } from "@/components/ui/CircularGauge"
import type { SimulationInput } from "@/types/simulation"
import "@/styles/components/gauge.css"
import "@/styles/components/gauge-tooltip.css"

type Props = {
  inputs: SimulationInput
  onChange: (patch: Partial<SimulationInput>) => void
}

const REENTRY_GAUGES: { label: string; key: keyof SimulationInput; tooltip: string }[] = [
  { label: "Training Investment",  key: "trainingIncrease",          tooltip: "% increase in job training budget — funds AIDT vocational programs and reentry workforce skills" },
  { label: "Employer Incentives",  key: "employerIncentiveIncrease", tooltip: "% of employers enrolled in fair-chance hiring — tax credits for hiring people with criminal records" },
  { label: "Transport Support",    key: "transportSupportIncrease",  tooltip: "% increase in transit coverage — expanded MATS bus routes connecting residents to job centers" },
]

const LONGTERM_GAUGES: { label: string; key: keyof SimulationInput; tooltip: string }[] = [
  { label: "Safety Improvement",  key: "safetyImprovement", tooltip: "% reduction in crime incidents — community policing, lighting, and neighborhood investment" },
  { label: "Affordable Housing",  key: "affordableHousing", tooltip: "% increase in affordable units — new construction permits and rent assistance programs" },
  { label: "School Quality",      key: "schoolQuality",     tooltip: "% improvement in school ratings — drives youth retention and attracts families to Montgomery" },
]

export function GaugePanel({ inputs, onChange }: Props) {
  return (
    <div className="gauge-panel">
      <GaugeRow variant="reentry" tag="Reentry" subtitle="Criminal Justice Reform"
        gauges={REENTRY_GAUGES} inputs={inputs} onChange={onChange} />
      <div className="gauge-panel__divider" />
      <GaugeRow variant="longterm" tag="Long-term" subtitle="Youth & Community Investment"
        gauges={LONGTERM_GAUGES} inputs={inputs} onChange={onChange} />
    </div>
  )
}

type GaugeRowProps = {
  variant: "reentry" | "longterm"
  tag: string
  subtitle: string
  gauges: { label: string; key: keyof SimulationInput; tooltip: string }[]
  inputs: SimulationInput
  onChange: (patch: Partial<SimulationInput>) => void
}

function GaugeRow({ variant, tag, subtitle, gauges, inputs, onChange }: GaugeRowProps) {
  return (
    <div>
      <div className="gauge-row__header">
        <span className={`tag tag--${variant}`}>{tag}</span>
        <span className="gauge-row__subtitle">{subtitle}</span>
        <span className={`gauge-row__header-line gauge-row__header-line--${variant}`} />
      </div>
      <div className="gauge-grid">
        {gauges.map(({ label, key, tooltip }) => (
          <GaugeCard key={key} label={label} tooltip={tooltip}
            value={inputs[key] as number}
            onChange={v => onChange({ [key]: v })}
            variant={variant} />
        ))}
      </div>
    </div>
  )
}

// ── GaugeCard with click-to-open portal tooltip ───────────────
function GaugeCard({ label, tooltip, value, onChange, variant }: {
  label: string; tooltip: string; value: number
  onChange: (v: number) => void; variant: "reentry" | "longterm"
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState({ x: 0, y: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [open])

  const handleClick = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ x: rect.left, y: rect.bottom + 8 })
    }
    setOpen(o => !o)
  }

  return (
    <div className="gauge-card">
      <h4 className="gauge-card__label">
        {label}
        <button ref={btnRef} className="gauge-info-btn" onClick={handleClick} aria-label="More info">
          {/* Circle question mark SVG */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
      </h4>

      <CircularGauge label="" value={value} onChange={onChange} variant={variant} />

      {/* Portal — renders outside all parent overflow/z-index stacking contexts */}
      {open && typeof document !== "undefined" && createPortal(
        <div className="gauge-portal-tooltip" style={{ left: pos.x, top: pos.y }}>
          {tooltip}
        </div>,
        document.body
      )}
    </div>
  )
}
