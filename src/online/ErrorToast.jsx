import React, { useEffect } from "react";
import { useOnlineStore } from "./store.js";
import { Toast } from "./ui.jsx";

/** Globale Fehlermeldung oben mittig; verschwindet nach 6 Sekunden von selbst. */
export default function ErrorToast() {
  const error = useOnlineStore((s) => s.error);
  const clearError = useOnlineStore((s) => s.clearError);

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(clearError, 6000);
    return () => clearTimeout(timer);
  }, [error, clearError]);

  if (!error) return null;
  return <Toast tone="error" onClose={clearError}>{error}</Toast>;
}
