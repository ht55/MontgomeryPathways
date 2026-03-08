// frontend/layout/AppSidebar.tsx

import Link from "next/link"
import "@/styles/components/sidebar.css"

type Props = {
  activePage: "dashboard" | "navigator"
}

const MODE_LABELS = {
  dashboard: { label: "Simulation Mode",  desc: "Policy ROI Forecasting"      },
  navigator: { label: "Navigator Mode",   desc: "Resident Opportunity Engine"  },
} as const

/**
 * Shared sidebar — used by both dashboard and navigator pages.
 * Single source of truth for navigation chrome.
 */
export function AppSidebar({ activePage }: Props) {
  const mode = MODE_LABELS[activePage]

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__title">City of<br />Montgomery</div>
        <div className="sidebar__subtitle">Alabama · State Baseline</div>
        <div className="sidebar__mode-badge">
          <div className="sidebar__mode-label">{mode.label}</div>
          <div className="sidebar__mode-desc">{mode.desc}</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        <NavButton href="/dashboard" label="City Intelligence"  icon="🏙" active={activePage === "dashboard"} />
        <NavButton href="/navigator" label="Resident Navigator" icon="👤" active={activePage === "navigator"} />
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__footer-label">Data Source</div>
        <div className="sidebar__footer-text">
          Montgomery County<br />Alabama DOC · Census 2023<br />Meta Investment Forecast
        </div>
      </div>
    </aside>
  )
}

function NavButton({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  return (
    <Link href={href}>
      <button className={`sidebar__nav-btn${active ? " sidebar__nav-btn--active" : ""}`}>
        <span className="sidebar__nav-btn-icon">{icon}</span>
        <span className="sidebar__nav-btn-label">{label}</span>
        {active && <span className="sidebar__nav-btn-pip" />}
      </button>
    </Link>
  )
}
