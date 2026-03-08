/**
 * Shared formatting utilities.
 * Keep all display formatting logic here — never inline in components.
 */

export function fmtDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export function fmtPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}
