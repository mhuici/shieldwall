"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, AlertTriangle, Clock, Lock } from "lucide-react";
import { TEXTOS_LEGALES } from "@/lib/types";

interface GatekeeperValidacionProps {
  token: string;
  empresaNombre: string;
  empleadoNombre: string;
  onValidacionExitosa: () => void;
}

export function GatekeeperValidacion({
  token,
  empresaNombre,
  empleadoNombre,
  onValidacionExitosa,
}: GatekeeperValidacionProps) {
  const [cuil, setCuil] = useState("");
  const [legajo, setLegajo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intentosFallidos, setIntentosFallidos] = useState(0);

  // Formatear CUIL mientras se escribe
  const handleCuilChange = (value: string) => {
    // Remover todo excepto números
    const numeros = value.replace(/\D/g, "");

    // Formatear como XX-XXXXXXXX-X
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
    // Validar que al menos uno esté completo
    const cuilLimpio = cuil.replace(/\D/g, "");

    if (!cuilLimpio && !legajo.trim()) {
      setError("Debe ingresar su CUIL o número de legajo");
      return;
    }

    if (cuilLimpio && cuilLimpio.length !== 11) {
      setError("El CUIL debe tener 11 dígitos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ver/${token}/validar-identidad`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cuil: cuilLimpio || null,
          legajo: legajo.trim() || null,
          userAgent: navigator.userAgent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIntentosFallidos((prev) => prev + 1);

        if (data.bloqueado) {
          setError("Demasiados intentos fallidos. Por favor, contacte a su empleador.");
        } else {
          setError(data.error || "Los datos ingresados no coinciden con los registrados");
        }
        return;
      }

      // Validación exitosa
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
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          {/* Card principal */}
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Notificación Laboral Pendiente</CardTitle>
              <CardDescription className="text-base">
                <strong>{empresaNombre}</strong> le ha enviado una comunicación laboral
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground text-center">
                Estimado/a <strong>{empleadoNombre}</strong>, para acceder al documento
                por favor verifique su identidad:
              </p>

              {bloqueado ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Demasiados intentos fallidos. Por favor, contacte a su empleador
                    para verificar sus datos de contacto.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cuil">CUIL</Label>
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

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">o</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="legajo">Número de Legajo</Label>
                      <Input
                        id="legajo"
                        type="text"
                        placeholder="Ingrese su número de legajo"
                        value={legajo}
                        onChange={(e) => {
                          setLegajo(e.target.value);
                          setError(null);
                        }}
                        disabled={loading}
                        className="text-center"
                      />
                    </div>
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
                      "Verificar y Acceder al Documento"
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Aviso de procedimiento */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2 text-sm">
                    Aviso de Procedimiento - Ley 27.742
                  </h4>
                  <p className="text-sm text-amber-800 whitespace-pre-line">
                    {TEXTOS_LEGALES.AVISO_PROCEDIMIENTO_72HS}
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
