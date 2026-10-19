import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useOnlineStore } from "./store.js";
import { toBoard, canEditPlayer, isHostAway, lastTouchedRound, trickSumMismatches, getCell, roundBids } from "./rules.js";
import { computeGameStats, cardsForRound } from "../lib/wizard.js";
import GameBoard from "../components/GameBoard.jsx";
import WinnerScreen from "../components/WinnerScreen.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import SessionCodeBadge from "./SessionCodeBadge.jsx";
import RoundBar from "./RoundBar.jsx";
import CellPicker from "./CellPicker.jsx";
import { useMediaQuery, Toast } from "./ui.jsx";

const FIELD = { pred: "Ansage", act: "Stiche" };
const OWN = { pred: "die eigene Ansage", act: "die eigenen Stiche" };
const NOOP = () => {};

const chipStyle = {
  fontSize: 10, padding: "2px 7px", borderRadius: 999, whiteSpace: "nowrap",
  border: "1px solid rgb(var(--ink) / 0.15)", color: "rgb(var(--ink) / 0.55)", fontFamily: "'DM Sans', sans-serif",
};

/** „✎ Ben hat die Ansage von Carla in Runde 5 von 2 auf 3 geändert.“ */
function describeEdit(session, edit, me) {
  const by = session.players?.[edit.by]?.name ?? "Jemand";
  const field = FIELD[edit.field] ?? "Wert";
  const whose = edit.target === me ? `deine ${field}`
    : edit.target === edit.by ? (OWN[edit.field] ?? `den eigenen Wert`)
    : `die ${field} von ${session.players?.[edit.target]?.name ?? "?"}`;
  const change = edit.to === undefined || edit.to === null
    ? `gelöscht (war ${edit.from})`
    : `von ${edit.from} auf ${edit.to} geändert`;
  return `${by} hat ${whose} in Runde ${edit.ri + 1} ${change}.`;
}

/* ════════════════════════════════════════════
   LAUFENDES ONLINE-SPIEL (Tabelle, Eingabeleiste, Siegerehrung)
   ════════════════════════════════════════════ */
export default function OnlineGame() {
  const session = useOnlineStore((s) => s.session);
  const sessionCode = useOnlineStore((s) => s.sessionCode);
  const playerId = useOnlineStore((s) => s.playerId);
  const spectating = useOnlineStore((s) => s.spectating);
  const connected = useOnlineStore((s) => s.connected);
  const undoCount = useOnlineStore((s) => s.undoStack.length);
  const undo = useOnlineStore((s) => s.undo);
  const startRematch = useOnlineStore((s) => s.startRematch);
  const backToLobby = useOnlineStore((s) => s.backToLobby);
  const claimHost = useOnlineStore((s) => s.claimHost);
  const leave = useOnlineStore((s) => s.leave);

  const compact = useMediaQuery("(max-width: 640px)");
  const [showChart, setShowChart] = useState(false);
  const [view, setView] = useState("table");
  const [picker, setPicker] = useState(null); // { id, ri, field|null }
  const [confirm, setConfirm] = useState(null);
  const [barHeight, setBarHeight] = useState(0);
  const [editNote, setEditNote] = useState(null);
  const autoShownFor = useRef(null);
  const prevStartedAt = useRef(session?.startedAt);
  const seenEditAt = useRef(session?.lastEdit?.at ?? null);

  const board = useMemo(() => toBoard(session), [session]);
  const n = board.ids.length;
  const total = board.totalRounds;
  const stats = useMemo(() => computeGameStats(board.data, n, total), [board, n, total]);
  const myIndex = board.ids.indexOf(playerId);
  const isMember = !spectating && myIndex >= 0;
  const isHost = isMember && session?.hostId === playerId;
  const finished = session?.state === "finished";
  const startedAt = session?.startedAt;
  const mismatches = useMemo(() => trickSumMismatches(session), [session]);

  // Aktuelle Runde: die höchste begonnene Runde (bzw. die nächste, wenn sie vollständig ist).
  // Lücken in alten Runden ziehen niemanden zurück, sie werden in der Leiste angezeigt.
  const currentRound = useMemo(() => {
    if (total === 0) return 0;
    const last = lastTouchedRound(session);
    if (last < 0) return 0;
    return stats.roundComplete(last) ? Math.min(last + 1, total - 1) : last;
  }, [session, stats, total]);

  const gaps = useMemo(() => {
    const out = [];
    for (let ri = 0; ri < currentRound; ri++) {
      const missingPred = board.ids.filter((id) => getCell(session, id, ri, "pred") === null);
      const missingAct = board.ids.filter((id) => getCell(session, id, ri, "act") === null);
      if (missingPred.length || missingAct.length) out.push({ ri, missingPred, missingAct });
    }
    return out;
  }, [session, board, currentRound]);

  // Rechte + Ansage-Regeln: Ansagen nur der Reihe nach (vorhandene korrigierbar), Stiche erst nach
  // gültigen Ansagen. Ohne field (kompakte Zelle) entscheidet die Zahlenauswahl im Detail.
  const canEdit = useCallback((pi, ri, field) => {
    const id = board.ids[pi];
    if (!isMember || ri > currentRound || !canEditPlayer(session, playerId, id)) return false;
    if (field === "pred") return getCell(session, id, ri, "pred") !== null || roundBids(session, ri).nextId === id;
    if (field === "act") {
      if (getCell(session, id, ri, "act") !== null) return true;
      const bids = roundBids(session, ri);
      return bids.allIn && !bids.violation;
    }
    return true;
  }, [isMember, currentRound, session, playerId, board]);
  const currentBids = useMemo(() => roundBids(session, currentRound), [session, currentRound]);
  const turnCell = !finished && currentBids.nextId ? { pi: board.ids.indexOf(currentBids.nextId), ri: currentRound } : null;
  // Wer als Letztes ansagt, sieht den verbotenen Wert schon im leeren Feld („≠2“)
  const cellPlaceholder = (pi, ri, field) => {
    const id = board.ids[pi];
    if (field !== "pred" || getCell(session, id, ri, "pred") !== null) return null;
    const bids = roundBids(session, ri);
    if (bids.nextId !== id) return null;
    const forbidden = bids.forbiddenFor(id);
    return forbidden === null ? null : `≠${forbidden}`;
  };

  // Siegerehrung automatisch – genau einmal je Spiel und nur, wenn alle Stich-Summen stimmen
  useEffect(() => {
    if (finished && mismatches.length === 0 && autoShownFor.current !== startedAt) {
      autoShownFor.current = startedAt;
      setView("winner");
    }
  }, [finished, mismatches.length, startedAt]);

  // Siegerehrung immer von oben zeigen (man war evtl. weit unten in der Tabelle);
  // eine offene Zahlenauswahl gehört zur Tabelle und wird geschlossen
  useLayoutEffect(() => {
    if (view !== "winner") return;
    window.scrollTo(0, 0);
    setPicker(null);
  }, [view]);

  // Neues Spiel (Revanche): zurück zur Tabelle, offene Auswahl schließen
  useEffect(() => {
    if (prevStartedAt.current === startedAt) return;
    prevStartedAt.current = startedAt;
    setView("table");
    setPicker(null);
  }, [startedAt]);

  // Auswahl schließen, wenn das Feld nicht mehr bearbeitet werden darf (z. B. Spieler wieder online)
  useEffect(() => {
    if (!picker || !session) return;
    if (!(isMember && picker.ri <= currentRound && canEditPlayer(session, playerId, picker.id))) setPicker(null);
  }, [picker, session, isMember, currentRound, playerId]);

  // Korrekturen anderer für alle sichtbar machen
  const lastEdit = session?.lastEdit;
  useEffect(() => {
    const at = lastEdit?.at ?? null;
    if (at === seenEditAt.current) return;
    seenEditAt.current = at;
    if (!lastEdit || lastEdit.by === playerId || !session) return;
    setEditNote(describeEdit(session, lastEdit, playerId));
  }, [lastEdit?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!editNote) return undefined;
    const timer = setTimeout(() => setEditNote(null), 5000);
    return () => clearTimeout(timer);
  }, [editNote]);

  if (!session || !sessionCode) return null;

  const hostName = session.players?.[session.hostId]?.name ?? "?";
  const hostAway = isHostAway(session);
  const leaveCfg = {
    message: "Sitzung verlassen? Deine Werte bleiben erhalten – mit dem Code kommst du jederzeit zurück.",
    confirmLabel: "Verlassen", tone: "neutral", icon: "🚪", action: leave,
  };
  const lobbyCfg = {
    message: "Zurück in die Lobby? Alle Einträge dieser Partie werden für alle gelöscht – danach können Spieler dazukommen oder gehen.",
    confirmLabel: "Zur Lobby", tone: "danger", icon: "👥", action: backToLobby,
  };
  const rematchCfg = {
    message: "Neue Partie mit denselben Spielern starten? Die Ergebnisse dieser Partie werden für alle gelöscht.",
    confirmLabel: "Revanche starten", tone: "danger", icon: "🔄", action: startRematch,
  };
  const claimCfg = {
    message: `${hostName} ist gerade nicht verbunden. Spielleitung übernehmen?`,
    confirmLabel: "Übernehmen", tone: "neutral", icon: "🪄", action: claimHost,
  };
  const onLeave = () => (spectating ? leave() : setConfirm(leaveCfg));

  const confirmEl = confirm && (
    <ConfirmDialog message={confirm.message} confirmLabel={confirm.confirmLabel} tone={confirm.tone} icon={confirm.icon}
      onCancel={() => setConfirm(null)}
      onConfirm={async () => { const c = confirm; setConfirm(null); await c.action(); }} />
  );
  const noteEl = editNote && <Toast tone="info" onClose={() => setEditNote(null)}>{editNote}</Toast>;

  /* ── Siegerehrung ── */
  if (view === "winner") {
    const notices = [];
    if (!finished) notices.push("✎ Es wird gerade korrigiert – die Rangliste aktualisiert sich live.");
    for (const ri of mismatches) {
      const s = board.ids.reduce((acc, id) => acc + (getCell(session, id, ri, "act") ?? 0), 0);
      notices.push(`⚠ Runde ${ri + 1}: zusammen ${s} statt ${cardsForRound(ri, total)} Stiche – bitte prüfen.`);
    }
    const hint = { width: "100%", textAlign: "center", fontSize: 13, color: "rgb(var(--ink) / 0.45)", fontFamily: "'DM Sans', sans-serif", margin: 0 };
    return (
      <>
        <WinnerScreen
          playerNames={board.names} totals={stats.totals} correctPreds={stats.correctPreds} completedRounds={stats.completedRounds}
          highlightIndex={isMember ? myIndex : null}
          notice={notices.length ? notices.map((t, i) => <div key={i}>{t}</div>) : null}
          actions={<>
            <button onClick={() => setView("table")} className="magic-btn-secondary">◁ Zurück zur Tabelle</button>
            {isHost && finished && <button onClick={() => setConfirm(rematchCfg)} className="magic-btn-primary">🔄 Revanche</button>}
            {isHost && !finished && <p style={hint}>Revanche ist nach der Korrektur wieder möglich.</p>}
            {isHost && <button onClick={() => setConfirm(lobbyCfg)} className="magic-btn-secondary">👥 Spieler ändern</button>}
            {!isHost && !spectating && <p style={hint}>{hostName} kann eine Revanche starten.</p>}
            {isMember && !isHost && hostAway && (
              <button onClick={() => setConfirm(claimCfg)} className="magic-btn-secondary">🪄 Spielleitung übernehmen</button>
            )}
            <button onClick={onLeave} className="magic-btn-secondary">Sitzung verlassen</button>
          </>}
        />
        {confirmEl}
        {noteEl}
      </>
    );
  }

  /* ── Tabelle ── */
  const renderPlayerBadge = (pi) => {
    const id = board.ids[pi];
    const p = session.players[id];
    return (
      <>
        {id === session.hostId && <span title="Spielleitung" aria-label="Spielleitung" style={{ fontSize: 11 }}>🪄</span>}
        {p?.guest && <span title="Spieler ohne Handy" aria-label="ohne Handy" style={{ fontSize: 11 }}>👤</span>}
        {p && !p.guest && p.online !== true && <span title="offline – Gerät nicht verbunden" aria-label="offline" style={{ fontSize: 11, opacity: 0.75 }}>📴</span>}
        {pi === myIndex && isMember && <span style={{ fontSize: 10, color: "rgb(var(--ink) / 0.35)", whiteSpace: "nowrap" }}>(du)</span>}
      </>
    );
  };

  const leading = (
    <>
      <SessionCodeBadge code={sessionCode} compact={compact} />
      {isMember && (
        <button onClick={() => undo()} disabled={!undoCount} className="magic-btn-sm" aria-label="Meine letzte Änderung zurücknehmen"
          title="Meine letzte Änderung zurücknehmen" style={{ opacity: undoCount ? 1 : 0.35 }}>↩</button>
      )}
    </>
  );
  const trailing = (
    <>
      {finished && (
        <button onClick={() => setView("winner")} className="magic-btn-gold" aria-label="Ergebnis ansehen">🏆{compact ? "" : " Ergebnis"}</button>
      )}
      {isHost && (
        <button onClick={() => setConfirm(lobbyCfg)} className="magic-btn-sm" aria-label="Zurück in die Lobby" title="Zurück in die Lobby">👥</button>
      )}
      {isMember && !isHost && hostAway && (
        <button onClick={() => setConfirm(claimCfg)} className="magic-btn-sm" aria-label="Spielleitung übernehmen" title="Spielleitung übernehmen">🪄</button>
      )}
      <button onClick={onLeave} className="magic-btn-sm" aria-label="Sitzung verlassen" title="Sitzung verlassen">✕</button>
    </>
  );
  const headerExtra = (
    <>
      {spectating && <span style={chipStyle}>👀 Zuschauer</span>}
      {!connected && <span style={{ ...chipStyle, borderColor: "rgb(var(--danger) / 0.5)", color: "rgb(var(--danger-text))" }}>offline</span>}
    </>
  );

  return (
    <>
      <GameBoard
        playerNames={board.names} data={board.data} totalRounds={total}
        canEdit={canEdit} onCellChange={NOOP}
        onCellClick={(pi, ri, field) => setPicker({ id: board.ids[pi], ri, field })}
        leadingActions={leading} trailingActions={trailing} headerExtra={headerExtra}
        renderPlayerBadge={renderPlayerBadge} highlightPlayer={isMember ? myIndex : null}
        bottomPadding={barHeight} showChart={showChart} onShowChartChange={setShowChart}
        currentRound={currentRound} layout={compact ? "compact" : "wide"} scrollBlock="nearest"
        turnCell={turnCell} cellPlaceholder={cellPlaceholder}
      />
      <RoundBar
        currentRound={currentRound} mismatches={mismatches} gaps={gaps} finished={finished}
        onOpenCell={(id, ri, field) => setPicker({ id, ri, field })}
        onShowWinner={() => setView("winner")} onHeight={setBarHeight}
      />
      {picker && <CellPicker targetId={picker.id} roundIndex={picker.ri} field={picker.field} onClose={() => setPicker(null)} />}
      {confirmEl}
      {noteEl}
    </>
  );
}
