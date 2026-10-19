import React from "react";

/* ════════════════════════════════════════════
   GLOBALE STYLES (Schriften, Buttons, Tabellenköpfe, Animationen)
   ════════════════════════════════════════════ */
export default function GlobalStyles() {
  return <style>{CSS}</style>;
}

const CSS = `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@700;900&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

        * { box-sizing: border-box; margin: 0; }
        input::placeholder { color: rgba(255,255,255,0.12) !important; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(192,132,252,0.15); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(192,132,252,0.3); }
        table th, table td { vertical-align: middle; }

        .th1 {
          position: sticky; top: 0; z-index: 5; padding: 10px 8px;
          background: rgba(8,5,20,0.97); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          text-align: left; font-size: 11px; color: rgba(255,255,255,0.3);
          letter-spacing: 1px; text-transform: uppercase; font-weight: 500;
        }
        .th2 {
          position: sticky; top: 37px; z-index: 5; padding: 5px 4px;
          background: rgba(8,5,20,0.97);
          border-bottom: 1px solid rgba(255,255,255,0.04);
          text-align: center; font-size: 10px; color: rgba(255,255,255,0.2);
          letter-spacing: 1px; text-transform: uppercase;
        }

        .magic-btn-sm {
          padding: 7px 12px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.5);
          font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.3s;
        }
        .magic-btn-sm:hover {
          border-color: rgba(192,132,252,0.3); color: #c084fc;
          box-shadow: 0 0 12px rgba(192,132,252,0.15);
        }

        .magic-btn-gold {
          padding: 7px 16px; border-radius: 8px; border: none;
          background: linear-gradient(135deg, #fbbf24, #f97316);
          color: #000; font-size: 13px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          animation: pulseGold 2s infinite;
          box-shadow: 0 0 16px rgba(251,191,36,0.3);
        }

        .magic-btn-primary {
          padding: 14px 32px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #8b5cf6 100%);
          color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: 'Cinzel', serif; letter-spacing: 2px; text-transform: uppercase;
          box-shadow: 0 4px 24px rgba(124,58,237,0.35);
          transition: all 0.3s;
        }
        .magic-btn-primary:hover {
          transform: translateY(-2px); box-shadow: 0 8px 36px rgba(124,58,237,0.5);
        }

        .magic-btn-secondary {
          padding: 14px 28px; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6);
          font-size: 14px; cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.3s;
        }
        .magic-btn-secondary:hover {
          border-color: rgba(192,132,252,0.3); color: #c084fc;
        }

        /* ── Ergänzungen für Startseite & Online-Modus ── */
        body { background: #050311; }
        .magic-btn-sm:focus-visible, .magic-btn-primary:focus-visible, .magic-btn-secondary:focus-visible,
        .magic-btn-gold:focus-visible, .magic-option:focus-visible, .magic-chip:focus-visible {
          outline: 2px solid #c084fc; outline-offset: 2px;
        }
        .magic-btn-primary:disabled, .magic-btn-secondary:disabled, .magic-btn-sm:disabled,
        .magic-chip:disabled, .magic-option:disabled {
          opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none;
        }

        .magic-card {
          background: rgba(12,8,28,0.8); border: 1px solid rgba(192,132,252,0.15);
          border-radius: 24px; padding: 32px 28px; width: 100%; max-width: 500px;
          backdrop-filter: blur(24px); position: relative;
          box-shadow: 0 0 60px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .magic-label {
          display: block; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
          color: rgba(192,132,252,0.5); margin-bottom: 14px; font-family: "Cinzel", serif;
        }
        .magic-field {
          width: 100%; padding: 13px 18px; border-radius: 12px;
          border: 1.5px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
          color: #fff; font-size: 16px; outline: none; font-family: "DM Sans", sans-serif;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .magic-field:focus { border-color: #c084fc; box-shadow: 0 0 16px rgba(192,132,252,0.2); }

        .magic-option {
          display: flex; align-items: center; gap: 16px; width: 100%; text-align: left;
          padding: 18px 20px; border-radius: 16px; cursor: pointer;
          border: 1.5px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02);
          color: #fff; font-family: "DM Sans", sans-serif; transition: all 0.3s ease;
        }
        .magic-option:hover { border-color: rgba(192,132,252,0.5); background: rgba(192,132,252,0.08); box-shadow: 0 0 24px rgba(192,132,252,0.15); transform: translateY(-1px); }

        .magic-chip {
          min-width: 40px; height: 40px; padding: 0 12px; border-radius: 12px; cursor: pointer;
          border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.75); font-size: 16px; font-weight: 700;
          font-family: "DM Sans", sans-serif; transition: all 0.2s;
        }
        .magic-chip:hover:not(:disabled) { border-color: rgba(192,132,252,0.45); color: #fff; }

        @keyframes spinRune { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(-50%,-50%) translate(0, 0); }
          25% { transform: translate(-50%,-50%) translate(30px, -40px); }
          50% { transform: translate(-50%,-50%) translate(-20px, 20px); }
          75% { transform: translate(-50%,-50%) translate(40px, 30px); }
        }
        @keyframes floatRune {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.04; }
          30% { opacity: 0.08; }
          50% { transform: translate(var(--dx), var(--dy)) rotate(15deg); opacity: 0.06; }
          70% { opacity: 0.08; }
        }
        @keyframes aurora {
          0%, 100% { transform: scaleX(1) skewX(0deg); opacity: 0.6; }
          33% { transform: scaleX(1.15) skewX(3deg); opacity: 0.8; }
          66% { transform: scaleX(0.9) skewX(-2deg); opacity: 0.5; }
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes spinSlow {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes portalIn {
          from { opacity: 0; transform: scale(0.95); filter: blur(6px); }
          to { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes portalOut {
          from { opacity: 1; transform: scale(1); filter: blur(0); }
          to { opacity: 0; transform: scale(1.05); filter: blur(8px); }
        }
        @keyframes pulseGold {
          0%, 100% { box-shadow: 0 0 10px rgba(251,191,36,0.3); }
          50% { box-shadow: 0 0 24px rgba(251,191,36,0.6), 0 0 48px rgba(251,191,36,0.2); }
        }
        @keyframes burstParticle {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--bx), var(--by)) scale(0); opacity: 0; }
        }
        @keyframes burstGlow {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 0.8; }
          100% { transform: translate(-50%,-50%) scale(4); opacity: 0; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) translateX(var(--drift)) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-12px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(4px); }
        }
`;
