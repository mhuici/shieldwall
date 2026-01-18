"use client";

/**
 * Timeline Visual Component - Pack Evidencia v2.0
 *
 * Componente visual para mostrar la cadena de custodia completa
 * de una notificación laboral con todos los eventos de las Fases 1-5.
 */

import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Eye,
  UserCheck,
  FileCheck,
  AlertTriangle,
  Shield,
  Fingerprint,
  ScrollText,
  Timer,
  Link2,
  FileSignature,
  Blocks,
  Stamp,
  Camera,
  FileText,
  Users,
} from "lucide-react";

export interface TimelineEvent {
  fecha: string;
  tipo: string;
  titulo: string;
  detalle?: string;
  ip?: string;
  hash?: string;
}

interface TimelineVisualProps {
  eventos: TimelineEvent[];
  className?: string;
}

// Mapeo de iconos por tipo de evento
const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  // Eventos básicos
  creacion: FileText,
  envio_email: Mail,
  envio_sms: Phone,
  envio_whatsapp: MessageSquare,
  email_entregado: Mail,
  sms_entregado: Phone,
  whatsapp_entregado: MessageSquare,
  link_abierto: Eye,
  apertura_link: Eye,
  identidad_validada: UserCheck,
  validacion_identidad: UserCheck,
  lectura_confirmada: FileCheck,
  confirmacion_lectura: FileCheck,
  firmeza: Shield,

  // Alertas
  alerta_72hs: AlertTriangle,
  alerta_5dias: AlertTriangle,
  alerta_7dias: AlertTriangle,

  // Testigos y evidencia
  declaracion_testigo: Users,
  invitacion_testigo: Users,
  evidencia_subida: Camera,

  // Biometría (Fase 1-2)
  biometria_verificacion: Fingerprint,
  biometria_enrolamiento: Fingerprint,
  biometria_fallida: Fingerprint,
  biometria_contingencia: AlertTriangle,

  // Protocolo lectura (Fase 4)
  scroll_completado: ScrollText,
  tiempo_lectura: Timer,
  reconocimiento_validado: CheckCircle2,
  reconocimiento_fallido: AlertTriangle,

  // Timestamps (Fase 5)
  tsa_sellado: Stamp,
  tsa_fallido: AlertTriangle,
  blockchain_pendiente: Blocks,
  blockchain_confirmado: Blocks,
  timestamp_confirmado: Clock,

  // Firma digital (Fase 5)
  firma_digital: FileSignature,
  firma_verificada: FileSignature,

  // Descargo
  descargo_habilitado: FileText,
  descargo_identidad: UserCheck,
  descargo_ejercer_descargo: FileText,
  descargo_declinar_descargo: FileText,
  descargo_confirmado: FileCheck,

  // Bitácora
  bitacora_vinculada: Link2,
};

// Colores por tipo de evento
const eventColors: Record<string, string> = {
  // Positivos
  creacion: "bg-blue-500",
  lectura_confirmada: "bg-green-500",
  confirmacion_lectura: "bg-green-500",
  identidad_validada: "bg-green-500",
  validacion_identidad: "bg-green-500",
  firmeza: "bg-emerald-600",
  biometria_verificacion: "bg-green-500",
  reconocimiento_validado: "bg-green-500",
  blockchain_confirmado: "bg-purple-600",
  tsa_sellado: "bg-purple-500",
  firma_digital: "bg-indigo-500",
  descargo_confirmado: "bg-green-500",
  declaracion_testigo: "bg-blue-500",

  // Neutros / En progreso
  envio_email: "bg-blue-400",
  envio_sms: "bg-blue-400",
  envio_whatsapp: "bg-blue-400",
  email_entregado: "bg-blue-500",
  sms_entregado: "bg-blue-500",
  whatsapp_entregado: "bg-blue-500",
  link_abierto: "bg-sky-500",
  apertura_link: "bg-sky-500",
  scroll_completado: "bg-sky-500",
  tiempo_lectura: "bg-sky-500",
  blockchain_pendiente: "bg-yellow-500",
  descargo_habilitado: "bg-gray-500",
  invitacion_testigo: "bg-gray-500",
  evidencia_subida: "bg-gray-500",
  bitacora_vinculada: "bg-gray-500",

  // Alertas
  alerta_72hs: "bg-yellow-500",
  alerta_5dias: "bg-orange-500",
  alerta_7dias: "bg-red-500",
  biometria_contingencia: "bg-yellow-500",

  // Negativos
  biometria_fallida: "bg-red-500",
  reconocimiento_fallido: "bg-red-500",
  tsa_fallido: "bg-red-500",
};

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}

function getEventIcon(tipo: string): React.ComponentType<{ className?: string }> {
  return eventIcons[tipo] || Clock;
}

function getEventColor(tipo: string): string {
  return eventColors[tipo] || "bg-gray-400";
}

export function TimelineVisual({ eventos, className }: TimelineVisualProps) {
  if (!eventos || eventos.length === 0) {
    return (
      <div className={cn("text-center text-muted-foreground py-8", className)}>
        No hay eventos registrados
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Línea vertical */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {eventos.map((evento, index) => {
          const Icon = getEventIcon(evento.tipo);
          const color = getEventColor(evento.tipo);

          return (
            <div key={index} className="relative pl-12">
              {/* Icono del evento */}
              <div
                className={cn(
                  "absolute left-0 w-8 h-8 rounded-full flex items-center justify-center",
                  color
                )}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>

              {/* Contenido del evento */}
              <div className="bg-card border rounded-lg p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <h4 className="font-medium text-foreground">{evento.titulo}</h4>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(evento.fecha)}
                  </span>
                </div>

                {evento.detalle && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {evento.detalle}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs">
                  {evento.ip && (
                    <span className="bg-muted px-2 py-1 rounded">
                      IP: {evento.ip}
                    </span>
                  )}
                  {evento.hash && (
                    <span className="bg-muted px-2 py-1 rounded font-mono">
                      Hash: {evento.hash.substring(0, 16)}...
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Componente compacto para mostrar en tarjetas
export function TimelineCompact({
  eventos,
  maxItems = 5,
  className,
}: TimelineVisualProps & { maxItems?: number }) {
  const displayEvents = eventos.slice(0, maxItems);
  const hasMore = eventos.length > maxItems;

  return (
    <div className={cn("space-y-2", className)}>
      {displayEvents.map((evento, index) => {
        const Icon = getEventIcon(evento.tipo);
        const color = getEventColor(evento.tipo);

        return (
          <div key={index} className="flex items-center gap-3 text-sm">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                color
              )}
            >
              <Icon className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="truncate block">{evento.titulo}</span>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(evento.fecha).split(" ")[0]}
            </span>
          </div>
        );
      })}

      {hasMore && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          +{eventos.length - maxItems} eventos más
        </p>
      )}
    </div>
  );
}

// Exportar índice
export { TimelineVisual as default };
