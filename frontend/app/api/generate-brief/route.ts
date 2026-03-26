// frontend/app/api/generate-brief/route.ts
import { NextRequest, NextResponse } from "next/server"

const API_BASE  = process.env.API_URL!
const appToken = process.env.APP_TOKEN ?? ""

export async function POST(req: NextRequest) {
  const geminiKey = req.headers.get("X-Gemini-Key") ?? ""
  const body = await req.json()

  const res = await fetch(`${API_BASE}/api/generate-brief`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-App-Token":  appToken,
      "X-Gemini-Key": geminiKey,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}