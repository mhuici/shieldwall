"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  User,
  Mail,
  Phone,
  Send,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  FileSignature,
  XCircle,
} from "lucide-react";
import {
  type DeclaracionTestigo,
  type CrearTestigoForm,
  type EstadoTestigo,
  ESTADO_TESTIGO_LABELS,
  RELACION_TESTIGO_LABELS,
} from "@/lib/types";

// Colores de badge según estado
const ESTADO_BADGE_VARIANT: Record<EstadoTestigo, "default" | "secondary" | "destructive" | "outline"> = {
  pendiente: "secondary",
  invitado: "outline",
  validado: "outline",
  firmado: "default",
  rechazado: "destructive",
  expirado: "destructive",
};

// Iconos según estado
const ESTADO_ICON: Record<EstadoTestigo, React.ReactNode> = {
  pendiente: <Clock className="h-3 w-3" />,
  invitado: <Send className="h-3 w-3" />,
  validado: <Eye className="h-3 w-3" />,
  firmado: <CheckCircle className="h-3 w-3" />,
  rechazado: <XCircle className="h-3 w-3" />,
  expirado: <AlertCircle className="h-3 w-3" />,
};

interface CardTestigoProps {
  // Puede ser un testigo ya guardado en BD o uno temporal del form
  testigo: DeclaracionTestigo | CrearTestigoForm;
  index?: number;
  onEliminar?: () => void;
  onEnviarInvitacion?: () => void;
  onVerDeclaracion?: () => void;
  loading?: boolean;
  readonly?: boolean;
}

// Type guard para saber si es un testigo guardado
function esTestigoGuardado(testigo: DeclaracionTestigo | CrearTestigoForm): testigo is DeclaracionTestigo {
  return "id" in testigo && "estado" in testigo;
}

export function CardTestigo({
  testigo,
  index,
  onEliminar,
  onEnviarInvitacion,
  onVerDeclaracion,
  loading = false,
  readonly = false,
}: CardTestigoProps) {
  const esGuardado = esTestigoGuardado(testigo);
  const estado: EstadoTestigo = esGuardado ? testigo.estado : "pendiente";
  const puedeEnviarInvitacion = esGuardado && estado === "pendiente" && (testigo.email || testigo.telefono);
  const puedeVerDeclaracion = esGuardado && estado === "firmado";
  const puedeEliminar = !readonly && (!esGuardado || estado === "pendiente");

  return (
    <Card className="relative">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Info del testigo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate">{testigo.nombre_completo}</span>
              {index !== undefined && (
                <span className="text-xs text-muted-foreground">#{index + 1}</span>
              )}
            </div>

            {/* Cargo y relación */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
              {testigo.cargo && <span>{testigo.cargo}</span>}
              {testigo.cargo && testigo.relacion && <span>•</span>}
              <span>{RELACION_TESTIGO_LABELS[testigo.relacion]}</span>
              {testigo.presente_en_hecho && (
                <>
                  <span>•</span>
                  <span className="text-green-600 text-xs">Presente en el hecho</span>
                </>
              )}
            </div>

            {/* Contacto */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {testigo.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">{testigo.email}</span>
                </div>
              )}
              {testigo.telefono && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{testigo.telefono}</span>
                </div>
              )}
            </div>

            {/* Descripción del testigo (si ya firmó) */}
            {esGuardado && testigo.descripcion_testigo && (
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                <p className="text-muted-foreground italic line-clamp-2">
                  &quot;{testigo.descripcion_testigo}&quot;
                </p>
              </div>
            )}
          </div>

          {/* Estado y acciones */}
          <div className="flex flex-col items-end gap-2">
            {/* Badge de estado */}
            <Badge variant={ESTADO_BADGE_VARIANT[estado]} className="flex items-center gap-1">
              {ESTADO_ICON[estado]}
              {ESTADO_TESTIGO_LABELS[estado]}
            </Badge>

            {/* Botones de acción */}
            <div className="flex gap-1">
              {puedeEnviarInvitacion && onEnviarInvitacion && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onEnviarInvitacion}
                        disabled={loading}
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Enviar invitación</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {puedeVerDeclaracion && onVerDeclaracion && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={onVerDeclaracion}>
                        <FileSignature className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver declaración firmada</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {puedeEliminar && onEliminar && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={onEliminar}
                        disabled={loading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Eliminar testigo</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Fecha de invitación/firma */}
            {esGuardado && testigo.invitacion_enviada_at && (
              <span className="text-xs text-muted-foreground">
                Invitado:{" "}
                {new Date(testigo.invitacion_enviada_at).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            )}
            {esGuardado && testigo.juramento_timestamp && (
              <span className="text-xs text-green-600">
                Firmado:{" "}
                {new Date(testigo.juramento_timestamp).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
