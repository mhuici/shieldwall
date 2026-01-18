"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ScrollTrackerProps {
  /** Token de la notificación para enviar tracking */
  token: string;
  /** Callback cuando se alcanza el porcentaje mínimo de scroll */
  onScrollComplete?: () => void;
  /** Callback cuando se alcanza el tiempo mínimo de lectura */
  onTimeComplete?: () => void;
  /** Tiempo mínimo de lectura en segundos (calculado por backend) */
  tiempoMinimoSegundos?: number;
  /** Porcentaje de scroll requerido (default 90%) */
  scrollMinimo?: number;
  children: React.ReactNode;
}

interface TrackingState {
  scrollPorcentajeMaximo: number;
  tiempoAcumuladoSegundos: number;
  scrollCompletado: boolean;
  tiempoCompletado: boolean;
}

/**
 * Componente que trackea scroll y tiempo de lectura de forma invisible.
 * No muestra indicadores visuales al usuario.
 */
export function ScrollTracker({
  token,
  onScrollComplete,
  onTimeComplete,
  tiempoMinimoSegundos = 30,
  scrollMinimo = 90,
  children,
}: ScrollTrackerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tracking, setTracking] = useState<TrackingState>({
    scrollPorcentajeMaximo: 0,
    tiempoAcumuladoSegundos: 0,
    scrollCompletado: false,
    tiempoCompletado: false,
  });

  // Referencias para el timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const isVisibleRef = useRef<boolean>(true);
  const lastSentRef = useRef<{ scroll: number; time: number }>({ scroll: 0, time: 0 });

  // Enviar tracking al backend (debounced)
  const sendTracking = useCallback(async (
    eventType: "scroll" | "tiempo" | "complete",
    data: Partial<TrackingState>
  ) => {
    // Solo enviar si hay cambios significativos
    const scrollChanged = Math.abs((data.scrollPorcentajeMaximo || 0) - lastSentRef.current.scroll) >= 10;
    const timeChanged = (data.tiempoAcumuladoSegundos || 0) - lastSentRef.current.time >= 10;

    if (eventType !== "complete" && !scrollChanged && !timeChanged) {
      return;
    }

    try {
      await fetch(`/api/ver/${token}/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evento_tipo: eventType,
          scroll_porcentaje: data.scrollPorcentajeMaximo,
          tiempo_segundos: data.tiempoAcumuladoSegundos,
          scroll_completado: data.scrollCompletado,
          tiempo_completado: data.tiempoCompletado,
        }),
      });

      lastSentRef.current = {
        scroll: data.scrollPorcentajeMaximo || lastSentRef.current.scroll,
        time: data.tiempoAcumuladoSegundos || lastSentRef.current.time,
      };
    } catch (error) {
      console.error("[ScrollTracker] Error sending tracking:", error);
    }
  }, [token]);

  // Handler de scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const scrollable = scrollHeight - clientHeight;
    const porcentaje = scrollable > 0 ? Math.round((scrollTop / scrollable) * 100) : 100;

    setTracking((prev) => {
      const nuevoMaximo = Math.max(prev.scrollPorcentajeMaximo, porcentaje);
      const nuevoCompletado = nuevoMaximo >= scrollMinimo;

      // Solo actualizar si hay cambios
      if (nuevoMaximo === prev.scrollPorcentajeMaximo) {
        return prev;
      }

      const newState = {
        ...prev,
        scrollPorcentajeMaximo: nuevoMaximo,
        scrollCompletado: nuevoCompletado,
      };

      // Enviar tracking
      sendTracking("scroll", newState);

      // Callback si se completó
      if (nuevoCompletado && !prev.scrollCompletado && onScrollComplete) {
        onScrollComplete();
      }

      return newState;
    });
  }, [scrollMinimo, onScrollComplete, sendTracking]);

  // Timer para tiempo de lectura
  useEffect(() => {
    const updateTime = () => {
      if (!isVisibleRef.current) return;

      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);

      setTracking((prev) => {
        const nuevoTiempoCompletado = elapsed >= tiempoMinimoSegundos;

        // Solo actualizar si hay cambios significativos
        if (elapsed === prev.tiempoAcumuladoSegundos) {
          return prev;
        }

        const newState = {
          ...prev,
          tiempoAcumuladoSegundos: elapsed,
          tiempoCompletado: nuevoTiempoCompletado,
        };

        // Enviar tracking cada 10 segundos
        if (elapsed % 10 === 0) {
          sendTracking("tiempo", newState);
        }

        // Callback si se completó
        if (nuevoTiempoCompletado && !prev.tiempoCompletado && onTimeComplete) {
          onTimeComplete();
        }

        return newState;
      });
    };

    timerRef.current = setInterval(updateTime, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [tiempoMinimoSegundos, onTimeComplete, sendTracking]);

  // Listener de visibilidad
  useEffect(() => {
    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === "visible";

      if (isVisibleRef.current) {
        // Resumir conteo desde donde quedó
        startTimeRef.current = Date.now() - (tracking.tiempoAcumuladoSegundos * 1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [tracking.tiempoAcumuladoSegundos]);

  // Enviar tracking final al desmontar
  useEffect(() => {
    return () => {
      sendTracking("complete", tracking);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-y-auto"
      style={{ maxHeight: "calc(100vh - 200px)" }}
    >
      {children}
    </div>
  );
}

/**
 * Hook para usar en componentes que necesitan saber el estado de tracking
 */
export function useScrollTracking(token: string, tiempoMinimoSegundos: number, scrollMinimo: number = 90) {
  const [puedeConfirmar, setPuedeConfirmar] = useState(false);
  const [scrollCompletado, setScrollCompletado] = useState(false);
  const [tiempoCompletado, setTiempoCompletado] = useState(false);

  useEffect(() => {
    setPuedeConfirmar(scrollCompletado && tiempoCompletado);
  }, [scrollCompletado, tiempoCompletado]);

  return {
    puedeConfirmar,
    scrollCompletado,
    tiempoCompletado,
    onScrollComplete: () => setScrollCompletado(true),
    onTimeComplete: () => setTiempoCompletado(true),
  };
}
