import { create } from "zustand";
import * as S from "./session.js";
import { CODE_LENGTH, MAX_NAME_LENGTH, getCell, isSessionExpired, normalizeCode } from "./rules.js";
import { PLAYER_ID_KEY, NAME_KEY, LAST_SESSION_KEY, SPECTATE_KEY, TAB_SESSION_KEY } from "./keys.js";

/**
 * Globaler Client-State des Online-Modus (Zustand, wie beim Kniffel Dashboard).
 * Die Sitzung selbst lebt in Firebase – dieser Store hält nur das lokale
 * Abbild plus UI-Zustand und verbindet nach einem Reload automatisch wieder.
 */

const UNDO_LIMIT = 50;

/** localStorage kann im privaten Modus fehlen oder werfen – nie daran scheitern. */
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* egal */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* egal */ } },
};

const tabStorage = {
  set(key, value) { try { sessionStorage.setItem(key, value); } catch { /* egal */ } },
  remove(key) { try { sessionStorage.removeItem(key); } catch { /* egal */ } },
};

/** Zufalls-ID; randomUUID gibt es nur über HTTPS/localhost (nicht beim Testen im WLAN per IP). */
function randomId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Stabile Spieler-ID pro Browser, damit Reload = Reconnect statt Doppel-Beitritt. */
function loadPlayerId() {
  let id = storage.get(PLAYER_ID_KEY);
  if (!id) {
    id = randomId();
    storage.set(PLAYER_ID_KEY, id);
  }
  return id;
}

/** Einladungsparameter ?code=… nach Beitritt entfernen (sonst erscheint der Dialog später erneut). */
export function clearInviteParam() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("code")) return;
    url.searchParams.delete("code");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  } catch { /* egal */ }
}

/** Erwartete Regelverstöße (SessionError) nur als Meldung zeigen, echte Fehler zusätzlich loggen. */
function logUnexpected(err) {
  if (!(err instanceof S.SessionError)) console.error(err);
}

export function errorMessage(err) {
  if (err instanceof S.SessionError) return err.message;
  const text = String(err?.code ?? err?.message ?? err ?? "").toLowerCase();
  if (text.includes("permission")) {
    return "Zugriff verweigert – sind die Datenbank-Regeln für Wizard in Firebase eingerichtet? (siehe SETUP_PRIVAT.md)";
  }
  return "Verbindung zu Firebase fehlgeschlagen. Bitte Internetverbindung prüfen.";
}

let unsubscribe = null;
let connectionUnsub = null;

function detach() {
  const [sessionUnsub, connUnsub] = [unsubscribe, connectionUnsub];
  unsubscribe = null;
  connectionUnsub = null;
  try { sessionUnsub?.(); } catch (err) { logUnexpected(err); }
  try { connUnsub?.(); } catch (err) { logUnexpected(err); }
}

export const useOnlineStore = create((set, get) => {
  /** Zurück zur Online-Startseite, optional mit Meldung. */
  function reset(error = null) {
    detach();
    storage.remove(LAST_SESSION_KEY);
    storage.remove(SPECTATE_KEY);
    tabStorage.remove(TAB_SESSION_KEY);
    set({ session: null, sessionCode: null, spectating: false, undoStack: [], connected: true, error });
  }

  /**
   * Live-Abo aufbauen. `silent`: beim Wiederverbinden nach Reload keine
   * Fehlermeldung, falls die Sitzung inzwischen weg ist.
   */
  function attach(code, { spectating = false, silent = false } = {}) {
    detach();
    const { playerId } = get();
    set({ sessionCode: code, spectating, session: null, undoStack: [] });
    storage.set(LAST_SESSION_KEY, code);
    tabStorage.set(TAB_SESSION_KEY, code);
    if (spectating) storage.set(SPECTATE_KEY, "1");
    else storage.remove(SPECTATE_KEY);

    let wasConnected = false;
    connectionUnsub = S.subscribeToConnection((connected) => {
      if (connected) wasConnected = true;
      set({ connected: connected || !wasConnected });
    });

    unsubscribe = S.subscribeToSession(
      code,
      spectating ? null : playerId,
      (session) => {
        if (session === null || isSessionExpired(session, S.serverNow())) {
          const expired = session !== null;
          if (expired) void S.deleteIfExpired(code).catch(() => {});
          reset(silent ? null : expired
            ? "Diese Sitzung ist abgelaufen (älter als 24 Stunden) und wurde gelöscht."
            : "Die Sitzung wurde beendet oder existiert nicht mehr.");
          return;
        }
        if (!spectating && !session.players?.[playerId]) {
          reset(silent ? null : "Du wurdest aus der Sitzung entfernt.");
          return;
        }
        silent = false; // ab jetzt verbunden: spätere Änderungen wieder melden
        const prev = get().session;
        // Neues Spiel (Start/Revanche): Rückgängig-Stapel gehört zum alten Spiel
        const undoStack = prev && prev.startedAt !== session.startedAt ? [] : get().undoStack;
        set({ session, sessionCode: code, undoStack });
      },
      (error) => {
        console.error(error);
        reset(errorMessage(error));
      },
    );
  }

  async function withBusy(action) {
    set({ busy: true, error: null });
    try {
      await action();
    } catch (err) {
      logUnexpected(err);
      set({ error: errorMessage(err) });
    } finally {
      set({ busy: false });
    }
  }

  function requireName() {
    const name = get().playerName.trim();
    if (!name) set({ error: "Bitte zuerst deinen Namen eingeben." });
    return name;
  }

  function requireCode(rawCode) {
    const code = normalizeCode(rawCode);
    if (code.length !== CODE_LENGTH) {
      set({ error: `Der Sitzungscode besteht aus ${CODE_LENGTH} Zeichen.` });
      return null;
    }
    return code;
  }

  return {
    playerId: loadPlayerId(),
    playerName: storage.get(NAME_KEY) ?? "",
    sessionCode: null,
    session: null,
    spectating: false,
    busy: false,
    error: null,
    connected: true,
    /** Einträge, die Firebase noch nicht bestätigt hat (z. B. weil das Handy offline ist). */
    pendingWrites: 0,
    /** Eigene Änderungen dieses Geräts: { targetId, ri, field, prev, next, startedAt } */
    undoStack: [],

    setPlayerName: (name) => {
      const trimmed = String(name).slice(0, MAX_NAME_LENGTH);
      storage.set(NAME_KEY, trimmed);
      set({ playerName: trimmed });
    },

    clearError: () => set({ error: null }),
    showError: (error) => set({ error }),

    create: async () => {
      const name = requireName();
      if (!name) return;
      await withBusy(async () => {
        const code = await S.createSession(get().playerId, name);
        clearInviteParam();
        attach(code);
      });
    },

    join: async (rawCode) => {
      const name = requireName();
      const code = name && requireCode(rawCode);
      if (!code) return;
      await withBusy(async () => {
        await S.joinSession(code, get().playerId, name);
        clearInviteParam();
        attach(code);
      });
    },

    /** Nur zuschauen: kein Spieler, nichts bearbeiten, z. B. für einen Fernseher. */
    watch: async (rawCode) => {
      const code = requireCode(rawCode);
      if (!code) return;
      await withBusy(async () => {
        const session = await S.fetchSession(code);
        if (!session || isSessionExpired(session, S.serverNow())) {
          throw new S.SessionError(`Keine (aktive) Sitzung mit dem Code „${code}“ gefunden.`);
        }
        clearInviteParam();
        attach(code, { spectating: true });
      });
    },

    /**
     * Letzte Sitzung wieder verbinden (falls noch vorhanden und Mitglied).
     * `silent` (Standard, z. B. nach Reload): keine Meldung, falls sie weg ist.
     */
    resumeLastSession: ({ silent = true } = {}) => {
      const code = storage.get(LAST_SESSION_KEY);
      if (!code || get().sessionCode) return;
      attach(code, { spectating: storage.get(SPECTATE_KEY) === "1", silent });
    },

    /** Code der zuletzt verbundenen Sitzung (oder null). */
    lastSessionCode: () => storage.get(LAST_SESSION_KEY),
    /** War die zuletzt verbundene Sitzung nur zum Zuschauen? */
    lastSessionWasSpectating: () => storage.get(SPECTATE_KEY) === "1",

    reorderPlayers: async (order) => {
      const { sessionCode, playerId } = get();
      if (sessionCode) await withBusy(() => S.setPlayerOrder(sessionCode, playerId, order));
    },

    addGuest: async (name) => {
      const { sessionCode, playerId } = get();
      if (!sessionCode) return;
      await withBusy(() => S.addGuest(sessionCode, playerId, `guest-${randomId()}`, name));
    },

    removeFromLobby: async (targetId) => {
      const { sessionCode, playerId } = get();
      if (sessionCode) await withBusy(() => S.removeLobbyPlayer(sessionCode, playerId, targetId));
    },

    start: async () => {
      const { sessionCode, playerId } = get();
      if (sessionCode) await withBusy(() => S.startGame(sessionCode, playerId));
    },

    /**
     * Ansage (`field = "pred"`) oder Stiche (`"act"`) eintragen; `value = null` löscht.
     * `expected` = Wert, den die Oberfläche beim Antippen gezeigt hat (Standard:
     * aktueller lokaler Stand) – hat inzwischen jemand anderes etwas eingetragen,
     * gibt es eine Meldung statt eines stillen Überschreibens.
     * Bewusst ohne `busy`: Eintragen soll nie andere Knöpfe sperren.
     */
    setCell: async (targetId, ri, field, value, expected) => {
      const { sessionCode, playerId, session } = get();
      if (!sessionCode || !session) return;
      const prev = expected !== undefined ? expected : getCell(session, targetId, ri, field);
      if (prev === value) return;
      const startedAt = session.startedAt;
      set((s) => ({ pendingWrites: s.pendingWrites + 1 }));
      try {
        await S.setCell(sessionCode, playerId, targetId, ri, field, value, startedAt, prev);
        const entry = { targetId, ri, field, prev, next: value, startedAt };
        set((s) => ({ undoStack: [...s.undoStack, entry].slice(-UNDO_LIMIT) }));
      } catch (err) {
        logUnexpected(err);
        set({ error: errorMessage(err) });
      } finally {
        set((s) => ({ pendingWrites: Math.max(0, s.pendingWrites - 1) }));
      }
    },

    /** Letzte eigene Änderung dieses Geräts zurücknehmen. */
    undo: async () => {
      const { undoStack, sessionCode, playerId } = get();
      const last = undoStack[undoStack.length - 1];
      if (!last || !sessionCode) return;
      set((s) => ({ undoStack: undoStack.slice(0, -1), pendingWrites: s.pendingWrites + 1 }));
      try {
        await S.revertCell(sessionCode, playerId, last.targetId, last.ri, last.field, last.next, last.prev, last.startedAt);
      } catch (err) {
        logUnexpected(err);
        set({ error: errorMessage(err) });
      } finally {
        set((s) => ({ pendingWrites: Math.max(0, s.pendingWrites - 1) }));
      }
    },

    startRematch: async () => {
      const { sessionCode, playerId } = get();
      if (sessionCode) await withBusy(() => S.rematch(sessionCode, playerId));
    },

    /** Spielleitung: zurück in den Warteraum (Spieler ändern, gleicher Code). */
    backToLobby: async () => {
      const { sessionCode, playerId } = get();
      if (sessionCode) await withBusy(() => S.returnToLobby(sessionCode, playerId));
    },

    /** Spielleitung übernehmen, wenn deren Gerät offline ist. */
    claimHost: async () => {
      const { sessionCode, playerId } = get();
      if (sessionCode) await withBusy(() => S.claimHost(sessionCode, playerId));
    },

    /**
     * Verlassen: In der Lobby wird man ausgetragen (Spielleitung wird ggf.
     * übergeben). Im laufenden Spiel bleiben die eigenen Werte erhalten –
     * Rückkehr jederzeit mit dem Code oder per Reload.
     */
    leave: async () => {
      const { sessionCode, playerId, session, spectating } = get();
      reset(null);
      if (!spectating && sessionCode && session?.state === "lobby") {
        try {
          await S.leaveLobby(sessionCode, playerId);
        } catch {
          // Verlassen darf nie an einem Netzwerkfehler scheitern
        }
      }
    },
  };
});

// Warnen, bevor ein noch nicht gespeicherter Eintrag durch Schließen/Neuladen verloren geht
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (event) => {
    if (useOnlineStore.getState().pendingWrites > 0) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
}
