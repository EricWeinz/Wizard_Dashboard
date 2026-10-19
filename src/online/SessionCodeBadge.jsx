import React, { useState } from "react";
import { copyText, inviteUrl } from "./ui.jsx";

/** Kompakter Code-Chip; Klick kopiert den Einladungslink (…/?code=ABC234). */
export default function SessionCodeBadge({ code, compact = false }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (await copyText(inviteUrl(code))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button onClick={copy} className="magic-btn-sm" aria-label={`Einladungslink für Sitzung ${code} kopieren`}
      title="Einladungslink kopieren"
      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'Cinzel', serif", letterSpacing: 2, fontWeight: 700 }}>
      {!compact && <span style={{ fontSize: 10, letterSpacing: 1, opacity: 0.6, fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>Code</span>}
      {code}
      <span aria-hidden style={{ letterSpacing: 0 }}>{copied ? "✅" : "🔗"}</span>
    </button>
  );
}
