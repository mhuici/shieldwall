"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
  FileText,
  Camera,
  UserCheck,
  ClipboardList,
  Hash,
} from "lucide-react";
import { TipoDocumentoVerificacion, ResultadoVerificacion } from "@/lib/types";

interface VerificadorIntegridadProps {
  notificacionId?: string;
}

const tiposDocumento: {
  value: TipoDocumentoVerificacion;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "notificacion", label: "Sanción/Notificación", icon: <FileText className="h-4 w-4" /> },
  { value: "testigo", label: "Declaración de Testigo", icon: <UserCheck className="h-4 w-4" /> },
  { value: "evidencia", label: "Evidencia Multimedia", icon: <Camera className="h-4 w-4" /> },
  { value: "descargo", label: "Descargo del Empleado", icon: <ClipboardList className="h-4 w-4" /> },
  { value: "bitacora", label: "Entrada de Bitácora", icon: <FileText className="h-4 w-4" /> },
  { value: "paquete", label: "Paquete de Evidencia", icon: <Shield className="h-4 w-4" /> },
];

export function VerificadorIntegridad({
  notificacionId,
}: VerificadorIntegridadProps) {
  const [tipo, setTipo] = useState<TipoDocumentoVerificacion>("notificacion");
  const [documentoId, setDocumentoId] = useState(notificacionId || "");
  const [hashProporcionado, setHashProporcionado] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verificar = async () => {
    if (!documentoId.trim()) {
      setError("Ingrese el ID del documento");
      return;
    }

    try {
      setVerificando(true);
      setError(null);
      setResultado(null);

      const response = await fetch(`/api/verificar/${tipo}/${documentoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hash_proporcionado: hashProporcionado.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al verificar");
      }

      const data: ResultadoVerificacion = await response.json();
      setResultado(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setVerificando(false);
    }
  };

  const copiarHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Verificador de Integridad
        </CardTitle>
        <CardDescription>
          Compruebe que un documento no ha sido alterado verificando su hash
          SHA-256
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de documento */}
        <div className="space-y-2">
          <Label>Tipo de Documento</Label>
          <Select
            value={tipo}
            onValueChange={(v) => setTipo(v as TipoDocumentoVerificacion)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tiposDocumento.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <div className="flex items-center gap-2">
                    {t.icon}
                    {t.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ID del documento */}
        <div className="space-y-2">
          <Label htmlFor="documentoId">ID del Documento</Label>
          <Input
            id="documentoId"
            value={documentoId}
            onChange={(e) => setDocumentoId(e.target.value)}
            placeholder="UUID del documento (ej: 123e4567-e89b-12d3...)"
            className="font-mono text-sm"
          />
        </div>

        {/* Hash a comparar (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="hash">
            Hash SHA-256 a Comparar{" "}
            <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="hash"
            value={hashProporcionado}
            onChange={(e) => setHashProporcionado(e.target.value)}
            placeholder="Si tiene un hash, ingréselo para comparar"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Si no proporciona un hash, se mostrará el hash almacenado en el
            sistema
          </p>
        </div>

        {/* Botón verificar */}
        <Button
          onClick={verificar}
          disabled={verificando || !documentoId.trim()}
          className="w-full"
        >
          {verificando ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Verificar Integridad
            </>
          )}
        </Button>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div
            className={`p-4 rounded-lg border ${
              resultado.verificacion_exitosa
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {resultado.verificacion_exitosa ? (
                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4
                    className={`font-medium ${
                      resultado.verificacion_exitosa
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {resultado.verificacion_exitosa
                      ? "Documento Íntegro"
                      : "Integridad Comprometida"}
                  </h4>
                  <Badge
                    variant={
                      resultado.verificacion_exitosa ? "default" : "destructive"
                    }
                  >
                    {resultado.verificacion_exitosa ? "VÁLIDO" : "INVÁLIDO"}
                  </Badge>
                </div>
                <p
                  className={`text-sm mt-1 ${
                    resultado.verificacion_exitosa
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {resultado.mensaje}
                </p>

                {/* Hashes */}
                <div className="mt-4 space-y-2">
                  {resultado.hash_esperado && (
                    <div className="bg-white/50 p-2 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Hash almacenado en sistema:
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copiarHash(resultado.hash_esperado!)}
                          className="h-6 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <code className="text-xs font-mono break-all">
                        {resultado.hash_esperado}
                      </code>
                    </div>
                  )}

                  {resultado.hash_proporcionado && (
                    <div className="bg-white/50 p-2 rounded">
                      <span className="text-xs text-muted-foreground">
                        Hash proporcionado:
                      </span>
                      <code className="text-xs font-mono break-all block">
                        {resultado.hash_proporcionado}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 flex items-center gap-2 mb-2">
            <Hash className="h-4 w-4" />
            ¿Cómo verificar manualmente?
          </h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>1. Obtenga el archivo original</p>
            <p>2. Calcule el hash SHA-256:</p>
            <code className="block bg-blue-100 p-2 rounded text-xs font-mono my-2">
              sha256sum archivo.pdf (Linux/Mac)
              <br />
              certutil -hashfile archivo.pdf SHA256 (Windows)
            </code>
            <p>3. Compare con el hash almacenado en el sistema</p>
            <p>4. Si coinciden, el documento es íntegro</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
