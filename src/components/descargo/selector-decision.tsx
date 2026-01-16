"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Loader2,
  AlertTriangle,
  FileText,
  XCircle,
  CheckCircle,
  Scale,
  Clock,
} from "lucide-react";
import type { DecisionDescargo } from "@/lib/types";

interface SelectorDecisionProps {
  token: string;
  empleadoNombre: string;
  sancionTipo: string;
  sancionMotivo: string;
  sancionDescripcion: string;
  sancionFechaHecho: string;
  diasRestantes: number;
  onDecisionTomada: (decision: DecisionDescargo) => void;
}

export function SelectorDecision({
  token,
  empleadoNombre,
  sancionTipo,
  sancionMotivo,
  sancionDescripcion,
  sancionFechaHecho,
  diasRestantes,
  onDecisionTomada,
}: SelectorDecisionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecision = async (decision: "ejercer_descargo" | "declinar_descargo") => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/descargo/${token}/decision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ decision }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al registrar la decisión");
        return;
      }

      onDecisionTomada(decision);
    } catch (err) {
      console.error("Error registrando decisión:", err);
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-lg">NotiLegal</span>
            <span className="text-muted-foreground">- Audiencia de Descargo</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Bienvenida */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Identidad verificada</p>
                  <p className="text-sm text-green-700">Hola, {empleadoNombre}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalle de la sanción */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sanción Recibida
              </CardTitle>
              <CardDescription>
                Lea atentamente los detalles de la sanción antes de tomar su decisión
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo de sanción:</span>
                  <p className="font-medium capitalize">{sancionTipo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha del hecho:</span>
                  <p className="font-medium">{formatDate(sancionFechaHecho)}</p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground text-sm">Motivo:</span>
                <p className="font-medium">{sancionMotivo}</p>
              </div>

              <div>
                <span className="text-muted-foreground text-sm">Descripción de los hechos:</span>
                <p className="text-sm bg-slate-50 p-3 rounded-lg mt-1 whitespace-pre-wrap">
                  {sancionDescripcion}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className={diasRestantes <= 5 ? "text-red-600 font-medium" : "text-muted-foreground"}>
                  Plazo para presentar descargo: {diasRestantes} días restantes
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Opciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Su Decisión
              </CardTitle>
              <CardDescription>
                Elija cómo desea proceder. Esta decisión quedará registrada con fecha, hora e IP.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {/* Opción: Ejercer descargo */}
                <Card
                  className="border-2 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => !loading && handleDecision("ejercer_descargo")}
                >
                  <CardContent className="pt-6 text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Presentar Descargo</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Quiero escribir mi versión de los hechos y presentar mi defensa
                    </p>
                    <Button
                      className="w-full"
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDecision("ejercer_descargo");
                      }}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Ejercer mi Derecho"
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Opción: Declinar descargo */}
                <Card
                  className="border-2 border-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => !loading && handleDecision("declinar_descargo")}
                >
                  <CardContent className="pt-6 text-center">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <XCircle className="h-6 w-6 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Declinar Descargo</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      No deseo presentar descargo en este momento
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDecision("declinar_descargo");
                      }}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Declinar"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Info legal */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2 text-sm">
                    Importante
                  </h4>
                  <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                    <li>Su decisión quedará registrada de forma inmutable</li>
                    <li>Si elige presentar descargo, podrá escribir su versión de los hechos</li>
                    <li>Si declina, quedará constancia de que se le ofreció el derecho</li>
                    <li>Ambas opciones requieren confirmación final con declaración jurada</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
