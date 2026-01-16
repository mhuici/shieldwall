"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Package,
  FileText,
  Clock,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
  Hash,
  Users,
  Image,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import type { TipoExportacion } from "@/lib/types";

interface ExportarEvidenciaProps {
  notificacionId: string;
  resumen?: {
    testigos: number;
    evidencias: number;
    tieneDescargo: boolean;
    novedadesBitacora: number;
  };
  className?: string;
}

const TIPOS_EXPORTACION: {
  value: TipoExportacion;
  label: string;
  descripcion: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: "paquete_completo",
    label: "Paquete Completo",
    descripcion: "Toda la evidencia: sanción, testigos, archivos, descargo y bitácora",
    icon: Package,
  },
  {
    value: "peritaje_tecnico",
    label: "Documentación Técnica",
    descripcion: "Hashes, timestamps y metadatos para peritaje informático",
    icon: Hash,
  },
  {
    value: "cadena_custodia",
    label: "Cadena de Custodia",
    descripcion: "Documento con toda la trazabilidad de la evidencia",
    icon: Shield,
  },
  {
    value: "solo_timeline",
    label: "Solo Timeline",
    descripcion: "Timeline de eventos en formato JSON y HTML",
    icon: Clock,
  },
];

export function ExportarEvidencia({
  notificacionId,
  resumen,
  className = "",
}: ExportarEvidenciaProps) {
  const [tipoExportacion, setTipoExportacion] = useState<TipoExportacion>("paquete_completo");
  const [solicitadoPara, setSolicitadoPara] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{
    success: boolean;
    url?: string;
    hash?: string;
    error?: string;
  } | null>(null);

  const handleExportar = async () => {
    setLoading(true);
    setResultado(null);

    try {
      const response = await fetch(`/api/exportar/${notificacionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: tipoExportacion,
          solicitado_para: solicitadoPara || undefined,
          motivo: motivo || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al exportar");
      }

      setResultado({
        success: true,
        url: data.url,
        hash: data.hash,
      });
    } catch (error) {
      setResultado({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Paquete de Evidencia
        </CardTitle>
        <CardDescription>
          Genera un paquete con toda la evidencia para presentar en juicio o peritaje
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen de contenido disponible */}
        {resumen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Sanción</p>
                <p className="font-medium">1 documento</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Testigos</p>
                <p className="font-medium">{resumen.testigos} declaraciones</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Evidencias</p>
                <p className="font-medium">{resumen.evidencias} archivos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-cyan-500" />
              <div>
                <p className="text-xs text-muted-foreground">Descargo</p>
                <p className="font-medium">{resumen.tieneDescargo ? "Presentado" : "No presentado"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tipo de exportación */}
        <div className="space-y-2">
          <Label>Tipo de exportación</Label>
          <Select
            value={tipoExportacion}
            onValueChange={(v) => setTipoExportacion(v as TipoExportacion)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_EXPORTACION.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  <div className="flex items-center gap-2">
                    <tipo.icon className="h-4 w-4" />
                    <span>{tipo.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {TIPOS_EXPORTACION.find((t) => t.value === tipoExportacion)?.descripcion}
          </p>
        </div>

        {/* Campos opcionales */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="solicitado_para">Solicitado para (opcional)</Label>
            <Input
              id="solicitado_para"
              placeholder="Ej: Juzgado Laboral N°1 Mar del Plata"
              value={solicitadoPara}
              onChange={(e) => setSolicitadoPara(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Input
              id="motivo"
              placeholder="Ej: Presentación como prueba documental"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
        </div>

        {/* Contenido del paquete según tipo */}
        <div className="p-4 border rounded-lg space-y-2">
          <p className="text-sm font-medium">El paquete incluirá:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {tipoExportacion === "paquete_completo" && (
              <>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  PDF de la sanción con hash embebido
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Declaraciones de testigos firmadas digitalmente
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Evidencia multimedia con metadatos EXIF
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Descargo del empleado (si existe)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Bitácora de novedades relacionadas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Timeline completo de eventos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Documento de cadena de custodia
                </li>
              </>
            )}
            {tipoExportacion === "peritaje_tecnico" && (
              <>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Listado de todos los hashes SHA-256
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Timestamps con trazabilidad completa
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Metadatos técnicos del sistema
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Instrucciones de verificación para peritos
                </li>
              </>
            )}
            {tipoExportacion === "cadena_custodia" && (
              <>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Documento PDF de cadena de custodia
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Registro de todos los accesos y modificaciones
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Certificación de integridad
                </li>
              </>
            )}
            {tipoExportacion === "solo_timeline" && (
              <>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Timeline en formato JSON
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Timeline en formato HTML (visualizable)
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Resultado */}
        {resultado && (
          <div
            className={`p-4 rounded-lg ${
              resultado.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {resultado.success ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Paquete generado exitosamente</span>
                </div>
                {resultado.hash && (
                  <div className="text-sm text-green-600">
                    <span className="font-medium">Hash del paquete:</span>{" "}
                    <code className="bg-white px-2 py-0.5 rounded">{resultado.hash}</code>
                  </div>
                )}
                {resultado.url && (
                  <Button asChild className="w-full">
                    <a href={resultado.url} download>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Paquete
                    </a>
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>{resultado.error}</span>
              </div>
            )}
          </div>
        )}

        {/* Botón de exportar */}
        {!resultado?.success && (
          <Button onClick={handleExportar} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando paquete...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Generar Paquete de Evidencia
              </>
            )}
          </Button>
        )}

        {/* Nota legal */}
        <p className="text-xs text-muted-foreground text-center">
          El paquete incluye firma digital SHA-256 que garantiza la integridad de todos los documentos.
          Cualquier modificación posterior será detectable.
        </p>
      </CardContent>
    </Card>
  );
}
