import { useSyncExternalStore } from "react";
import { DEFAULT_PLAYER_COLORS, makePlayerColors, setPlayerColors } from "./wizard.js";

/* ════════════════════════════════════════════
   FARBDESIGNS
   Alle Farben der Oberfläche laufen über CSS-Variablen (RGB-Tripel, damit
   `rgb(var(--accent) / 0.3)` mit beliebiger Deckkraft funktioniert).
   Ein Design überschreibt nur die Variablen; umgeschaltet wird über das
   data-theme-Attribut am <html> – wie beim Kniffel Dashboard. Neue Designs:
   einfach unten in THEMES ergänzen.
   ════════════════════════════════════════════ */

/** Standardwerte = das ursprüngliche Wizard-Design („Arkan“). */
const BASE = {
  "ink": "255 255 255",          // Schrift, feine Linien, helle Flächen-Tönung
  "on-accent": "255 255 255",    // Schrift auf farbigen Knöpfen
  "accent": "192 132 252",       // Hauptakzent (Violett)
  "accent-mid": "129 140 248",   // Mitte der Titel-Verläufe
  "accent-2": "96 165 250",      // Zweitakzent (Blau)
  "btn-a": "124 58 237",         // Knopf-Verlauf links
  "btn-b": "99 102 241",         // Knopf-Verlauf Mitte
  "btn-c": "139 92 246",         // Knopf-Verlauf rechts
  "soft": "233 213 255",         // helle Akzentschrift
  "soft-2": "243 232 255",
  "soft-3": "196 181 253",
  "soft-blue": "191 219 254",
  "gold": "251 191 36",
  "gold-2": "249 115 22",
  "gold-text": "253 230 138",
  "danger": "239 68 68",
  "danger-2": "248 113 113",
  "danger-text": "252 165 165",
  "danger-text-2": "254 202 202",
  "danger-deep": "220 38 38",
  "success": "52 211 153",
  "success-text": "134 239 172",
  "bg": "5 3 17",                // Seitenhintergrund
  "bg-mid": "15 10 30",
  "glow-1": "88 28 135",         // Lichtschein oben links
  "glow-2": "30 58 138",         // Lichtschein unten rechts
  "s-card": "12 8 28",           // Karten / Panels
  "s-head": "8 5 20",            // Kopfzeilen
  "s-dialog": "15 10 35",
  "s-bar": "10 7 24",            // Eingabeleiste, feste Spalte
  "s-info": "18 10 40",
  "s-error": "28 8 16",
  "s-deep": "10 6 22",
  "orb-blue": "59 130 246",      // schwebende Lichter im Hintergrund
  "orb-pink": "236 72 153",
};

/** Eigene Spielerfarben je Design (gut unterscheidbar; Spieler 1 trägt die Designfarbe). */
const PALETTES = {
  feuer: makePlayerColors(["#fb923c", "#facc15", "#f87171", "#60a5fa", "#34d399", "#e879f9"]),
  eis: makePlayerColors(["#67e8f9", "#a5b4fc", "#f0abfc", "#5eead4", "#fda4af", "#fde68a"]),
  druide: makePlayerColors(["#4ade80", "#facc15", "#fb923c", "#38bdf8", "#f472b6", "#c4b5fd"]),
  gold: makePlayerColors(["#eab308", "#e5e7eb", "#f97316", "#60a5fa", "#34d399", "#f472b6"]),
  neon: makePlayerColors(["#f472b6", "#22d3ee", "#a3e635", "#facc15", "#fb923c", "#c084fc"]),
  // Helles Pergament: kräftige „Tinten“-Töne statt Pastell
  pergament: makePlayerColors(["#7e22ce", "#1d4ed8", "#c2410c", "#047857", "#be123c", "#a16207"], 1.6),
};

export const THEMES = [
  {
    id: "arkan", label: "Arkan", icon: "🔮", swatch: ["#050311", "#c084fc", "#60a5fa"],
    tokens: {},
  },
  {
    id: "feuer", label: "Feuerzauber", icon: "🔥", swatch: ["#0c0402", "#fb923c", "#facc15"],
    tokens: {
      "accent": "251 146 60", "accent-mid": "248 113 113", "accent-2": "250 204 21",
      "btn-a": "194 65 12", "btn-b": "220 38 38", "btn-c": "234 88 12",
      "soft": "254 215 170", "soft-2": "255 237 213", "soft-3": "253 186 116", "soft-blue": "254 240 138",
      "bg": "12 4 2", "bg-mid": "26 9 5", "glow-1": "153 27 27", "glow-2": "180 83 9",
      "s-card": "28 10 6", "s-head": "20 7 4", "s-dialog": "34 12 8", "s-bar": "24 9 5",
      "s-info": "40 14 8", "s-error": "40 8 8", "s-deep": "16 6 3",
      "orb-blue": "234 88 12", "orb-pink": "220 38 38",
    },
  },
  {
    id: "eis", label: "Eiszauber", icon: "❄️", swatch: ["#020810", "#67e8f9", "#e0f2fe"],
    tokens: {
      "accent": "103 232 249", "accent-mid": "125 211 252", "accent-2": "224 242 254",
      "btn-a": "8 145 178", "btn-b": "2 132 199", "btn-c": "14 165 233",
      "soft": "207 250 254", "soft-2": "236 254 255", "soft-3": "165 243 252", "soft-blue": "224 242 254",
      "bg": "2 8 16", "bg-mid": "6 18 30", "glow-1": "14 116 144", "glow-2": "30 64 175",
      "s-card": "6 18 32", "s-head": "4 13 24", "s-dialog": "8 22 38", "s-bar": "5 15 28",
      "s-info": "8 26 44", "s-error": "36 10 18", "s-deep": "3 10 20",
      "orb-blue": "56 189 248", "orb-pink": "165 180 252",
    },
  },
  {
    id: "druide", label: "Druidenhain", icon: "🌿", swatch: ["#020a05", "#4ade80", "#facc15"],
    tokens: {
      "accent": "74 222 128", "accent-mid": "163 230 53", "accent-2": "250 204 21",
      "btn-a": "21 128 61", "btn-b": "22 101 52", "btn-c": "34 197 94",
      "soft": "220 252 231", "soft-2": "240 253 244", "soft-3": "187 247 208", "soft-blue": "254 249 195",
      "bg": "2 10 5", "bg-mid": "6 20 10", "glow-1": "21 94 47", "glow-2": "101 84 14",
      "s-card": "8 22 12", "s-head": "5 16 8", "s-dialog": "10 28 16", "s-bar": "6 19 10",
      "s-info": "12 34 20", "s-error": "36 12 12", "s-deep": "4 14 7",
      "orb-blue": "16 185 129", "orb-pink": "234 179 8",
    },
  },
  {
    id: "gold", label: "Königshof", icon: "👑", swatch: ["#050504", "#eab308", "#fde047"],
    tokens: {
      "accent": "234 179 8", "accent-mid": "245 158 11", "accent-2": "253 224 71",
      "btn-a": "161 98 7", "btn-b": "180 83 9", "btn-c": "202 138 4",
      "soft": "254 243 199", "soft-2": "255 251 235", "soft-3": "253 230 138", "soft-blue": "254 249 195",
      "bg": "5 5 4", "bg-mid": "14 12 8", "glow-1": "120 90 20", "glow-2": "70 60 40",
      "s-card": "16 14 10", "s-head": "11 10 7", "s-dialog": "20 18 12", "s-bar": "13 12 8",
      "s-info": "26 22 12", "s-error": "34 10 10", "s-deep": "8 7 5",
      "orb-blue": "202 138 4", "orb-pink": "161 98 7",
    },
  },
  {
    id: "neon", label: "Neon-Magie", icon: "🌌", swatch: ["#06020e", "#f472b6", "#22d3ee"],
    tokens: {
      "accent": "244 114 182", "accent-mid": "192 132 252", "accent-2": "34 211 238",
      "btn-a": "219 39 119", "btn-b": "147 51 234", "btn-c": "236 72 153",
      "soft": "251 207 232", "soft-2": "253 242 248", "soft-3": "249 168 212", "soft-blue": "165 243 252",
      "bg": "6 2 14", "bg-mid": "16 5 28", "glow-1": "157 23 77", "glow-2": "8 145 178",
      "s-card": "18 6 30", "s-head": "12 4 22", "s-dialog": "22 8 38", "s-bar": "14 5 26",
      "s-info": "28 10 48", "s-error": "40 8 22", "s-deep": "10 3 18",
      "orb-blue": "34 211 238", "orb-pink": "236 72 153",
    },
  },
  {
    // Helles Design im Stil der offiziellen Anleitung und des „Blocks der Wahrheit“
    id: "pergament", label: "Pergament", icon: "📜", swatch: ["#ecdfbe", "#991b1b", "#1e40af"], light: true,
    tokens: {
      "ink": "62 39 20",
      "accent": "153 27 27", "accent-mid": "124 45 18", "accent-2": "30 64 175",
      "btn-a": "120 53 15", "btn-b": "146 64 14", "btn-c": "153 27 27",
      "soft": "92 30 14", "soft-2": "70 30 12", "soft-3": "120 53 15", "soft-blue": "30 58 138",
      "gold": "180 120 10", "gold-2": "194 65 12", "gold-text": "133 77 14",
      "danger": "185 28 28", "danger-2": "185 28 28", "danger-text": "153 27 27", "danger-text-2": "127 29 29",
      "danger-deep": "153 27 27", "success": "21 128 61", "success-text": "21 101 52",
      "bg": "236 223 190", "bg-mid": "243 233 207", "glow-1": "196 160 100", "glow-2": "180 140 90",
      "s-card": "250 243 224", "s-head": "245 235 210", "s-dialog": "251 245 228", "s-bar": "244 233 206",
      "s-info": "250 240 220", "s-error": "253 236 230", "s-deep": "92 64 40",
      "orb-blue": "180 120 60", "orb-pink": "190 110 80",
    },
  },
];

const THEME_KEY = "wizard:theme";
const DEFAULT_THEME = THEMES[0];
const byId = (id) => THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;

/** CSS mit allen Variablen: Standard auf :root, jedes Design auf :root[data-theme=…]. */
export function themeCss() {
  const block = (selector, tokens) =>
    `${selector} {\n${Object.entries(tokens).map(([k, v]) => `  --${k}: ${v};`).join("\n")}\n}`;
  return [
    block(":root", BASE),
    ...THEMES.filter((t) => Object.keys(t.tokens).length).map((t) => block(`:root[data-theme="${t.id}"]`, t.tokens)),
    `:root[data-theme="pergament"] { color-scheme: light; }`,
  ].join("\n");
}

function readStored() {
  try {
    return byId(localStorage.getItem(THEME_KEY)).id;
  } catch {
    return DEFAULT_THEME.id;
  }
}

let currentTheme = readStored();
const listeners = new Set();

export function getStoredTheme() {
  return readStored();
}

export function getTheme() {
  return currentTheme;
}

/** Symbol des Designs (Startbildschirm, Einladung, Favicon). */
export function themeIcon(id = currentTheme) {
  return byId(id).icon;
}

/** Design anwenden: data-theme setzen, speichern, Spielerfarben, Browserleiste, Favicon. */
export function applyTheme(id) {
  const theme = byId(id);
  currentTheme = theme.id;
  document.documentElement.dataset.theme = theme.id;
  try { localStorage.setItem(THEME_KEY, theme.id); } catch { /* egal */ }
  setPlayerColors(PALETTES[theme.id] ?? DEFAULT_PLAYER_COLORS);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.swatch[0]);
  document.querySelector('link[rel="icon"]')?.setAttribute(
    "href",
    `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${theme.icon}</text></svg>`,
  );
  listeners.forEach((notify) => notify());
}

/** Reaktiver Zugriff auf das aktive Design. */
export function useTheme() {
  return useSyncExternalStore(
    (onChange) => { listeners.add(onChange); return () => listeners.delete(onChange); },
    getTheme,
    getTheme,
  );
}
