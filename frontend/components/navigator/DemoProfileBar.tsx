// frontend/components/navigator/DemoProfileBar.tsx

"use client"
import { useState } from "react"
import { DEMO_PROFILES, type DemoProfile } from "@/lib/demo-profiles"
import type { NavigatorRequest } from "@/hooks/useNavigator"
import "@/styles/components/demo-bar.css"

type Props = {
  onSelect: (profile: NavigatorRequest, id: string) => void
  activeId?: string
  loading?: boolean
}

export function DemoProfileBar({ onSelect, activeId, loading }: Props) {
  const [dismissed, setDismissed] = useState(false)
  if (loading) return null

  const active = DEMO_PROFILES.find(d => d.id === activeId)

  if (activeId && active) {
    return (
      <div className="demo-pill">
        <span className="demo-pill__emoji">{active.emoji}</span>
        <span className="demo-pill__label">{active.label}</span>
        <button className="demo-pill__close" onClick={() => onSelect(active.profile, "")}>✕</button>
      </div>
    )
  }

  if (dismissed) return null

  return (
    <div className="demo-float">
      <div className="demo-float__mode">✦ Demo Mode</div>
      <p className="demo-float__desc">
        Select a profile below and hit<br />
        <strong>Find My Opportunities</strong> to see it in action
      </p>
      <div className="demo-float__list">
        {DEMO_PROFILES.map((demo: DemoProfile) => (
          <button key={demo.id} className="demo-float__btn" onClick={() => onSelect(demo.profile, demo.id)}>
            <span className="demo-float__emoji">{demo.emoji}</span>
            <div>
              <div className="demo-float__name">{demo.label}</div>
              <div className="demo-float__tag">{demo.tagline}</div>
            </div>
          </button>
        ))}
      </div>
      <button className="demo-float__skip" onClick={() => setDismissed(true)}>Skip / Close</button>
    </div>
  )
}