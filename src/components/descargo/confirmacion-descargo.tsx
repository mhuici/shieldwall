"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Loader2,
  AlertTriangle,
  FileText,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Lock,
} from "lucide-react";
import {
  type DecisionDescargo,
  TEXTO_CHECKBOX_EJERCER_DESCARGO,
  TEXTO_CHECKBOX_DECLINAR_DESCARGO,
} from "@/lib/types";

interface ConfirmacionDescargoProps {
  token: string;
  decision: DecisionDescargo;
  textoDescargo?: string;
  empleadoNombre: string;
  onVolver?: () => void;
  onConfirmado: (hash: string) => void;
}

export function ConfirmacionDescargo({
  token,
  decision,
  textoDescargo,
  empleadoNombre,
  onVolver,
  onConfirmado,
}: ConfirmacionDescargoProps) {
  const [aceptado, setAceptado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEjercer = decision === "ejercer_descargo";
  const checkboxTexto = esEjercer ? TEXTO_CHECKBOX_EJERCER_DESCARGO : TEXTO_CHECKBOX_DECLINAR_DESCARGO;

  const handleConfirmar = async () => {
    if (!aceptado) {
      setError("Debe aceptar la declaración jurada para continuar");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/descargo/${token}/confirmar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ checkbox_texto: checkboxTexto }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al confirmar el descargo");
        return;
      }

      onConfirmado(data.hash);
    } catch (err) {
      console.error("Error confirmando descargo:", err);
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-lg">NotiLegal</span>
            <span className="text-muted-foreground">- Confirmación Final</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Resumen de la decisión */}
          <Card className={esEjercer ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {esEjercer ? (
                  <FileText className="h-6 w-6 text-blue-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-gray-600" />
                )}
                <div>
                  <p className={`font-medium ${esEjercer ? "text-blue-800" : "text-gray-800"}`}>
                    {esEjercer ? "Presentar Descargo" : "Declinar Descargo"}
                  </p>
                  <p className={`text-sm ${esEjercer ? "text-blue-700" : "text-gray-700"}`}>
                    {esEjercer
                      ? "Va a presentar su versión de los hechos"
                      : "Va a declinar su derecho a presentar descargo"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vista previa del descargo (si ejerció) */}
          {esEjercer && textoDescargo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Su Descargo</CardTitle>
                <CardDescription>
                  Revise el contenido antes de confirmar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-sm">{textoDescargo}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Declaración jurada */}
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5" />
                Declaración Jurada
              </CardTitle>
              <CardDescription>
                Lea atentamente y acepte la siguiente declaración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-sm whitespace-pre-line">{checkboxTexto}</p>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="aceptar"
                  checked={aceptado}
                  onCheckedChange={(checked) => {
                    setAceptado(checked === true);
                    setError(null);
                  }}
                />
                <label
                  htmlFor="aceptar"
                  className="text-sm cursor-pointer select-none"
                >
                  Yo, <strong>{empleadoNombre}</strong>, acepto la declaración anterior de forma
                  voluntaria y entiendo que esta acción es irrevocable.
                </label>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Info de registro */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                    Registro de Integridad
                  </h4>
                  <p className="text-sm text-blue-800">
                    Al confirmar, se generará un hash SHA-256 único que garantiza la integridad
                    de su {esEjercer ? "descargo" : "decisión"}. También se registrará la fecha,
                    hora exacta e IP de origen como prueba de autenticidad.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-between">
            {onVolver && (
              <Button variant="outline" onClick={onVolver} disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Editar
              </Button>
            )}

            <Button
              size="lg"
              onClick={handleConfirmar}
              disabled={!aceptado || loading}
              className={esEjercer ? "" : "bg-gray-600 hover:bg-gray-700"}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {esEjercer ? "Confirmar y Enviar Descargo" : "Confirmar Declinación"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
