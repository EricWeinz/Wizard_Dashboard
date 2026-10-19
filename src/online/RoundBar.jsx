import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useOnlineStore } from "./store.js";
import { getCell, canEditPlayer, dealerIndex, biddingOrder, roundBids, isMember as isMemberOf } from "./rules.js";
import { PLAYER_COLORS, cardsForRound, calcPoints } from "../lib/wizard.js";
import { joinNames } from "./ui.jsx";

const karten = (c) => `${c} ${c === 1 ? "Karte" : "Karten"}`;
/** Nach einem Eintrag bzw. Rundenwechsel kurz keine Zahl-Tipps annehmen (Doppel-Tipp-Schutz). */
const TAP_GUARD_MS = 400;

const oneLine = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const warnStyle = {
  flexShrink: 0, minHeight: 40, padding: "8px 12px", borderRadius: 10, fontSize: 12, lineHeight: 1.3,
  border: "1px solid rgb(var(--danger) / 0.45)", background: "rgb(var(--danger) / 0.1)", color: "rgb(var(--danger-text-2))",
  fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", textAlign: "left",
};
const smallBtn = { minHeight: 40, padding: "8px 12px", fontSize: 13 };

/**
 * Eingabeleiste am unteren Bildschirmrand – die Hauptbedienung auf dem Handy.
 * Zeigt die aktuelle Runde (Geber, wer noch fehlt) und führt durch die Schritte
 * Ansage -> „Runde läuft“ -> Stiche. Für Spieler ohne Handy bzw. offline
 * Mitspieler (und als Spielleitung für alle) lässt sich das Ziel umschalten.
 */
export default function RoundBar({ currentRound, mismatches, gaps, finished, onOpenCell, onShowWinner, onHeight }) {
  const session = useOnlineStore((s) => s.session);
  const playerId = useOnlineStore((s) => s.playerId);
  const spectating = useOnlineStore((s) => s.spectating);
  const connected = useOnlineStore((s) => s.connected);
  const pendingWrites = useOnlineStore((s) => s.pendingWrites);
  const setCell = useOnlineStore((s) => s.setCell);

  const rootRef = useRef(null);
  const stepRef = useRef(null);
  const guardUntil = useRef(0);
  const refocus = useRef(false);
  const [collapsed, setCollapsed] = useState(false);
  const [targetId, setTargetId] = useState(playerId);
  const [editing, setEditing] = useState(null);          // "pred" | "act": vorhandenen Wert ändern
  const [actOpenRound, setActOpenRound] = useState(-1);  // „Stiche eintragen“ wurde für diese Runde geöffnet
  const [flash, setFlash] = useState(null);              // { text, id } kurze Bestätigung nach Eintrag für andere

  // Eigene Höhe melden: an OnlineGame (Platz unter der Tabelle) und an den Browser
  // (scroll-padding), damit Mitscrollen und Tab-Fokus nichts hinter der Leiste verstecken.
  const reportHeight = () => {
    const el = rootRef.current;
    if (!el) return;
    const h = Math.ceil(el.getBoundingClientRect().height);
    document.documentElement.style.scrollPaddingBottom = `${h + 8}px`;
    onHeight?.(h);
  };
  // Ohne Abhängigkeiten: läuft bei jedem Rendern VOR dem Scroll-Effekt der Tabelle
  useLayoutEffect(reportHeight);
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(reportHeight);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.scrollPaddingBottom = "";
      onHeight?.(0);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tastatur/Screenreader: Verschwindet der fokussierte Knopf durch einen Schrittwechsel,
  // landet der Fokus auf dem ersten Knopf des neuen Schritts statt im Nichts.
  useLayoutEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    const active = document.activeElement;
    if (active && active !== document.body && rootRef.current?.contains(active)) return;
    (stepRef.current?.querySelector("button") ?? rootRef.current)?.focus({ preventScroll: true });
  });

  // Neue Runde: wieder bei „Du“ beginnen – und kurz keine Zahl-Tipps annehmen, damit ein
  // Doppel-Tipp nicht schon als Ansage für die gerade erst erschienene Runde landet.
  useEffect(() => {
    setEditing(null);
    setTargetId(playerId);
    guardUntil.current = Date.now() + TAP_GUARD_MS;
  }, [currentRound, playerId]);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(null), 1600);
    return () => clearTimeout(timer);
  }, [flash]);

  if (!session) return null;

  const order = session.playerOrder ?? [];
  const n = order.length;
  const total = session.totalRounds ?? 0;
  const R = currentRound;
  const C = cardsForRound(R, total);
  const name = (id) => session.players?.[id]?.name ?? "?";
  const colorOf = (id) => PLAYER_COLORS[order.indexOf(id)] ?? PLAYER_COLORS[0];
  const cell = (id, field, ri = R) => getCell(session, id, ri, field);

  const preds = order.map((id) => cell(id, "pred"));
  const acts = order.map((id) => cell(id, "act"));
  const sum = (list) => list.reduce((s, v) => s + (v ?? 0), 0);
  const predCount = preds.filter((v) => v !== null).length;
  const actCount = acts.filter((v) => v !== null).length;
  const allPreds = n > 0 && predCount === n;
  const dealerId = order[dealerIndex(session, R)];
  const bidOrder = biddingOrder(session, R);
  const missingIds = allPreds ? bidOrder.filter((id) => cell(id, "act") === null) : bidOrder.filter((id) => cell(id, "pred") === null);
  // Ansage-Regeln: der Reihe nach, Summe ≠ Kartenzahl
  const bids = roundBids(session, R);

  const member = !spectating && isMemberOf(session, playerId);
  // Wen darf ich hier eintragen? Mich zuerst, dann die anderen in Sitzordnung.
  const editable = member
    ? [playerId, ...order.filter((id) => id !== playerId && canEditPlayer(session, playerId, id))]
    : [];
  const T = editable.includes(targetId) ? targetId : (editable[0] ?? null);
  const mine = T === playerId;
  const forWhom = mine ? "dich" : name(T);                       // „Ansage für dich / für Oma“
  const valueLabel = (field) => (field === "pred"
    ? (mine ? "Deine Ansage" : `Ansage von ${name(T)}`)
    : (mine ? "Deine Stiche" : `Stiche von ${name(T)}`));

  /* ── Statuszeilen ── */
  const line1 = `Runde ${R + 1} von ${total} · ${karten(C)} · 🃏 ${name(dealerId)} gibt`;
  let line2;
  if (finished) line2 = "🏆 Alle Runden sind gespielt.";
  else if (predCount === 0) line2 = `Noch keine Ansagen – ${name(bidOrder[0])} beginnt.`;
  else if (!allPreds) line2 = `${predCount} von ${n} haben angesagt (zusammen ${sum(preds)}) · jetzt: ${name(bids.nextId)}`;
  else if (bids.violation) line2 = `⚠ Die Ansagen ergeben genau ${C} – nicht erlaubt, bitte eine Ansage ändern.`;
  else if (actCount === 0) line2 = `Alle haben angesagt (zusammen ${sum(preds)} bei ${karten(C)}) – viel Glück!`;
  else line2 = `Stiche: ${actCount} von ${n} eingetragen (zusammen ${sum(acts)} von ${C})`;
  // Beim Ansagen zählt nur, wer jetzt dran ist (steht schon in Zeile 2); beim Stiche-Eintragen alle Fehlenden
  const showWaiting = !finished && allPreds && actCount > 0 && missingIds.length > 0;
  const waiting = showWaiting ? `Warten auf ${joinNames(missingIds.map(name))} …` : null;

  /* ── Hinweise: falsche Stich-Summen, Lücken in alten Runden, offline ── */
  const warnings = [];
  if (!connected && pendingWrites > 0) {
    warnings.push({ key: "offline", text: "⚠ Offline – Einträge werden gespeichert, sobald die Verbindung zurück ist" });
  }
  for (const ri of mismatches) {
    const c = cardsForRound(ri, total);
    const s = sum(order.map((id) => cell(id, "act", ri)));
    warnings.push({
      key: `m${ri}`, text: `⚠ Runde ${ri + 1}: zusammen ${s} statt ${c} Stiche – bitte prüfen`,
      onClick: member ? () => onOpenCell(playerId, ri, "act") : null,
    });
  }
  for (const gap of gaps) {
    const ids = [...new Set([...gap.missingPred, ...gap.missingAct])];
    const firstEditable = [...gap.missingPred.map((id) => [id, "pred"]), ...gap.missingAct.map((id) => [id, "act"])]
      .find(([id]) => member && canEditPlayer(session, playerId, id));
    warnings.push({
      key: `g${gap.ri}`, text: `Runde ${gap.ri + 1}: Werte von ${joinNames(ids.map(name))} fehlen`,
      onClick: firstEditable ? () => onOpenCell(firstEditable[0], gap.ri, firstEditable[1]) : null,
    });
  }

  /* ── Eintragen ── */
  const isAutoTarget = (id) => Boolean(session.players?.[id]?.guest) || session.players?.[id]?.online !== true;
  // Bewusster Schrittwechsel (Chip, „Stiche eintragen“, ✎): der nächste Zahl-Tipp ist gewollt
  const startStep = (fn) => { refocus.current = true; guardUntil.current = 0; fn(); };

  const pick = (field, value) => {
    if (!T || Date.now() < guardUntil.current) return;
    guardUntil.current = Date.now() + TAP_GUARD_MS; // Doppel-Tipp landet nie im nächsten Schritt
    refocus.current = true;
    const expected = cell(T, field);
    setEditing(null);
    if (expected !== value) setCell(T, R, field, value, expected);
    if (mine) return;
    // Für jemand anderen eingetragen: kurz bestätigen und zum nächsten Gast/offline
    // Mitspieler springen, dem im aktuellen Schritt noch der Wert fehlt – nie zu
    // jemandem, der selbst online ist. Sonst zurück zu „Du“. Ansagen folgen dabei
    // der Ansage-Reihenfolge (nur der direkt Nächste kommt in Frage).
    let next = null;
    if (field === "pred") {
      const following = bids.order[bids.order.indexOf(T) + 1];
      if (following && following !== playerId && editable.includes(following) && isAutoTarget(following) && cell(following, "pred") === null) next = following;
    } else {
      const start = order.indexOf(T);
      for (let k = 1; k < n && !next; k++) {
        const id = order[(start + k) % n];
        if (id !== playerId && editable.includes(id) && isAutoTarget(id) && cell(id, field) === null) next = id;
      }
    }
    setTargetId(next ?? playerId);
    setFlash({ text: `✓ ${name(T)}: ${value}${next ? ` – weiter mit ${name(next)}` : ""}`, id: next });
  };

  const numberButtons = (field, current, forbidden = null) => (
    <div key={`${R}-${field}-${T}`} style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {Array.from({ length: C + 1 }, (_, v) => {
        const selected = current === v;
        const blocked = v === forbidden;
        const c = colorOf(T);
        return (
          <button key={v} className="magic-chip" aria-pressed={selected} disabled={blocked}
            aria-label={`${field === "pred" ? "Ansage" : "Stiche"} ${v} für ${forWhom}${blocked ? " (nicht erlaubt)" : ""}`} onClick={() => pick(field, v)}
            title={blocked ? `Nicht erlaubt: Zusammen wären es genau ${C} Ansagen bei ${C} Karten` : undefined}
            style={{
              minWidth: 42, height: 42, padding: "0 10px",
              ...(blocked ? { textDecoration: "line-through", borderColor: "rgb(var(--danger) / 0.5)", color: "rgb(var(--danger-2))" } : {}),
              ...(selected ? { borderColor: c.accent, background: c.dim, color: "rgb(var(--ink))", boxShadow: `0 0 12px ${c.glow}` } : {}),
            }}>{v}</button>
        );
      })}
    </div>
  );
  const forbiddenNote = (forbidden) => forbidden === null ? null : (
    <div style={{ fontSize: 12, color: "rgb(var(--danger-text))", margin: "-2px 0 6px" }}>
      {forbidden} ist nicht erlaubt – sonst ergäben die Ansagen zusammen genau {C}.
    </div>
  );

  const label = (text) => <div style={{ fontSize: 12, color: "rgb(var(--ink) / 0.6)", marginBottom: 6 }}>{text}</div>;
  const editChip = (text, field, aria) => (
    <button onClick={() => startStep(() => setEditing(field))} aria-label={aria} className="magic-btn-sm" style={smallBtn}>{text}</button>
  );

  let step = null;
  if (finished) {
    step = (
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, color: "rgb(var(--gold-text))" }}>🏆 Spiel beendet</span>
        <button onClick={onShowWinner} className="magic-btn-gold" style={{ minHeight: 40 }}>Ergebnis ansehen</button>
      </div>
    );
  } else if (T) {
    const tPred = cell(T, "pred");
    const tAct = cell(T, "act");
    if ((editing === "pred" || tPred === null) && tPred === null && bids.nextId !== T) {
      // Der Reihe nach: Wer noch nicht dran ist, sieht auf wen gewartet wird
      const nextId = bids.nextId;
      const canHelp = nextId && nextId !== playerId && editable.includes(nextId);
      step = (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "rgb(var(--ink) / 0.65)" }}>
            {mine ? "Du bist noch nicht dran" : `${name(T)} ist noch nicht dran`} – zuerst sagt{" "}
            <strong style={{ color: colorOf(nextId).accent }}>{name(nextId)}</strong> an.
          </span>
          {canHelp && (
            <button onClick={() => startStep(() => { setTargetId(nextId); setEditing(null); })} className="magic-btn-sm" style={smallBtn}>
              Für {name(nextId)} eintragen
            </button>
          )}
        </div>
      );
    } else if (editing === "pred" || tPred === null) {
      const forbidden = bids.forbiddenFor(T);
      step = <>{label(mine && tPred === null ? "Du bist dran – deine Ansage:" : `Ansage für ${forWhom}:`)}{forbiddenNote(forbidden)}{numberButtons("pred", tPred, forbidden)}</>;
    } else if (!allPreds) {
      step = (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {editChip(`Ansage ${tPred} ✎`, "pred", `${valueLabel("pred")} (${tPred}) ändern`)}
          <span style={{ fontSize: 13, color: "rgb(var(--ink) / 0.55)" }}>
            {mine ? "Deine Ansage steht." : `Ansage von ${name(T)} steht.`}
          </span>
        </div>
      );
    } else if (bids.violation) {
      step = (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "rgb(var(--danger-text))" }}>⚠ Die Ansagen ergeben zusammen genau {C} – bitte eine Ansage ändern.</span>
          {editChip(`Ansage ${tPred} ✎`, "pred", `${valueLabel("pred")} (${tPred}) ändern`)}
        </div>
      );
    } else if (editing === "act" || (tAct === null && actOpenRound === R)) {
      step = <>{label(`Stiche für ${forWhom} (Ansage ${tPred}):`)}{numberButtons("act", tAct)}</>;
    } else if (tAct === null) {
      step = (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "rgb(var(--ink) / 0.65)" }}>Alle haben angesagt – die Runde läuft.</span>
          <button onClick={() => startStep(() => setActOpenRound(R))} className="magic-btn-primary"
            style={{ minHeight: 40, padding: "10px 16px", fontSize: 12 }}>
            Stiche eintragen →
          </button>
        </div>
      );
    } else {
      const pts = calcPoints(String(tPred), String(tAct));
      step = (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14 }}>
            ✓ Ansage {tPred} · Stiche {tAct} ·{" "}
            <strong style={{ color: pts >= 0 ? "rgb(var(--success))" : "rgb(var(--danger-2))" }}>{pts >= 0 ? "+" : ""}{pts}</strong>
          </span>
          {editChip("Ansage ✎", "pred", `${valueLabel("pred")} ändern`)}
          {editChip("Stiche ✎", "act", `${valueLabel("act")} ändern`)}
        </div>
      );
    }
  }

  const chips = editable.length > 1 && !finished ? (
    <div role="group" aria-label="Für wen eintragen?" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
      {editable.map((id) => {
        const selected = id === T;
        const c = colorOf(id);
        return (
          <button key={id} aria-pressed={selected} onClick={() => startStep(() => { setTargetId(id); setEditing(null); })} style={{
            flexShrink: 0, minHeight: 40, padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
            border: `1.5px solid ${selected ? c.accent : "rgb(var(--ink) / 0.12)"}`,
            background: selected ? c.dim : "rgb(var(--ink) / 0.03)", color: selected ? "rgb(var(--ink))" : "rgb(var(--ink) / 0.65)",
            boxShadow: flash?.id === id ? `0 0 16px ${c.glow}` : "none",
          }}>
            {id === playerId ? "Du" : name(id)}{session.players[id]?.guest ? " 👤" : ""}
          </button>
        );
      })}
    </div>
  ) : null;

  return createPortal(
    <div ref={rootRef} tabIndex={-1} role="region" aria-label="Eingabe für die aktuelle Runde" style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, color: "rgb(var(--ink))", outline: "none",
      maxHeight: "min(320px, 55vh)", overflowY: "auto",
      background: "rgb(var(--s-bar) / 0.97)", borderTop: "1px solid rgb(var(--accent) / 0.2)",
      boxShadow: "0 -10px 30px rgba(0,0,0,0.45)", padding: "10px 12px calc(10px + env(safe-area-inset-bottom))",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div aria-live="polite" style={{ flex: 1, minWidth: 0 }}>
            <div title={line1} style={{ fontSize: 13, fontWeight: 700, color: "rgb(var(--soft))", ...oneLine }}>{line1}</div>
            <div title={waiting ? `${line2} · ${waiting}` : line2} style={{ fontSize: 12, color: "rgb(var(--ink) / 0.55)", marginTop: 2, ...oneLine }}>
              {line2}{waiting && !collapsed && <> · <span style={{ color: "rgb(var(--gold) / 0.85)" }}>{waiting}</span></>}
            </div>
          </div>
          <button onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed}
            aria-label={collapsed ? "Eingabeleiste ausklappen" : "Eingabeleiste einklappen"}
            className="magic-btn-sm" style={{ minWidth: 40, minHeight: 40, padding: 0, flexShrink: 0 }}>{collapsed ? "▴" : "▾"}</button>
        </div>

        {!collapsed && warnings.length > 0 && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {warnings.map((w) => w.onClick
              ? <button key={w.key} onClick={w.onClick} style={{ ...warnStyle, cursor: "pointer" }}>{w.text}</button>
              : <span key={w.key} style={{ ...warnStyle, display: "inline-flex", alignItems: "center" }}>{w.text}</span>)}
          </div>
        )}

        {!collapsed && flash && <div role="status" style={{ fontSize: 12, color: "rgb(var(--success-text))" }}>{flash.text}</div>}
        {!collapsed && chips}
        {!collapsed && <div ref={stepRef}>{step}</div>}
      </div>
    </div>,
    document.body,
  );
}
