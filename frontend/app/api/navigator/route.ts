// frontend/app/api/navigator/route.ts
import { NextRequest, NextResponse } from "next/server"

const API_BASE  = process.env.API_URL!
const appToken = process.env.APP_TOKEN ?? ""

export async function POST(req: NextRequest) {
  const geminiKey      = req.headers.get("X-Gemini-Key") ?? ""
  const brightdataToken = req.headers.get("X-Brightdata-Token") ?? ""
  const body = await req.json()

  const res = await fetch(`${API_BASE}/api/navigator`, {
    method: "POST",
    headers: {
      "Content-Type":    "application/json",
      "X-App-Token":     appToken,
      "X-Gemini-Key":    geminiKey,
      ...(brightdataToken ? { "X-Brightdata-Token": brightdataToken } : {}),
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}