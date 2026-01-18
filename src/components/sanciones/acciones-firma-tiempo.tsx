"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Link2,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AccionesFirmaTiempoProps {
  notificacionId: string;
  tieneHash: boolean;
  firmaAplicada: boolean;
  timestampAplicado: boolean;
}

export function AccionesFirmaTiempo({
  notificacionId,
  tieneHash,
  firmaAplicada: initialFirmaAplicada,
  timestampAplicado: initialTimestampAplicado,
}: AccionesFirmaTiempoProps) {
  const [firmaAplicada, setFirmaAplicada] = useState(initialFirmaAplicada);
  const [timestampAplicado, setTimestampAplicado] = useState(initialTimestampAplicado);
  const [aplicandoFirma, setAplicandoFirma] = useState(false);
  const [aplicandoTimestamp, setAplicandoTimestamp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const handleAplicarFirma = async () => {
    setAplicandoFirma(true);
    setError(null);
    setExito(null);

    try {
      const response = await fetch("/api/firma-digital/firmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_documento: "sancion",
          documento_id: notificacionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al aplicar firma digital");
        return;
      }

      setFirmaAplicada(true);
      setExito("Firma digital PKI aplicada correctamente");

      // Recargar después de un momento para ver los cambios
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setAplicandoFirma(false);
    }
  };

  const handleAplicarTimestamp = async () => {
    setAplicandoTimestamp(true);
    setError(null);
    setExito(null);

    try {
      const response = await fetch("/api/timestamp/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_documento: "sancion",
          documento_id: notificacionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al crear timestamp");
        return;
      }

      setTimestampAplicado(true);
      setExito("Timestamp blockchain creado correctamente");

      // Recargar después de un momento para ver los cambios
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setAplicandoTimestamp(false);
    }
  };

  if (!tieneHash) {
    return null;
  }

  // Si ya tiene ambos, mostrar solo el estado
  if (firmaAplicada && timestampAplicado) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Documento con máxima validez legal</h4>
              <p className="text-sm text-green-700">
                Este documento cuenta con firma digital PKI y timestamp blockchain,
                lo que le otorga fecha cierta y autenticidad conforme al Art. 288 CCyC.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Reforzar Validez Legal
        </CardTitle>
        <CardDescription>
          Aplicá firma digital PKI y timestamp blockchain para máxima validez en juicio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {exito && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            {exito}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Firma Digital PKI */}
          <div className={`p-4 rounded-lg border ${firmaAplicada ? 'bg-green-50 border-green-200' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className={`h-5 w-5 ${firmaAplicada ? 'text-green-600' : 'text-blue-600'}`} />
              <h4 className="font-medium">Firma Digital PKI</h4>
              {firmaAplicada && (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  Aplicada
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Equivale a firma ológrafa según Art. 288 CCyC. Garantiza autenticidad e integridad.
            </p>
            {!firmaAplicada && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={aplicandoFirma}
                    className="w-full"
                  >
                    {aplicandoFirma ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Firmando...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Aplicar Firma PKI
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Aplicar Firma Digital PKI</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se aplicará una firma digital RSA-SHA256 a este documento.
                      Esta acción es irreversible y quedará registrada en la cadena de custodia.
                      <br /><br />
                      <strong>Fundamento Legal:</strong> Art. 288 Código Civil y Comercial -
                      La firma digital tiene equivalencia con la firma ológrafa cuando
                      cumple los requisitos legales.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAplicarFirma}>
                      Confirmar Firma
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Timestamp Blockchain */}
          <div className={`p-4 rounded-lg border ${timestampAplicado ? 'bg-green-50 border-green-200' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Link2 className={`h-5 w-5 ${timestampAplicado ? 'text-green-600' : 'text-blue-600'}`} />
              <h4 className="font-medium">Timestamp Blockchain</h4>
              {timestampAplicado && (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  Anclado
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Fecha cierta mediante anclaje en Bitcoin (OpenTimestamps). Prueba irrefutable de existencia.
            </p>
            {!timestampAplicado && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={aplicandoTimestamp}
                    className="w-full"
                  >
                    {aplicandoTimestamp ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Anclando...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-2" />
                        Anclar en Blockchain
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Crear Timestamp en Blockchain</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se anclará el hash del documento en la blockchain de Bitcoin
                      mediante el protocolo OpenTimestamps.
                      <br /><br />
                      Esto proporciona <strong>fecha cierta irrefutable</strong> que
                      puede verificarse independientemente por cualquier perito.
                      <br /><br />
                      <strong>Nota:</strong> La confirmación completa puede tomar
                      algunas horas hasta que se incluya en un bloque de Bitcoin.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAplicarTimestamp}>
                      Confirmar Timestamp
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Estas acciones son opcionales pero altamente recomendadas para máxima validez probatoria en juicio laboral.
        </p>
      </CardContent>
    </Card>
  );
}
