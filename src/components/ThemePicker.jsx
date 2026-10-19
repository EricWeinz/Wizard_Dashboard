import React, { useEffect, useRef, useState } from "react";
import { THEMES, applyTheme, useTheme } from "../lib/theme.js";

/** Drei Farbpunkte als Vorschau eines Designs. */
function Swatch({ colors, size = 12 }) {
  return (
    <span aria-hidden style={{ display: "inline-flex", gap: 3 }}>
      {colors.map((c, i) => (
        <span key={i} style={{
          width: size, height: size, borderRadius: "50%", background: c,
          border: "1px solid rgb(var(--ink) / 0.25)", boxShadow: i === 1 ? `0 0 8px ${c}` : "none",
        }} />
      ))}
    </span>
  );
}

/** Symbol eines Designs in der Auswahl: kleines Wappen, falls vorhanden, sonst das Emoji. */
function ThemeBadge({ theme, size }) {
  const src = theme.favicon ?? theme.logo;
  if (src) return <img src={src} alt="" aria-hidden draggable={false} style={{ height: size + 4, width: "auto", display: "block" }} />;
  return <span aria-hidden style={{ fontSize: size }}>{theme.icon}</span>;
}

/** Raster aller Designs (Startseite) – wirkt sofort und wird im Browser gemerkt. */
export default function ThemePicker() {
  const theme = useTheme();
  return (
    <div className="magic-card" style={{ marginTop: 20, padding: "22px 20px" }}>
      <span className="magic-label">◈ Farbdesign ◈</span>
      <div role="radiogroup" aria-label="Farbdesign" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))", gap: 8 }}>
        {THEMES.map((t) => {
          const active = t.id === theme;
          return (
            <button key={t.id} type="button" role="radio" aria-checked={active} onClick={() => applyTheme(t.id)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minHeight: 64,
              padding: "10px 6px", borderRadius: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              border: `1.5px solid ${active ? "rgb(var(--accent))" : "rgb(var(--ink) / 0.08)"}`,
              background: active ? "rgb(var(--accent) / 0.12)" : "rgb(var(--ink) / 0.03)",
              boxShadow: active ? "0 0 18px rgb(var(--accent) / 0.25)" : "none", transition: "all 0.25s",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ThemeBadge theme={t} size={15} />
                <Swatch colors={t.swatch} />
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: active ? "rgb(var(--ink))" : "rgb(var(--ink) / 0.6)" }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Kompaktes Design-Menü (🎨) für Kopfzeilen und Karten: öffnet eine kleine
 * Liste, schließt bei Klick daneben oder mit Escape – wie beim Kniffel Dashboard.
 */
const MENU_WIDTH = 210;

export function ThemeMenu({ style }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [alignLeft, setAlignLeft] = useState(false);
  const ref = useRef(null);

  // Steht der Knopf weit links (z. B. umgebrochene Kopfzeile am Handy), klappt das Menü nach rechts auf
  const toggle = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setAlignLeft(rect.right - MENU_WIDTH < 8);
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <button onClick={toggle} className="magic-btn-sm" aria-haspopup="menu" aria-expanded={open}
        aria-label="Farbdesign ändern" title="Farbdesign ändern">🎨</button>
      {open && (
        <div role="menu" aria-label="Farbdesign" style={{
          position: "absolute", ...(alignLeft ? { left: 0 } : { right: 0 }), top: "calc(100% + 8px)", zIndex: 60,
          width: MENU_WIDTH, maxWidth: "calc(100vw - 16px)", maxHeight: "70vh", overflowY: "auto",
          padding: 6, borderRadius: 16, background: "rgb(var(--s-dialog) / 0.98)", border: "1px solid rgb(var(--accent) / 0.25)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)", animation: "fadeIn 0.15s ease-out", fontFamily: "'DM Sans', sans-serif",
        }}>
          {THEMES.map((t) => {
            const active = t.id === theme;
            return (
              <button key={t.id} type="button" role="menuitemradio" aria-checked={active}
                onClick={() => { applyTheme(t.id); setOpen(false); }} style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", minHeight: 40, padding: "6px 10px",
                  borderRadius: 10, cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: 600,
                  border: `1px solid ${active ? "rgb(var(--accent) / 0.5)" : "transparent"}`,
                  background: active ? "rgb(var(--accent) / 0.12)" : "transparent", color: "rgb(var(--ink) / 0.85)",
                }}>
                <ThemeBadge theme={t} size={13} />
                <span style={{ flex: 1 }}>{t.label}</span>
                <Swatch colors={t.swatch} size={10} />
                {active && <span aria-hidden style={{ color: "rgb(var(--accent))" }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
