import React, { useState } from "react";
import QRCode from "react-qr-code";
import { useOnlineStore } from "./store.js";
import { effectivePlayerOrder, isHostAway, startPlayerOf, MAX_NAME_LENGTH } from "./rules.js";
import { PLAYER_COLORS, ROUNDS_MAP, MIN_PLAYERS, MAX_PLAYERS } from "../lib/wizard.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { ThemeMenu } from "../components/ThemePicker.jsx";
import StartPlayerPicker from "../components/StartPlayerPicker.jsx";
import { screenStyle, textStyle, OnlineTitle, copyText, inviteUrl } from "./ui.jsx";

const smallBtn = { padding: "6px 9px", fontSize: 12, lineHeight: 1, minWidth: 40, minHeight: 40 };

/* ════════════════════════════════════════════
   WARTERAUM: Code teilen, Mitspieler sehen, Sitzordnung, Gäste, Start
   ════════════════════════════════════════════ */
export default function WaitingRoom() {
  const session = useOnlineStore((s) => s.session);
  const sessionCode = useOnlineStore((s) => s.sessionCode);
  const playerId = useOnlineStore((s) => s.playerId);
  const spectating = useOnlineStore((s) => s.spectating);
  const busy = useOnlineStore((s) => s.busy);
  const reorderPlayers = useOnlineStore((s) => s.reorderPlayers);
  const addGuest = useOnlineStore((s) => s.addGuest);
  const removeFromLobby = useOnlineStore((s) => s.removeFromLobby);
  const start = useOnlineStore((s) => s.start);
  const setStartPlayer = useOnlineStore((s) => s.setStartPlayer);
  const claimHost = useOnlineStore((s) => s.claimHost);
  const leave = useOnlineStore((s) => s.leave);

  const [copied, setCopied] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [confirm, setConfirm] = useState(null);

  if (!session || !sessionCode) return null;

  const isHost = !spectating && session.hostId === playerId;
  const order = effectivePlayerOrder(session);
  const count = order.length;
  const hostName = session.players?.[session.hostId]?.name ?? "?";
  const url = inviteUrl(sessionCode);
  const canStart = count >= MIN_PLAYERS && count <= MAX_PLAYERS;
  const starter = startPlayerOf(session);
  const starterName = session.players?.[starter]?.name ?? "?";

  // Nachbarn tauschen und die neue Reihenfolge speichern (nur Spielleitung)
  const move = (index, dir) => {
    const target = index + dir;
    if (busy || target < 0 || target >= count) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    reorderPlayers(next);
  };

  const copy = async (what) => {
    if (await copyText(what === "code" ? sessionCode : url)) {
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const submitGuest = async (e) => {
    e.preventDefault();
    const name = guestName.trim();
    if (!name) return;
    await addGuest(name);
    if (!useOnlineStore.getState().error) setGuestName("");
  };

  const runConfirmed = async () => {
    const c = confirm;
    setConfirm(null);
    await c?.action();
  };

  return (
    <div style={screenStyle}>
      <ThemeMenu style={{ position: "absolute", top: 16, right: 16, zIndex: 5 }} />
      <OnlineTitle subtitle="Warteraum" />

      <div className="magic-card" style={{ padding: "26px 18px" }}>
        {/* Wer beginnt? Ganz oben, damit es niemand übersieht (Ansage reihum, Beginn rückt jede Runde weiter) */}
        {count > 0 && (
          <div style={{ marginBottom: 26 }}>
            <StartPlayerPicker
              names={order.map((id) => session.players[id].name)}
              selected={Math.max(0, order.indexOf(starter))}
              onSelect={(i) => setStartPlayer(order[i])}
              readOnly={!isHost}
              disabled={busy}
              chosen={Boolean(session.startPlayerId)}
              note={spectating ? "Legt die Spielleitung fest." : `${hostName} legt das als Spielleitung fest.`}
            />
          </div>
        )}

        {/* Einladen */}
        <div style={{ textAlign: "center" }}>
          <span className="magic-label">◈ Mitspieler einladen ◈</span>
          <p style={{ ...textStyle, marginTop: -6 }}>Code weitergeben, Link teilen oder QR-Code scannen.</p>
          <div role="img" aria-label={`Sitzungscode ${sessionCode.split("").join(" ")}`}
            style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
            {sessionCode.split("").map((ch, i) => (
              <span key={i} aria-hidden style={{
                width: 42, height: 52, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 10, border: "1.5px solid rgb(var(--accent) / 0.3)", background: "rgb(var(--accent) / 0.08)",
                fontFamily: "var(--font-label)", fontSize: 24, fontWeight: 700, color: "rgb(var(--soft-2))",
                boxShadow: "0 0 16px rgb(var(--accent) / 0.12)",
              }}>{ch}</span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button onClick={() => copy("code")} className="magic-btn-sm">{copied === "code" ? "✅ Kopiert" : "📋 Code kopieren"}</button>
            <button onClick={() => copy("link")} className="magic-btn-sm">{copied === "link" ? "✅ Kopiert" : "🔗 Link kopieren"}</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 16 }}>
            <div style={{ background: "#fff", padding: 10, borderRadius: 14, boxShadow: "0 0 30px rgb(var(--accent) / 0.2)" }}>
              <QRCode value={url} size={148} fgColor="#0a0616" bgColor="#ffffff" title={`QR-Code für Sitzung ${sessionCode}`} />
            </div>
            <p style={{ ...textStyle, fontSize: 12 }}>📱 Mit der Handykamera scannen, um direkt beizutreten</p>
          </div>
        </div>

        {/* Spieler */}
        <span className="magic-label" style={{ marginTop: 24 }}>◈ Spieler ({count}/{MAX_PLAYERS}) ◈</span>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {order.map((id, i) => {
            const p = session.players[id];
            const offline = !p.guest && p.online !== true;
            const color = PLAYER_COLORS[i] ?? PLAYER_COLORS[0];
            return (
              <li key={id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 12,
                border: "1px solid rgb(var(--ink) / 0.06)", background: "rgb(var(--ink) / 0.025)",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <span style={{ width: 16, fontSize: 12, color: "rgb(var(--ink) / 0.3)", textAlign: "right", flexShrink: 0 }}>{i + 1}.</span>
                <span aria-hidden style={{ width: 10, height: 10, borderRadius: "50%", background: color.accent, boxShadow: `0 0 8px ${color.glow}`, flexShrink: 0 }} />
                <span style={{
                  flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontSize: 15, fontWeight: 600, color: offline ? "rgb(var(--ink) / 0.4)" : "rgb(var(--ink))",
                }}>
                  {p.name}
                  {id === playerId && <span style={{ color: "rgb(var(--ink) / 0.4)", fontWeight: 400 }}> (du)</span>}
                </span>
                {id === starter && <span title="Sagt in Runde 1 zuerst an" aria-label="beginnt" style={{ fontSize: 13 }}>☝️</span>}
                {p.guest && <span title="Spieler ohne Handy" aria-label="ohne Handy" style={{ fontSize: 13 }}>👤</span>}
                {offline && <span style={{ fontSize: 10, color: "rgb(var(--ink) / 0.4)", border: "1px solid rgb(var(--ink) / 0.15)", borderRadius: 6, padding: "1px 5px" }}>offline</span>}
                {id === session.hostId && <span title="Spielleitung" aria-label="Spielleitung" style={{ fontSize: 14 }}>🪄</span>}
                {isHost && count > 1 && (
                  <span style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label={`${p.name} nach oben`} className="magic-btn-sm" style={smallBtn}>▲</button>
                    <button onClick={() => move(i, 1)} disabled={busy || i === count - 1} aria-label={`${p.name} nach unten`} className="magic-btn-sm" style={smallBtn}>▼</button>
                  </span>
                )}
                {isHost && id !== playerId && (
                  <button aria-label={`${p.name} entfernen`} className="magic-btn-sm" style={smallBtn} disabled={busy}
                    onClick={() => setConfirm({
                      message: `${p.name} aus der Sitzung entfernen?`, confirmLabel: "Entfernen", tone: "danger", icon: "✕",
                      action: () => removeFromLobby(id),
                    })}>✕</button>
                )}
              </li>
            );
          })}
          {Array.from({ length: Math.max(0, MAX_PLAYERS - count) }, (_, i) => (
            <li key={`free-${i}`} style={{
              padding: "9px 12px", borderRadius: 12, border: "1px dashed rgb(var(--ink) / 0.08)",
              ...textStyle, fontSize: 13, color: "rgb(var(--ink) / 0.22)",
            }}>Freier Platz</li>
          ))}
        </ul>

        {isHost && (
          <>
            {count < MAX_PLAYERS && (
              <form onSubmit={submitGuest} style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <input className="magic-field" value={guestName} onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Spieler ohne Handy" aria-label="Name eines Spielers ohne Handy"
                  maxLength={MAX_NAME_LENGTH} style={{ flex: 1, minWidth: 0, padding: "11px 14px" }} />
                <button type="submit" className="magic-btn-secondary" disabled={busy || !guestName.trim()}
                  style={{ padding: "10px 14px", flexShrink: 0 }} aria-label="Spieler ohne Handy hinzufügen">＋ Hinzufügen</button>
              </form>
            )}
            {count > 1 && (
              <p style={{ ...textStyle, fontSize: 12, marginTop: 10, textAlign: "center" }}>
                ↕️ Reihenfolge = Sitzordnung im Uhrzeigersinn.
              </p>
            )}
          </>
        )}

        {/* Start / Warten */}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          {spectating ? (
            <p style={{ ...textStyle, textAlign: "center", padding: "12px", borderRadius: 12, background: "rgb(var(--ink) / 0.04)" }}>
              👀 Du schaust zu – Mitspieler treten mit dem Code bei.
            </p>
          ) : isHost ? (
            <>
              <button onClick={() => start()} disabled={busy || !canStart} className="magic-btn-primary" style={{ width: "100%", padding: "15px 12px" }}>
                ✦ Spiel starten ✦
                <span style={{ display: "block", fontSize: 11, letterSpacing: 1, textTransform: "none", opacity: 0.8, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                  {count} Spieler{canStart ? ` · ${ROUNDS_MAP[count]} Runden · ${starterName} beginnt` : ""}
                </span>
              </button>
              {count < MIN_PLAYERS && (
                <p style={{ ...textStyle, textAlign: "center", color: "rgb(var(--gold) / 0.75)" }}>Wizard braucht mindestens {MIN_PLAYERS} Spieler.</p>
              )}
            </>
          ) : (
            <>
              <p style={{ ...textStyle, textAlign: "center", padding: "12px", borderRadius: 12, background: "rgb(var(--ink) / 0.04)" }}>
                ⏳ Warten, bis {hostName} das Spiel startet …
              </p>
              {isHostAway(session) && (
                <button className="magic-btn-secondary" style={{ width: "100%" }} disabled={busy}
                  onClick={() => setConfirm({
                    message: `${hostName} ist gerade nicht verbunden. Spielleitung übernehmen?`,
                    confirmLabel: "Übernehmen", tone: "neutral", icon: "🪄", action: claimHost,
                  })}>🪄 Spielleitung übernehmen</button>
              )}
            </>
          )}
          <button onClick={() => leave()} className="magic-btn-secondary" style={{ width: "100%" }}>Sitzung verlassen</button>
        </div>
      </div>

      {confirm && (
        <ConfirmDialog message={confirm.message} confirmLabel={confirm.confirmLabel} tone={confirm.tone} icon={confirm.icon}
          onConfirm={runConfirmed} onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
}
