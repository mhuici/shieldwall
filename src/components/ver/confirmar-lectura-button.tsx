"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle } from "lucide-react";

interface ConfirmarLecturaButtonProps {
  notificacionId: string;
  token?: string;
}

export function ConfirmarLecturaButton({ notificacionId, token }: ConfirmarLecturaButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!accepted) {
      setError("Debés aceptar haber leído la notificación");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Usar token si está disponible, sino usar ID
      const identificador = token || notificacionId;

      const response = await fetch(`/api/ver/${identificador}/confirmar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al confirmar lectura");
      }

      setConfirmed(true);
      router.refresh();
    } catch (err) {
      console.error("Error al confirmar lectura:", err);
      setError("Error al confirmar la lectura. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="font-medium text-green-700">
            Lectura confirmada correctamente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="acepto"
            checked={accepted}
            onCheckedChange={(checked) => {
              setAccepted(checked as boolean);
              setError(null);
            }}
            disabled={loading}
          />
          <label
            htmlFor="acepto"
            className="text-sm leading-relaxed cursor-pointer"
          >
            Declaro haber leído y recibido esta notificación de sanción laboral.
            Entiendo que tengo 30 días corridos para impugnarla y que, de no hacerlo,
            quedará firme con valor de prueba plena.
          </label>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          onClick={handleConfirm}
          disabled={loading || !accepted}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirmando...
            </>
          ) : (
            "Confirmar Lectura"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Al confirmar, se registrará la fecha y hora de lectura con fines probatorios.
        </p>
      </CardContent>
    </Card>
  );
}
