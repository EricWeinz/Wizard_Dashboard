import React, { useEffect, useLayoutEffect, useRef } from "react";
import { isFirebaseConfigured, firebaseInitError } from "./firebase.js";
import { useOnlineStore, clearInviteParam } from "./store.js";
import { inviteCodeFromUrl } from "./keys.js";
import { screenStyle, Spinner } from "./ui.jsx";
import ConfigMissing from "./ConfigMissing.jsx";
import OnlineLobby from "./OnlineLobby.jsx";
import WaitingRoom from "./WaitingRoom.jsx";
import OnlineGame from "./OnlineGame.jsx";
import ErrorToast from "./ErrorToast.jsx";

/**
 * Online-Modus (wird erst bei Bedarf nachgeladen).
 * Routing rein über den Sitzungszustand aus Firebase:
 * keine Sitzung -> Startseite, lobby -> Warteraum, playing/finished -> Spiel.
 *
 * autoResume: "reload" (gleicher Tab neu geladen -> still wieder verbinden),
 *             "card" (Karte „Zurück zu Sitzung …“ -> mit Meldung, falls weg) oder false.
 */
export default function OnlineApp({ onExit, autoResume = false }) {
  const session = useOnlineStore((s) => s.session);
  const sessionCode = useOnlineStore((s) => s.sessionCode);
  const leave = useOnlineStore((s) => s.leave);
  const started = useRef(false);

  // Einmalig beim Öffnen: Einladungslink hat Vorrang; sonst ggf. letzte Sitzung fortsetzen
  useEffect(() => {
    if (!isFirebaseConfigured || started.current) return;
    started.current = true;
    const { resumeLastSession, lastSessionCode, lastSessionWasSpectating } = useOnlineStore.getState();
    const invite = inviteCodeFromUrl();
    if (autoResume === "card") {
      // Ausdrücklich „Zurück zu Sitzung …“ gewählt: das hat Vorrang vor einem alten Link
      clearInviteParam();
      resumeLastSession({ silent: false });
    } else if (invite) {
      // Gleiche Sitzung wie zuletzt (als Mitspieler): einfach wieder verbinden. Sonst Einladungsdialog.
      // Der Link bleibt in der Adresse, bis die Verbindung steht – scheitert sie (z. B. entfernt),
      // erscheint der Einladungsdialog.
      if (invite === lastSessionCode() && !lastSessionWasSpectating()) resumeLastSession({ silent: false });
    } else if (autoResume) {
      resumeLastSession({ silent: true });
    }
  }, [autoResume]);

  // Verbunden: Einladungslink aus der Adresse nehmen (sonst erscheint der Dialog später erneut)
  useEffect(() => {
    if (session && inviteCodeFromUrl() === sessionCode) clearInviteParam();
  }, [session, sessionCode]);

  // Bei jedem Screenwechsel oben beginnen (z. B. Start-Knopf am Ende des langen Warteraums).
  // Layout-Effekt: läuft vor dem Mitscrollen der Tabelle zur aktuellen Runde.
  const screenKey = !session ? (sessionCode ? "connecting" : "lobby") : session.state === "lobby" ? "waiting" : "game";
  useLayoutEffect(() => { window.scrollTo(0, 0); }, [screenKey]);

  if (!isFirebaseConfigured) return <ConfigMissing onBack={onExit} detail={firebaseInitError} />;

  let screen;
  if (sessionCode && !session) {
    screen = (
      <div style={screenStyle}>
        <Spinner label={`Verbinde mit Sitzung ${sessionCode} …`} />
        <button onClick={() => leave()} className="magic-btn-secondary" style={{ marginTop: 28 }}>Abbrechen</button>
      </div>
    );
  } else if (!session) {
    screen = <OnlineLobby onBack={onExit} />;
  } else if (session.state === "lobby") {
    screen = <WaitingRoom />;
  } else {
    screen = <OnlineGame />;
  }

  return (
    <>
      {screen}
      <ErrorToast />
    </>
  );
}
