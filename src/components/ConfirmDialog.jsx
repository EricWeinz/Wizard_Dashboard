import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

/* ════════════════════════════════════════════
   CONFIRM DIALOG (Feature 5)
   ════════════════════════════════════════════ */
const TONES = {
  // rot: zerstörerische Aktionen (Neues Spiel, Revanche)
  danger: { background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 4px 16px rgba(220,38,38,0.3)" },
  // violett: harmlose Rückfragen (z. B. Sitzung verlassen – Werte bleiben erhalten)
  neutral: { background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #8b5cf6 100%)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" },
};

/** Rückfrage-Dialog; rendert per Portal direkt in <body>, Escape bricht ab. */
export default function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = "Neues Spiel", icon = "⚠️", tone = "danger" }) {
  const cancelRef = useRef(null);
  const dialogRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const messageId = useId();
  // Nur beim Öffnen: Fokus auf "Abbrechen" (nicht bei jedem Neu-Rendern, z. B. durch Live-Updates)
  useEffect(() => {
    const previous = document.activeElement; // Fokus nach dem Schließen zurückgeben
    cancelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onCancelRef.current();
      // Tab bleibt im Dialog (zwei Knöpfe: Abbrechen <-> Bestätigen)
      if (e.key === "Tab" && dialogRef.current) {
        const items = [...dialogRef.current.querySelectorAll("button")];
        const i = items.indexOf(document.activeElement);
        e.preventDefault();
        items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length]?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  const toneStyle = TONES[tone] ?? TONES.danger;
  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(5,3,17,0.8)", backdropFilter: "blur(8px)",
      animation: "fadeIn 0.2s ease-out",
    }} onClick={onCancel}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={messageId} onClick={e => e.stopPropagation()} style={{
        background: "rgba(15,10,35,0.95)", border: "1px solid rgba(192,132,252,0.2)",
        borderRadius: 20, padding: "32px 36px", maxWidth: 380, width: "90%",
        boxShadow: "0 0 60px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
        animation: "fadeSlideIn 0.3s ease-out",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
          <p id={messageId} style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, margin: 0 }}>
            {message}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button ref={cancelRef} onClick={onCancel} style={{
            flex: 1, padding: "12px 0", borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
          }}>Abbrechen</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
            background: toneStyle.background,
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", boxShadow: toneStyle.boxShadow,
            transition: "all 0.2s",
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
