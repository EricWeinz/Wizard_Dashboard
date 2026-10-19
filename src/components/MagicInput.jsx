import React from "react";

/* ════════════════════════════════════════════
   MAGICAL INPUT (Feature 4: Tab/Enter nav)
   ════════════════════════════════════════════ */
export default function MagicInput({ value, onChange, placeholder, color, warn, inputId, onNavigate, ariaLabel }) {
  const handleChange = (e) => {
    const v = e.target.value;
    if (v !== "" && !/^\d+$/.test(v)) return;
    onChange(v);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      if (onNavigate) onNavigate(inputId);
    }
  };
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <input data-input-id={inputId} aria-label={ariaLabel} type="text" inputMode="numeric" value={value} onChange={handleChange} onKeyDown={handleKeyDown} placeholder={placeholder}
        style={{
          width: 46, padding: "7px 0", textAlign: "center", borderRadius: 8,
          border: `1.5px solid ${warn ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
          background: warn ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)",
          color: value ? "#fff" : "rgba(255,255,255,0.2)", fontSize: 14, outline: "none",
          fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s",
        }}
        onFocus={e => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 12px ${color}40`; }}
        onBlur={e => { e.target.style.borderColor = warn ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
      />
    </div>
  );
}

/**
 * Anzeige-Variante in gleicher Größe wie MagicInput.
 * Ohne `onClick`: nur lesen (Online: Werte anderer Spieler).
 * Mit `onClick`: antippbarer Knopf, der eine Zahlenauswahl öffnet (Online).
 */
export function MagicValue({ value, warn, ariaLabel, onClick, color = "#c084fc" }) {
  const filled = value !== "";
  const base = {
    display: "inline-block", width: 46, padding: "7px 0", textAlign: "center", borderRadius: 8,
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: "normal",
  };
  if (!onClick) {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <span aria-label={ariaLabel} style={{
          ...base, cursor: "default",
          border: `1.5px solid ${warn ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.03)"}`,
          background: warn ? "rgba(239,68,68,0.04)" : "transparent",
          color: filled ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.12)",
        }}>{filled ? value : "–"}</span>
      </div>
    );
  }
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button type="button" onClick={onClick} aria-label={ariaLabel} style={{
        ...base, cursor: "pointer", margin: 0,
        border: `1.5px solid ${warn ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`,
        background: warn ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.05)",
        color: filled ? "#fff" : "rgba(255,255,255,0.25)", transition: "all 0.3s",
      }}
        onFocus={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 12px ${color}40`; }}
        onBlur={e => { e.currentTarget.style.borderColor = warn ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = color; }}
        onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = warn ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"; }}
      >{filled ? value : "–"}</button>
    </div>
  );
}
