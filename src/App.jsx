import React, { useState, lazy, Suspense } from "react";
import MagicalBackground from "./components/MagicalBackground.jsx";
import GlobalStyles from "./components/GlobalStyles.jsx";
import LoginScreen, { isUnlocked } from "./components/LoginScreen.jsx";
import StartScreen from "./components/StartScreen.jsx";
import SetupScreen from "./components/SetupScreen.jsx";
import LocalGame from "./components/LocalGame.jsx";
import { LAST_SESSION_KEY, TAB_SESSION_KEY, inviteCodeFromUrl } from "./online/keys.js";

// Der Online-Modus (inkl. Firebase-SDK) wird erst bei Bedarf nachgeladen –
// der lokale Modus bleibt so schlank wie bisher.
const OnlineApp = lazy(() => import("./online/OnlineApp.jsx"));

const readStorage = (store, key) => { try { return window[store].getItem(key); } catch { return null; } };

/**
 * Wohin nach dem Login? Ein Einladungslink (?code=…) hat immer Vorrang.
 * Automatisch wieder verbunden wird nur beim Neuladen desselben Tabs – sonst
 * zeigt die Startseite eine Karte „Zurück zu Sitzung …“ (kein Überfall durch
 * die Sitzung vom Vorabend, wenn man eigentlich lokal spielen will).
 */
function afterLogin() {
  if (inviteCodeFromUrl()) return { screen: "online", resume: false };
  if (readStorage("sessionStorage", TAB_SESSION_KEY) && readStorage("localStorage", LAST_SESSION_KEY)) {
    return { screen: "online", resume: "reload" };
  }
  return { screen: "start", resume: false };
}

/* ════════════════════════════════════════════
   ROOT
   ════════════════════════════════════════════ */
export default function WizardScoreTracker() {
  const [route, setRoute] = useState(() => (isUnlocked() ? afterLogin() : { screen: "login", resume: false }));
  const gs = route.screen;
  const setGs = (screen, resume = false) => setRoute({ screen, resume });
  const [pc, setPc] = useState(4);
  const [pn, setPn] = useState([]);
  const resumeCode = gs === "start" ? readStorage("localStorage", LAST_SESSION_KEY) : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 0%, rgba(88,28,135,0.25) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(30,58,138,0.2) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(15,10,30,1) 0%, #050311 100%)",
      color: "#fff", overflow: "hidden",
    }}>
      <MagicalBackground />
      {gs === "login" && <LoginScreen onLogin={() => setRoute(afterLogin())} />}
      {gs === "start" && <StartScreen onLocal={() => setGs("setup")} onOnline={() => setGs("online")}
        resumeCode={resumeCode} onResume={() => setGs("online", "card")} />}
      {gs === "setup" && <SetupScreen onBack={() => setGs("start")} onStart={(c, n) => { setPc(c); setPn(n); setGs("playing"); }} />}
      {gs === "playing" && <LocalGame playerCount={pc} playerNames={pn} onReset={() => setGs("setup")} />}
      {gs === "online" && (
        <OnlineErrorBoundary onExit={() => setGs("start")}>
          <Suspense fallback={<OnlineLoading />}>
            <OnlineApp onExit={() => setGs("start")} autoResume={route.resume} />
          </Suspense>
        </OnlineErrorBoundary>
      )}
      <GlobalStyles />
    </div>
  );
}

function OnlineLoading() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", gap: 16, position: "relative", zIndex: 1,
      fontFamily: "'Cinzel', serif", color: "rgba(192,132,252,0.6)", letterSpacing: 3,
    }}>
      <div style={{ fontSize: 40, animation: "spinRune 3s linear infinite" }} aria-hidden>ᛟ</div>
      <div style={{ fontSize: 12, textTransform: "uppercase" }}>Verbinde …</div>
    </div>
  );
}

/** Falls das Nachladen scheitert (offline, neue Version deployt …): verständlich statt weißer Seite. */
class OnlineErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("Online-Modus konnte nicht geladen werden:", error);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", padding: 24, position: "relative", zIndex: 1, gap: 20, textAlign: "center",
      }}>
        <div style={{ fontSize: 40 }} aria-hidden>🌩️</div>
        <p style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans', sans-serif", maxWidth: 360, lineHeight: 1.5 }}>
          Der Online-Modus konnte nicht geladen werden. Bitte Internetverbindung prüfen und neu laden.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="magic-btn-secondary" onClick={() => { this.setState({ failed: false }); this.props.onExit(); }}>◁ Zurück</button>
          <button className="magic-btn-primary" onClick={() => window.location.reload()}>Neu laden</button>
        </div>
      </div>
    );
  }
}
