"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Loader2,
  AlertTriangle,
  FileText,
  Save,
  ArrowRight,
  Clock,
  Info,
} from "lucide-react";

interface FormularioDescargoProps {
  token: string;
  empleadoNombre: string;
  sancionMotivo: string;
  sancionDescripcion: string;
  diasRestantes: number;
  textoInicial?: string;
  onContinuar: (texto: string) => void;
}

export function FormularioDescargo({
  token,
  empleadoNombre,
  sancionMotivo,
  sancionDescripcion,
  diasRestantes,
  textoInicial = "",
  onContinuar,
}: FormularioDescargoProps) {
  const [texto, setTexto] = useState(textoInicial);
  const [guardando, setGuardando] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-guardar cada 30 segundos si hay cambios
  const guardarBorrador = useCallback(async () => {
    if (!texto || texto.length < 10) return;

    setGuardando(true);
    try {
      const response = await fetch(`/api/descargo/${token}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ texto }),
      });

      if (response.ok) {
        setUltimoGuardado(new Date());
        setError(null);
      }
    } catch (err) {
      console.error("Error guardando borrador:", err);
    } finally {
      setGuardando(false);
    }
  }, [token, texto]);

  // Auto-guardar
  useEffect(() => {
    const interval = setInterval(() => {
      if (texto && texto.length >= 20) {
        guardarBorrador();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [texto, guardarBorrador]);

  const handleContinuar = () => {
    if (texto.trim().length < 20) {
      setError("El descargo debe tener al menos 20 caracteres");
      return;
    }
    onContinuar(texto);
  };

  const caracteresMinimos = 20;
  const caracteresActuales = texto.length;
  const porcentajeCompletado = Math.min(100, (caracteresActuales / caracteresMinimos) * 100);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-lg">NotiLegal</span>
              <span className="text-muted-foreground">- Redactar Descargo</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className={diasRestantes <= 5 ? "text-red-600" : ""}>
                {diasRestantes} días restantes
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Contexto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Su Descargo
              </CardTitle>
              <CardDescription>
                Escriba su versión de los hechos. Sea claro, específico y objetivo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recordatorio de la sanción */}
              <div className="bg-slate-50 rounded-lg p-4 text-sm">
                <p className="text-muted-foreground mb-2">
                  <strong>Motivo de la sanción:</strong> {sancionMotivo}
                </p>
                <p className="text-muted-foreground text-xs">
                  <strong>Hechos según empleador:</strong> {sancionDescripcion.substring(0, 150)}
                  {sancionDescripcion.length > 150 && "..."}
                </p>
              </div>

              {/* Textarea principal */}
              <div className="space-y-2">
                <Textarea
                  placeholder={`Estimado/a,\n\nEn relación a la sanción recibida por "${sancionMotivo}", deseo manifestar lo siguiente:\n\n[Escriba aquí su versión de los hechos, incluyendo:\n- Su perspectiva de lo ocurrido\n- Circunstancias relevantes\n- Pruebas o testigos que pueda mencionar\n- Cualquier otro elemento de defensa]`}
                  value={texto}
                  onChange={(e) => {
                    setTexto(e.target.value);
                    setError(null);
                  }}
                  rows={12}
                  className="resize-none text-base"
                />

                {/* Barra de progreso de caracteres */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex-1 mr-4">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          porcentajeCompletado >= 100 ? "bg-green-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${porcentajeCompletado}%` }}
                      />
                    </div>
                  </div>
                  <span className={caracteresActuales < caracteresMinimos ? "text-amber-600" : "text-green-600"}>
                    {caracteresActuales} / {caracteresMinimos} caracteres mínimos
                  </span>
                </div>
              </div>

              {/* Estado de guardado */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {guardando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Guardando borrador...</span>
                    </>
                  ) : ultimoGuardado ? (
                    <>
                      <Save className="h-4 w-4 text-green-600" />
                      <span>
                        Guardado a las {ultimoGuardado.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </>
                  ) : (
                    <span>El borrador se guarda automáticamente</span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={guardarBorrador}
                  disabled={guardando || texto.length < 10}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                    Consejos para su descargo
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Sea específico con fechas, horas y lugares</li>
                    <li>Mencione testigos que puedan corroborar su versión</li>
                    <li>Explique las circunstancias atenuantes si las hubiera</li>
                    <li>Mantenga un tono respetuoso y profesional</li>
                    <li>Evite contradecirse con hechos documentados</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advertencia */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2 text-sm">
                    Importante
                  </h4>
                  <p className="text-sm text-amber-800">
                    Todo lo que escriba quedará registrado de forma permanente y será parte del
                    expediente laboral. Asegúrese de que la información sea verídica antes de confirmar.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botón continuar */}
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleContinuar}
              disabled={texto.trim().length < caracteresMinimos}
            >
              Continuar a Confirmación
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
