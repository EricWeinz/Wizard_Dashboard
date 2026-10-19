import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useOnlineStore } from "./store.js";
import { getCell } from "./rules.js";
import { PLAYER_COLORS, cardsForRound } from "../lib/wizard.js";
import { useMediaQuery, trapTab } from "./ui.jsx";

const LABEL = { pred: "Ansage", act: "Stiche" };

/**
 * Zahlenauswahl für eine Zelle (statt Tippen): ein Wert = ein Schreibzugriff.
 * Mit `field` nur dieses Feld (Auswahl schließt), ohne `field` Ansage und
 * Stiche zusammen (kompakte Handy-Tabelle; bleibt offen bis „Fertig“).
 * Handy: Blatt am unteren Rand, Desktop: mittige Karte.
 */
export default function CellPicker({ targetId, roundIndex, field = null, onClose }) {
  const session = useOnlineStore((s) => s.session);
  const playerId = useOnlineStore((s) => s.playerId);
  const setCell = useOnlineStore((s) => s.setCell);
  const sheet = useMediaQuery("(max-width: 640px)");
  const titleId = useId();
  const firstRef = useRef(null);
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement; // z. B. die angetippte Zelle
    firstRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onCloseRef.current();
      else trapTab(e, dialogRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  const order = session?.playerOrder ?? [];
  const pi = order.indexOf(targetId);
  const player = session?.players?.[targetId];
  if (!session || !player || pi < 0) return null;

  const color = PLAYER_COLORS[pi] ?? PLAYER_COLORS[0];
  const total = session.totalRounds ?? 0;
  const cards = cardsForRound(roundIndex, total);
  const fields = field ? [field] : ["pred", "act"];
  const acts = order.map((id) => getCell(session, id, roundIndex, "act"));
  const actSum = acts.every((v) => v !== null) ? acts.reduce((s, v) => s + v, 0) : null;

  // Erwarteter Wert = der gerade angezeigte -> kein stilles Überschreiben fremder Einträge
  const choose = (f, value) => {
    const current = getCell(session, targetId, roundIndex, f);
    if (current !== value) setCell(targetId, roundIndex, f, value, current);
    if (field) onClose();
  };

  return createPortal(
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 300, display: "flex", justifyContent: "center",
      alignItems: sheet ? "flex-end" : "center", background: "rgba(5,3,17,0.72)", backdropFilter: "blur(6px)",
      animation: "fadeIn 0.2s ease-out",
    }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()} style={{
        width: sheet ? "100%" : "min(440px, calc(100% - 32px))",
        background: "rgba(15,10,35,0.98)", border: "1px solid rgba(192,132,252,0.22)",
        borderRadius: sheet ? "20px 20px 0 0" : 20,
        padding: sheet ? "18px 16px calc(18px + env(safe-area-inset-bottom))" : 22,
        boxShadow: "0 -10px 40px rgba(0,0,0,0.5)", animation: "fadeSlideIn 0.25s ease-out",
        fontFamily: "'DM Sans', sans-serif", color: "#fff",
      }}>
        <div id={titleId} style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: color.accent, textShadow: `0 0 10px ${color.glow}` }}>
            {player.name}{targetId === playerId ? " (du)" : ""}
          </span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Runde {roundIndex + 1} · {cards} {cards === 1 ? "Karte" : "Karten"}
          </span>
        </div>

        {fields.map((f, fi) => {
          const current = getCell(session, targetId, roundIndex, f);
          return (
            <section key={f} style={{ marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, minHeight: 40 }}>
                <span className="magic-label" style={{ margin: 0 }}>{LABEL[f]}</span>
                {current !== null && (
                  <button onClick={() => choose(f, null)} className="magic-btn-sm" style={{ minHeight: 40, padding: "8px 14px", fontSize: 12 }}
                    aria-label={`${LABEL[f]} von ${player.name} leeren`}>⌫ Leeren</button>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Array.from({ length: cards + 1 }, (_, v) => {
                  const selected = current === v;
                  return (
                    <button key={v} ref={fi === 0 && v === 0 ? firstRef : undefined} className="magic-chip"
                      aria-pressed={selected} aria-label={`${LABEL[f]} ${v} für ${player.name}`} onClick={() => choose(f, v)}
                      style={{
                        minWidth: 44, height: 44,
                        ...(selected ? { borderColor: color.accent, background: color.dim, color: "#fff", boxShadow: `0 0 12px ${color.glow}` } : {}),
                      }}>{v}</button>
                  );
                })}
              </div>
            </section>
          );
        })}

        {actSum !== null && actSum !== cards && (
          <p role="status" style={{ marginTop: 14, fontSize: 13, color: "#fca5a5" }}>
            ⚠ Die Stiche dieser Runde ergeben zusammen {actSum} statt {cards}.
          </p>
        )}
        <button onClick={onClose} className="magic-btn-secondary" style={{ width: "100%", marginTop: 18, padding: 12 }}>
          {field ? "Abbrechen" : "Fertig"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
