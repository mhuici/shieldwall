"use client";

import { useState } from "react";
import { AgregarTestigoDialog } from "./agregar-testigo-dialog";
import { CardTestigo } from "./card-testigo";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, AlertCircle, CheckCircle } from "lucide-react";
import {
  type CrearTestigoForm,
  type DeclaracionTestigo,
} from "@/lib/types";

interface ListaTestigosProps {
  // Testigos ya guardados en BD (para vista de detalle)
  testigosGuardados?: DeclaracionTestigo[];
  // Testigos temporales del form (para creación)
  testigosTemporales?: CrearTestigoForm[];
  // Callbacks
  onAgregarTestigo?: (testigo: CrearTestigoForm) => void;
  onEliminarTestigo?: (index: number) => void;
  onEnviarInvitacion?: (testigoId: string) => void;
  onVerDeclaracion?: (testigoId: string) => void;
  // Config
  requiereTestigos?: boolean;
  readonly?: boolean;
  maxTestigos?: number;
}

export function ListaTestigos({
  testigosGuardados = [],
  testigosTemporales = [],
  onAgregarTestigo,
  onEliminarTestigo,
  onEnviarInvitacion,
  onVerDeclaracion,
  requiereTestigos = false,
  readonly = false,
  maxTestigos = 10,
}: ListaTestigosProps) {
  const [loading, setLoading] = useState<string | null>(null);

  // Combinar testigos para mostrar
  const totalTestigos = testigosGuardados.length + testigosTemporales.length;
  const testigosFirmados = testigosGuardados.filter((t) => t.estado === "firmado").length;
  const puedeAgregar = !readonly && totalTestigos < maxTestigos;

  const handleEnviarInvitacion = async (testigoId: string) => {
    if (!onEnviarInvitacion) return;
    setLoading(testigoId);
    try {
      await onEnviarInvitacion(testigoId);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Testigos</h3>
          {totalTestigos > 0 && (
            <Badge variant="secondary">{totalTestigos}</Badge>
          )}
          {testigosFirmados > 0 && (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {testigosFirmados} firmados
            </Badge>
          )}
          {requiereTestigos && totalTestigos === 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Obligatorio
            </Badge>
          )}
        </div>

        {puedeAgregar && onAgregarTestigo && (
          <AgregarTestigoDialog
            onTestigoAgregado={onAgregarTestigo}
            disabled={totalTestigos >= maxTestigos}
          />
        )}
      </div>

      {/* Alerta si requiere testigos */}
      {requiereTestigos && totalTestigos === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Este tipo de sanción requiere al menos un testigo para tener mayor validez probatoria.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista vacía */}
      {totalTestigos === 0 && !requiereTestigos && (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay testigos agregados</p>
          {!readonly && (
            <p className="text-xs mt-1">
              Agregar testigos fortalece la validez probatoria de la sanción
            </p>
          )}
        </div>
      )}

      {/* Lista de testigos guardados */}
      {testigosGuardados.length > 0 && (
        <div className="space-y-2">
          {testigosGuardados.map((testigo, index) => (
            <CardTestigo
              key={testigo.id}
              testigo={testigo}
              index={index}
              loading={loading === testigo.id}
              readonly={readonly}
              onEnviarInvitacion={
                onEnviarInvitacion
                  ? () => handleEnviarInvitacion(testigo.id)
                  : undefined
              }
              onVerDeclaracion={
                onVerDeclaracion
                  ? () => onVerDeclaracion(testigo.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Lista de testigos temporales (form) */}
      {testigosTemporales.length > 0 && (
        <div className="space-y-2">
          {testigosGuardados.length > 0 && testigosTemporales.length > 0 && (
            <p className="text-xs text-muted-foreground mt-4 mb-2">
              Testigos por agregar:
            </p>
          )}
          {testigosTemporales.map((testigo, index) => (
            <CardTestigo
              key={`temp-${index}`}
              testigo={testigo}
              index={testigosGuardados.length + index}
              onEliminar={onEliminarTestigo ? () => onEliminarTestigo(index) : undefined}
            />
          ))}
        </div>
      )}

      {/* Info adicional */}
      {totalTestigos > 0 && !readonly && (
        <p className="text-xs text-muted-foreground">
          Los testigos recibirán un link para completar su declaración bajo juramento.
          La declaración quedará firmada digitalmente con hash y timestamp.
        </p>
      )}
    </div>
  );
}
