import { ROUNDS_MAP, MIN_PLAYERS, MAX_PLAYERS, cardsForRound } from "../lib/wizard.js";

/**
 * Reine Spiellogik des Online-Modus – ohne Firebase-Import, damit sie mit
 * `node --test` geprüft werden kann.
 *
 * Jeder `apply…`-Updater bekommt den aktuellen Sitzungsknoten (nie `null`),
 * verändert ihn direkt und liefert `{ value, failure }` zurück:
 *   value   – neue Sitzung | `undefined` (Transaktion abbrechen) | `null` (Sitzung löschen)
 *   failure – verständliche Fehlermeldung für den Nutzer oder `null`
 * `session.js` führt die Updater als Firebase-Transaktion auf dem ganzen
 * Sitzungsknoten aus (wie beim Kniffel Dashboard): zwei Geräte können sich
 * so nie gegenseitig überschreiben.
 *
 * Datenmodell unter wizard/sessions/{CODE}:
 *   state: 'lobby' | 'playing' | 'finished'
 *   hostId, createdAt (Basis der 24-h-Frist), startedAt?, finishedAt?, totalRounds?,
 *   playerOrder?: string[], dealerStart?: number (Index des ersten Gebers),
 *   lastEdit?: { by, target, ri, field, from, to?, at }  (letzte Korrektur eines Werts)
 *   players/{id}: { name, joinedAt, online?, guest?, rounds?: { r1: { pred?, act? }, … } }
 * Runden-Schlüssel sind bewusst `r1`, `r2`, … statt 0, 1, …: Objekte mit
 * Zahlenschlüsseln wandelt Firebase sonst in (löchrige) Arrays um.
 */

export const MAX_NAME_LENGTH = 20;
export const CODE_LENGTH = 6;
/** Sitzungen verfallen 24 h nach Erstellung (eine Revanche verlängert sie). */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
/** Ohne 0/O und 1/I, damit der Code mündlich gut weitergegeben werden kann. */
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const FIELDS = ["pred", "act"];
const FIELD_LABEL = { pred: "Ansage", act: "Stiche" };

const ok = (value) => ({ value, failure: null });
const fail = (failure) => ({ value: undefined, failure });

/* ── Hilfsfunktionen ─────────────────────────────────────────── */

export function normalizeCode(input) {
  return String(input ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** `randomValues(n)` liefert n Zufallszahlen (Standard: crypto.getRandomValues). */
export function randomCode(randomValues = defaultRandomValues) {
  const random = randomValues(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_CHARS[random[i] % CODE_CHARS.length];
  return code;
}

function defaultRandomValues(n) {
  return crypto.getRandomValues(new Uint32Array(n));
}

export function cleanName(name) {
  return String(name ?? "").trim().slice(0, MAX_NAME_LENGTH);
}

/** Fehlendes oder kaputtes `createdAt` zählt als abgelaufen (wird dann aufgeräumt). */
export function isSessionExpired(session, now = Date.now()) {
  return !(now - session?.createdAt <= SESSION_TTL_MS);
}

export function roundKey(roundIndex) {
  return `r${roundIndex + 1}`;
}

/** Eingetragener Wert (Zahl) oder `null`, wenn das Feld leer ist. */
export function getCell(session, playerId, roundIndex, field) {
  const value = session?.players?.[playerId]?.rounds?.[roundKey(roundIndex)]?.[field];
  return Number.isInteger(value) ? value : null;
}

export function isMember(session, playerId) {
  return Boolean(playerId && session?.players?.[playerId] && !session.players[playerId].guest);
}

/**
 * Darf `byId` die Werte von `targetId` bearbeiten? Eigene, die von Spielern
 * ohne Handy und von gerade offline Mitspielern (Akku leer, Browser zu …) –
 * so bleibt das Spiel nie an einem fehlenden Gerät hängen. Die Spielleitung darf alle.
 */
export function canEditPlayer(session, byId, targetId) {
  if (!isMember(session, byId)) return false;
  const target = session?.players?.[targetId];
  if (!target) return false;
  return byId === targetId || byId === session.hostId || Boolean(target.guest) || target.online !== true;
}

/** Ist das Gerät der Spielleitung gerade nicht verbunden? Dann darf jemand übernehmen. */
export function isHostAway(session) {
  const host = session?.players?.[session?.hostId];
  return !host || host.online !== true;
}

/* ── Geber & Ansage-Reihenfolge (nur Anzeige, keine Regel) ──── */

/** Index (in playerOrder) des Gebers in Runde `roundIndex`; reihum im Uhrzeigersinn. */
export function dealerIndex(session, roundIndex) {
  const n = session?.playerOrder?.length ?? 0;
  if (n === 0) return 0;
  return (((session.dealerStart ?? 0) + roundIndex) % n + n) % n;
}

/** Spieler-IDs in Ansage-Reihenfolge: links vom Geber beginnend, der Geber zuletzt. */
export function biddingOrder(session, roundIndex) {
  const order = session?.playerOrder ?? [];
  const dealer = dealerIndex(session, roundIndex);
  return order.map((_, i) => order[(dealer + 1 + i) % order.length]);
}

/**
 * Gewünschte Reihenfolge mit dem aktuellen Spielerstand abgleichen: nicht mehr
 * vorhandene IDs fallen raus, neue werden nach Beitrittszeit hinten angehängt.
 */
function reconcileOrder(session, desired) {
  const players = session.players ?? {};
  const present = [];
  for (const id of Array.isArray(desired) ? desired : []) {
    if (players[id] && !present.includes(id)) present.push(id);
  }
  const missing = Object.keys(players)
    .filter((id) => !present.includes(id))
    .sort((a, b) => (players[a].joinedAt ?? 0) - (players[b].joinedAt ?? 0));
  return [...present, ...missing];
}

/** Sitzordnung: im Spiel die festgelegte, in der Lobby die gewünschte + Neue hinten. */
export function effectivePlayerOrder(session) {
  if (session?.state && session.state !== "lobby") {
    return (session.playerOrder ?? []).filter((id) => session.players?.[id]);
  }
  return reconcileOrder(session ?? {}, session?.playerOrder ?? []);
}

function nameTaken(session, name, exceptId = null) {
  const wanted = name.trim().toLowerCase();
  return Object.entries(session.players ?? {}).some(
    ([id, p]) => id !== exceptId && String(p.name ?? "").trim().toLowerCase() === wanted,
  );
}

/** Haben alle Spieler in allen Runden Ansage und Stiche? */
export function isGameComplete(session) {
  const order = session.playerOrder ?? [];
  const total = session.totalRounds ?? 0;
  if (order.length === 0 || total === 0) return false;
  for (const id of order) {
    for (let ri = 0; ri < total; ri++) {
      if (getCell(session, id, ri, "pred") === null || getCell(session, id, ri, "act") === null) return false;
    }
  }
  return true;
}

/** Spielzustand nach jedem Eintrag aus den Daten neu bestimmen. */
function recomputeState(session, now) {
  if (isGameComplete(session)) {
    if (session.state !== "finished") {
      session.state = "finished";
      session.finishedAt = now;
    }
  } else {
    session.state = "playing";
    delete session.finishedAt;
  }
}

/* ── Sitzung anlegen & beitreten ─────────────────────────────── */

export function newSession(playerId, playerName, now) {
  return {
    state: "lobby",
    hostId: playerId,
    createdAt: now,
    players: {
      [playerId]: { name: cleanName(playerName), joinedAt: now },
    },
  };
}

/**
 * Beitritt bzw. Reconnect. Bekannte Spieler dürfen jederzeit zurück (der Name
 * wird aktualisiert, solange er nicht mit einem anderen kollidiert); neue
 * Spieler nur in der Lobby.
 */
export function applyJoin(session, playerId, playerName, now) {
  if (isSessionExpired(session, now)) {
    return { value: null, failure: "Diese Sitzung ist abgelaufen (älter als 24 Stunden)." };
  }
  const name = cleanName(playerName);
  if (!name) return fail("Bitte zuerst einen Namen eingeben.");
  session.players = session.players ?? {};
  const existing = session.players[playerId];
  if (existing && !existing.guest) {
    if (!nameTaken(session, name, playerId)) existing.name = name;
    return ok(session);
  }
  if (session.state !== "lobby") {
    return fail("Dieses Spiel läuft bereits – neue Mitspieler können nur in der Lobby beitreten. Du kannst aber zuschauen.");
  }
  if (Object.keys(session.players).length >= MAX_PLAYERS) {
    return fail(`Diese Sitzung ist voll (maximal ${MAX_PLAYERS} Spieler).`);
  }
  if (nameTaken(session, name)) {
    return fail(`Der Name „${name}“ ist in dieser Sitzung schon vergeben. Bitte wähle einen anderen.`);
  }
  session.players[playerId] = { name, joinedAt: now };
  return ok(session);
}

/* ── Lobby-Werkzeuge der Spielleitung ────────────────────────── */

export function applySetOrder(session, byId, desiredOrder) {
  if (session.hostId !== byId) return fail("Nur die Spielleitung kann die Reihenfolge ändern.");
  if (session.state !== "lobby") return ok(session); // nach dem Start nicht mehr änderbar
  session.playerOrder = reconcileOrder(session, desiredOrder);
  return ok(session);
}

export function applyAddGuest(session, byId, guestId, guestName, now) {
  if (session.hostId !== byId) return fail("Nur die Spielleitung kann Spieler ohne Handy hinzufügen.");
  if (session.state !== "lobby") return fail("Spieler können nur vor dem Start hinzugefügt werden.");
  const name = cleanName(guestName);
  if (!name) return fail("Bitte einen Namen für den Spieler eingeben.");
  session.players = session.players ?? {};
  if (Object.keys(session.players).length >= MAX_PLAYERS) {
    return fail(`Die Sitzung ist voll (maximal ${MAX_PLAYERS} Spieler).`);
  }
  if (nameTaken(session, name)) return fail(`Der Name „${name}“ ist schon vergeben.`);
  if (session.players[guestId]) return fail("Bitte erneut versuchen.");
  session.players[guestId] = { name, joinedAt: now, guest: true };
  return ok(session);
}

export function applyRemoveLobbyPlayer(session, byId, targetId) {
  if (session.hostId !== byId) return fail("Nur die Spielleitung kann Spieler entfernen.");
  if (session.state !== "lobby") return fail("Spieler können nur vor dem Start entfernt werden.");
  if (targetId === session.hostId) return fail("Die Spielleitung kann sich nicht selbst entfernen.");
  if (!session.players?.[targetId]) return ok(session); // schon weg
  delete session.players[targetId];
  if (Array.isArray(session.playerOrder)) {
    session.playerOrder = session.playerOrder.filter((id) => id !== targetId);
  }
  return ok(session);
}

/** Start durch die Spielleitung: Sitzordnung und Rundenzahl werden fest. */
export function applyStart(session, byId, now) {
  if (session.hostId !== byId) return fail("Nur die Spielleitung kann das Spiel starten.");
  if (session.state !== "lobby") return ok(session); // bereits gestartet -> idempotent
  const order = effectivePlayerOrder(session);
  if (order.length < MIN_PLAYERS) return fail(`Wizard braucht mindestens ${MIN_PLAYERS} Spieler.`);
  if (order.length > MAX_PLAYERS) return fail(`Maximal ${MAX_PLAYERS} Spieler.`);
  for (const id of order) delete session.players[id].rounds;
  session.playerOrder = order;
  session.totalRounds = ROUNDS_MAP[order.length];
  session.dealerStart = 0;
  session.state = "playing";
  session.startedAt = now;
  session.createdAt = now; // 24-h-Frist ab Spielstart
  delete session.finishedAt;
  delete session.lastEdit;
  return ok(session);
}

/* ── Werte eintragen ─────────────────────────────────────────── */

function checkCellWrite(session, byId, targetId, roundIndex, field, value, startedAt) {
  if (session.state !== "playing" && session.state !== "finished") return "Das Spiel läuft gerade nicht.";
  if (session.startedAt !== startedAt) {
    return "Inzwischen wurde ein neues Spiel gestartet – der Eintrag wurde verworfen.";
  }
  if (!isMember(session, byId)) return "Nur Mitspieler können Werte eintragen.";
  if (!(session.playerOrder ?? []).includes(targetId) || !session.players?.[targetId]) {
    return "Spieler nicht gefunden.";
  }
  if (!canEditPlayer(session, byId, targetId)) {
    return "Du kannst nur deine eigenen Werte (und die von Spielern ohne Handy) eintragen.";
  }
  if (!FIELDS.includes(field)) return "Unbekanntes Feld.";
  const total = session.totalRounds ?? 0;
  if (!Number.isInteger(roundIndex) || roundIndex < 0 || roundIndex >= total) return "Ungültige Runde.";
  if (value !== null) {
    const cards = cardsForRound(roundIndex, total);
    if (!Number.isInteger(value) || value < 0 || value > cards) {
      return `In Runde ${roundIndex + 1} gibt es ${cards} ${cards === 1 ? "Karte" : "Karten"} – erlaubt sind 0 bis ${cards}.`;
    }
  }
  return null;
}

function writeCell(session, targetId, roundIndex, field, value) {
  const player = session.players[targetId];
  const rounds = player.rounds ?? {};
  const key = roundKey(roundIndex);
  const entry = { ...(rounds[key] ?? {}) };
  if (value === null) delete entry[field];
  else entry[field] = value;
  if (Object.keys(entry).length === 0) delete rounds[key];
  else rounds[key] = entry;
  // Firebase speichert keine leeren Objekte – lokal genauso halten
  if (Object.keys(rounds).length === 0) delete player.rounds;
  else player.rounds = rounds;
}

/** Korrekturen (ein vorhandener Wert wird geändert/gelöscht) für den Hinweis bei allen merken. */
function noteEdit(session, byId, targetId, roundIndex, field, from, to, now) {
  if (from === null) return;
  const edit = { by: byId, target: targetId, ri: roundIndex, field, from, at: now };
  if (to !== null) edit.to = to;
  session.lastEdit = edit;
}

/**
 * Trägt eine Ansage/Stichzahl ein (`value = null` löscht das Feld).
 * `startedAt` (Pflicht: Kennung des Spiels, das die Oberfläche zeigte) verhindert,
 * dass ein verspäteter Eintrag aus dem vorigen Spiel nach einer Revanche im neuen landet.
 * `expected` (optional) ist der Wert, den die Oberfläche beim Antippen zeigte:
 * Hat inzwischen jemand anderes etwas eingetragen, wird nichts still überschrieben.
 */
export function applySetCell(session, byId, targetId, roundIndex, field, value, now, startedAt, expected) {
  const problem = checkCellWrite(session, byId, targetId, roundIndex, field, value, startedAt);
  if (problem) return fail(problem);
  const current = getCell(session, targetId, roundIndex, field);
  if (expected !== undefined && current !== expected) {
    if (current === value) return ok(session); // jemand hat genau das schon eingetragen
    const name = session.players[targetId].name;
    return fail(current === null
      ? `${FIELD_LABEL[field]} von ${name} in Runde ${roundIndex + 1} wurde inzwischen gelöscht – bitte prüfen.`
      : `${FIELD_LABEL[field]} von ${name} in Runde ${roundIndex + 1} ist inzwischen ${current} – bitte prüfen.`);
  }
  if (current === value) return ok(session);
  writeCell(session, targetId, roundIndex, field, value);
  noteEdit(session, byId, targetId, roundIndex, field, current, value, now);
  recomputeState(session, now);
  return ok(session);
}

/** Rückgängig für dieses Gerät: nur, wenn das Feld noch den eigenen Wert hat. */
export function applyRevertCell(session, byId, targetId, roundIndex, field, expected, value, now, startedAt) {
  const problem = checkCellWrite(session, byId, targetId, roundIndex, field, value, startedAt);
  if (problem) return fail(problem);
  const current = getCell(session, targetId, roundIndex, field);
  if (current !== expected) {
    return fail(`${FIELD_LABEL[field]} wurde inzwischen geändert – Rückgängig ist hier nicht mehr möglich.`);
  }
  writeCell(session, targetId, roundIndex, field, value);
  noteEdit(session, byId, targetId, roundIndex, field, current, value, now);
  recomputeState(session, now);
  return ok(session);
}

/* ── Revanche, Verlassen, Präsenz, Aufräumen ─────────────────── */

/** Gleiche Spieler und Reihenfolge, leere Tabelle. */
export function applyRematch(session, byId, now) {
  if (session.hostId !== byId) return fail("Nur die Spielleitung kann eine Revanche starten.");
  if (session.state !== "finished") return ok(session);
  for (const player of Object.values(session.players ?? {})) delete player.rounds;
  const n = session.playerOrder?.length ?? 0;
  if (n > 0) session.dealerStart = ((session.dealerStart ?? 0) + (session.totalRounds ?? 0)) % n;
  session.state = "playing";
  session.startedAt = now;
  session.createdAt = now; // Revanche verlängert die 24-h-Lebensdauer
  delete session.finishedAt;
  delete session.lastEdit;
  return ok(session);
}

/**
 * Zurück in die Lobby (Spielleitung): gleiche Sitzung und gleicher Code, aber
 * Spieler können wieder dazukommen, gehen oder umgesetzt werden.
 */
export function applyReturnToLobby(session, byId, now) {
  if (session.hostId !== byId) return fail("Nur die Spielleitung kann zurück in die Lobby.");
  if (session.state === "lobby") return ok(session);
  for (const player of Object.values(session.players ?? {})) delete player.rounds;
  session.state = "lobby";
  session.createdAt = now;
  delete session.totalRounds;
  delete session.startedAt;
  delete session.finishedAt;
  delete session.dealerStart;
  delete session.lastEdit;
  return ok(session);
}

/** Spielleitung übernehmen – nur, wenn das Gerät der bisherigen Spielleitung offline ist. */
export function applyClaimHost(session, byId) {
  if (!isMember(session, byId)) return fail("Nur Mitspieler können die Spielleitung übernehmen.");
  if (session.hostId === byId) return ok(session);
  if (!isHostAway(session)) {
    return fail("Die Spielleitung ist online – übernehmen geht nur, wenn ihr Gerät nicht verbunden ist.");
  }
  session.hostId = byId;
  return ok(session);
}

/**
 * Verlassen in der Lobby: Spieler wird ausgetragen. Geht die Spielleitung,
 * übernimmt der am längsten anwesende Mitspieler mit Gerät. Bleiben nur noch
 * Spieler ohne Handy (oder niemand) übrig, wird die Sitzung gelöscht.
 */
export function applyLeaveLobby(session, playerId) {
  if (session.state !== "lobby" || !session.players?.[playerId]) return ok(session);
  delete session.players[playerId];
  if (Array.isArray(session.playerOrder)) {
    session.playerOrder = session.playerOrder.filter((id) => id !== playerId);
  }
  const devicePlayers = Object.entries(session.players).filter(([, p]) => !p.guest);
  if (devicePlayers.length === 0) return ok(null);
  if (session.hostId === playerId) {
    devicePlayers.sort(([, a], [, b]) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0));
    session.hostId = devicePlayers[0][0];
  }
  return ok(session);
}

/** Online-Markierung setzen – nur für echte Mitglieder, nie eine Geister-Sitzung anlegen. */
export function applyPresence(session, playerId) {
  if (!isMember(session, playerId)) return { value: undefined, failure: null };
  if (session.players[playerId].online === true) return { value: undefined, failure: null };
  session.players[playerId].online = true;
  return ok(session);
}

/** Online-Markierung beim bewussten Trennen entfernen (fehlt = offline). */
export function applyPresenceOff(session, playerId) {
  if (session.players?.[playerId]?.online !== true) return { value: undefined, failure: null };
  delete session.players[playerId].online;
  return ok(session);
}

export function applyDeleteIfExpired(session, now) {
  return ok(isSessionExpired(session, now) ? null : session);
}

/* ── Darstellung ─────────────────────────────────────────────── */

/**
 * Wandelt die Sitzung in das Tabellenformat des lokalen Modus um
 * (`data[pi][ri] = { pred: "2", act: "" }`), damit Tabelle, Chart und
 * Punktekarten unverändert wiederverwendet werden.
 */
export function toBoard(session) {
  const ids = (session?.playerOrder ?? []).filter((id) => session.players?.[id]);
  const totalRounds = session?.totalRounds ?? 0;
  const str = (v) => (v === null ? "" : String(v));
  return {
    ids,
    totalRounds,
    names: ids.map((id) => session.players[id].name ?? "?"),
    data: ids.map((id) =>
      Array.from({ length: totalRounds }, (_, ri) => ({
        pred: str(getCell(session, id, ri, "pred")),
        act: str(getCell(session, id, ri, "act")),
      })),
    ),
  };
}

/** Höchste Runde, in der schon irgendein Wert steht (−1, wenn noch alles leer ist). */
export function lastTouchedRound(session) {
  let last = -1;
  for (const id of session?.playerOrder ?? []) {
    for (const key of Object.keys(session.players?.[id]?.rounds ?? {})) {
      const ri = Number(key.slice(1)) - 1;
      if (Number.isInteger(ri) && ri > last) last = ri;
    }
  }
  return last;
}

/** Runden mit falscher Stich-Summe (alle Stiche eingetragen, Summe ≠ Kartenzahl). */
export function trickSumMismatches(session) {
  const order = session?.playerOrder ?? [];
  const total = session?.totalRounds ?? 0;
  const rounds = [];
  for (let ri = 0; ri < total; ri++) {
    const acts = order.map((id) => getCell(session, id, ri, "act"));
    if (acts.some((v) => v === null)) continue;
    const sum = acts.reduce((s, v) => s + v, 0);
    if (sum !== cardsForRound(ri, total)) rounds.push(ri);
  }
  return rounds;
}
