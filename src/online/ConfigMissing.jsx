import React from "react";
import { screenStyle, textStyle, OnlineTitle } from "./ui.jsx";

const VARS = `VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...`;

/** Hilfeseite, falls der Online-Modus ohne Firebase-Konfiguration geöffnet wird. */
export default function ConfigMissing({ onBack, detail }) {
  return (
    <div style={screenStyle}>
      <OnlineTitle subtitle="Online-Sitzung" />
      <div className="magic-card" style={{ padding: "28px 22px" }}>
        <span className="magic-label">◈ Noch nicht eingerichtet ◈</span>
        <p style={{ ...textStyle, color: "rgb(var(--ink) / 0.75)", fontSize: 15 }}>
          Für den Online-Modus fehlt die Firebase-Konfiguration. Lokal an einem Gerät spielen geht weiterhin.
        </p>
        <p style={{ ...textStyle, marginTop: 12 }}>
          Lege im Projektordner eine Datei <code>.env</code> an (Vorlage: <code>.env.example</code>) bzw. trage die
          Werte bei Vercel unter <em>Settings → Environment Variables</em> ein:
        </p>
        <pre style={{
          marginTop: 12, padding: 14, borderRadius: 12, overflowX: "auto", fontSize: 12, lineHeight: 1.6,
          background: "rgba(0,0,0,0.35)", border: "1px solid rgb(var(--ink) / 0.06)", color: "rgb(var(--soft-3))",
        }}>{VARS}</pre>
        <p style={{ ...textStyle, marginTop: 12 }}>Schritt für Schritt: <strong>SETUP_PRIVAT.md</strong> bzw. README.</p>
        {detail && <p style={{ ...textStyle, marginTop: 10, color: "rgb(var(--danger-2) / 0.8)", fontSize: 12 }}>{detail}</p>}
      </div>
      <button onClick={onBack} className="magic-btn-secondary" style={{ marginTop: 24 }}>◁ Zurück</button>
    </div>
  );
}
