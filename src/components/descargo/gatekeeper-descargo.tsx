"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, AlertTriangle, Lock, Scale } from "lucide-react";

interface GatekeeperDescargoProps {
  token: string;
  empresaNombre: string;
  empleadoNombre: string;
  sancionTipo: string;
  sancionMotivo: string;
  diasRestantes: number;
  onValidacionExitosa: () => void;
}

export function GatekeeperDescargo({
  token,
  empresaNombre,
  empleadoNombre,
  sancionTipo,
  sancionMotivo,
  diasRestantes,
  onValidacionExitosa,
}: GatekeeperDescargoProps) {
  const [cuil, setCuil] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intentosFallidos, setIntentosFallidos] = useState(0);

  // Formatear CUIL mientras se escribe
  const handleCuilChange = (value: string) => {
    const numeros = value.replace(/\D/g, "");
    let formatted = numeros;
    if (numeros.length > 2) {
      formatted = numeros.slice(0, 2) + "-" + numeros.slice(2);
    }
    if (numeros.length > 10) {
      formatted = numeros.slice(0, 2) + "-" + numeros.slice(2, 10) + "-" + numeros.slice(10, 11);
    }
    setCuil(formatted);
    setError(null);
  };

  const handleValidar = async () => {
    const cuilLimpio = cuil.replace(/\D/g, "");

    if (!cuilLimpio) {
      setError("Debe ingresar su CUIL");
      return;
    }

    if (cuilLimpio.length !== 11) {
      setError("El CUIL debe tener 11 dígitos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/descargo/${token}/validar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cuil: cuilLimpio }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIntentosFallidos((prev) => prev + 1);
        setError(data.error || "CUIL incorrecto");
        return;
      }

      onValidacionExitosa();
    } catch (err) {
      console.error("Error validando identidad:", err);
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const bloqueado = intentosFallidos >= 5;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-lg">NotiLegal</span>
            <span className="text-muted-foreground">- Audiencia de Descargo</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          {/* Card principal */}
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Scale className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Derecho a Descargo</CardTitle>
              <CardDescription className="text-base">
                <strong>{empresaNombre}</strong> le notificó una sanción disciplinaria
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Info de la sanción */}
              <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium capitalize">{sancionTipo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Motivo:</span>
                  <span className="font-medium">{sancionMotivo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plazo para descargo:</span>
                  <span className={`font-medium ${diasRestantes <= 5 ? "text-red-600" : "text-green-600"}`}>
                    {diasRestantes} días restantes
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Estimado/a <strong>{empleadoNombre}</strong>, para ejercer su derecho
                a descargo, primero verifique su identidad:
              </p>

              {bloqueado ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Demasiados intentos fallidos. Por favor, contacte a su empleador.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cuil">Ingrese su CUIL</Label>
                    <Input
                      id="cuil"
                      type="text"
                      placeholder="XX-XXXXXXXX-X"
                      value={cuil}
                      onChange={(e) => handleCuilChange(e.target.value)}
                      disabled={loading}
                      maxLength={13}
                      className="font-mono text-center text-lg"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {intentosFallidos > 0 && intentosFallidos < 5 && (
                    <p className="text-sm text-amber-600 text-center">
                      Intentos restantes: {5 - intentosFallidos}
                    </p>
                  )}

                  <Button
                    onClick={handleValidar}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Verificar Identidad
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Info legal */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Scale className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                    Su Derecho a Defensa (Art. 67 LCT)
                  </h4>
                  <p className="text-sm text-blue-800">
                    Usted tiene derecho a presentar un descargo ante la sanción recibida.
                    Puede ejercer este derecho o decidir no hacerlo. Ambas opciones quedarán
                    registradas con fecha y hora exactas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-4">
        <p>Sistema de notificaciones laborales con validez legal</p>
      </div>
    </div>
  );
}
