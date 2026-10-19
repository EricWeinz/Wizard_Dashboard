import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useOnlineStore } from "./store.js";
import { MAX_NAME_LENGTH } from "./rules.js";
import { textStyle, trapTab } from "./ui.jsx";
import { themeIcon } from "../lib/theme.js";
import ThemeLogo from "../components/ThemeLogo.jsx";

/**
 * Beitritts-Dialog nach dem Scannen des QR-Codes bzw. Öffnen eines
 * Einladungslinks: Name eingeben, „Mitspielen“ – fertig.
 */
export default function JoinPrompt({ code, onClose }) {
  const playerName = useOnlineStore((s) => s.playerName);
  const setPlayerName = useOnlineStore((s) => s.setPlayerName);
  const join = useOnlineStore((s) => s.join);
  const watch = useOnlineStore((s) => s.watch);
  const busy = useOnlineStore((s) => s.busy);
  const titleId = useId();
  const nameRef = useRef(null);
  const submitRef = useRef(null);
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Beim Öffnen: Fokus ins Namensfeld (oder auf „Mitspielen“, wenn der Name schon da ist); Escape schließt
  useEffect(() => {
    const previous = document.activeElement;
    (useOnlineStore.getState().playerName.trim() ? submitRef : nameRef).current?.focus();
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

  return createPortal(
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, background: "rgb(var(--bg) / 0.82)", backdropFilter: "blur(8px)", animation: "fadeIn 0.2s ease-out",
    }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}
        className="magic-card" style={{ maxWidth: 400, padding: "26px 22px", animation: "fadeSlideIn 0.3s ease-out" }}>
        <button onClick={onClose} aria-label="Schließen" style={{
          position: "absolute", top: 8, right: 8, background: "none", border: "none",
          color: "rgb(var(--ink) / 0.5)", fontSize: 16, cursor: "pointer", minWidth: 40, minHeight: 40,
        }}>✕</button>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div aria-hidden style={{ fontSize: 40, filter: "drop-shadow(0 0 16px rgb(var(--accent) / 0.4))" }}><ThemeLogo height={56} style={{ margin: "0 auto" }} fallback={themeIcon()} /></div>
          <h2 id={titleId} style={{ margin: "8px 0 0", fontFamily: "var(--font-label)", fontSize: 20, color: "rgb(var(--soft))", letterSpacing: 1 }}>
            Du wurdest eingeladen!
          </h2>
          <p style={{ ...textStyle, marginTop: 6 }}>
            Sitzung <span style={{ fontFamily: "var(--font-label)", fontWeight: 700, letterSpacing: 3, color: "rgb(var(--ink))" }}>{code}</span>
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); join(code); }}>
          <label className="magic-label" htmlFor="wiz-invite-name" style={{ textAlign: "center" }}>◈ Dein Name ◈</label>
          <input id="wiz-invite-name" ref={nameRef} className="magic-field" value={playerName}
            onChange={(e) => setPlayerName(e.target.value)} placeholder="Name eingeben"
            maxLength={MAX_NAME_LENGTH} autoComplete="nickname" />
          <button ref={submitRef} type="submit" className="magic-btn-primary" disabled={busy || !playerName.trim()}
            style={{ width: "100%", marginTop: 16, padding: "15px 12px" }}>
            {busy ? "Bitte warten …" : "✦ Mitspielen ✦"}
          </button>
        </form>
        <button type="button" onClick={() => watch(code)} disabled={busy} className="magic-btn-secondary"
          style={{ width: "100%", marginTop: 10, padding: "12px" }}>
          👀 Nur zuschauen
        </button>
        <button type="button" onClick={onClose} style={{
          display: "block", margin: "14px auto 0", background: "none", border: "none", cursor: "pointer",
          ...textStyle, textDecoration: "underline", textUnderlineOffset: 3,
        }}>Stattdessen neue Sitzung</button>
      </div>
    </div>,
    document.body,
  );
}
