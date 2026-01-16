"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  ImagePlus,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import {
  type TipoEvidencia,
  TIPO_EVIDENCIA_LABELS,
  MIME_TYPES_PERMITIDOS,
  TAMANO_MAXIMO_BYTES,
  MAX_EVIDENCIAS_POR_INCIDENTE,
} from "@/lib/types";
import {
  extractEXIF,
  calculateFileHash,
  formatFileSize,
  detectTipoEvidencia,
} from "@/lib/utils/exif-extractor";
import { CardEvidencia } from "./card-evidencia";

export interface EvidenciaLocal {
  id: string;
  file: File;
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
  status: "pending" | "uploading" | "uploaded" | "error";
  error?: string;
}

interface UploadEvidenciaProps {
  evidencias: EvidenciaLocal[];
  onAdd: (evidencia: EvidenciaLocal) => void;
  onRemove: (id: string) => void;
  onTogglePrincipal: (id: string) => void;
  disabled?: boolean;
}

export function UploadEvidencia({
  evidencias,
  onAdd,
  onRemove,
  onTogglePrincipal,
  disabled = false,
}: UploadEvidenciaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    tipo: TipoEvidencia;
    preview?: string;
    exif?: ReturnType<typeof extractEXIF> extends Promise<infer T> ? T : never;
    hash?: string;
  } | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoEvidencia>("foto");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Verificar cantidad máxima
    if (evidencias.length >= MAX_EVIDENCIAS_POR_INCIDENTE) {
      return {
        valid: false,
        error: `Máximo ${MAX_EVIDENCIAS_POR_INCIDENTE} archivos por incidente`,
      };
    }

    // Detectar tipo
    const tipo = detectTipoEvidencia(file.type);

    // Verificar MIME type
    const mimeTypes = Object.values(MIME_TYPES_PERMITIDOS).flat();
    if (!mimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido: ${file.type}`,
      };
    }

    // Verificar tamaño
    const maxSize = TAMANO_MAXIMO_BYTES[tipo];
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Archivo muy grande. Máximo: ${formatFileSize(maxSize)}`,
      };
    }

    return { valid: true };
  };

  const processFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || "Archivo inválido");
        setIsProcessing(false);
        return;
      }

      const tipo = detectTipoEvidencia(file.type);
      setTipoSeleccionado(tipo);

      // Extraer EXIF si es imagen
      const exif = tipo === "foto" ? await extractEXIF(file) : {};

      // Calcular hash
      const hash = await calculateFileHash(file);

      // Crear preview para imágenes
      let preview: string | undefined;
      if (tipo === "foto" || tipo === "screenshot") {
        preview = URL.createObjectURL(file);
      }

      setPendingFile({
        file,
        tipo,
        preview,
        exif,
        hash,
      });
      setDescripcion("");
    } catch (err) {
      setError("Error procesando archivo");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await processFile(files[0]);
      }
    },
    [disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirm = () => {
    if (!pendingFile) return;

    const evidencia: EvidenciaLocal = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file: pendingFile.file,
      tipo: tipoSeleccionado,
      nombre_archivo: pendingFile.file.name,
      tamano_bytes: pendingFile.file.size,
      url_preview: pendingFile.preview,
      descripcion: descripcion.trim() || undefined,
      es_prueba_principal: evidencias.length === 0, // Primera es principal
      exif_fecha_captura: pendingFile.exif?.fechaCaptura,
      exif_latitud: pendingFile.exif?.latitud,
      exif_longitud: pendingFile.exif?.longitud,
      hash_sha256: pendingFile.hash || "",
      status: "pending",
    };

    onAdd(evidencia);
    setPendingFile(null);
    setDescripcion("");
  };

  const handleCancel = () => {
    if (pendingFile?.preview) {
      URL.revokeObjectURL(pendingFile.preview);
    }
    setPendingFile(null);
    setDescripcion("");
  };

  const canAddMore = evidencias.length < MAX_EVIDENCIAS_POR_INCIDENTE;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}
          `}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            disabled={disabled}
          />

          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Procesando archivo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-muted rounded-full">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Arrastrá un archivo o hacé click para seleccionar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fotos, videos, audios o documentos (máx. {MAX_EVIDENCIAS_POR_INCIDENTE} archivos)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de evidencias */}
      {evidencias.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Evidencia adjunta ({evidencias.length}/{MAX_EVIDENCIAS_POR_INCIDENTE})
          </Label>
          <div className="grid gap-2">
            {evidencias.map((ev) => (
              <CardEvidencia
                key={ev.id}
                evidencia={ev}
                onRemove={() => onRemove(ev.id)}
                onTogglePrincipal={() => onTogglePrincipal(ev.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info valor probatorio */}
      {evidencias.length > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-xs text-green-700">
              <p className="font-medium">Evidencia con valor probatorio</p>
              <p className="mt-1">
                Los metadatos EXIF (fecha, ubicación) y el hash SHA-256 quedarán
                registrados como prueba de autenticidad.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      <Dialog open={!!pendingFile} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar evidencia</DialogTitle>
            <DialogDescription>
              Verificá los datos y agregá una descripción opcional
            </DialogDescription>
          </DialogHeader>

          {pendingFile && (
            <div className="space-y-4">
              {/* Preview */}
              {pendingFile.preview && (
                <div className="flex justify-center">
                  <img
                    src={pendingFile.preview}
                    alt="Preview"
                    className="max-h-48 rounded-md object-contain"
                  />
                </div>
              )}

              {/* Info del archivo */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Archivo:</span>
                  <span className="font-medium truncate ml-2">
                    {pendingFile.file.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tamaño:</span>
                  <span>{formatFileSize(pendingFile.file.size)}</span>
                </div>
                {pendingFile.exif?.fechaCaptura && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha captura (EXIF):</span>
                    <span className="text-green-600 font-medium">
                      {new Date(pendingFile.exif.fechaCaptura).toLocaleString("es-AR")}
                    </span>
                  </div>
                )}
                {pendingFile.exif?.latitud && pendingFile.exif?.longitud && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ubicación GPS:</span>
                    <span className="text-green-600 font-medium">Detectada</span>
                  </div>
                )}
                {pendingFile.exif?.dispositivo && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dispositivo:</span>
                    <span>{pendingFile.exif.dispositivo}</span>
                  </div>
                )}
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de evidencia</Label>
                <Select
                  value={tipoSeleccionado}
                  onValueChange={(v) => setTipoSeleccionado(v as TipoEvidencia)}
                >
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_EVIDENCIA_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">
                  Descripción <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  id="descripcion"
                  placeholder="¿Qué muestra esta evidencia?"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Hash */}
              <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                <span className="text-muted-foreground">SHA-256: </span>
                {pendingFile.hash}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>
              <Upload className="h-4 w-4 mr-2" />
              Agregar evidencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
