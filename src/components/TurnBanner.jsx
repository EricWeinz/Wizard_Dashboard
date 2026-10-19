import React from "react";

/** Hinweisleiste über der Tabelle: wer gibt, wer jetzt ansagt, was nicht erlaubt ist. */
export default function TurnBanner({ tone = "info", icon, title, detail }) {
  const danger = tone === "danger";
  return (
    <div role="status" aria-live="polite" style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 14,
      border: `1px solid ${danger ? "rgb(var(--danger) / 0.45)" : "rgb(var(--accent) / 0.25)"}`,
      background: danger ? "rgb(var(--danger) / 0.08)" : "rgb(var(--accent) / 0.06)",
      fontFamily: "'DM Sans', sans-serif", animation: "fadeIn 0.3s ease-out",
    }}>
      <span aria-hidden style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: danger ? "rgb(var(--danger-text))" : "rgb(var(--soft))" }}>{title}</div>
        {detail && <div style={{ fontSize: 12, color: "rgb(var(--ink) / 0.55)", marginTop: 2, lineHeight: 1.4 }}>{detail}</div>}
      </div>
    </div>
  );
}
