"use client"

import { useRef, useId, useState } from "react"

type Variant = "reentry" | "longterm"

type VariantColors = {
  base: string
  glow: string
  bright: string
}

type Props = {
  label: string
  value: number
  onChange: (v: number) => void
  max?: number
  variant?: Variant
}

const VARIANT_COLOR: Record<Variant, VariantColors> = {
  reentry:  { base: "#FF5722", glow: "#FF7043", bright: "#FFAB91" },
  longterm: { base: "#3D5AFE", glow: "#536DFE", bright: "#8C9EFF" },
}

export function CircularGauge({ label, value, onChange, max = 30, variant = "reentry" }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const isDragging = useRef<boolean>(false)
  const id = useId().replace(/:/g, "")
  const colors = VARIANT_COLOR[variant]

  const size       = 130
  const cx         = size / 2
  const cy         = size / 2
  const r          = 58
  const rInner     = 48
  const startAngle = -220
  const endAngle   = 40
  const totalAngle = endAngle - startAngle

  const toRad  = (deg: number) => (deg * Math.PI) / 180
  const angle  = startAngle + (value / max) * totalAngle
  const thumbX = cx + r * Math.cos(toRad(angle))
  const thumbY = cy + r * Math.sin(toRad(angle))

  const arcPath = (from: number, to: number, radius: number): string => {
    const s = { x: cx + radius * Math.cos(toRad(from)), y: cy + radius * Math.sin(toRad(from)) }
    const e = { x: cx + radius * Math.cos(toRad(to)),   y: cy + radius * Math.sin(toRad(to)) }
    const large = (to - from + 360) % 360 > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`
  }

  type Tick = { x1: number; y1: number; x2: number; y2: number; isMajor: boolean; filled: boolean }
  const ticks: Tick[] = []
  const tickCount = 40
  for (let i = 0; i <= tickCount; i++) {
    const a    = startAngle + (i / tickCount) * totalAngle
    const isMajor = i % 8 === 0
    const rOut = r + 10
    const rIn  = isMajor ? r + 4 : r + 7
    const x1 = cx + rOut * Math.cos(toRad(a))
    const y1 = cy + rOut * Math.sin(toRad(a))
    const x2 = cx + rIn  * Math.cos(toRad(a))
    const y2 = cy + rIn  * Math.sin(toRad(a))
    const filled = i / tickCount <= value / max
    ticks.push({ x1, y1, x2, y2, isMajor, filled })
  }

  const handlePointer = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>): void => {
    if (!isDragging.current || !svgRef.current) return
    const rect    = svgRef.current.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    const x = (clientX - rect.left) * (size / rect.width)  - cx
    const y = (clientY - rect.top)  * (size / rect.height) - cy
    let deg = Math.atan2(y, x) * 180 / Math.PI
    if (deg < 0) deg += 360
    let start = startAngle % 360
    if (start < 0) start += 360
    let offset = deg - start
    if (offset < 0) offset += 360
    if (offset > totalAngle) {
      const distToMax  = offset - totalAngle
      const distToZero = 360 - offset
      onChange(distToMax <= distToZero ? max : 0)
      return
    }
    onChange(Math.round((offset / totalAngle) * max))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, touchAction: 'none' }}>
      <span style={{
        fontFamily: "'Rajdhani', 'Orbitron', monospace",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: colors.bright,
        opacity: 0.7,
      }}>{label}</span>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        style={{ overflow: 'visible', cursor: 'crosshair' }}
        onMouseDown={() => (isDragging.current = true)}
        onMouseUp={() => (isDragging.current = false)}
        onMouseLeave={() => (isDragging.current = false)}
        onMouseMove={handlePointer}
        onTouchStart={(e) => { e.preventDefault(); isDragging.current = true; }}
        onTouchEnd={() => (isDragging.current = false)}
        onTouchMove={handlePointer}
      >
        <defs>
          <linearGradient id={`arc-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={colors.base}  stopOpacity="0.3" />
            <stop offset="60%"  stopColor={colors.glow}  stopOpacity="0.9" />
            <stop offset="100%" stopColor={colors.bright} stopOpacity="1" />
          </linearGradient>

          <radialGradient id={`knob-base-${id}`} cx="38%" cy="32%" r="68%">
            <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="25%"  stopColor="#E8E8E8" stopOpacity="1" />
            <stop offset="55%"  stopColor="#B0B0B0" stopOpacity="1" />
            <stop offset="80%"  stopColor="#787878" stopOpacity="1" />
            <stop offset="100%" stopColor="#404040" stopOpacity="1" />
          </radialGradient>

          <radialGradient id={`knob-rim-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="70%"  stopColor="transparent" stopOpacity="0" />
            <stop offset="100%" stopColor={colors.glow}  stopOpacity="0.6" />
          </radialGradient>

          <radialGradient id={`plate-${id}`} cx="45%" cy="38%" r="65%">
            <stop offset="0%"   stopColor="#2a2a2a" />
            <stop offset="70%"  stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0d0d0d" />
          </radialGradient>

          <filter id={`arc-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>

          <filter id={`knob-glow-${id}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.filled ? colors.glow : 'rgba(255,255,255,0.12)'}
            strokeWidth={t.isMajor ? 1.5 : 0.8}
            strokeLinecap="round"
            opacity={t.filled ? (t.isMajor ? 1 : 0.7) : 1}
          />
        ))}

        {/* Track */}
        <path d={arcPath(startAngle, endAngle, r)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" strokeLinecap="round" />
        <path d={arcPath(startAngle, endAngle, r)} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="7" strokeLinecap="round" style={{ mixBlendMode: 'multiply' }} />

        {/* Filled arc */}
        {value > 0 && (
          <>
            <path d={arcPath(startAngle, angle, r)} fill="none" stroke={colors.glow} strokeWidth="8" strokeLinecap="round" opacity="0.25" filter={`url(#arc-glow-${id})`} />
            <path d={arcPath(startAngle, angle, r)} fill="none" stroke={`url(#arc-grad-${id})`} strokeWidth="5" strokeLinecap="round" />
            <path d={arcPath(startAngle, angle, r)} fill="none" stroke={colors.bright} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          </>
        )}

        {/* Dial plate */}
        <circle cx={cx} cy={cy} r={rInner - 2} fill={`url(#plate-${id})`} />
        <circle cx={cx} cy={cy} r={rInner - 10} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={rInner - 18} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

        {/* Value text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="26" fontWeight="700"
          fontFamily="'Rajdhani', 'Orbitron', monospace" letterSpacing="-1" style={{ pointerEvents: 'none' }}>
          {value}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill={colors.bright} fontSize="9" fontWeight="500"
          fontFamily="'Rajdhani', monospace" letterSpacing="3" opacity="0.7" style={{ pointerEvents: 'none' }}>
          / {max}
        </text>

        {/* Knob */}
        <circle cx={thumbX} cy={thumbY} r={14} fill="none" stroke={colors.glow} strokeWidth="1" opacity="0.5" filter={`url(#knob-glow-${id})`} />
        <circle cx={thumbX + 0.5} cy={thumbY + 1.5} r={11} fill="rgba(0,0,0,0.6)" style={{ filter: 'blur(3px)' }} />
        <circle cx={thumbX} cy={thumbY} r={11} fill={`url(#knob-base-${id})`} />
        <circle cx={thumbX} cy={thumbY} r={11} fill={`url(#knob-rim-${id})`} />
        <circle cx={thumbX} cy={thumbY} r={11} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.7" />
        <circle cx={thumbX} cy={thumbY} r={10.2} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
        <circle cx={thumbX} cy={thumbY} r={3.5} fill={colors.glow} opacity="0.9" />
        <circle cx={thumbX} cy={thumbY} r={1.8} fill={colors.bright} />
        <ellipse cx={thumbX - 2.5} cy={thumbY - 3} rx={3} ry={1.8}
          fill="rgba(255,255,255,0.6)"
          transform={`rotate(-30, ${thumbX}, ${thumbY})`}
          style={{ pointerEvents: 'none' }}
        />
      </svg>
    </div>
  )
}
