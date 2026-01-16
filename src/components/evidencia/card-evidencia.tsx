"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Image,
  Video,
  FileAudio,
  FileText,
  Monitor,
  MapPin,
  Calendar,
  Trash2,
  Star,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { TipoEvidencia } from "@/lib/types";
import { formatFileSize } from "@/lib/utils/exif-extractor";

interface EvidenciaItem {
  id: string;
  tipo: TipoEvidencia;
  nombre_archivo: string;
  tamano_bytes: number;
  url_preview?: string;
  descripcion?: string;
  es_prueba_principal: boolean;
  exif_fecha_captura?: string;
  exif_latitud?: number;
  exif_longitud?: number;
  hash_sha256: string;
}

interface CardEvidenciaProps {
  evidencia: EvidenciaItem;
  onRemove?: () => void;
  onTogglePrincipal?: () => void;
  showActions?: boolean;
}

const iconsByTipo: Record<TipoEvidencia, React.ReactNode> = {
  foto: <Image className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  audio: <FileAudio className="h-5 w-5" />,
  documento: <FileText className="h-5 w-5" />,
  screenshot: <Monitor className="h-5 w-5" />,
};

const colorsByTipo: Record<TipoEvidencia, string> = {
  foto: "bg-blue-100 text-blue-700",
  video: "bg-purple-100 text-purple-700",
  audio: "bg-green-100 text-green-700",
  documento: "bg-orange-100 text-orange-700",
  screenshot: "bg-cyan-100 text-cyan-700",
};

export function CardEvidencia({
  evidencia,
  onRemove,
  onTogglePrincipal,
  showActions = true,
}: CardEvidenciaProps) {
  const hasLocation =
    evidencia.exif_latitud !== undefined &&
    evidencia.exif_longitud !== undefined;

  return (
    <div className="relative border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
      <div className="flex gap-3">
        {/* Preview o icono */}
        <div
          className={`flex-shrink-0 w-16 h-16 rounded-md flex items-center justify-center ${colorsByTipo[evidencia.tipo]}`}
        >
          {evidencia.url_preview && evidencia.tipo === "foto" ? (
            <img
              src={evidencia.url_preview}
              alt={evidencia.nombre_archivo}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            iconsByTipo[evidencia.tipo]
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" title={evidencia.nombre_archivo}>
                {evidencia.nombre_archivo}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(evidencia.tamano_bytes)}
              </p>
            </div>

            {evidencia.es_prueba_principal && (
              <Badge variant="default" className="bg-amber-500 text-xs flex-shrink-0">
                <Star className="h-3 w-3 mr-1" />
                Principal
              </Badge>
            )}
          </div>

          {/* Metadatos EXIF */}
          <div className="mt-2 flex flex-wrap gap-2">
            {evidencia.exif_fecha_captura && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(evidencia.exif_fecha_captura), "dd/MM/yyyy HH:mm", {
                  locale: es,
                })}
              </Badge>
            )}

            {hasLocation && (
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                GPS verificado
              </Badge>
            )}
          </div>

          {evidencia.descripcion && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {evidencia.descripcion}
            </p>
          )}
        </div>

        {/* Acciones */}
        {showActions && (
          <div className="flex flex-col gap-1">
            {onTogglePrincipal && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onTogglePrincipal}
                title={
                  evidencia.es_prueba_principal
                    ? "Quitar como principal"
                    : "Marcar como principal"
                }
              >
                <Star
                  className={`h-4 w-4 ${
                    evidencia.es_prueba_principal
                      ? "fill-amber-500 text-amber-500"
                      : "text-muted-foreground"
                  }`}
                />
              </Button>
            )}
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={onRemove}
                title="Eliminar"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Hash (colapsado) */}
      <div className="mt-2 pt-2 border-t">
        <p className="text-[10px] text-muted-foreground font-mono truncate" title={evidencia.hash_sha256}>
          SHA-256: {evidencia.hash_sha256.substring(0, 16)}...
        </p>
      </div>
    </div>
  );
}
