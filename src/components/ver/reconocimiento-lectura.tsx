"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  FileSignature,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";

interface ReconocimientoLecturaProps {
  notificacionId: string;
  token: string;
  /** Si el usuario puede enviar (scroll y tiempo completados) */
  puedeEnviar: boolean;
  /** Tipo de sanción para generar pregunta */
  tipoSancion: string;
  /** Días de suspensión (si aplica) */
  diasSuspension?: number;
  /** Fecha del hecho */
  fechaHecho?: string;
  /** Callback cuando se confirma */
  onConfirmado?: () => void;
}

interface CampoReconocimiento {
  tipo: string;
  pregunta: string;
  ejemplo: string;
}

const CAMPOS_POR_TIPO: Record<string, CampoReconocimiento> = {
  tipo_sancion: {
    tipo: "tipo_sancion",
    pregunta: "Indique la sanción o medida mencionada en el documento",
    ejemplo: 'Ej: "suspensión", "apercibimiento"',
  },
  duracion: {
    tipo: "duracion",
    pregunta: "Indique la cantidad de días mencionada",
    ejemplo: 'Ej: "3 días", "5"',
  },
  fecha_hecho: {
    tipo: "fecha_hecho",
    pregunta: "Indique la fecha del hecho sancionado",
    ejemplo: 'Ej: "15/01/2026"',
  },
};

export function ReconocimientoLectura({
  notificacionId,
  token,
  puedeEnviar,
  tipoSancion,
  diasSuspension,
  fechaHecho,
  onConfirmado,
}: ReconocimientoLecturaProps) {
  const router = useRouter();

  const [campo, setCampo] = useState<CampoReconocimiento | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intentos, setIntentos] = useState(0);
  const [intentosFallidos, setIntentosFallidos] = useState<string[]>([]);

  const MAX_INTENTOS = 3;
  const intentosRestantes = MAX_INTENTOS - intentos;

  // Seleccionar campo aleatorio al montar
  useEffect(() => {
    const camposDisponibles: CampoReconocimiento[] = [
      CAMPOS_POR_TIPO.tipo_sancion,
    ];

    if (tipoSancion === "suspension" && diasSuspension) {
      camposDisponibles.push(CAMPOS_POR_TIPO.duracion);
    }

    if (fechaHecho) {
      camposDisponibles.push(CAMPOS_POR_TIPO.fecha_hecho);
    }

    // Seleccionar uno con probabilidad ponderada (tipo_sancion tiene más peso)
    const random = Math.random();
    if (camposDisponibles.length === 1) {
      setCampo(camposDisponibles[0]);
    } else if (random < 0.5) {
      setCampo(camposDisponibles[0]); // tipo_sancion
    } else if (camposDisponibles.length === 2) {
      setCampo(camposDisponibles[1]);
    } else {
      setCampo(camposDisponibles[random < 0.75 ? 1 : 2]);
    }
  }, [tipoSancion, diasSuspension, fechaHecho]);

  const handleSubmit = async () => {
    if (!respuesta.trim()) {
      setError("Por favor ingrese su respuesta");
      return;
    }

    if (!puedeEnviar) {
      setError("Por favor lea el documento completo antes de continuar");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ver/${token}/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          // Nuevo formato: texto libre en lugar de checkbox
          reconocimiento: {
            campo_tipo: campo?.tipo,
            respuesta: respuesta.trim(),
            intento_numero: intentos + 1,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Incrementar intentos
        setIntentos((prev) => prev + 1);
        setIntentosFallidos((prev) => [...prev, respuesta.trim()]);

        if (data.intentosAgotados) {
          setError(
            "Ha agotado los intentos disponibles. Por favor contacte a su empleador para verificar su identidad."
          );
        } else {
          setError(
            data.error ||
              "La respuesta no coincide con el documento. Por favor revise y vuelva a intentar."
          );
        }
        return;
      }

      setConfirmed(true);
      onConfirmado?.();
      router.refresh();
    } catch (err) {
      console.error("Error al confirmar lectura:", err);
      setError("Error de conexión. Por favor intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-3" />
          <p className="font-semibold text-green-700 text-lg">
            Notificación confirmada correctamente
          </p>
          <p className="text-sm text-green-600 mt-1">
            Se ha registrado la fecha y hora de su confirmación
          </p>
        </CardContent>
      </Card>
    );
  }

  if (intentos >= MAX_INTENTOS) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-10 w-10 text-red-600 mx-auto mb-3" />
          <p className="font-semibold text-red-700 text-lg">
            Intentos agotados
          </p>
          <p className="text-sm text-red-600 mt-2">
            Ha agotado los {MAX_INTENTOS} intentos disponibles para confirmar la
            lectura.
          </p>
          <p className="text-sm text-red-600 mt-2">
            Por favor contacte a su empleador o al área de Recursos Humanos para
            recibir asistencia.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-blue-50 border-b border-blue-200">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSignature className="h-5 w-5 text-blue-600" />
          Confirmación de Lectura
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Indicador de que debe leer primero */}
        {!puedeEnviar && (
          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertDescription>
              Por favor lea el documento completo antes de continuar. El botón
              se habilitará cuando haya leído todo el contenido.
            </AlertDescription>
          </Alert>
        )}

        {/* Campo de reconocimiento */}
        {campo && (
          <div className="space-y-3">
            <Label htmlFor="reconocimiento" className="text-base">
              {campo.pregunta}:
            </Label>
            <Input
              id="reconocimiento"
              type="text"
              value={respuesta}
              onChange={(e) => {
                setRespuesta(e.target.value);
                setError(null);
              }}
              placeholder={campo.ejemplo}
              disabled={loading || !puedeEnviar}
              className="text-lg"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">{campo.ejemplo}</p>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Intentos restantes */}
        {intentos > 0 && intentosRestantes > 0 && (
          <p className="text-sm text-amber-600 text-center">
            Intentos restantes: {intentosRestantes}
          </p>
        )}

        {/* Nota legal */}
        <div className="bg-slate-50 p-3 rounded-lg border">
          <p className="text-xs text-muted-foreground">
            Al confirmar, usted declara haber leído y comprendido el contenido
            de esta notificación. Se registrará la fecha, hora y su respuesta
            como prueba de recepción.
          </p>
        </div>

        {/* Botón de confirmación */}
        <Button
          onClick={handleSubmit}
          disabled={loading || !puedeEnviar || !respuesta.trim()}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirmando...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirmar Recepción
            </>
          )}
        </Button>

        {!puedeEnviar && (
          <p className="text-xs text-center text-muted-foreground">
            Continúe leyendo el documento para habilitar la confirmación
          </p>
        )}
      </CardContent>
    </Card>
  );
}
