import React, { useState, useEffect, useRef } from "react";

/* ════════════════════════════════════════════
   ANIMATED NUMBER (Feature 8)
   ════════════════════════════════════════════ */
export default function AnimatedNumber({ value, color, size = 30, glow = false, glowColor }) {
  const [display, setDisplay] = useState(value);
  const ref = useRef(value);
  const frameRef = useRef(null);

  useEffect(() => {
    const from = ref.current;
    const to = value;
    if (from === to) return;
    const diff = to - from;
    const steps = Math.min(Math.abs(diff), 20);
    const duration = Math.min(400, steps * 30);
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(from + diff * eased);
      setDisplay(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        ref.current = to;
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value]);

  return (
    <span style={{
      fontSize: size, fontWeight: 700, color, fontFamily: "'Cinzel', serif", lineHeight: 1,
      filter: glow ? `drop-shadow(0 0 6px ${glowColor})` : "none",
      transition: "color 0.3s",
    }}>{display}</span>
  );
}
