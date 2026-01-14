"use client";

import { useEffect, useRef } from "react";

interface TrackingAperturaProps {
  token: string;
}

/**
 * Componente invisible que registra la apertura del link
 * Se ejecuta una vez cuando el componente se monta
 */
export function TrackingApertura({ token }: TrackingAperturaProps) {
  const tracked = useRef(false);

  useEffect(() => {
    // Solo trackear una vez por carga de página
    if (tracked.current) return;
    tracked.current = true;

    const trackOpening = async () => {
      try {
        await fetch(`/api/ver/${token}/tracking`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userAgent: navigator.userAgent,
          }),
        });
      } catch (error) {
        // Silenciosamente ignorar errores de tracking
        console.error("Error tracking apertura:", error);
      }
    };

    trackOpening();
  }, [token]);

  // Este componente no renderiza nada visible
  return null;
}
