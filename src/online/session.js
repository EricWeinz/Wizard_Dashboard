import { ref, onValue, onDisconnect, runTransaction, get } from "firebase/database";
import { getDb } from "./firebase.js";
import * as R from "./rules.js";

/**
 * Synchronisierung über die Firebase Realtime Database – nach dem Muster des
 * Kniffel Dashboards: Alle Schreibzugriffe laufen als Transaktion auf dem
 * kompletten Sitzungsknoten `wizard/sessions/{CODE}`. Die eigentliche Logik
 * steckt in den reinen Funktionen aus `rules.js`.
 *
 * Wichtiges Transaktions-Detail: Beim ersten Aufruf bekommt der Callback oft
 * den lokalen Cache-Wert `null`, obwohl die Sitzung auf dem Server existiert.
 * Wir geben dann `null` unverändert zurück – der Server lehnt das wegen des
 * Hash-Vergleichs ab und ruft den Callback mit den echten Daten erneut auf.
 * Erst wenn der Commit mit `null` durchgeht, existiert die Sitzung wirklich nicht.
 */

export class SessionError extends Error {}

/* ── Serverzeit ───────────────────────────────────────────────
   Zeitstempel und die 24-h-Frist richten sich nach der Firebase-Serveruhr.
   So löscht ein Handy mit falsch gestellter Uhr keine frischen Sitzungen. */
let serverOffset = 0;
let offsetTracked = false;
function trackServerOffset() {
  if (offsetTracked) return;
  offsetTracked = true;
  onValue(ref(getDb(), ".info/serverTimeOffset"), (snap) => {
    serverOffset = Number(snap.val()) || 0;
  });
}
export function serverNow() {
  return Date.now() + serverOffset;
}

const sessionPath = (code) => `wizard/sessions/${code}`;
const sessionRef = (code) => ref(getDb(), sessionPath(code));

/**
 * Nur vollständige Sitzungen an die Updater geben. Ohne Abo kann der lokale
 * Cache ein Teilstück liefern (z. B. nur ausstehende Präsenz-Schreibzugriffe):
 * das wie `null` behandeln und unverändert zurückgeben -> Server-Roundtrip.
 */
const isSessionShaped = (s) => Boolean(s && typeof s === "object" && s.state && s.hostId && s.createdAt);

/**
 * Führt einen Updater aus rules.js als Transaktion aus.
 * Wirft `SessionError` mit der Meldung des Updaters bzw. wenn die Sitzung
 * nicht (mehr) existiert – außer `allowDelete` ist gesetzt.
 */
async function mutate(code, updater, { allowDelete = false, missingMessage } = {}) {
  trackServerOffset();
  let failure = null;
  const result = await runTransaction(sessionRef(code), (session) => {
    failure = null;
    if (!isSessionShaped(session)) return session; // siehe oben: Server-Roundtrip erzwingen
    // Wirft ein Updater bei unerwarteten Daten, darf die Transaktion nicht hängen bleiben
    // (das SDK fängt Fehler bei Wiederholungen nicht ab): dann sauber abbrechen.
    try {
      const out = updater(session, serverNow());
      failure = out.failure ?? null;
      return out.value;
    } catch (err) {
      console.error("Transaktion abgebrochen:", err);
      failure = "Unerwarteter Fehler beim Speichern. Bitte erneut versuchen.";
      return undefined;
    }
  });
  if (failure) throw new SessionError(failure);
  if (!allowDelete && result.committed && !isSessionShaped(result.snapshot.val())) {
    throw new SessionError(missingMessage ?? "Diese Sitzung existiert nicht mehr.");
  }
  return result;
}

/* ── Sitzung anlegen, beitreten, zuschauen ─────────────────── */

/** Erstellt eine neue Sitzung mit kollisionsfreiem 6-stelligem Code. */
export async function createSession(playerId, playerName) {
  trackServerOffset();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = R.randomCode();
    const result = await runTransaction(sessionRef(code), (current) => {
      if (current !== null) return undefined; // Code vergeben -> neuer Versuch
      return R.newSession(playerId, playerName, serverNow());
    });
    if (result.committed) return code;
  }
  throw new SessionError("Es konnte kein freier Sitzungscode erzeugt werden. Bitte erneut versuchen.");
}

export async function joinSession(code, playerId, playerName) {
  const result = await mutate(code, (s, now) => R.applyJoin(s, playerId, playerName, now), {
    missingMessage: `Keine Sitzung mit dem Code „${code}“ gefunden.`,
  });
  if (!result.committed) throw new SessionError("Beitritt fehlgeschlagen. Bitte erneut versuchen.");
}

/** Für „Nur zuschauen“: Gibt es die Sitzung (noch)? */
export async function fetchSession(code) {
  trackServerOffset();
  const snap = await get(sessionRef(code));
  return snap.val();
}

/** Löscht eine Sitzung transaktional – aber nur, wenn sie wirklich abgelaufen ist. */
export async function deleteIfExpired(code) {
  await mutate(code, (s, now) => R.applyDeleteIfExpired(s, now), { allowDelete: true });
}

/* ── Lobby ─────────────────────────────────────────────────── */

export const setPlayerOrder = (code, byId, order) =>
  mutate(code, (s) => R.applySetOrder(s, byId, order));

export const addGuest = (code, byId, guestId, name) =>
  mutate(code, (s, now) => R.applyAddGuest(s, byId, guestId, name, now));

export const removeLobbyPlayer = (code, byId, targetId) =>
  mutate(code, (s) => R.applyRemoveLobbyPlayer(s, byId, targetId));

export const startGame = (code, byId) =>
  mutate(code, (s, now) => R.applyStart(s, byId, now));

/** Lobby verlassen. Der Letzte löscht die Sitzung (daher allowDelete). */
export const leaveLobby = (code, playerId) =>
  mutate(code, (s) => R.applyLeaveLobby(s, playerId), { allowDelete: true });

/* ── Spiel ─────────────────────────────────────────────────── */

/** `expected`: Wert, den die Oberfläche beim Antippen zeigte (Schutz vor stillem Überschreiben). */
export const setCell = (code, byId, targetId, roundIndex, field, value, startedAt, expected) =>
  mutate(code, (s, now) => R.applySetCell(s, byId, targetId, roundIndex, field, value, now, startedAt, expected));

export const revertCell = (code, byId, targetId, roundIndex, field, expected, value, startedAt) =>
  mutate(code, (s, now) => R.applyRevertCell(s, byId, targetId, roundIndex, field, expected, value, now, startedAt));

export const rematch = (code, byId) =>
  mutate(code, (s, now) => R.applyRematch(s, byId, now));

export const returnToLobby = (code, byId) =>
  mutate(code, (s, now) => R.applyReturnToLobby(s, byId, now));

export const claimHost = (code, byId) =>
  mutate(code, (s) => R.applyClaimHost(s, byId));

/* ── Live-Abo & Präsenz ────────────────────────────────────── */

/** `.info/connected`: Ist dieses Gerät gerade mit Firebase verbunden? */
export function subscribeToConnection(onChange) {
  return onValue(ref(getDb(), ".info/connected"), (snap) => onChange(snap.val() === true));
}

/**
 * Live-Abo auf die Sitzung: liefert bei jeder Änderung (egal von welchem
 * Gerät) sofort den neuen Stand. `playerId = null` heißt Zuschauer – dann
 * wird keine Präsenz gepflegt.
 *
 * Präsenz wie beim Kniffel Dashboard über `.info/connected`, aber gegen
 * „Geister-Sitzungen“ (Reste gelöschter Sitzungen) abgesichert:
 * - Online setzen und beim Verlassen wieder entfernen laufen als Transaktion
 *   auf dem Sitzungsknoten und nur, solange man Mitglied ist. (Ein einfaches
 *   set/remove auf einem Unterpfad würde laufende Transaktionen auf der
 *   Sitzung abbrechen – das SDK quittiert das teils mit einem internen Fehler.)
 * - Der Server entfernt `online` beim Verbindungsabbruch (onDisconnect.remove);
 *   auf einem nicht (mehr) vorhandenen Pfad ist das ein No-Op.
 * Fehlt `online`, gilt der Spieler als offline.
 */
export function subscribeToSession(code, playerId, onChange, onError) {
  trackServerOffset();
  const db = getDb();
  const onlineRef = playerId ? ref(db, `${sessionPath(code)}/players/${playerId}/online`) : null;
  let presenceStarted = false;
  let connected = false;
  let connectedUnsub = null;
  let latest = null;
  let marking = false;
  let lastSelfHeal = 0;

  // Reihenfolge wichtig: erst den Trennungs-Handler scharf schalten, dann online
  // setzen – bei einem Abbruch direkt nach dem Connect bleibt so nichts hängen.
  function markOnline() {
    onDisconnect(onlineRef).remove().catch(() => {});
    if (marking) return; // läuft schon; setzt online ohnehin
    marking = true;
    mutate(code, (s) => R.applyPresence(s, playerId))
      .catch(() => {})
      .finally(() => { marking = false; });
  }

  function startPresence() {
    if (presenceStarted || !onlineRef) return;
    presenceStarted = true;
    // Nach jedem Reconnect (Handy gesperrt, Netz weg …) neu anmelden
    connectedUnsub = onValue(ref(db, ".info/connected"), (snap) => {
      connected = snap.val() === true;
      if (connected && R.isMember(latest, playerId)) markOnline();
    });
  }

  const unsubscribe = onValue(
    sessionRef(code),
    (snapshot) => {
      const session = snapshot.val();
      latest = session;
      if (R.isMember(session, playerId)) {
        startPresence();
        // Selbstheilung (z. B. ein zweiter Tab desselben Browsers wurde geschlossen
        // und hat beim Trennen `online` entfernt) – gedrosselt gegen Schleifen.
        if (connected && session.players[playerId].online !== true && Date.now() - lastSelfHeal > 5000) {
          lastSelfHeal = Date.now();
          markOnline();
        }
      }
      onChange(session);
    },
    (error) => onError?.(error),
  );

  // Aufräumen darf nie werfen (läuft oft mitten in einem Firebase-Callback)
  return () => {
    try { unsubscribe(); } catch (err) { console.error(err); }
    try { connectedUnsub?.(); } catch (err) { console.error(err); }
    if (presenceStarted) {
      onDisconnect(onlineRef).cancel().catch(() => {});
      mutate(code, (s) => R.applyPresenceOff(s, playerId), { allowDelete: true }).catch(() => {});
    }
  };
}
