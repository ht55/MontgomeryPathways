"use client"
/**
 * hooks/useApiKeys.ts
 * Manages Gemini + Bright Data API keys in localStorage.
 */
import { useState, useEffect } from "react"

const GEMINI_KEY      = "gemini_api_key"
const BRIGHTDATA_KEY  = "brightdata_api_token"

export type ApiKeys = {
  geminiKey:       string | null
  brightdataToken: string | null
}

export function useApiKeys() {
  const [keys, setKeys]   = useState<ApiKeys>({ geminiKey: null, brightdataToken: null })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setKeys({
      geminiKey:       localStorage.getItem(GEMINI_KEY),
      brightdataToken: localStorage.getItem(BRIGHTDATA_KEY),
    })
    setLoaded(true)
  }, [])

  const saveKeys = (geminiKey: string, brightdataToken: string) => {
    localStorage.setItem(GEMINI_KEY, geminiKey.trim())
    if (brightdataToken.trim()) {
      localStorage.setItem(BRIGHTDATA_KEY, brightdataToken.trim())
    } else {
      localStorage.removeItem(BRIGHTDATA_KEY)
    }
    setKeys({
      geminiKey:       geminiKey.trim(),
      brightdataToken: brightdataToken.trim() || null,
    })
  }

  const clearKeys = () => {
    localStorage.removeItem(GEMINI_KEY)
    localStorage.removeItem(BRIGHTDATA_KEY)
    setKeys({ geminiKey: null, brightdataToken: null })
  }

  return { keys, loaded, saveKeys, clearKeys }
}