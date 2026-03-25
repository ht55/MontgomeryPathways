"use client"
/**
 * components/ui/ApiKeysModal.tsx
 * One modal for both Gemini + Bright Data keys.
 * Shown when user tries to use AI features without keys configured.
 */
import { useState } from "react"

type Props = {
  onSave:  (geminiKey: string, brightdataToken: string) => void
  onClose: () => void
}

export function ApiKeysModal({ onSave, onClose }: Props) {
  const [gemini,     setGemini]     = useState("")
  const [brightdata, setBrightdata] = useState("")
  const [error,      setError]      = useState("")

  const handleSave = () => {
    if (!gemini.trim()) {
      setError("Gemini API key is required.")
      return
    }
    if (!gemini.trim().startsWith("AIza")) {
      setError("Gemini API keys start with 'AIza'. Please check your key.")
      return
    }
    onSave(gemini.trim(), brightdata.trim())
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(8px)",
    }}>
      <div style={{
        background: "rgba(10, 7, 30, 0.98)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "16px",
        padding: "2rem",
        width: "min(460px, 92vw)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
      }}>

        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{
            fontSize: "0.7rem", letterSpacing: "0.1em",
            color: "var(--color-accent, #f97316)",
            textTransform: "uppercase", marginBottom: "0.5rem",
          }}>
            ✦ API Keys Required
          </div>
          <h3 style={{ color: "white", fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>
            Connect your API keys to get started
          </h3>
          <p style={{
            fontSize: "0.82rem", color: "rgba(255,255,255,0.5)",
            marginTop: "0.5rem", lineHeight: 1.6,
          }}>
            Keys are stored only in your browser — never on our servers.
          </p>
        </div>

        {/* Gemini — Required */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
              Gemini API Key <span style={{ color: "var(--color-accent, #f97316)" }}>*</span>
            </label>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "0.72rem", color: "var(--color-accent, #f97316)" }}>
              Get free key ↗
            </a>
          </div>
          <input
            type="password"
            placeholder="AIza..."
            value={gemini}
            onChange={e => { setGemini(e.target.value); setError("") }}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            style={inputStyle(!!error && !gemini)}
          />
        </div>

        {/* Bright Data — Optional */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
              Bright Data API Token{" "}
              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>(optional)</span>
            </label>
            <a href="https://brightdata.com" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>
              brightdata.com ↗
            </a>
          </div>
          <input
            type="password"
            placeholder="Leave blank to use cached data"
            value={brightdata}
            onChange={e => setBrightdata(e.target.value)}
            style={inputStyle(false)}
          />
          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginTop: "0.4rem" }}>
            Without a token, the Resident Navigator uses pre-cached Montgomery data.
          </div>
        </div>

        {error && (
          <div style={{ fontSize: "0.8rem", color: "rgba(255,100,100,0.9)", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={handleSave}
            disabled={!gemini.trim()}
            style={{
              flex: 1, padding: "0.8rem",
              background: gemini.trim() ? "var(--color-accent, #f97316)" : "rgba(255,255,255,0.08)",
              border: "none", borderRadius: "8px",
              color: "white", fontSize: "0.9rem", fontWeight: 600,
              cursor: gemini.trim() ? "pointer" : "not-allowed",
              transition: "background 0.2s",
            }}
          >
            Save & Continue
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "0.8rem 1.25rem",
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px", color: "rgba(255,255,255,0.45)",
              fontSize: "0.9rem", cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>

        <p style={{
          fontSize: "0.68rem", color: "rgba(255,255,255,0.25)",
          marginTop: "1rem", textAlign: "center", lineHeight: 1.5,
        }}>
          Stored in your browser's localStorage only. Clear anytime in browser settings.
        </p>
      </div>
    </div>
  )
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "0.7rem 1rem",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${hasError ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.1)"}`,
    borderRadius: "8px", color: "white",
    fontSize: "0.88rem", outline: "none",
    boxSizing: "border-box",
  }
}