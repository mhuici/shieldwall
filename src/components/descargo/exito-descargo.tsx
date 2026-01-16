"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, FileText, XCircle, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { DecisionDescargo } from "@/lib/types";

interface ExitoDescargoProps {
  decision: DecisionDescargo;
  hash: string;
  empleadoNombre: string;
}

export function ExitoDescargo({ decision, hash, empleadoNombre }: ExitoDescargoProps) {
  const [copiado, setCopiado] = useState(false);
  const esEjercer = decision === "ejercer_descargo";

  const handleCopiarHash = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error("Error copiando:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-lg">NotiLegal</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          {/* Card de éxito */}
          <Card className={esEjercer ? "border-green-200" : "border-gray-200"}>
            <CardHeader className="text-center">
              <div
                className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  esEjercer ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                {esEjercer ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-gray-600" />
                )}
              </div>
              <CardTitle className="text-xl">
                {esEjercer ? "Descargo Presentado" : "Declinación Registrada"}
              </CardTitle>
              <CardDescription className="text-base">
                {esEjercer
                  ? "Su descargo ha sido registrado exitosamente"
                  : "Su decisión de no presentar descargo ha sido registrada"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Estimado/a <strong>{empleadoNombre}</strong>,{" "}
                  {esEjercer
                    ? "su versión de los hechos ha quedado incorporada al expediente laboral."
                    : "ha quedado constancia de que se le ofreció el derecho a descargo y decidió no ejercerlo."}
                </p>
              </div>

              {/* Hash de integridad */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hash de Integridad (SHA-256)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopiarHash}
                    className="h-8"
                  >
                    {copiado ? (
                      <>
                        <Check className="h-4 w-4 mr-1 text-green-600" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                <code className="block text-xs font-mono bg-white p-2 rounded border break-all">
                  {hash}
                </code>
                <p className="text-xs text-muted-foreground">
                  Este código único garantiza que el contenido no puede ser alterado.
                  Guárdelo como comprobante.
                </p>
              </div>

              {/* Info adicional */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 text-sm mb-1">
                      ¿Qué sigue?
                    </h4>
                    <p className="text-sm text-blue-800">
                      {esEjercer
                        ? "Su empleador recibirá notificación de su descargo y lo incorporará al proceso disciplinario."
                        : "Su empleador recibirá notificación de su decisión. El proceso disciplinario continuará su curso."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Registrado el{" "}
                  {new Date().toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Puede cerrar */}
          <p className="text-center text-sm text-muted-foreground">
            Puede cerrar esta ventana. Recibirá una copia por email si tiene uno registrado.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-4">
        <p>Sistema de notificaciones laborales con validez legal</p>
      </div>
    </div>
  );
}
