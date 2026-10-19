import React, { useState } from "react";
import { themeLogo, useTheme } from "../lib/theme.js";

/**
 * Bild-Logo des aktiven Designs (z. B. das Dynamo-Wappen) – wie das BrandMark im Kniffel Dashboard.
 * Hat das Design kein Logo oder lädt das Bild nicht, erscheint `fallback` (Standard: nichts),
 * damit die übrigen Designs unverändert bleiben.
 */
export default function ThemeLogo({ height, fallback = null, style }) {
  const theme = useTheme();
  const src = themeLogo(theme);
  const [failed, setFailed] = useState(null);
  if (!src || failed === src) return fallback;
  return (
    <img src={src} alt="" aria-hidden draggable={false} onError={() => setFailed(src)}
      style={{ height, width: "auto", display: "block", filter: "drop-shadow(0 0 18px rgb(var(--accent) / 0.35))", ...style }} />
  );
}
