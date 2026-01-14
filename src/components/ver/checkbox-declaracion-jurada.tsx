"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle, FileSignature } from "lucide-react";
import { TEXTOS_LEGALES } from "@/lib/types";

interface CheckboxDeclaracionJuradaProps {
  notificacionId: string;
  token?: string;
  onConfirmado?: () => void;
}

export function CheckboxDeclaracionJurada({
  notificacionId,
  token,
  onConfirmado,
}: CheckboxDeclaracionJuradaProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!accepted) {
      setError("Debe marcar la casilla de declaración jurada para continuar");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const identificador = token || notificacionId;

      const response = await fetch(`/api/ver/${identificador}/confirmar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          checkboxAceptado: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al confirmar lectura");
      }

      setConfirmed(true);
      onConfirmado?.();
      router.refresh();
    } catch (err) {
      console.error("Error al confirmar lectura:", err);
      setError("Error al confirmar la lectura. Por favor, intente nuevamente.");
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

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-blue-50 border-b border-blue-200">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSignature className="h-5 w-5 text-blue-600" />
          Confirmación de Recepción
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Checkbox con declaración jurada */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="declaracion-jurada"
            checked={accepted}
            onCheckedChange={(checked) => {
              setAccepted(checked as boolean);
              setError(null);
            }}
            disabled={loading}
            className="mt-1"
          />
          <label
            htmlFor="declaracion-jurada"
            className="text-sm leading-relaxed cursor-pointer select-none"
          >
            <span className="font-semibold">DECLARO BAJO JURAMENTO</span> que:
            <ul className="mt-2 space-y-1 list-none">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">(i)</span>
                <span>He accedido personalmente a este documento;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">(ii)</span>
                <span>He leído íntegramente su contenido;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">(iii)</span>
                <span>
                  Comprendo que dispongo de <strong>TREINTA (30) días corridos</strong>{" "}
                  desde la fecha de esta confirmación para ejercer mi derecho de
                  impugnación por escrito ante el empleador;
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-medium">(iv)</span>
                <span>
                  Entiendo que, transcurrido dicho plazo sin impugnación fehaciente,
                  la sanción adquirirá <strong>firmeza</strong> conforme a la Ley 27.742.
                </span>
              </li>
            </ul>
          </label>
        </div>

        {/* Nota legal */}
        <div className="bg-slate-50 p-3 rounded-lg border">
          <p className="text-xs text-muted-foreground">
            La presente declaración constituye prueba de notificación fehaciente a todos
            los efectos legales. Se registrará la fecha, hora, dirección IP y dispositivo
            utilizado para esta confirmación.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Button
          onClick={handleConfirm}
          disabled={loading || !accepted}
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
              Confirmar Recepción de Notificación
            </>
          )}
        </Button>

        {!accepted && (
          <p className="text-xs text-center text-muted-foreground">
            Debe marcar la casilla de declaración jurada para habilitar el botón
          </p>
        )}
      </CardContent>
    </Card>
  );
}
