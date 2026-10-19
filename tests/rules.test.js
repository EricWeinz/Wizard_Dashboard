import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newSession, applyJoin, applySetOrder, applyAddGuest, applyRemoveLobbyPlayer, applyStart,
  applySetCell, applyRevertCell, applyRematch, applyLeaveLobby, applyPresence, applyDeleteIfExpired,
  effectivePlayerOrder, isGameComplete, toBoard, lastTouchedRound, trickSumMismatches,
  normalizeCode, randomCode, isSessionExpired, getCell, canEditPlayer, SESSION_TTL_MS,
  applyClaimHost, applyReturnToLobby, dealerIndex, biddingOrder, isHostAway, applyPresenceOff,
} from "../src/online/rules.js";
import { cardsForRound, ROUNDS_MAP } from "../src/lib/wizard.js";

const T0 = 1_700_000_000_000;

/** Firebase lehnt Schreibzugriffe mit `undefined` ab – darf nie vorkommen. */
function assertFirebaseSafe(value, path = "session") {
  if (value === undefined) assert.fail(`${path} ist undefined`);
  if (typeof value === "number" && !Number.isFinite(value)) assert.fail(`${path} ist ${value}`);
  if (value === null || typeof value !== "object") return;
  for (const [k, v] of Object.entries(value)) assertFirebaseSafe(v, `${path}.${k}`);
}

/** Wendet einen Updater an und prüft das Ergebnis wie eine Transaktion. */
function run(result) {
  if (result.value !== undefined && result.value !== null) assertFirebaseSafe(result.value);
  return result;
}

function lobbyWith(names) {
  let s = newSession("host", names[0], T0);
  names.slice(1).forEach((n, i) => { s = run(applyJoin(s, `p${i + 1}`, n, T0 + i + 1)).value; });
  return s;
}

function startedGame(names = ["Eric", "Gina", "Steven", "Anna"]) {
  return run(applyStart(lobbyWith(names), "host", T0 + 100)).value;
}

/** Alle Geräte-Spieler als verbunden markieren (wie es die Präsenz tut). */
function allOnline(s) {
  for (const p of Object.values(s.players)) if (!p.guest) p.online = true;
  return s;
}

test("Code: Normalisierung und Zufallscode ohne verwechselbare Zeichen", () => {
  assert.equal(normalizeCode(" ab-c 2x9 "), "ABC2X9");
  for (let i = 0; i < 200; i++) {
    const code = randomCode();
    assert.match(code, /^[A-HJ-NP-Z2-9]{6}$/);
  }
});

test("Beitritt: eindeutige Namen, max. 6, nur in der Lobby, Reconnect mit Umbenennung", () => {
  let s = newSession("host", "Eric", T0);
  assertFirebaseSafe(s);
  assert.equal(run(applyJoin(s, "p1", "eric", T0)).failure?.includes("schon vergeben"), true);
  s = run(applyJoin(s, "p1", "Gina", T0 + 1)).value;
  s = run(applyJoin(s, "p1", "Gina B.", T0 + 2)).value; // Reconnect benennt um
  assert.equal(s.players.p1.name, "Gina B.");
  s = run(applyJoin(s, "p1", "Eric", T0 + 3)).value;     // Konflikt -> alter Name bleibt
  assert.equal(s.players.p1.name, "Gina B.");
  for (let i = 2; i <= 5; i++) s = run(applyJoin(s, `p${i}`, `S${i}`, T0 + i)).value;
  assert.equal(Object.keys(s.players).length, 6);
  assert.match(run(applyJoin(s, "p6", "Zu viel", T0)).failure, /voll/);
  s = run(applyStart(s, "host", T0 + 10)).value;
  assert.match(run(applyJoin(s, "late", "Spät", T0 + 11)).failure, /läuft bereits/);
  assert.equal(run(applyJoin(s, "p2", "S2", T0 + 12)).failure, null); // Reconnect im Spiel erlaubt
  assert.match(run(applyJoin(s, "x", "   ", T0)).failure, /Namen/);
});

test("Beitritt in abgelaufene Sitzung löscht sie", () => {
  const s = newSession("host", "Eric", T0);
  const r = run(applyJoin(s, "p1", "Gina", T0 + SESSION_TTL_MS + 1));
  assert.equal(r.value, null);
  assert.match(r.failure, /abgelaufen/);
  assert.equal(isSessionExpired({}, T0), true, "kaputte Sitzung ohne createdAt gilt als abgelaufen");
  assert.equal(run(applyDeleteIfExpired(newSession("h", "E", T0), T0 + 5)).value.hostId, "h");
  assert.equal(run(applyDeleteIfExpired(newSession("h", "E", T0), T0 + SESSION_TTL_MS + 5)).value, null);
});

test("Lobby: Reihenfolge, Gäste, Entfernen – nur Spielleitung", () => {
  let s = lobbyWith(["Eric", "Gina", "Steven"]);
  assert.match(run(applySetOrder(s, "p1", ["p2", "p1", "host"])).failure, /Spielleitung/);
  s = run(applySetOrder(s, "host", ["p2", "ghost", "p1", "p2"])).value;
  assert.deepEqual(s.playerOrder, ["p2", "p1", "host"]);
  assert.match(run(applyAddGuest(s, "p1", "g1", "Oma", T0)).failure, /Spielleitung/);
  s = run(applyAddGuest(s, "host", "g1", "Oma", T0 + 50)).value;
  assert.equal(s.players.g1.guest, true);
  assert.deepEqual(effectivePlayerOrder(s), ["p2", "p1", "host", "g1"]);
  assert.match(run(applyAddGuest(s, "host", "g2", "oma", T0)).failure, /vergeben/);
  assert.match(run(applyRemoveLobbyPlayer(s, "host", "host")).failure, /selbst/);
  s = run(applyRemoveLobbyPlayer(s, "host", "p2")).value;
  assert.deepEqual(effectivePlayerOrder(s), ["p1", "host", "g1"]);
  assert.equal(s.players.p2, undefined);
});

test("Start: mind. 3 Spieler, feste Reihenfolge und Rundenzahl, idempotent", () => {
  const two = lobbyWith(["Eric", "Gina"]);
  assert.match(run(applyStart(two, "host", T0)).failure, /mindestens 3/);
  let s = lobbyWith(["Eric", "Gina", "Steven", "Anna", "Ben"]);
  assert.match(run(applyStart(s, "p1", T0)).failure, /Spielleitung/);
  s = run(applyStart(s, "host", T0 + 100)).value;
  assert.equal(s.state, "playing");
  assert.equal(s.totalRounds, ROUNDS_MAP[5]);
  assert.equal(s.startedAt, T0 + 100);
  assert.deepEqual(s.playerOrder, ["host", "p1", "p2", "p3", "p4"]);
  const again = run(applyStart(s, "host", T0 + 200)).value;
  assert.equal(again.startedAt, T0 + 100);
});

test("Eintragen: Rechte (eigene, Gäste, Spielleitung alle), Zuschauer nie", () => {
  let s = lobbyWith(["Eric", "Gina", "Steven"]);
  s = run(applyAddGuest(s, "host", "g1", "Oma", T0 + 5)).value;
  s = allOnline(run(applyStart(s, "host", T0 + 10)).value);
  assert.equal(run(applySetCell(s, "p1", "p1", 0, "pred", 1, T0, s.startedAt)).failure, null);
  assert.match(run(applySetCell(s, "p1", "p2", 0, "pred", 1, T0, s.startedAt)).failure, /eigenen Werte/);
  assert.equal(run(applySetCell(s, "p1", "g1", 0, "pred", 0, T0, s.startedAt)).failure, null);
  assert.equal(run(applySetCell(s, "host", "p2", 0, "act", 1, T0, s.startedAt)).failure, null);
  assert.match(run(applySetCell(s, "zuschauer", "p1", 0, "pred", 1, T0, s.startedAt)).failure, /Mitspieler/);
  assert.match(run(applySetCell(s, "g1", "g1", 0, "pred", 1, T0, s.startedAt)).failure, /Mitspieler/);
  assert.equal(canEditPlayer(s, "p2", "g1"), true);
  assert.equal(canEditPlayer(s, "p2", "p1"), false);
  assert.equal(canEditPlayer(s, "host", "p1"), true);
});

test("Eintragen: Wertebereich je Runde nach Hausregel, Löschen räumt auf", () => {
  let s = startedGame(); // 4 Spieler, 15 Runden: 1..8..1 Karten
  assert.equal(cardsForRound(7, 15), 8);
  assert.match(run(applySetCell(s, "host", "host", 0, "pred", 2, T0, s.startedAt)).failure, /erlaubt sind 0 bis 1/);
  assert.match(run(applySetCell(s, "host", "host", 0, "pred", -1, T0, s.startedAt)).failure, /erlaubt/);
  assert.match(run(applySetCell(s, "host", "host", 0, "pred", 1.5, T0, s.startedAt)).failure, /erlaubt/);
  assert.match(run(applySetCell(s, "host", "host", 15, "pred", 0, T0, s.startedAt)).failure, /Ungültige Runde/);
  assert.match(run(applySetCell(s, "host", "host", 0, "foo", 0, T0, s.startedAt)).failure, /Unbekannt/);
  s = run(applySetCell(s, "host", "host", 7, "pred", 8, T0, s.startedAt)).value;
  assert.equal(getCell(s, "host", 7, "pred"), 8);
  assert.deepEqual(s.players.host.rounds, { r8: { pred: 8 } });
  s = run(applySetCell(s, "host", "host", 7, "pred", null, T0, s.startedAt)).value;
  assert.equal(s.players.host.rounds, undefined, "leere Objekte werden entfernt (wie in Firebase)");
});

function fillGame(s, now = T0 + 1000) {
  for (const id of s.playerOrder) {
    for (let ri = 0; ri < s.totalRounds; ri++) {
      s = run(applySetCell(s, "host", id, ri, "pred", 0, now, s.startedAt)).value;
      s = run(applySetCell(s, "host", id, ri, "act", id === s.playerOrder[0] ? cardsForRound(ri, s.totalRounds) : 0, now, s.startedAt)).value;
    }
  }
  return s;
}

test("Spielende wird aus den Daten berechnet und bei Löschen wieder geöffnet", () => {
  let s = startedGame(["A", "B", "C"]);
  assert.equal(isGameComplete(s), false);
  s = fillGame(s, T0 + 5000);
  assert.equal(s.state, "finished");
  assert.equal(s.finishedAt, T0 + 5000);
  assert.deepEqual(trickSumMismatches(s), []);
  s = run(applySetCell(s, "host", "p1", 3, "act", 1, T0 + 6000, s.startedAt)).value; // Wert ändern: bleibt beendet
  assert.equal(s.state, "finished");
  assert.equal(s.finishedAt, T0 + 5000);
  assert.deepEqual(trickSumMismatches(s), [3]);
  s = run(applySetCell(s, "host", "p1", 3, "act", null, T0 + 7000, s.startedAt)).value; // Löschen: läuft weiter
  assert.equal(s.state, "playing");
  assert.equal(s.finishedAt, undefined);
});

test("Verspätete Einträge aus dem vorigen Spiel werden nach einer Revanche verworfen", () => {
  let s = fillGame(startedGame(["A", "B", "C"]));
  const oldStart = s.startedAt;
  assert.match(run(applyRematch(s, "p1", T0 + 9000)).failure, /Spielleitung/);
  s = run(applyRematch(s, "host", T0 + 9000)).value;
  assert.equal(s.state, "playing");
  assert.equal(s.createdAt, T0 + 9000);
  assert.equal(lastTouchedRound(s), -1);
  assert.match(run(applySetCell(s, "p1", "p1", 0, "pred", 1, T0, oldStart)).failure, /neues Spiel/);
  assert.equal(run(applySetCell(s, "p1", "p1", 0, "pred", 1, T0, s.startedAt)).failure, null);
});

test("Rückgängig nur, wenn das Feld noch den eigenen Wert hat", () => {
  let s = startedGame();
  s = run(applySetCell(s, "p1", "p1", 2, "pred", 2, T0, s.startedAt)).value;
  assert.equal(run(applyRevertCell(s, "p1", "p1", 2, "pred", 2, null, T0, s.startedAt)).failure, null);
  s = run(applySetCell(s, "host", "p1", 2, "pred", 3, T0, s.startedAt)).value; // Spielleitung korrigiert
  assert.match(run(applyRevertCell(s, "p1", "p1", 2, "pred", 2, null, T0, s.startedAt)).failure, /inzwischen geändert/);
});

test("Lobby verlassen: Spielleitung wird übergeben, nur Gäste übrig -> Sitzung weg", () => {
  let s = lobbyWith(["Eric", "Gina"]);
  s = run(applyAddGuest(s, "host", "g1", "Oma", T0 - 1)).value; // früher "beigetreten" als Gina
  s = run(applyLeaveLobby(s, "host")).value;
  assert.equal(s.hostId, "p1", "Gast wird nie Spielleitung");
  assert.equal(run(applyLeaveLobby(s, "p1")).value, null);
  const game = startedGame();
  assert.equal(run(applyLeaveLobby(game, "p1")).value.players.p1.name, "Gina", "im Spiel bleibt der Zettel");
});

test("Präsenz nur für echte Mitglieder", () => {
  let s = lobbyWith(["Eric", "Gina", "Steven"]);
  s = run(applyAddGuest(s, "host", "g1", "Oma", T0)).value;
  assert.equal(run(applyPresence(s, "p1")).value.players.p1.online, true);
  assert.equal(run(applyPresenceOff(s, "p1")).value.players.p1.online, undefined, "Abmelden entfernt online");
  assert.equal(run(applyPresenceOff(s, "p1")).value, undefined, "schon offline: nichts schreiben");
  assert.equal(run(applyPresenceOff(s, "fremd")).value, undefined, "Fremde: nie einen Knoten anlegen");
  assert.equal(run(applyPresence(s, "fremd")).value, undefined);
  assert.equal(run(applyPresence(s, "g1")).value, undefined);
});

test("Tabellen-Umrechnung für den gemeinsamen Spielblock", () => {
  let s = startedGame(["A", "B", "C"]);
  s = run(applySetCell(s, "p1", "p1", 4, "pred", 3, T0, s.startedAt)).value;
  const board = toBoard(s);
  assert.deepEqual(board.names, ["A", "B", "C"]);
  assert.equal(board.totalRounds, 20);
  assert.deepEqual(board.data[1][4], { pred: "3", act: "" });
  assert.deepEqual(board.data[0][0], { pred: "", act: "" });
  assert.equal(lastTouchedRound(s), 4);
});

test("Offline-Mitspieler darf jeder nachtragen; Spielleitung übernehmen nur, wenn sie offline ist", () => {
  let s = allOnline(startedGame(["Eric", "Gina", "Steven"]));
  assert.match(run(applySetCell(s, "p1", "p2", 0, "pred", 1, T0, s.startedAt)).failure, /eigenen Werte/);
  delete s.players.p2.online; // Steven: Akku leer
  assert.equal(run(applySetCell(s, "p1", "p2", 0, "pred", 1, T0, s.startedAt)).failure, null);
  assert.equal(isHostAway(s), false);
  assert.match(run(applyClaimHost(s, "p1")).failure, /online/);
  delete s.players.host.online;
  assert.equal(isHostAway(s), true);
  assert.match(run(applyClaimHost(s, "zuschauer")).failure, /Mitspieler/);
  s = run(applyClaimHost(s, "p1")).value;
  assert.equal(s.hostId, "p1");
  assert.equal(run(applyClaimHost(s, "p1")).value.hostId, "p1", "idempotent");
});

test("Kein stilles Überschreiben: erwarteter Wert muss noch stimmen; Korrekturen werden gemerkt", () => {
  let s = allOnline(startedGame());
  s = run(applySetCell(s, "p1", "p1", 3, "pred", 2, T0, s.startedAt, null)).value;
  assert.equal(s.lastEdit, undefined, "Ersteintrag ist keine Korrektur");
  // Spielleitung und Gina tippen gleichzeitig: Gina sah noch "leer"
  assert.match(run(applySetCell(s, "host", "p1", 3, "pred", 3, T0, s.startedAt, null)).failure, /inzwischen 2/);
  assert.equal(run(applySetCell(s, "host", "p1", 3, "pred", 2, T0, s.startedAt, null)).failure, null, "gleicher Wert ist kein Konflikt");
  s = run(applySetCell(s, "host", "p1", 3, "pred", 3, T0 + 7, s.startedAt, 2)).value;
  assert.deepEqual(s.lastEdit, { by: "host", target: "p1", ri: 3, field: "pred", from: 2, to: 3, at: T0 + 7 });
  s = run(applySetCell(s, "p1", "p1", 3, "pred", null, T0 + 8, s.startedAt, 3)).value;
  assert.deepEqual(s.lastEdit, { by: "p1", target: "p1", ri: 3, field: "pred", from: 3, at: T0 + 8 });
  assert.match(run(applySetCell(s, "p1", "p1", 3, "pred", 1, T0, s.startedAt, 3)).failure, /gelöscht/);
});

test("Zurück in die Lobby: gleiche Spieler, neue können beitreten, Start beginnt frisch", () => {
  let s = fillGame(startedGame(["A", "B", "C"]));
  assert.match(run(applyReturnToLobby(s, "p1", T0)).failure, /Spielleitung/);
  s = run(applyReturnToLobby(s, "host", T0 + 50)).value;
  assert.equal(s.state, "lobby");
  assert.equal(s.totalRounds, undefined);
  assert.equal(lastTouchedRound(s), -1);
  s = run(applyJoin(s, "p9", "Neu", T0 + 60)).value;
  s = run(applyStart(s, "host", T0 + 70)).value;
  assert.equal(s.totalRounds, 15);
  assert.deepEqual(s.playerOrder, ["host", "p1", "p2", "p9"]);
});

test("Geber reihum, Ansage links vom Geber; Revanche setzt die Reihe fort", () => {
  let s = startedGame(["A", "B", "C", "D"]);
  assert.equal(dealerIndex(s, 0), 0);
  assert.deepEqual(biddingOrder(s, 0), ["p1", "p2", "p3", "host"]);
  assert.equal(dealerIndex(s, 5), 1);
  s = fillGame(s);
  s = run(applyRematch(s, "host", T0 + 99999)).value;
  assert.equal(s.dealerStart, 15 % 4);
  assert.equal(dealerIndex(s, 0), 3);
});

test("Ohne Spiel-Kennung (startedAt) wird nichts eingetragen", () => {
  const s = allOnline(startedGame());
  assert.match(run(applySetCell(s, "p1", "p1", 0, "pred", 1, T0)).failure, /neues Spiel/);
  assert.match(run(applyRevertCell(s, "p1", "p1", 0, "pred", null, 1, T0)).failure, /neues Spiel/);
});
