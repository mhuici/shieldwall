"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Hash,
  FileText,
  Calendar,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  User,
  Building2,
  Clock,
  ExternalLink,
  Printer,
} from "lucide-react";
import Link from "next/link";

interface DocumentoEncontrado {
  tipo: string;
  id: string;
  descripcion: string;
  fecha_creacion: string;
  hash_almacenado: string;
  metadata?: Record<string, unknown>;
}

interface ResultadoVerificacion {
  encontrado: boolean;
  hash_buscado: string;
  documentos?: DocumentoEncontrado[];
  verificacion?: {
    integridad_verificada: boolean;
    mensaje: string;
    fecha_verificacion: string;
  };
  mensaje?: string;
  sugerencias?: string[];
}

const TIPO_LABELS: Record<string, { label: string; color: string }> = {
  notificacion: { label: "Sanción", color: "blue" },
  confirmacion_lectura: { label: "Confirmación de Lectura", color: "green" },
  testigo: { label: "Declaración de Testigo", color: "purple" },
  evidencia: { label: "Evidencia", color: "orange" },
  descargo: { label: "Descargo", color: "cyan" },
  bitacora: { label: "Bitácora", color: "yellow" },
  paquete: { label: "Paquete de Evidencia", color: "emerald" },
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2">
      {copied ? (
        <>
          <Check className="h-3 w-3 mr-1 text-green-500" />
          Copiado
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 mr-1" />
          {label || "Copiar"}
        </>
      )}
    </Button>
  );
}

export default function VerificarHashPage() {
  const params = useParams();
  const hash = params.hash as string;

  const [loading, setLoading] = useState(true);
  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verificar = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/verificar/publico", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hash }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al verificar");
        }

        const data = await response.json();
        setResultado(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    if (hash) {
      verificar();
    }
  }, [hash]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 print:bg-white">
      {/* Header */}
      <header className="bg-white border-b shadow-sm print:shadow-none">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/verificar" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl">NotiLegal</span>
          </Link>
          <div className="flex items-center gap-2 print:hidden">
            <Link href="/verificar">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Nueva verificación
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Estado de carga */}
        {loading && (
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-lg font-medium">Verificando documento...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Buscando en la base de datos de NotiLegal
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="border-red-200">
            <CardContent className="py-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-red-900 mb-2">Error de verificación</h2>
                <p className="text-red-700">{error}</p>
                <Link href="/verificar" className="mt-6">
                  <Button>Intentar de nuevo</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado: No encontrado */}
        {resultado && !resultado.encontrado && (
          <div className="space-y-6">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-12">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                    <XCircle className="h-10 w-10 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-red-900 mb-3">
                    Documento No Encontrado
                  </h2>
                  <p className="text-red-700 max-w-lg">
                    No se encontró ningún documento con este hash en el sistema NotiLegal.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Hash buscado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Hash Buscado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4 p-3 bg-slate-100 rounded-lg">
                  <code className="font-mono text-sm break-all">{resultado.hash_buscado}</code>
                  <CopyButton text={resultado.hash_buscado} />
                </div>
              </CardContent>
            </Card>

            {/* Sugerencias */}
            {resultado.sugerencias && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Posibles causas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {resultado.sugerencias.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 text-sm font-medium">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Resultado: Encontrado */}
        {resultado && resultado.encontrado && resultado.documentos && (
          <div className="space-y-6">
            {/* Banner de éxito */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="py-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-900 mb-3">
                    Integridad Verificada
                  </h2>
                  <p className="text-green-700 max-w-lg">
                    El hash coincide con un documento almacenado en el sistema.
                    <br />
                    <strong>El documento NO ha sido alterado.</strong>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Hash verificado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Hash className="h-5 w-5 text-green-600" />
                  Hash Verificado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <code className="font-mono text-sm break-all text-green-900">
                    {resultado.hash_buscado}
                  </code>
                  <CopyButton text={resultado.hash_buscado} />
                </div>
                {resultado.verificacion && (
                  <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Verificado el {formatDate(resultado.verificacion.fecha_verificacion)}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Documentos encontrados */}
            {resultado.documentos.map((doc, index) => {
              const tipoInfo = TIPO_LABELS[doc.tipo] || { label: doc.tipo, color: "gray" };

              return (
                <Card key={doc.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Documento Encontrado
                        {resultado.documentos && resultado.documentos.length > 1 && ` #${index + 1}`}
                      </CardTitle>
                      <Badge
                        className={`bg-${tipoInfo.color}-100 text-${tipoInfo.color}-800 border-${tipoInfo.color}-200`}
                      >
                        {tipoInfo.label}
                      </Badge>
                    </div>
                    <CardDescription>{doc.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Metadata del documento */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">ID del documento</p>
                        <p className="font-mono text-sm">{doc.id}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Fecha de creación</p>
                        <p className="text-sm">{formatDate(doc.fecha_creacion)}</p>
                      </div>
                    </div>

                    {/* Metadata adicional */}
                    {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-3">Información adicional</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {Object.entries(doc.metadata).map(([key, value]) => (
                            <div key={key} className="flex items-start gap-2">
                              {key === "empleado" && <User className="h-4 w-4 text-muted-foreground mt-0.5" />}
                              {key === "empresa" && <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />}
                              {!["empleado", "empresa"].includes(key) && (
                                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                              )}
                              <div>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {key.replace(/_/g, " ")}
                                </p>
                                <p className="text-sm">{String(value)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Información técnica */}
            <Card className="bg-slate-50">
              <CardHeader>
                <CardTitle className="text-lg">Información Técnica para Peritaje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Algoritmo de hash</p>
                    <p className="font-medium">SHA-256</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Longitud del hash</p>
                    <p className="font-medium">256 bits (64 caracteres hex)</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Formato de timestamp</p>
                    <p className="font-medium">ISO 8601 (UTC)</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sistema</p>
                    <p className="font-medium">NotiLegal v1.0</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-muted-foreground mb-2">
                    Para verificar manualmente con herramientas externas:
                  </p>
                  <div className="bg-slate-200 p-3 rounded font-mono text-xs overflow-x-auto">
                    <p className="text-slate-700"># Linux/Mac</p>
                    <p>sha256sum archivo.pdf</p>
                    <p className="text-slate-700 mt-2"># Windows (PowerShell)</p>
                    <p>Get-FileHash archivo.pdf -Algorithm SHA256</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer legal */}
            <Card className="border-blue-200 bg-blue-50 print:bg-white">
              <CardContent className="py-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota legal:</strong> Esta verificación confirma que el hash proporcionado
                  coincide con un documento almacenado en el sistema NotiLegal. La verificación
                  fue registrada con fecha, hora e IP del solicitante para fines de auditoría.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer para impresión */}
      <footer className="hidden print:block mt-8 pt-4 border-t text-center text-sm text-slate-600">
        <p>Verificación realizada en NotiLegal - {new Date().toLocaleString("es-AR")}</p>
        <p>https://notilegal.com.ar/verificar</p>
      </footer>
    </div>
  );
}
