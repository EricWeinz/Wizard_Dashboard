import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { PLAYER_COLORS, cardsForRound, calcPoints, computeGameStats } from "../lib/wizard.js";
import AnimatedNumber from "./AnimatedNumber.jsx";
import ScoreChart from "./ScoreChart.jsx";
import MagicInput, { MagicValue } from "./MagicInput.jsx";
import { ThemeMenu } from "./ThemePicker.jsx";
import ThemeLogo from "./ThemeLogo.jsx";

const ALWAYS = () => true;

/**
 * Der Spielblock: Kopfzeile, Punktekarten, Verlaufs-Chart und Tabelle.
 * Rein darstellend – woher die Daten kommen (lokaler State oder Firebase) und
 * wer welche Zelle bearbeiten darf, bestimmen LocalGame bzw. der Online-Modus.
 *
 * data[pi][ri] = { pred, act } als Strings ("" = leer)
 * canEdit(pi, ri)            – false: Zelle wird nur angezeigt
 * onCellChange(pi, ri, field, value)
 * leadingActions / trailingActions – Buttons links/rechts vom 📈-Button
 * headerExtra                – Zusatz neben der Rundenanzeige (z. B. Verbindungsstatus)
 * renderPlayerBadge(pi)      – kleines Symbol neben dem Namen in der Punktekarte
 * highlightPlayer            – Index der eigenen Spalte (Online) oder null
 * bottomPadding              – Platz für eine fixierte Leiste am unteren Rand
 * showChart / onShowChartChange – optional von außen gesteuert (bleibt dann beim
 *                              Wechsel zur Siegerehrung erhalten)
 * currentRound               – optional: hervorgehobene Runde (Standard: erste unvollständige)
 * onCellClick(pi, ri, field) – optional: bearbeitbare Zellen werden zu Knöpfen (Online:
 *                              Zahlenauswahl statt Tippen) statt Eingabefeldern;
 *                              im Layout "compact" mit field = null (beide Werte)
 * layout                     – "wide" (Standard: je Spieler Ansage | Stiche | Σ) oder
 *                              "compact" (Handy: eine Spalte je Spieler, „2/3“ + Summe)
 * bidOrder(ri)               – optional: Ansage-Reihenfolge (Spaltenindizes) für die Tab-Navigation
 * cellPlaceholder(pi, ri, f) – optional: Platzhalter leerer Felder (z. B. „≠2“ für den verbotenen Wert)
 * turnCell                   – optional: { pi, ri } der Ansage, die jetzt dran ist (leuchtet)
 * banner                     – optional: Hinweis über der Tabelle (z. B. wer jetzt ansagt)
 * canEdit(pi, ri, field)     – field = "pred" | "act" (kompakte Ansicht: null = ganze Zelle)
 * scrollBlock                – Ausrichtung beim Mitscrollen zur aktuellen Runde
 *                              ("center" wie bisher, "nearest" ruhiger, null = nie)
 */
export default function GameBoard({
  playerNames, data, totalRounds,
  canEdit = ALWAYS, onCellChange,
  leadingActions = null, trailingActions = null, headerExtra = null,
  renderPlayerBadge = null, highlightPlayer = null, bottomPadding = 0,
  showChart: showChartProp, onShowChartChange,
  currentRound = null, onCellClick = null, layout = "wide", scrollBlock = "center",
  bidOrder = null, cellPlaceholder = null, turnCell = null, banner = null,
}) {
  const playerCount = playerNames.length;
  const stats = useMemo(() => computeGameStats(data, playerCount, totalRounds), [data, playerCount, totalRounds]);
  const { roundComplete, completedRounds, totals, maxTotal, correctPreds, actSumWarn, predSumNote } = stats;
  const activeRound = currentRound ?? stats.activeRound;
  const getRunningTotal = stats.runningTotal;
  const [showChartOwn, setShowChartOwn] = useState(false);
  const showChart = showChartProp ?? showChartOwn;
  const setShowChart = onShowChartChange ?? setShowChartOwn;
  const [hoveredRow, setHoveredRow] = useState(null);
  const activeRowRef = useRef(null);

  // Zur aktuellen Runde mitscrollen – frühestens nach der Einblend-Animation (portalIn, 0,6 s):
  // währenddessen ist der Screen noch verkleinert und das Ziel läge daneben. Ein Frame
  // später ist außerdem der Platz für eine fixierte Leiste (bottomPadding) im Layout.
  const mountedAt = useRef(Date.now());
  useEffect(() => {
    if (!scrollBlock) return undefined;
    const wait = Math.max(0, 650 - (Date.now() - mountedAt.current));
    let frame = 0;
    const timer = setTimeout(() => {
      frame = requestAnimationFrame(() => activeRowRef.current?.scrollIntoView({ behavior: "smooth", block: scrollBlock }));
    }, wait);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [activeRound]);

  /* Feature 4: Smart Tab/Enter navigation */
  const buildInputOrder = useCallback(() => {
    // Order: for each round, pred for all players, then act for all players
    const order = [];
    for (let ri = 0; ri < totalRounds; ri++) {
      // Ansagen in Ansage-Reihenfolge (der Reihe nach), Stiche in Spaltenreihenfolge
      for (const pi of bidOrder ? bidOrder(ri) : Array.from({ length: playerCount }, (_, i) => i)) order.push(`pred-${pi}-${ri}`);
      for (let pi = 0; pi < playerCount; pi++) order.push(`act-${pi}-${ri}`);
    }
    return order;
  }, [totalRounds, playerCount, bidOrder]);

  const handleNavigate = useCallback((currentId) => {
    const order = buildInputOrder();
    const idx = order.indexOf(currentId);
    // Find next empty field starting from current position
    for (let offset = 1; offset <= order.length; offset++) {
      const nextIdx = (idx + offset) % order.length;
      const nextId = order[nextIdx];
      const [field, pi, ri] = nextId.split("-");
      const val = data[parseInt(pi)][parseInt(ri)][field];
      if (val === "") {
        const el = document.querySelector(`[data-input-id="${nextId}"]`);
        if (el) { el.focus(); return; }
      }
    }
    // If all filled, just go to literal next
    const nextIdx = (idx + 1) % order.length;
    const el = document.querySelector(`[data-input-id="${order[nextIdx]}"]`);
    if (el) el.focus();
  }, [data, buildInputOrder]);

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", animation: "portalIn 0.6s ease-out backwards" }}>
      {/* Header */}
      <div className="board-head" style={{
        padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 8,
        borderBottom: "1px solid rgb(var(--ink) / 0.05)", background: "rgb(var(--s-head) / 0.9)",
        backdropFilter: "blur(24px)", position: "sticky", top: 0, zIndex: 10,
        boxShadow: "0 4px 30px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeLogo height={26} style={{ marginRight: -4, filter: "drop-shadow(0 0 8px rgb(var(--accent) / 0.3))" }} />
          <h1 className="brand-title" style={{
            fontSize: 18, fontFamily: "var(--font-title)", margin: 0,
            background: "linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-2)))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 8px rgb(var(--accent) / 0.2))",
          }}>Wizard</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "rgb(var(--ink) / 0.25)", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
              Runde {Math.min(activeRound + 1, totalRounds)}/{totalRounds}
            </span>
            <div style={{ width: 80, height: 4, borderRadius: 2, background: "rgb(var(--ink) / 0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, transition: "width 0.5s ease",
                width: `${(completedRounds / totalRounds) * 100}%`,
                background: "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-mid)), rgb(var(--accent-2)))",
                boxShadow: "0 0 8px rgb(var(--accent) / 0.4)",
              }} />
            </div>
            {headerExtra}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {leadingActions}
          <button onClick={() => setShowChart(c => !c)} aria-label="Punkteverlauf ein-/ausblenden" aria-pressed={showChart} className="magic-btn-sm" style={{ borderColor: showChart ? "rgb(var(--accent) / 0.3)" : undefined, color: showChart ? "rgb(var(--accent))" : undefined }}>📈</button>
          <ThemeMenu />
          {trailingActions}
        </div>
      </div>

      {/* Score Cards */}
      <div style={{ padding: "14px 20px 6px", display: "flex", gap: 8, overflowX: "auto", flexShrink: 0 }}>
        {playerNames.map((name, i) => {
          const isLeader = totals[i] === maxTotal && totals[i] !== 0;
          const pct = completedRounds > 0 ? Math.round((correctPreds[i] / completedRounds) * 100) : 0;
          return (
            <div key={i} style={{
              flex: 1, minWidth: 125, padding: "14px 16px", borderRadius: 16,
              background: `linear-gradient(135deg, ${PLAYER_COLORS[i].bg}, rgb(var(--s-card) / 0.5))`,
              border: `1.5px solid ${isLeader ? PLAYER_COLORS[i].accent : "rgb(var(--ink) / 0.04)"}`,
              boxShadow: isLeader ? `0 0 30px ${PLAYER_COLORS[i].glow}, inset 0 0 20px ${PLAYER_COLORS[i].bg}` : "none",
              transition: "all 0.5s ease", position: "relative", overflow: "hidden",
            }}>
              {isLeader && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${PLAYER_COLORS[i].dim}, transparent 70%)`, pointerEvents: "none" }} />}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, position: "relative" }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", background: PLAYER_COLORS[i].accent, flexShrink: 0,
                  boxShadow: `0 0 8px ${PLAYER_COLORS[i].glow}`,
                  animation: isLeader ? "breathe 2s infinite ease-in-out" : "none",
                }} />
                <span style={{ fontSize: 12, color: "rgb(var(--ink) / 0.55)", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: renderPlayerBadge ? "3em" : undefined }}>{name}</span>
                {renderPlayerBadge && renderPlayerBadge(i)}
                {isLeader && <span style={{ fontSize: 14, marginLeft: "auto", filter: "drop-shadow(0 0 4px rgb(var(--gold) / 0.5))" }}>👑</span>}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 20, position: "relative" }}>
                <AnimatedNumber value={totals[i]} color={PLAYER_COLORS[i].accent} size={30} glow={isLeader} glowColor={PLAYER_COLORS[i].glow} />
                {data[i][activeRound].pred !== "" && (
                  <div style={{
                    fontSize: 17, fontWeight: 700, color: "rgb(var(--ink) / 0.6)",
                    fontFamily: "'DM Sans', sans-serif",
                    background: "rgb(var(--ink) / 0.07)", borderRadius: 8,
                    padding: "3px 10px", lineHeight: 1.4,
                    border: "1px solid rgb(var(--ink) / 0.1)",
                  }}>
                    <span style={{ fontSize: 10, color: "rgb(var(--ink) / 0.3)", marginRight: 4 }}>Ans.</span>
                    {data[i][activeRound].pred}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 10, color: "rgb(var(--ink) / 0.25)", marginTop: 4, fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
                {correctPreds[i]}/{completedRounds} ✓ · {pct}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      {showChart && (
        <div style={{ margin: "8px 20px", padding: 16, borderRadius: 16, background: "rgb(var(--s-card) / 0.7)", border: "1px solid rgb(var(--ink) / 0.05)", backdropFilter: "blur(12px)", animation: "fadeSlideIn 0.3s ease-out", boxShadow: "inset 0 0 40px rgb(var(--btn-c) / 0.03)" }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 10, flexWrap: "wrap" }}>
            {playerNames.map((n, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 3, borderRadius: 2, background: PLAYER_COLORS[i].accent, boxShadow: `0 0 4px ${PLAYER_COLORS[i].glow}` }} />
                <span style={{ fontSize: 11, color: "rgb(var(--ink) / 0.4)", fontFamily: "'DM Sans', sans-serif" }}>{n}</span>
              </div>
            ))}
          </div>
          <ScoreChart data={data} playerCount={playerCount} playerNames={playerNames} totalRounds={totalRounds} />
        </div>
      )}

      {banner && <div style={{ padding: layout === "compact" ? "6px 12px 0" : "6px 20px 0" }}>{banner}</div>}

      {/* Table */}
      {layout === "compact" ? renderCompactTable() : (
      <div style={{ flex: 1, overflow: "auto", padding: `8px 20px ${32 + bottomPadding}px` }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr>
              <th className="th1">Runde</th>
              {playerNames.map((name, i) => (
                <th key={i} colSpan={3} className="th1" style={{ textAlign: "center", color: PLAYER_COLORS[i].accent, fontWeight: 600, fontSize: 13, borderBottom: `2px solid ${PLAYER_COLORS[i].accent}`, textShadow: `0 0 10px ${PLAYER_COLORS[i].glow}` }}>{name}{highlightPlayer === i && <span style={{ opacity: 0.55, fontWeight: 400, textTransform: "none" }}> · du</span>}</th>
              ))}
            </tr>
            <tr>
              <th className="th2" />
              {playerNames.map((_, i) => (
                <React.Fragment key={i}>
                  <th className="th2">Ans.</th>
                  <th className="th2">Stiche</th>
                  <th className="th2">Σ</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalRounds }, (_, ri) => {
              const isActive = ri === activeRound;
              const isDone = roundComplete(ri);
              const cards = cardsForRound(ri, totalRounds);
              const actWarn = actSumWarn(ri);
              const predNote = predSumNote(ri);
              const isHovered = hoveredRow === ri;

              return (
                <tr key={ri} ref={isActive ? activeRowRef : null}
                  onMouseEnter={() => setHoveredRow(ri)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    background: isActive ? "rgb(var(--accent) / 0.04)" : isHovered ? "rgb(var(--ink) / 0.02)" : "transparent",
                    transition: "background 0.25s",
                    boxShadow: isActive ? "inset 0 0 30px rgb(var(--accent) / 0.03)" : isHovered ? "inset 0 0 20px rgb(var(--ink) / 0.01)" : "none",
                  }}>
                  <td style={{
                    padding: "7px 12px", fontSize: 14, fontWeight: 600,
                    color: isActive ? "rgb(var(--accent))" : isDone ? "rgb(var(--ink) / 0.2)" : "rgb(var(--ink) / 0.4)",
                    borderBottom: "1px solid rgb(var(--ink) / 0.03)", whiteSpace: "nowrap", fontFamily: "var(--font-label)",
                    textShadow: isActive ? "0 0 8px rgb(var(--accent) / 0.3)" : "none",
                  }}>
                    {isActive && <span style={{ marginRight: 4, fontSize: 8, verticalAlign: "middle", animation: "breathe 1.5s infinite" }}>✦</span>}
                    {ri + 1}
                  </td>
                  {Array.from({ length: playerCount }, (_, pi) => {
                    const pts = calcPoints(data[pi][ri].pred, data[pi][ri].act);
                    const runTotal = pts !== null ? getRunningTotal(pi, ri) : null;
                    const isCorrect = pts !== null && data[pi][ri].pred === data[pi][ri].act;
                    const cellDone = pts !== null;
                    const doneBg = cellDone ? PLAYER_COLORS[pi].doneBg : "transparent";
                    const editPred = canEdit(pi, ri, "pred");
                    const editAct = canEdit(pi, ri, "act");
                    const isTurn = Boolean(turnCell && turnCell.pi === pi && turnCell.ri === ri);
                    const predPh = (cellPlaceholder && cellPlaceholder(pi, ri, "pred")) || "–";
                    const predLabel = `Ansage ${playerNames[pi]}, Runde ${ri + 1}: ${data[pi][ri].pred === "" ? "leer" : data[pi][ri].pred}${isTurn ? " – jetzt dran" : ""}`;
                    const actLabel = `Stiche ${playerNames[pi]}, Runde ${ri + 1}: ${data[pi][ri].act === "" ? "leer" : data[pi][ri].act}`;
                    return (
                      <React.Fragment key={pi}>
                        <td style={{ padding: "4px 2px", textAlign: "center", borderBottom: "1px solid rgb(var(--ink) / 0.03)", borderLeft: "1px solid rgb(var(--ink) / 0.02)", background: doneBg, transition: "background 0.4s" }}>
                          {editPred && onCellClick
                            ? <MagicValue value={data[pi][ri].pred} warn={predNote} ariaLabel={predLabel} color={PLAYER_COLORS[pi].accent} turn={isTurn} placeholder={predPh} onClick={() => onCellClick(pi, ri, "pred")} />
                            : editPred
                            ? <MagicInput value={data[pi][ri].pred} onChange={v => onCellChange(pi, ri, "pred", v)} placeholder={predPh} color={PLAYER_COLORS[pi].accent} warn={predNote} turn={isTurn} inputId={`pred-${pi}-${ri}`} onNavigate={handleNavigate} ariaLabel={predLabel} />
                            : <MagicValue value={data[pi][ri].pred} warn={predNote} ariaLabel={predLabel} color={PLAYER_COLORS[pi].accent} turn={isTurn} />}
                        </td>
                        <td style={{ padding: "4px 2px", textAlign: "center", borderBottom: "1px solid rgb(var(--ink) / 0.03)", background: doneBg, transition: "background 0.4s" }}>
                          {editAct && onCellClick
                            ? <MagicValue value={data[pi][ri].act} warn={actWarn === true} ariaLabel={actLabel} color={PLAYER_COLORS[pi].accent} onClick={() => onCellClick(pi, ri, "act")} />
                            : editAct
                            ? <MagicInput value={data[pi][ri].act}
                                onChange={v => onCellChange(pi, ri, "act", v)} placeholder="–"
                                color={PLAYER_COLORS[pi].accent} warn={actWarn === true} inputId={`act-${pi}-${ri}`} onNavigate={handleNavigate} ariaLabel={actLabel} />
                            : <MagicValue value={data[pi][ri].act} warn={actWarn === true} ariaLabel={actLabel} />}
                        </td>
                        <td style={{
                          padding: "4px 6px", textAlign: "center", borderBottom: "1px solid rgb(var(--ink) / 0.03)",
                          fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                          color: runTotal === null ? "rgb(var(--ink) / 0.06)" : runTotal >= 0 ? PLAYER_COLORS[pi].accent : "rgb(var(--danger))",
                          textShadow: runTotal !== null && runTotal >= 0 ? `0 0 8px ${PLAYER_COLORS[pi].glow}` : "none",
                          background: doneBg, transition: "background 0.4s",
                        }}>
                          {runTotal !== null ? (
                            <div style={{ lineHeight: 1.1, animation: "fadeIn 0.3s ease-out" }}>
                              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                                {runTotal}
                                {isCorrect ? <span style={{ fontSize: 10, color: "rgb(var(--success))", textShadow: "0 0 6px rgb(var(--success) / 0.5)" }}>✓</span>
                                  : <span style={{ fontSize: 9, color: "rgb(var(--danger) / 0.4)" }}>✗</span>}
                              </span>
                              <div style={{ fontSize: 10, fontWeight: 400, color: pts >= 0 ? "rgb(var(--success) / 0.6)" : "rgb(var(--danger) / 0.5)" }}>{pts >= 0 ? "+" : ""}{pts}</div>
                            </div>
                          ) : <span style={{ opacity: 0.3 }}>·</span>}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  {actWarn === true && <td style={{ padding: "0 6px", fontSize: 9, color: "rgb(var(--danger) / 0.6)", whiteSpace: "nowrap", borderBottom: "1px solid rgb(var(--ink) / 0.03)" }}>⚠ ≠{cards}</td>}
                  {predNote && actWarn !== true && <td title={`Nicht erlaubt: Die Ansagen dürfen zusammen nicht genau ${cards} ergeben`} style={{ padding: "0 6px", fontSize: 9, color: "rgb(var(--danger) / 0.75)", whiteSpace: "nowrap", borderBottom: "1px solid rgb(var(--ink) / 0.03)" }}>⚠ Σ={cards}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );

  /* Handy-Layout: eine Spalte je Spieler – oben „Ansage/Stiche“, darunter die laufende Summe.
     Passt auch mit 6 Spielern auf 390 px; die Rundenspalte bleibt beim Wischen stehen. */
  function renderCompactTable() {
    const stickyBg = "rgb(var(--s-bar) / 0.98)";
    return (
      <div style={{ flex: 1, overflow: "auto", padding: `8px 12px ${32 + bottomPadding}px` }}>
        <table style={{ width: "100%", minWidth: 40 + playerCount * 50, tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr>
              <th className="th1" style={{ width: 40, left: 0, zIndex: 6, padding: "10px 2px", textAlign: "center" }} aria-label="Runde">R</th>
              {playerNames.map((name, i) => (
                <th key={i} className="th1" style={{
                  textAlign: "center", padding: "8px 2px", fontSize: 11, letterSpacing: 0, textTransform: "none",
                  color: PLAYER_COLORS[i].accent, fontWeight: 600, borderBottom: `2px solid ${PLAYER_COLORS[i].accent}`,
                  textShadow: `0 0 10px ${PLAYER_COLORS[i].glow}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{name}{highlightPlayer === i && <span style={{ opacity: 0.55, fontWeight: 400 }}> · du</span>}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalRounds }, (_, ri) => {
              const isActive = ri === activeRound;
              const isDone = roundComplete(ri);
              const cards = cardsForRound(ri, totalRounds);
              const actWarn = actSumWarn(ri);
              const predNote = predSumNote(ri);
              return (
                <tr key={ri} ref={isActive ? activeRowRef : null} style={{
                  background: isActive ? "rgb(var(--accent) / 0.05)" : "transparent", transition: "background 0.25s",
                }}>
                  <td style={{
                    position: "sticky", left: 0, zIndex: 2, background: stickyBg, padding: "4px 2px", textAlign: "center",
                    borderBottom: "1px solid rgb(var(--ink) / 0.03)", whiteSpace: "nowrap",
                  }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, fontFamily: "var(--font-label)", lineHeight: 1.1,
                      color: isActive ? "rgb(var(--accent))" : isDone ? "rgb(var(--ink) / 0.25)" : "rgb(var(--ink) / 0.45)",
                      textShadow: isActive ? "0 0 8px rgb(var(--accent) / 0.3)" : "none",
                    }}>{ri + 1}</div>
                    <div style={{ fontSize: 9, lineHeight: 1.2, color: actWarn === true || predNote ? "rgb(var(--danger-2))" : "rgb(var(--ink) / 0.22)" }}
                      title={actWarn === true ? `Die Stiche ergeben zusammen nicht ${cards}` : predNote ? `Nicht erlaubt: Die Ansagen ergeben zusammen genau ${cards}` : `${cards} Karten`}>
                      {actWarn === true ? `⚠≠${cards}` : predNote ? `⚠Σ=${cards}` : `${cards} K.`}
                    </div>
                  </td>
                  {Array.from({ length: playerCount }, (_, pi) => {
                    const { pred, act } = data[pi][ri];
                    const pts = calcPoints(pred, act);
                    const runTotal = pts !== null ? getRunningTotal(pi, ri) : null;
                    const isCorrect = pts !== null && pred === act;
                    const editable = canEdit(pi, ri, null) && onCellClick;
                    const isTurn = Boolean(turnCell && turnCell.pi === pi && turnCell.ri === ri);
                    const label = `${playerNames[pi]}, Runde ${ri + 1}: Ansage ${pred === "" ? "leer" : pred}, Stiche ${act === "" ? "leer" : act}`;
                    const content = (
                      <>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 600, lineHeight: 1.2, whiteSpace: "nowrap" }}>
                          <span style={{ color: pred === "" ? "rgb(var(--ink) / 0.18)" : "rgb(var(--ink) / 0.9)" }}>{pred === "" ? "–" : pred}</span>
                          <span style={{ color: "rgb(var(--ink) / 0.25)" }}>/</span>
                          <span style={{ color: act === "" ? "rgb(var(--ink) / 0.18)" : actWarn === true ? "rgb(var(--danger-2))" : "rgb(var(--ink) / 0.9)" }}>{act === "" ? "–" : act}</span>
                        </span>
                        <span style={{
                          display: "block", fontSize: 11, fontWeight: 700, lineHeight: 1.2, minHeight: 13, whiteSpace: "nowrap",
                          color: runTotal === null ? "rgb(var(--ink) / 0.08)" : runTotal >= 0 ? PLAYER_COLORS[pi].accent : "rgb(var(--danger))",
                        }}>
                          {runTotal === null ? "·" : <>{runTotal}{isCorrect
                            ? <span style={{ fontSize: 9, color: "rgb(var(--success))", marginLeft: 1 }}>✓</span>
                            : <span style={{ fontSize: 8, color: "rgb(var(--danger) / 0.5)", marginLeft: 1 }}>✗</span>}</>}
                        </span>
                      </>
                    );
                    const box = {
                      display: "block", width: "100%", minHeight: 44, padding: "4px 0", borderRadius: 8, textAlign: "center",
                      fontFamily: "'DM Sans', sans-serif", color: "rgb(var(--ink))",
                    };
                    return (
                      <td key={pi} style={{
                        padding: "3px 2px", borderBottom: "1px solid rgb(var(--ink) / 0.03)",
                        background: pts !== null ? PLAYER_COLORS[pi].doneBg : "transparent", transition: "background 0.4s",
                      }}>
                        {editable ? (
                          <button type="button" onClick={() => onCellClick(pi, ri, null)} aria-label={isTurn ? `${label} – jetzt dran` : label} style={{
                            ...box, cursor: "pointer", margin: 0,
                            border: `1.5px solid ${actWarn === true || predNote ? "rgb(var(--danger) / 0.45)" : isTurn ? PLAYER_COLORS[pi].accent : "rgb(var(--ink) / 0.12)"}`,
                            background: "rgb(var(--ink) / 0.04)",
                            ...(isTurn ? { "--turn-glow": `${PLAYER_COLORS[pi].accent}99`, animation: "turnPulse 1.6s ease-in-out infinite" } : {}),
                          }}>{content}</button>
                        ) : (
                          <div aria-label={isTurn ? `${label} – jetzt dran` : label} style={{
                            ...box, border: `1.5px solid ${isTurn ? PLAYER_COLORS[pi].accent : "transparent"}`,
                            ...(isTurn ? { "--turn-glow": `${PLAYER_COLORS[pi].accent}99`, animation: "turnPulse 1.6s ease-in-out infinite" } : {}),
                          }}>{content}</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}
