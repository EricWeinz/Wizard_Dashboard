import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  PLAYER_COLORS, ROUNDS_MAP, calcPoints, computeGameStats, cardsForRound,
  bidOrderFor, bidStatus, forbiddenBid, predsOf,
} from "../lib/wizard.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import SpellBurst from "./SpellBurst.jsx";
import WinnerScreen from "./WinnerScreen.jsx";
import GameBoard from "./GameBoard.jsx";
import TurnBanner from "./TurnBanner.jsx";

const karten = (c) => `${c} ${c === 1 ? "Karte" : "Karten"}`;

/* ════════════════════════════════════════════
   LOKALES SPIEL (ein Gerät, eine Person trägt für alle ein)
   Ansagen gehen der Reihe nach (`startIndex` beginnt in Runde 1, danach reihum),
   und ihre Summe darf nicht der Kartenzahl entsprechen.
   ════════════════════════════════════════════ */
export default function LocalGame({ playerCount, playerNames, startIndex = 0, onReset }) {
  const totalRounds = ROUNDS_MAP[playerCount];
  const [data, setData] = useState(() => Array.from({ length: playerCount }, () => Array.from({ length: totalRounds }, () => ({ pred: "", act: "" }))));
  const [showChart, setShowChart] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [history, setHistory] = useState([]);
  const [bursts, setBursts] = useState([]);
  const burstId = useRef(0);

  const triggerBurst = useCallback((e, color) => {
    const rect = e.target.getBoundingClientRect();
    const id = burstId.current++;
    setBursts(b => [...b, { id, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, color }]);
  }, []);

  const updateCell = (pi, ri, field, val, e) => {
    if (val !== "" && !/^\d+$/.test(val)) return;
    setHistory(h => [...h.slice(-30), JSON.parse(JSON.stringify(data))]);
    const next = data.map((p, i) => i === pi ? p.map((r, j) => j === ri ? { ...r, [field]: val } : r) : p);
    const newEntry = { ...data[pi][ri], [field]: val };
    const wasDone = calcPoints(data[pi][ri].pred, data[pi][ri].act) !== null;
    const nowDone = calcPoints(newEntry.pred, newEntry.act) !== null;
    if (!wasDone && nowDone && e) triggerBurst(e, PLAYER_COLORS[pi].accent);
    setData(next);
  };

  const undo = () => { if (!history.length) return; setData(history[history.length - 1]); setHistory(h => h.slice(0, -1)); };

  const { gameComplete, totals, correctPreds, completedRounds, activeRound } = useMemo(
    () => computeGameStats(data, playerCount, totalRounds), [data, playerCount, totalRounds]);

  /* ── Ansage-Regeln ── */
  const bidOrder = useCallback((ri) => bidOrderFor(ri, playerCount, startIndex), [playerCount, startIndex]);
  const bids = (ri) => bidStatus(predsOf(data, ri), bidOrder(ri), cardsForRound(ri, totalRounds));

  // Spätere Runden bleiben zu, bis sie dran sind. Grenze = laufende Runde bzw. die höchste Runde
  // mit Einträgen – so sperrt eine Korrektur in einer alten Runde die laufende nicht.
  const lastTouched = useMemo(() => {
    for (let ri = totalRounds - 1; ri >= 0; ri--) if (data.some((p) => p[ri].pred !== "" || p[ri].act !== "")) return ri;
    return -1;
  }, [data, totalRounds]);
  const frontier = Math.max(activeRound, lastTouched);

  // Ansagen nur der Reihe nach (vorhandene lassen sich korrigieren), Stiche erst nach gültigen Ansagen
  const canEdit = (pi, ri, field) => {
    if (ri > frontier) return false;
    const cell = data[pi][ri];
    if (field === "pred") return cell.pred !== "" || bids(ri).next === pi;
    if (field === "act") {
      if (cell.act !== "") return true;
      const b = bids(ri);
      return b.allIn && !b.violation;
    }
    return true;
  };
  // Wer als Letztes ansagt, sieht den verbotenen Wert schon im leeren Feld (z. B. „≠2“)
  const cellPlaceholder = (pi, ri, field) => {
    if (field !== "pred" || data[pi][ri].pred !== "" || bids(ri).next !== pi) return null;
    const forbidden = forbiddenBid(predsOf(data, ri), pi, cardsForRound(ri, totalRounds));
    return forbidden === null ? null : `≠${forbidden}`;
  };

  const current = bids(activeRound);
  const turnCell = !gameComplete && current.next !== null ? { pi: current.next, ri: activeRound } : null;
  const name = (pi) => <span style={{ color: PLAYER_COLORS[pi].accent }}>{playerNames[pi]}</span>;

  let banner = null;
  if (!gameComplete) {
    const C = cardsForRound(activeRound, totalRounds);
    const order = bidOrder(activeRound);
    const dealer = order[order.length - 1];
    const roundInfo = <>Runde {activeRound + 1} · {karten(C)} · 🃏 {name(dealer)} gibt</>;
    if (current.violation) {
      banner = <TurnBanner tone="danger" icon="⚠️"
        title={<>Nicht erlaubt: Die Ansagen ergeben zusammen genau {C}</>}
        detail={<>Bei {karten(C)} darf die Summe nicht {C} sein – {name(dealer)} muss anders ansagen.</>} />;
    } else if (current.count === 0) {
      banner = <TurnBanner icon="🃏" title={<>{name(current.next)} sagt zuerst an</>} detail={roundInfo} />;
    } else if (!current.allIn) {
      const forbidden = forbiddenBid(predsOf(data, activeRound), current.next, C);
      banner = <TurnBanner icon="✦" title={<>Jetzt sagt {name(current.next)} an</>}
        detail={forbidden !== null
          ? <>Als Letztes: {forbidden} ist nicht erlaubt (sonst wären es zusammen genau {C}) · bisher zusammen {current.sum}</>
          : <>Bisher zusammen {current.sum} bei {karten(C)} · 🃏 {name(dealer)} gibt</>} />;
    } else {
      banner = <TurnBanner icon="✨" title="Alle haben angesagt"
        detail={<>Zusammen {current.sum} bei {karten(C)} – nach dem Spielen die Stiche eintragen.</>} />;
    }
  }

  if (showWinner) return <WinnerScreen playerNames={playerNames} totals={totals} correctPreds={correctPreds} completedRounds={completedRounds} onReset={onReset} onBack={() => setShowWinner(false)} />;

  return (
    <>
      {showConfirm && <ConfirmDialog message="Wirklich ein neues Spiel starten? Alle Punkte gehen verloren!" onConfirm={onReset} onCancel={() => setShowConfirm(false)} />}
      {bursts.map(b => <SpellBurst key={b.id} x={b.x} y={b.y} color={b.color} onDone={() => setBursts(bs => bs.filter(bb => bb.id !== b.id))} />)}
      <GameBoard
        playerNames={playerNames}
        data={data}
        totalRounds={totalRounds}
        showChart={showChart}
        onShowChartChange={setShowChart}
        canEdit={canEdit}
        bidOrder={bidOrder}
        cellPlaceholder={cellPlaceholder}
        turnCell={turnCell}
        banner={banner}
        onCellChange={(pi, ri, field, v) => updateCell(pi, ri, field, v, null)}
        leadingActions={<button onClick={undo} disabled={!history.length} className="magic-btn-sm" style={{ opacity: history.length ? 1 : 0.3 }} aria-label="Rückgängig">↩</button>}
        trailingActions={<>
          {gameComplete && <button onClick={() => setShowWinner(true)} className="magic-btn-gold">🏆 Ergebnis</button>}
          <button onClick={() => setShowConfirm(true)} className="magic-btn-sm" aria-label="Neues Spiel starten">✕</button>
        </>}
      />
    </>
  );
}
