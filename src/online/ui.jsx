import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ThemeLogo from "../components/ThemeLogo.jsx";

/* ════════════════════════════════════════════
   KLEINE BAUSTEINE FÜR DIE ONLINE-SCREENS
   ════════════════════════════════════════════ */

/** Grundgerüst eines Online-Screens (Animation mit `backwards`, damit fixierte Kinder am Bildschirm hängen). */
export const screenStyle = {
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  minHeight: "100vh", padding: "32px 16px", position: "relative", zIndex: 1,
  animation: "portalIn 0.8s ease-out backwards",
};

export const textStyle = { fontFamily: "'DM Sans', sans-serif", color: "rgb(var(--ink) / 0.55)", fontSize: 13, lineHeight: 1.5 };

/** true, solange die Medienabfrage zutrifft (reagiert auf Größenänderungen). */
export function useMediaQuery(query) {
  const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [query]);
  return matches;
}

export const inviteUrl = (code) => `${window.location.origin}${window.location.pathname}?code=${code}`;

/**
 * In die Zwischenablage kopieren. Ohne Berechtigung (z. B. per http im WLAN)
 * erscheint der Text zum manuellen Kopieren. true = wirklich kopiert.
 */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    window.prompt("Zum Kopieren markieren:", text);
    return false;
  }
}

/** Tab bleibt im Dialog: vom letzten zum ersten Element springen und umgekehrt. */
export function trapTab(event, container) {
  if (event.key !== "Tab" || !container) return;
  const items = [...container.querySelectorAll("button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])")];
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
  }
}

/** „Anna“, „Anna und Ben“, „Anna, Ben und Carl“ */
export function joinNames(names) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} und ${names[names.length - 1]}`;
}

/**
 * Gemeinsamer Stapel oben mittig: Mehrere Meldungen (z. B. Fehler + Änderungshinweis)
 * stehen untereinander statt sich zu überdecken.
 */
function toastStack() {
  let el = document.getElementById("wizard-toasts");
  if (!el) {
    el = document.createElement("div");
    el.id = "wizard-toasts";
    Object.assign(el.style, {
      position: "fixed", top: "16px", left: "50%", transform: "translateX(-50%)", zIndex: "400",
      width: "min(440px, calc(100% - 32px))", display: "flex", flexDirection: "column", gap: "8px",
      pointerEvents: "none",
    });
    document.body.appendChild(el);
  }
  return el;
}

/** Meldung oben mittig (per Portal, damit sie am Bildschirm statt am Screen hängt). */
export function Toast({ tone = "error", children, onClose }) {
  const error = tone === "error";
  return createPortal(
    <div role={error ? "alert" : "status"} style={{
      // Nur das ✕ fängt Tipps ab – die Knöpfe der Kopfzeile darunter bleiben bedienbar
      pointerEvents: "none", display: "flex", alignItems: "flex-start", gap: 10,
      padding: "12px 14px", borderRadius: 14,
      background: error ? "rgb(var(--s-error) / 0.97)" : "rgb(var(--s-info) / 0.97)",
      border: `1px solid ${error ? "rgb(var(--danger) / 0.45)" : "rgb(var(--accent) / 0.4)"}`,
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)", animation: "fadeSlideIn 0.3s ease-out",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <span aria-hidden style={{ fontSize: 16, lineHeight: 1.4 }}>{error ? "⚠️" : "✎"}</span>
      <p style={{ flex: 1, margin: 0, fontSize: 14, lineHeight: 1.45, color: error ? "rgb(var(--danger-text-2))" : "rgb(var(--soft))" }}>{children}</p>
      {onClose && (
        <button onClick={onClose} aria-label="Meldung schließen" style={{
          pointerEvents: "auto", background: "none", border: "none", color: "rgb(var(--ink) / 0.6)", fontSize: 15,
          cursor: "pointer", minWidth: 40, minHeight: 40, margin: "-10px -8px -10px 0", lineHeight: 1,
        }}>✕</button>
      )}
    </div>,
    toastStack(),
  );
}

/** Kleiner Kopf der Online-Screens: „Wizard“ + Untertitel. */
export function OnlineTitle({ subtitle }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      <ThemeLogo height={64} style={{ margin: "0 auto 10px" }} />
      <h1 className="brand-title" style={{
        fontSize: "clamp(40px, 9vw, 60px)", fontFamily: "var(--font-title)", margin: 0, lineHeight: 1.1,
        background: "linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-mid)) 50%, rgb(var(--accent-2)) 100%)",
        backgroundSize: "200% 200%", animation: "shimmer 4s ease-in-out infinite",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        filter: "drop-shadow(0 0 20px rgb(var(--accent) / 0.25))",
      }}>Wizard</h1>
      <div style={{
        fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "rgb(var(--accent) / 0.5)",
        marginTop: 8, fontFamily: "var(--font-label)",
      }}>✦ {subtitle} ✦</div>
    </div>
  );
}

/** Drehende Rune als Ladeanzeige. */
export function Spinner({ label }) {
  return (
    <div role="status" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div aria-hidden style={{ fontSize: 40, color: "rgb(var(--accent) / 0.6)", animation: "spinRune 3s linear infinite" }}>ᛟ</div>
      <div style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "rgb(var(--accent) / 0.6)", fontFamily: "var(--font-label)", textAlign: "center" }}>{label}</div>
    </div>
  );
}
