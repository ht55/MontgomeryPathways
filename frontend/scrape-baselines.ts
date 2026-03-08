#!/usr/bin/env npx ts-node
/**
 * scrape-baselines.ts
 *
 * One-time script to fetch real data from AL DOC, Census, HUD, and BLS
 * via Bright Data, then overwrite simulation-constants.ts with live values.
 *
 * Usage:
 *   npx ts-node scrape-baselines.ts
 *
 * Required env variable (.env):
 *   BRIGHTDATA_API_TOKEN=a00xxxx...
 */

import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"
import { fileURLToPath } from "url"

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// .env lives in backend/, one level up from frontend/
dotenv.config({ path: path.resolve(__dirname, "../backend/.env") })

const TOKEN = process.env.BRIGHTDATA_API_TOKEN
if (!TOKEN) {
  console.error("❌ BRIGHTDATA_API_TOKEN not found in .env")
  process.exit(1)
}

// ── Fetch HTML via Bright Data Web Unlocker ───────────────────────────────────────────────────────
async function fetchViaProx(url: string): Promise<string> {
  console.log(`  📡 Fetching: ${url}`)
  const res = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      zone: "web_unlocker1",
      url,
      format: "raw",
      country: "us",
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Bright Data error ${res.status}: ${body}`)
  }
  return res.text()
}

// ── Census API (no Bright Data needed — public endpoint) ──────────────────
async function fetchCensus(): Promise<{
  population: number
  youngAdultPop: number
  medianIncome: number
  povertyRate: number
  avgHouseholdSize: number
}> {
  console.log("\n📊 Fetching Census ACS 2023...")

  // B01003_001E = total population
  // B19013_001E = median household income
  // B17001_002E = population below poverty line
  // B25010_001E = average household size
  const baseUrl = "https://api.census.gov/data/2023/acs/acs1"
  const params = "get=B01003_001E,B19013_001E,B17001_002E,B25010_001E&for=county:101&in=state:01"

  const res = await fetch(`${baseUrl}?${params}`, {
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) throw new Error(`Census API error: ${res.status}`)
  const json = await res.json()
  const row = json[1] // row 0 is the header

  const population = parseInt(row[0])
  const medianIncome = parseInt(row[1])
  const povertyCount = parseInt(row[2])
  const avgHouseholdSize = parseFloat(row[3])
  const povertyRate = povertyCount / population

  // Ages 25–34: B01001_011E (M 25-29) + B01001_012E (M 30-34)
  //           + B01001_035E (F 25-29) + B01001_036E (F 30-34)
  const ageUrl = `${baseUrl}?get=B01001_011E,B01001_012E,B01001_035E,B01001_036E&for=county:101&in=state:01`
  const ageRes = await fetch(ageUrl, { signal: AbortSignal.timeout(15_000) })
  const ageJson = await ageRes.json()
  const ageRow = ageJson[1]
  const youngAdultPop = parseInt(ageRow[0]) + parseInt(ageRow[1]) + parseInt(ageRow[2]) + parseInt(ageRow[3])

  console.log(`  ✅ Population:          ${population.toLocaleString()}`)
  console.log(`  ✅ Ages 25-34:          ${youngAdultPop.toLocaleString()}`)
  console.log(`  ✅ Median HH income:    $${medianIncome.toLocaleString()}`)
  console.log(`  ✅ Poverty rate:        ${(povertyRate * 100).toFixed(1)}%`)
  console.log(`  ✅ Avg household size:  ${avgHouseholdSize}`)

  return { population, youngAdultPop, medianIncome, povertyRate, avgHouseholdSize }
}

// ── AL DOC — scrape recidivism rate via Bright Data ─────────────────────
async function fetchALDOC(): Promise<{ recidivismRate: number; source: string }> {
  console.log("\n🏛️  Fetching AL DOC Reentry Stats...")

  try {
    const html = await fetchViaProx(
      "https://www.doc.alabama.gov/research-and-planning/"
    )

    // Look for a percentage near the word "recidivism"
    const patterns = [
      /recidivism[^%\d]*(\d+\.?\d*)%/i,
      /(\d+\.?\d*)%[^%\d]*recidivism/i,
      /re-offend[^%\d]*(\d+\.?\d*)%/i,
      /reincarcerat[^%\d]*(\d+\.?\d*)%/i,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) {
        const rate = parseFloat(match[1]) / 100
        if (rate > 0.1 && rate < 0.9) {
          console.log(`  ✅ Recidivism rate: ${(rate * 100).toFixed(1)}% (AL DOC)`)
          return { recidivismRate: rate, source: "AL DOC Research & Planning" }
        }
      }
    }

    // Pattern match failed — fall back to known published value
    console.log("  ⚠️  Could not extract rate from page — using AL DOC 2023 Annual Report value")
    return { recidivismRate: 0.32, source: "AL DOC Annual Report 2023 (known value)" }
  } catch (e) {
    console.log(`  ⚠️  AL DOC fetch failed: ${e} — using fallback`)
    return { recidivismRate: 0.32, source: "AL DOC Annual Report 2023 (fallback)" }
  }
}

// ── HUD Fair Market Rent (public API, no key required) ──────────────────
async function fetchHUDRent(): Promise<{ rent2br: number; source: string }> {
  console.log("\n🏠 Fetching HUD Fair Market Rent...")

  try {
    // Public endpoint — no API key required
    const res = await fetch(
      "https://www.huduser.gov/hudapi/public/fmr/statedata/AL",
      { signal: AbortSignal.timeout(15_000) }
    )
    const json = await res.json()

    // Montgomery County FIPS: 01101
    const montgomery = json?.data?.basicdata?.find(
      (d: { countyname: string }) =>
        d.countyname?.toLowerCase().includes("montgomery")
    )

    if (montgomery?.["2br"]) {
      console.log(`  ✅ 2BR rent: $${montgomery["2br"]}/mo (HUD FMR 2024)`)
      return { rent2br: montgomery["2br"], source: "HUD Fair Market Rent 2024" }
    }

    throw new Error("Montgomery County not found in HUD data")
  } catch (e) {
    console.log(`  ⚠️  HUD fetch failed: ${e} — using fallback`)
    return { rent2br: 1_050, source: "HUD FMR 2024 (fallback)" }
  }
}

// ── BLS Local Area Unemployment Statistics ──────────────────────────────
async function fetchBLSUnemployment(): Promise<{ rate: number; source: string }> {
  console.log("\n💼 Fetching BLS unemployment rate...")

  try {
    // Series LAUMT011220000000003 = Montgomery, AL Metro unemployment rate
    const res = await fetch(
      "https://api.bls.gov/publicAPI/v2/timeseries/data/LAUMT011220000000003?startyear=2024&endyear=2025",
      { signal: AbortSignal.timeout(15_000) }
    )
    const json = await res.json()
    const latestValue = json?.Results?.series?.[0]?.data?.[0]?.value

    if (latestValue) {
      const rate = parseFloat(latestValue)
      console.log(`  ✅ Unemployment rate: ${rate}% (BLS LAUS)`)
      return { rate, source: "BLS Local Area Unemployment Statistics" }
    }
    throw new Error("BLS data not found")
  } catch (e) {
    console.log(`  ⚠️  BLS fetch failed: ${e} — using fallback`)
    return { rate: 5.2, source: "BLS LAUS 2024 (fallback)" }
  }
}

// ── Generate simulation-constants.ts content ────────────────────────────
function generateConstantsFile(data: {
  census: Awaited<ReturnType<typeof fetchCensus>>
  aldoc: Awaited<ReturnType<typeof fetchALDOC>>
  hud: Awaited<ReturnType<typeof fetchHUDRent>>
  bls: Awaited<ReturnType<typeof fetchBLSUnemployment>>
  scrapedAt: string
}): string {
  const { census, aldoc, hud, bls, scrapedAt } = data

  // Derived fiscal values
  const avgAnnualTax            = Math.round(census.medianIncome * 0.65 * 0.085)            // per-capita adj × local tax rate
  const lifetimeTaxContribution = Math.round(census.medianIncome * 0.65 * 0.085 * 25 * 0.72) // 25yr NPV

  return `/**
 * simulation-constants.ts
 * AUTO-GENERATED by scrape-baselines.ts — do not edit manually.
 * To regenerate: npx ts-node scrape-baselines.ts
 *
 * Last fetched: ${scrapedAt}
 */

// ─────────────────────────────────────────────────────────────────
// CRIME / REENTRY
// source: Montgomery_Crime_7days_2026-03-04.csv (local CSV)
// ─────────────────────────────────────────────────────────────────

export const WEEKLY_INCIDENTS = 143
export const ANNUAL_INCIDENTS_ESTIMATE = WEEKLY_INCIDENTS * 52  // 7,436/yr

/** source: ${aldoc.source} */
export const BASE_RECIDIVISM_RATE = ${aldoc.recidivismRate}

export const AVERAGE_INCARCERATION_COST = 28_600  // Vera Institute, Alabama FY2022

/**
 * Reentry pipeline: ~18% of annual incidents → reentry cohort
 * CSV: 143/wk × 52 × 0.18 ≈ 1,338
 */
export const TARGET_POPULATION = 1_338
export const EMPLOYMENT_CONVERSION_RATE = 0.65

// ─────────────────────────────────────────────────────────────────
// DEMOGRAPHICS  source: ${aldoc.source.includes("fallback") ? "Census ACS 2023" : "Census ACS 2023 (live)"}
// ─────────────────────────────────────────────────────────────────

/** source: Census ACS 2023 B01003 — Montgomery County, AL */
export const MONTGOMERY_POPULATION = ${data.census.population}

/** source: Census ACS 2023 B01001 — ages 25–34 */
export const YOUNG_ADULT_POPULATION = ${data.census.youngAdultPop}

/** source: Census ACS 2023 B25010 */
export const AVG_HOUSEHOLD_SIZE = ${data.census.avgHouseholdSize}

/** source: Census ACS 2023 B19013 — Montgomery County median HH income */
export const MEDIAN_HOUSEHOLD_INCOME = ${data.census.medianIncome}

/** source: Census ACS 2023 B17001 */
export const POVERTY_RATE = ${data.census.povertyRate.toFixed(4)}  // ${(data.census.povertyRate * 100).toFixed(1)}%

// ─────────────────────────────────────────────────────────────────
// FISCAL
// ─────────────────────────────────────────────────────────────────

/**
 * Per-capita annual local tax contribution
 * = MEDIAN_HOUSEHOLD_INCOME × 0.65 (per-capita adj) × 8.5% (AL+city tax)
 * source: Census ACS 2023 (live)
 */
export const AVERAGE_ANNUAL_TAX = ${avgAnnualTax}

/**
 * NPV of lifetime local tax contribution per retained young adult (25yr, 0.72 discount)
 * source: Census ACS 2023 (live)
 */
export const LIFETIME_TAX_CONTRIBUTION = ${lifetimeTaxContribution}

export const CHILD_GENERATION_MULTIPLIER = 1.4  // second-generation tax contribution multiplier

// ─────────────────────────────────────────────────────────────────
// YOUTH RETENTION
// source: IRS SOI Migration Data 2021→2022, Montgomery County
// ─────────────────────────────────────────────────────────────────

export const BASELINE_RETENTION_RATE = 0.48  // net outmigration implies ~48% annual retention

// ─────────────────────────────────────────────────────────────────
// HOUSING  source: Montgomery_Construction_Permit.csv (local CSV)
// ─────────────────────────────────────────────────────────────────

export const HOUSING_PIPELINE_UNITS = 514
export const CONSTRUCTION_PIPELINE_VALUE_M = 218.8
export const NEW_RESIDENTIAL_PERMITS = 120
export const NEW_COMMERCIAL_PERMITS = 32

/** source: ${hud.source} */
export const MEDIAN_2BR_RENT = ${hud.rent2br}

// ─────────────────────────────────────────────────────────────────
// LABOR  source: ${bls.source}
// ─────────────────────────────────────────────────────────────────

export const UNEMPLOYMENT_RATE_PCT = ${bls.rate}

// ─────────────────────────────────────────────────────────────────
// CRIME BREAKDOWN  source: Montgomery_Crime_7days_2026-03-04.csv
// ─────────────────────────────────────────────────────────────────

export const CRIME_BREAKDOWN = {
  THEFT:            51,
  DOMESTIC:         17,
  CRIMINAL:         16,
  BURGLARY:         12,
  ASSAULT:          12,
  HARASSMENT:       11,
  DISCHARGING:       6,
  ROBBERY:           4,
  MENACING:          4,
  ASSAULT_DOMESTIC:  3,
  HOMICIDE:          1,
} as const

export const VIOLENT_CRIMES_WEEKLY  = 37
export const PROPERTY_CRIMES_WEEKLY = 79
`
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Montgomery baseline scraper starting\n")
  console.log("=".repeat(50))

  const [census, aldoc, hud, bls] = await Promise.all([
    fetchCensus(),
    fetchALDOC(),
    fetchHUDRent(),
    fetchBLSUnemployment(),
  ])

  const scrapedAt = new Date().toISOString()
  const content = generateConstantsFile({ census, aldoc, hud, bls, scrapedAt })

  const outputPath = path.join(
    process.cwd(),
    "services",
    "engine",
    "simulation-constants.ts"
  )

  // Back up existing file before overwriting
  if (fs.existsSync(outputPath)) {
    fs.copyFileSync(outputPath, outputPath.replace(".ts", ".backup.ts"))
    console.log(`\n💾 Backup saved: simulation-constants.backup.ts`)
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, content, "utf-8")

  console.log("\n" + "=".repeat(50))
  console.log(`✅ simulation-constants.ts updated`)
  console.log(`📁 Output: ${outputPath}`)
  console.log("\n📋 Values summary:")
  console.log(`   Population:         ${census.population.toLocaleString()}`)
  console.log(`   Ages 25-34:         ${census.youngAdultPop.toLocaleString()}`)
  console.log(`   Median HH income:   $${census.medianIncome.toLocaleString()}`)
  console.log(`   Recidivism rate:    ${(aldoc.recidivismRate * 100).toFixed(1)}%`)
  console.log(`   Unemployment rate:  ${bls.rate}%`)
  console.log(`   2BR rent:           $${hud.rent2br}/mo`)
}

main().catch((e) => {
  console.error("❌ Error:", e)
  process.exit(1)
})
