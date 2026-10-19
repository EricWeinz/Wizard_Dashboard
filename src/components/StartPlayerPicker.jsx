import React, { useEffect, useId, useRef, useState } from "react";
import { PLAYER_COLORS } from "../lib/wizard.js";

/**
 * „Wer sagt zuerst an?“ – auffällige Karte ganz oben im Setup (lokal) und im Warteraum (online).
 *
 * names     – Namen in Sitzordnung
 * selected  – Index des Beginnenden
 * onSelect  – (index) => void, auch nach dem Auslosen
 * readOnly  – nur anzeigen (Mitspieler/Zuschauer online), `note` erklärt, wer wählt
 * chosen    – es wurde schon bewusst gewählt (dann pulsiert die Karte nicht mehr)
 */
export default function StartPlayerPicker({ names, selected, onSelect, readOnly = false, disabled = false, note = null, chosen = false }) {
  const count = names.length;
  const titleId = useId();
  const [rolling, setRolling] = useState(null);   // Index, der beim Auslosen gerade aufleuchtet
  const [pending, setPending] = useState(null);   // ausgelost, Bestätigung (online) steht noch aus
  const [touched, setTouched] = useState(false);
  const timer = useRef(null);
  const pendingTimer = useRef(null);
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(pendingTimer.current); }, []);
  useEffect(() => { setPending(null); }, [selected]);
  if (count === 0) return null;

  const current = Math.min(Math.max(selected, 0), count - 1);
  const shown = rolling ?? (pending !== null && pending < count ? pending : current);
  const locked = readOnly || disabled || rolling !== null;
  const attention = !readOnly && !touched && !chosen;

  const pick = (i) => {
    setTouched(true);
    onSelect(i);
  };

  /** Auslosen: reihum aufleuchten lassen, dann zufällig stehen bleiben. */
  const roll = () => {
    if (rolling !== null || count < 2) return;
    setTouched(true);
    const final = crypto.getRandomValues(new Uint32Array(1))[0] % count;
    let step = 0;
    let index = shown;
    const tick = () => {
      step += 1;
      if (step < 12) {
        index = (index + 1) % count;
        setRolling(index);
        timer.current = setTimeout(tick, 55 + step * 14);
      } else {
        setRolling(null);
        setPending(final);
        clearTimeout(pendingTimer.current);
        pendingTimer.current = setTimeout(() => setPending(null), 3000);
        onSelect(final);
      }
    };
    tick();
  };

  const starter = names[shown];
  const color = PLAYER_COLORS[shown] ?? PLAYER_COLORS[0];

  return (
    <section aria-labelledby={titleId} style={{
      position: "relative", borderRadius: 18, padding: "16px 16px 14px", textAlign: "left",
      border: "1.5px solid rgb(var(--accent) / 0.5)",
      background: "linear-gradient(160deg, rgb(var(--accent) / 0.16) 0%, rgb(var(--accent) / 0.05) 55%, rgb(var(--accent) / 0.02) 100%)",
      boxShadow: "0 0 26px rgb(var(--accent) / 0.16), inset 0 1px 0 rgb(var(--ink) / 0.06)",
      animation: attention ? "pickerGlow 2.4s ease-in-out infinite" : "none",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span aria-hidden style={{ fontSize: 30, lineHeight: 1, filter: "drop-shadow(0 0 10px rgb(var(--accent) / 0.45))" }}>☝️</span>
        <div style={{ minWidth: 0 }}>
          <h2 id={titleId} style={{ margin: 0, fontFamily: "var(--font-label)", fontSize: 19, fontWeight: 700, letterSpacing: 0.5, color: "rgb(var(--soft))", lineHeight: 1.2 }}>
            Wer sagt zuerst an?
          </h2>
          <p style={{ margin: "3px 0 0", fontSize: 12.5, lineHeight: 1.4, color: "rgb(var(--ink) / 0.55)" }}>
            {readOnly ? (note ?? "Legt die Spielleitung fest.") : "Tippe auf einen Namen – oder lass das Los entscheiden."}
          </p>
        </div>
      </div>

      <div role="radiogroup" aria-label="Wer sagt in Runde 1 zuerst an?" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {names.map((name, i) => {
          const active = i === shown;
          const c = PLAYER_COLORS[i] ?? PLAYER_COLORS[0];
          return (
            <button key={i} type="button" role="radio" aria-checked={active} disabled={locked} onClick={() => pick(i)} style={{
              minHeight: 44, maxWidth: "100%", padding: "10px 14px", borderRadius: 999, fontSize: 15, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif", cursor: locked ? "default" : "pointer",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              border: active ? `2px solid ${c.accent}` : "1.5px solid rgb(var(--ink) / 0.12)",
              background: active ? c.dim : "rgb(var(--ink) / 0.04)",
              color: active ? "rgb(var(--ink))" : locked ? "rgb(var(--ink) / 0.5)" : "rgb(var(--ink) / 0.7)",
              boxShadow: active ? `0 0 18px ${c.glow}` : "none",
              transform: active ? "scale(1.04)" : "none", transition: rolling !== null ? "none" : "all 0.2s ease",
              opacity: 1,
            }}>
              {active && <span aria-hidden style={{ color: c.accent, marginRight: 6 }}>✓</span>}{name}
            </button>
          );
        })}
        {!readOnly && count > 1 && (
          <button type="button" onClick={roll} disabled={disabled || rolling !== null} aria-label="Zufällig auslosen, wer beginnt" style={{
            minHeight: 44, padding: "10px 14px", borderRadius: 999, fontSize: 15, fontWeight: 700, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", border: "1.5px solid rgb(var(--accent) / 0.6)",
            background: "rgb(var(--accent) / 0.14)", color: "rgb(var(--soft))",
          }}>
            <span aria-hidden style={{ display: "inline-block", marginRight: 6, animation: rolling !== null ? "spinRune 0.5s linear infinite" : "none" }}>🎲</span>
            Auslosen
          </button>
        )}
      </div>

      <p aria-live="polite" style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.5, color: "rgb(var(--ink) / 0.7)" }}>
        {rolling !== null ? "🎲 Wird ausgelost …" : (
          <><strong style={{ color: color.accent }}>{starter}</strong> beginnt in Runde 1, danach geht es reihum im Uhrzeigersinn.</>
        )}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 11.5, lineHeight: 1.5, color: "rgb(var(--ink) / 0.45)" }}>
        Jede Runde beginnt der Nächste, wer zuletzt ansagt, gibt. Zusammen dürfen die Ansagen nie genau die Kartenzahl ergeben.
      </p>
    </section>
  );
}
