import React, { useState, useRef, useMemo, useCallback } from "react";
import { PLAYER_COLORS, ROUNDS_MAP, calcPoints, computeGameStats } from "../lib/wizard.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import SpellBurst from "./SpellBurst.jsx";
import WinnerScreen from "./WinnerScreen.jsx";
import GameBoard from "./GameBoard.jsx";

/* ════════════════════════════════════════════
   LOKALES SPIEL (ein Gerät, eine Person trägt für alle ein)
   ════════════════════════════════════════════ */
export default function LocalGame({ playerCount, playerNames, onReset }) {
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

  const { gameComplete, totals, correctPreds, completedRounds } = useMemo(
    () => computeGameStats(data, playerCount, totalRounds), [data, playerCount, totalRounds]);

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
