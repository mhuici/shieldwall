"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  Building2,
  FileSignature,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TEXTOS_LEGALES, RELACION_TESTIGO_LABELS, type RelacionTestigo } from "@/lib/types";

interface TestigoDeclaracionClientProps {
  testigo: {
    id: string;
    token: string;
    nombre_completo: string;
    cargo?: string;
    relacion: RelacionTestigo;
    presente_en_hecho: boolean;
    estado: string;
    descripcion_testigo?: string;
    hash_declaracion?: string;
    juramento_timestamp?: string;
    token_expira_at: string;
  };
  incidente: {
    tipo: string;
    motivo: string;
    fecha_hecho: string;
    hora_hecho?: string;
    lugar_hecho?: string;
    empleado_nombre: string;
  } | null;
  empresa: {
    razon_social: string;
  } | null;
  tokenExpirado: boolean;
  yaFirmado: boolean;
  noDisponible: boolean;
}

export function TestigoDeclaracionClient({
  testigo,
  incidente,
  empresa,
  tokenExpirado,
  yaFirmado,
  noDisponible,
}: TestigoDeclaracionClientProps) {
  const [descripcion, setDescripcion] = useState(testigo.descripcion_testigo || "");
  const [aceptaJuramento, setAceptaJuramento] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firmado, setFirmado] = useState(yaFirmado);
  const [hashGenerado, setHashGenerado] = useState(testigo.hash_declaracion || "");
  const [timestampFirma, setTimestampFirma] = useState(testigo.juramento_timestamp || "");

  // Si el token expiró
  if (tokenExpirado && !yaFirmado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Link Expirado</h2>
            <p className="text-muted-foreground">
              Este link para completar tu declaración ha expirado.
              Por favor, contactá al empleador para que te envíe un nuevo link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si fue rechazado o marcado como no disponible
  if (noDisponible) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Declaración No Disponible</h2>
            <p className="text-muted-foreground">
              Esta declaración ya no está disponible para completar.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si ya firmó, mostrar confirmación
  if (firmado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Declaración Firmada</h2>
              <p className="text-muted-foreground">
                Tu declaración ha sido registrada y firmada digitalmente.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">Resumen de tu declaración:</h3>
                <p className="text-sm text-green-700 italic">
                  &quot;{descripcion || testigo.descripcion_testigo}&quot;
                </p>
              </div>

              <div className="p-4 bg-slate-100 rounded-lg text-xs space-y-1">
                <p>
                  <span className="font-medium">Firmado:</span>{" "}
                  {timestampFirma
                    ? format(new Date(timestampFirma), "dd/MM/yyyy HH:mm:ss", { locale: es })
                    : "N/A"}
                </p>
                <p className="font-mono break-all">
                  <span className="font-medium font-sans">Hash:</span> {hashGenerado || "N/A"}
                </p>
              </div>

              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Declaración Inmutable</AlertTitle>
                <AlertDescription>
                  Esta declaración ha quedado registrada de forma inmutable y podrá ser
                  utilizada como prueba en procedimientos laborales.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFirmar = async () => {
    setError(null);

    if (descripcion.trim().length < 20) {
      setError("Tu declaración debe tener al menos 20 caracteres");
      return;
    }

    if (!aceptaJuramento) {
      setError("Debés aceptar la declaración jurada para continuar");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/testigo/${testigo.token}/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion_testigo: descripcion.trim(),
          declara_bajo_juramento: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al firmar la declaración");
      }

      setHashGenerado(data.hash);
      setTimestampFirma(data.timestamp);
      setFirmado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la declaración");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">NotiLegal</h1>
          <p className="text-muted-foreground">Declaración de Testigo</p>
        </div>

        {/* Saludo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Hola, {testigo.nombre_completo}
            </CardTitle>
            <CardDescription>
              {empresa?.razon_social} te solicita confirmar tu testimonio sobre un incidente laboral.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {testigo.cargo && (
                <Badge variant="outline">{testigo.cargo}</Badge>
              )}
              <Badge variant="secondary">
                {RELACION_TESTIGO_LABELS[testigo.relacion]}
              </Badge>
              {testigo.presente_en_hecho && (
                <Badge variant="default" className="bg-green-600">
                  Presente en el hecho
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datos del incidente */}
        {incidente && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos del Incidente</CardTitle>
              <CardDescription>
                Información sobre el hecho respecto al cual se solicita tu declaración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(incidente.fecha_hecho), "dd/MM/yyyy", { locale: es })}
                    {incidente.hora_hecho && ` a las ${incidente.hora_hecho}`}
                  </span>
                </div>
                {incidente.lugar_hecho && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{incidente.lugar_hecho}</span>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm">
                  <span className="font-medium">Motivo:</span> {incidente.motivo}
                </p>
                <p className="text-sm text-muted-foreground">
                  Empleado involucrado: {incidente.empleado_nombre}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulario de declaración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Tu Declaración
            </CardTitle>
            <CardDescription>
              Describí lo que viste o escuchaste en relación al incidente.
              Tu declaración será registrada de forma inmutable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descripcion">¿Qué viste o escuchaste?</Label>
              <Textarea
                id="descripcion"
                placeholder="Describí con tus palabras lo que presenciaste..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={6}
                disabled={loading}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {descripcion.length} caracteres (mínimo 20)
              </p>
            </div>

            {/* Declaración jurada */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="juramento"
                  checked={aceptaJuramento}
                  onCheckedChange={(checked) => setAceptaJuramento(checked as boolean)}
                  disabled={loading}
                  className="mt-1"
                />
                <div className="space-y-2">
                  <Label htmlFor="juramento" className="font-medium text-amber-900 cursor-pointer">
                    DECLARACIÓN JURADA
                  </Label>
                  <p className="text-xs text-amber-800 whitespace-pre-line">
                    {TEXTOS_LEGALES.CHECKBOX_DECLARACION_TESTIGO}
                  </p>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Botón firmar */}
            <Button
              onClick={handleFirmar}
              disabled={loading || descripcion.trim().length < 20 || !aceptaJuramento}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Firmando...
                </>
              ) : (
                <>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Firmar Declaración
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info de seguridad */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Tu declaración está protegida</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Se registrará con hash SHA-256 inmutable</li>
                  <li>• Se guardará tu IP y timestamp como prueba</li>
                  <li>• No podrá ser modificada después de firmar</li>
                  <li>• Constituye prueba testimonial válida</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiración */}
        <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Clock className="h-3 w-3" />
          Este link expira el{" "}
          {format(new Date(testigo.token_expira_at), "dd/MM/yyyy", { locale: es })}
        </div>
      </div>
    </div>
  );
}
