import React, { useState } from "react";
import { useOnlineStore } from "./store.js";
import { CODE_LENGTH, MAX_NAME_LENGTH, normalizeCode } from "./rules.js";
import { inviteCodeFromUrl } from "./keys.js";
import { clearInviteParam } from "./store.js";
import { screenStyle, textStyle, OnlineTitle } from "./ui.jsx";
import JoinPrompt from "./JoinPrompt.jsx";

/* ════════════════════════════════════════════
   ONLINE-STARTSEITE: Name, Sitzung erstellen, beitreten oder zuschauen
   ════════════════════════════════════════════ */
export default function OnlineLobby({ onBack }) {
  const playerName = useOnlineStore((s) => s.playerName);
  const setPlayerName = useOnlineStore((s) => s.setPlayerName);
  const create = useOnlineStore((s) => s.create);
  const join = useOnlineStore((s) => s.join);
  const watch = useOnlineStore((s) => s.watch);
  const busy = useOnlineStore((s) => s.busy);

  // Einladungslinks haben die Form …/?code=ABC234 -> Feld vorbelegen und Dialog zeigen
  const [joinCode, setJoinCode] = useState(() => inviteCodeFromUrl() ?? "");
  const [showPrompt, setShowPrompt] = useState(() => Boolean(inviteCodeFromUrl()));
  const codeReady = joinCode.length === CODE_LENGTH;

  return (
    <div style={screenStyle}>
      <OnlineTitle subtitle="Online-Sitzung" />

      <div className="magic-card" style={{ padding: "28px 22px" }}>
        <label className="magic-label" htmlFor="wiz-player-name">◈ Dein Name ◈</label>
        <input id="wiz-player-name" className="magic-field" value={playerName}
          onChange={(e) => setPlayerName(e.target.value)} placeholder="Name eingeben"
          maxLength={MAX_NAME_LENGTH} autoComplete="nickname" />

        <form onSubmit={(e) => { e.preventDefault(); create(); }} style={{ marginTop: 18 }}>
          <button type="submit" className="magic-btn-primary" disabled={busy} style={{ width: "100%", padding: "16px 12px" }}>
            {busy ? "Bitte warten …" : "✦ Neue Sitzung erstellen ✦"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0", ...textStyle, fontSize: 12 }}>
          <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />oder
          <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); join(joinCode); }} style={{ display: "flex", gap: 8 }}>
          <input aria-label="Sitzungscode" className="magic-field" value={joinCode}
            onChange={(e) => setJoinCode(normalizeCode(e.target.value).slice(0, CODE_LENGTH))}
            placeholder="CODE" autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false}
            style={{ flex: 1, minWidth: 0, textAlign: "center", letterSpacing: 6, fontFamily: "'Cinzel', serif", fontWeight: 700, textTransform: "uppercase" }} />
          <button type="submit" className="magic-btn-secondary" disabled={busy || !codeReady} style={{ padding: "12px 16px", flexShrink: 0 }}>
            Beitreten
          </button>
        </form>
        <button type="button" onClick={() => watch(joinCode)} disabled={busy || !codeReady}
          className="magic-btn-sm" style={{ width: "100%", marginTop: 10, padding: "10px 12px" }}>
          👀 Nur zuschauen
        </button>
        <p style={{ ...textStyle, fontSize: 11, textAlign: "center", marginTop: 6, color: "rgba(255,255,255,0.3)" }}>
          z. B. für einen Fernseher – zählt nicht als Mitspieler
        </p>
      </div>

      <button onClick={onBack} className="magic-btn-secondary" style={{ marginTop: 24 }}>◁ Zurück</button>
      <p style={{ ...textStyle, fontSize: 12, marginTop: 18, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
        Code oder QR-Code teilen – alle sehen jeden Eintrag sofort.
      </p>

      {showPrompt && codeReady && (
        <JoinPrompt code={joinCode} onClose={() => { setShowPrompt(false); clearInviteParam(); }} />
      )}
    </div>
  );
}
