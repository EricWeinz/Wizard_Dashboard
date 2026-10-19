import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

/**
 * Firebase-Konfiguration ausschließlich über Umgebungsvariablen (VITE_FIREBASE_*),
 * genau wie beim Kniffel Dashboard. Lokal: .env (siehe .env.example),
 * auf Vercel: Project Settings -> Environment Variables.
 * Ohne Konfiguration funktioniert der lokale Modus weiterhin; der Online-Modus
 * zeigt dann eine Einrichtungs-Hilfe.
 */
const env = import.meta.env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

let database = null;
/** Fehlermeldung, falls die Konfiguration vorhanden, aber unbrauchbar ist (z. B. falsche URL). */
export let firebaseInitError = null;

if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
  try {
    database = getDatabase(initializeApp(firebaseConfig));
  } catch (err) {
    firebaseInitError = err instanceof Error ? err.message : String(err);
    console.error("Firebase konnte nicht initialisiert werden:", err);
  }
}

export const isFirebaseConfigured = database !== null;

export function getDb() {
  if (!database) {
    throw new Error("Firebase ist nicht konfiguriert. Bitte .env mit den VITE_FIREBASE_*-Variablen anlegen (siehe README).");
  }
  return database;
}
