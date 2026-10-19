/** localStorage-Schlüssel des Online-Modus (ohne Abhängigkeiten, auch vom Haupt-Bundle genutzt). */
export const PLAYER_ID_KEY = "wizard:playerId";
export const NAME_KEY = "wizard:playerName";
export const LAST_SESSION_KEY = "wizard:lastSession";
export const SPECTATE_KEY = "wizard:spectating";
/** sessionStorage: dieser Tab war mit dieser Sitzung verbunden (Reload = automatisch wieder verbinden). */
export const TAB_SESSION_KEY = "wizard:tabSession";

/** Sitzungscode aus dem Einladungslink (?code=…), normalisiert, oder null. */
export function inviteCodeFromUrl() {
  try {
    const raw = new URLSearchParams(window.location.search).get("code") ?? "";
    const code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    return code.length === 6 ? code : null;
  } catch {
    return null;
  }
}
