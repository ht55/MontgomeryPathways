// frontend/app/navigator/page.tsx

"use client"

import { useState } from "react"
import { AppSidebar } from "@/layout/AppSidebar"
import { useNavigator } from "@/hooks/useNavigator"
import { DemoProfileBar } from "@/components/navigator/DemoProfileBar"
import type {
  NavigatorRequest,
  NavigatorResponse,
  CareerPath,
  SupportResource,
  ActionStep,
} from "@/hooks/useNavigator"

import "@/styles/components/navigator.css"

// ── Constants ─────────────────────────────────────────────────
const EDUCATION_OPTIONS = [
  { value: "no_diploma",    label: "No High School Diploma"   },
  { value: "ged",           label: "High School / GED"        },
  { value: "high_school",   label: "High School Diploma"      },
  { value: "some_college",  label: "Some College"             },
  { value: "associates",    label: "Associate's Degree"       },
  { value: "bachelors",     label: "Bachelor's Degree"        },
  { value: "masters",       label: "Master's Degree"          },
  { value: "doctoral",      label: "Doctoral Degree+"         },
] as const

const INCOME_OPTIONS = [
  { value: "0",          label: "No income"              },
  { value: "under_10k",  label: "Under $10,000 / yr"     },
  { value: "under_20k",  label: "$10,000–$20,000 / yr"   },
  { value: "under_35k",  label: "$20,000–$35,000 / yr"   },
  { value: "under_50k",  label: "$35,000–$50,000 / yr"   },
  { value: "under_75k",  label: "$50,000–$75,000 / yr"   },
  { value: "above_75k",  label: "Over $75,000 / yr"      },
] as const

const CAREER_OPTIONS = [
  { value: "construction",  label: "Trades / Construction"          },
  { value: "technology",    label: "Technology / Data"              },
  { value: "healthcare",    label: "Healthcare / Social Services"   },
  { value: "logistics",     label: "Logistics / Transportation"     },
  { value: "manufacturing", label: "Manufacturing"                  },
  { value: "education",     label: "Education"                      },
  { value: "food_service",  label: "Food Service"                   },
  { value: "retail",        label: "Retail"                         },
  { value: "trades",        label: "Skilled Trades"                 },
] as const

// ── Page ──────────────────────────────────────────────────────
export default function NavigatorPage() {
  const { result, loading, error, generate } = useNavigator()

  const [form, setForm] = useState<NavigatorRequest>({
    age:              35,
    zip_code:         "36104",
    education:        "high_school",
    income_bracket:   "0",
    career_interest:  "construction",
    has_vehicle:      false,
    prior_conviction: false,
    conviction_type:  undefined,
  })

  const [activeTab, setActiveTab] = useState<"careers" | "resources" | "plan">("careers")
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const patch = (p: Partial<NavigatorRequest>) => setForm(prev => ({ ...prev, ...p }))

  const handleSubmit = async () => {
    await generate(form)
    setActiveTab("careers")
  }

  return (
    <div className="navigator-layout">

      <AppSidebar activePage="navigator" />

      {/* ── Left: Input panel ───────────────────────────── */}
      <div className="navigator-input">
        <div className="navigator-input__header">
          <h2 className="navigator-input__title">Resident Profile</h2>
          <p className="navigator-input__subtitle">Fill in what applies — all fields are confidential</p>
        </div>

        <div className="nav-field">
          <label className="nav-field__label">Age</label>
          <input
            className="nav-field__input"
            type="number" min={16} max={75}
            value={form.age}
            onChange={e => patch({ age: Number(e.target.value) })}
          />
        </div>

        <div className="nav-field">
          <label className="nav-field__label">ZIP Code</label>
          <input
            className="nav-field__input"
            type="text"
            value={form.zip_code}
            onChange={e => patch({ zip_code: e.target.value })}
            placeholder="e.g. 36104"
          />
        </div>

        <div className="nav-field">
          <label className="nav-field__label">Education Level</label>
          <select
            className="nav-field__select"
            value={form.education}
            onChange={e => patch({ education: e.target.value as NavigatorRequest["education"] })}
          >
            {EDUCATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="nav-field">
          <label className="nav-field__label">Current Income</label>
          <select
            className="nav-field__select"
            value={form.income_bracket}
            onChange={e => patch({ income_bracket: e.target.value as NavigatorRequest["income_bracket"] })}
          >
            {INCOME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="nav-field">
          <label className="nav-field__label">Career Interest</label>
          <select
            className="nav-field__select"
            value={form.career_interest}
            onChange={e => patch({ career_interest: e.target.value as NavigatorRequest["career_interest"] })}
          >
            {CAREER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="nav-divider" />

        <div className="nav-toggles">
          <span className="nav-field__label">Situation</span>
          <Toggle
            label="I have a vehicle"
            description="Affects job location options"
            checked={form.has_vehicle}
            onChange={v => patch({ has_vehicle: v })}
          />
          <Toggle
            label="I have a prior conviction"
            description="We'll find employers who hire fairly"
            checked={form.prior_conviction}
            onChange={v => patch({ prior_conviction: v, conviction_type: v ? form.conviction_type : undefined })}
          />
        </div>

        {form.prior_conviction && (
          <div className="nav-field">
            <label className="nav-field__label">Type of conviction (optional)</label>
            <input
              className="nav-field__input"
              type="text"
              value={form.conviction_type ?? ""}
              onChange={e => patch({ conviction_type: e.target.value || undefined })}
              placeholder="e.g. non-violent, drug offense…"
            />
          </div>
        )}

        <button
          className="nav-submit-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          <span className="nav-submit-btn__icon">✦</span>
          <span className="nav-submit-btn__label">
            {loading ? "Analyzing your path…" : "Find My Opportunities"}
          </span>
          <span className="nav-submit-btn__shimmer" />
        </button>

        {error && <div className="nav-error">{error}</div>}

      </div>

      {/* ── Right: Output panel ──────────────────────────── */}
      <div className="navigator-output">
        <DemoProfileBar             
          onSelect={(profile, id) => { setForm(profile); setActiveId(id) }}
          activeId={activeId}
          loading={loading}
        />

        {loading  && <LoadingState />}
        {!loading && !result && <EmptyState />}
        {!loading && result  && (
          <Results
            result={result}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

      </div>

    </div>
  )
}

// ── Results ───────────────────────────────────────────────────
function Results({
  result,
  activeTab,
  onTabChange,
}: {
  result: NavigatorResponse
  activeTab: "careers" | "resources" | "plan"
  onTabChange: (t: "careers" | "resources" | "plan") => void
}) {
  return (
    <>
      <div className="nav-tabs">
        {(["careers", "resources", "plan"] as const).map(tab => (
          <button
            key={tab}
            className={`nav-tab${activeTab === tab ? " nav-tab--active" : ""}`}
            onClick={() => onTabChange(tab)}
          >
            {tab === "careers"   ? "🎯 Career Paths"
           : tab === "resources" ? "🤝 Support Resources"
           :                       "📋 Action Plan"}
          </button>
        ))}
      </div>

      {activeTab === "careers" && (
        <div className="nav-career-list">
          {result.career_paths.map((c, i) => <CareerCard key={i} career={c} index={i} defaultOpen={i === 0} />)}
        </div>
      )}

      {activeTab === "resources" && (
        <div className="nav-resource-grid">
          {result.support_resources.map((r, i) => <ResourceCard key={i} resource={r} />)}
        </div>
      )}

      {activeTab === "plan" && (
        <div className="nav-plan">
          <div className="nav-plan__title">Your 8-Week Action Plan</div>
          {result.action_plan.map((step, i) => (
            <ActionStepItem key={i} step={step} index={i} total={result.action_plan.length} />
          ))}
        </div>
      )}
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────
function CareerCard({ career, index, defaultOpen }: { career: CareerPath; index: number; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const demandClass = career.demand_level === "High" ? "rose" : career.demand_level === "Growing" ? "amber" : "sky"

  return (
    <div className="career-card">
      <div className="career-card__header" onClick={() => setOpen(!open)}>
        <div className="career-card__header-left">
          <span className="career-card__index">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <div className="career-card__title">{career.title}</div>
            <div className="career-card__salary">{career.salary_range}</div>
          </div>
        </div>
        <div className="career-card__header-right">
          <span className={`nav-tag nav-tag--${demandClass}`}>{career.demand_level}</span>
          <span className="career-card__chevron">{open ? "↑" : "↓"}</span>
        </div>
      </div>

      {open && (
        <div className="career-card__body">
          <div className="career-card__divider" />
          <div className="career-card__stats">
            <StatPill label="Time to Hire"     value={career.time_to_employment}   accent="var(--color-longterm)" />
            <StatPill label="Risk Reduction"   value={career.recidivism_reduction} accent="var(--color-success)"  />
            <StatPill label="City Saves"       value={career.city_savings}         accent="var(--color-gold)"     />
          </div>
          <div className="career-card__steps-label">Path to Employment</div>
          <div className="career-card__steps">
            {career.training_steps.map(step => (
              <div key={step.step} className="training-step">
                <span className="training-step__num">{step.step}</span>
                <div className="training-step__content">
                  <div className="training-step__desc">{step.description}</div>
                  <div className="training-step__meta">{step.provider} · {step.duration} · {step.cost}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ResourceCard({ resource }: { resource: SupportResource }) {
  return (
    <div className="resource-card">
      <div className="resource-card__header">
        <span className="resource-card__name">{resource.name}</span>
        <span className="nav-tag nav-tag--purple">{resource.type}</span>
      </div>
      <div className="resource-card__phone">{resource.phone}</div>
      <div className="resource-card__meta">{resource.address} · {resource.hours}</div>
      <div className="resource-card__relevance">{resource.relevance}</div>
    </div>
  )
}

function ActionStepItem({ step, index, total }: { step: ActionStep; index: number; total: number }) {
  return (
    <div className="action-step">
      <div className="action-step__track">
        <div className="action-step__num">{index + 1}</div>
        {index < total - 1 && <div className="action-step__line" />}
      </div>
      <div className="action-step__content">
        <div className="action-step__week">{step.week}</div>
        <div className="action-step__title">{step.title}</div>
        <div className="action-step__desc">{step.description}</div>
        {step.contact && <div className="action-step__contact">→ {step.contact}</div>}
      </div>
    </div>
  )
}

function StatPill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="stat-pill">
      <span className="stat-pill__label">{label}</span>
      <span className="stat-pill__value" style={{ color: accent }}>{value}</span>
    </div>
  )
}

function Toggle({ label, description, checked, onChange }: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      className={`nav-toggle${checked ? " nav-toggle--on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <div className="nav-toggle__track">
        <div className="nav-toggle__thumb" />
      </div>
      <div>
        <div className="nav-toggle__label">{label}</div>
        {description && <div className="nav-toggle__desc">{description}</div>}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="nav-state nav-state--loading">
      <div className="nav-state__ring">
        <div className="nav-state__ring-inner">✦</div>
      </div>
      <div className="nav-state__text">Analyzing your profile…</div>
      <div className="nav-state__sub">Finding real opportunities in Montgomery</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="nav-state">
      <div className="nav-state__icon">✦</div>
      <div className="nav-state__text">Your path starts here</div>
      <div className="nav-state__sub">
        Fill in your profile and we'll find real jobs, real resources,
        and a real step-by-step plan — made for where you are right now.
      </div>
    </div>
  )
}
