"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, MessageSquare, Send, AlertTriangle, FileSignature } from "lucide-react";
import Link from "next/link";

interface EnviarNotificacionButtonProps {
  notificacionId: string;
  tieneEmail: boolean;
  tieneTelefono: boolean;
  tieneConvenio?: boolean;
}

export function EnviarNotificacionButton({
  notificacionId,
  tieneEmail,
  tieneTelefono,
  tieneConvenio = false,
}: EnviarNotificacionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [enviarSMS, setEnviarSMS] = useState(false);
  const [resultado, setResultado] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Si no tiene convenio firmado, mostrar advertencia
  if (!tieneConvenio) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-900 mb-1">
              Convenio de Domicilio Electrónico requerido
            </h4>
            <p className="text-sm text-amber-700 mb-3">
              Para enviar notificaciones electrónicas con validez legal, el empleado debe
              firmar primero el Convenio de Domicilio Electrónico conforme a la Acordada
              N° 31/2011 CSJN.
            </p>
            <Link href="/dashboard/empleados">
              <Button variant="outline" size="sm" className="gap-2">
                <FileSignature className="h-4 w-4" />
                Ir a gestionar convenios
              </Button>
            </Link>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Alternativa: Puede enviar notificación por carta documento desde la opción
          correspondiente.
        </p>
      </div>
    );
  }

  const handleEnviar = async () => {
    setLoading(true);
    setResultado(null);

    try {
      const response = await fetch(`/api/notificar/${notificacionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enviarSMS,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar notificación");
      }

      setResultado({
        success: true,
        message: enviarSMS && data.sms?.enviado
          ? "Email y SMS enviados correctamente"
          : "Email enviado correctamente",
      });

      // Refrescar la página para mostrar el nuevo estado
      setTimeout(() => {
        router.refresh();
      }, 1500);

    } catch (error) {
      setResultado({
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Mail className="h-5 w-5 text-blue-600" />
          <span className="text-blue-700">Se enviará email al empleado</span>
        </div>

        {tieneTelefono && (
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <Checkbox
              id="enviarSMS"
              checked={enviarSMS}
              onCheckedChange={(checked) => setEnviarSMS(checked as boolean)}
              disabled={loading}
            />
            <label
              htmlFor="enviarSMS"
              className="flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span>También enviar SMS de notificación</span>
            </label>
          </div>
        )}
      </div>

      <Button
        onClick={handleEnviar}
        disabled={loading || !tieneEmail}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="mr-2 h-5 w-5" />
            Enviar Notificación
          </>
        )}
      </Button>

      {resultado && (
        <div
          className={`p-3 rounded-lg text-center ${
            resultado.success
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {resultado.message}
        </div>
      )}
    </div>
  );
}
