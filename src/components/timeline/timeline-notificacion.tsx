"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Hash,
  Send,
  CheckCircle,
  Eye,
  ShieldCheck,
  CheckSquare,
  UserPlus,
  Mail,
  PenTool,
  Image,
  Clock,
  XCircle,
  AlertTriangle,
  Shield,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import type { EventoTimeline } from "@/lib/types";

interface TimelineNotificacionProps {
  eventos: EventoTimeline[];
  className?: string;
}

const ICONOS: Record<string, React.ComponentType<{ className?: string }>> = {
  sancion_creada: FileText,
  timestamp_generacion: Hash,
  email_enviado: Send,
  email_entregado: CheckCircle,
  link_abierto: Eye,
  identidad_validada: ShieldCheck,
  lectura_confirmada: CheckSquare,
  testigo_agregado: UserPlus,
  testigo_invitado: Mail,
  testigo_firmado: PenTool,
  evidencia_adjuntada: Image,
  descargo_pendiente: Clock,
  descargo_presentado: FileText,
  descargo_declinado: XCircle,
  descargo_vencido: AlertTriangle,
  sancion_firme: Shield,
};

const COLORES: Record<string, { bg: string; border: string; dot: string }> = {
  sancion_creada: { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
  timestamp_generacion: { bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500" },
  email_enviado: { bg: "bg-cyan-50", border: "border-cyan-200", dot: "bg-cyan-500" },
  email_entregado: { bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
  link_abierto: { bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-500" },
  identidad_validada: { bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
  lectura_confirmada: { bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
  testigo_agregado: { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
  testigo_invitado: { bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-500" },
  testigo_firmado: { bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
  evidencia_adjuntada: { bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500" },
  descargo_pendiente: { bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-500" },
  descargo_presentado: { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
  descargo_declinado: { bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-500" },
  descargo_vencido: { bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
  sancion_firme: { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
};

const LABELS: Record<string, string> = {
  sancion_creada: "Sanción Creada",
  timestamp_generacion: "Timestamp Certificado",
  email_enviado: "Notificación Enviada",
  email_entregado: "Email Entregado",
  link_abierto: "Link Accedido",
  identidad_validada: "Identidad Verificada",
  lectura_confirmada: "Lectura Confirmada",
  testigo_agregado: "Testigo Agregado",
  testigo_invitado: "Invitación a Testigo",
  testigo_firmado: "Testigo Firmó",
  evidencia_adjuntada: "Evidencia Adjuntada",
  descargo_pendiente: "Descargo Pendiente",
  descargo_presentado: "Descargo Presentado",
  descargo_declinado: "Descargo Declinado",
  descargo_vencido: "Plazo de Descargo Vencido",
  sancion_firme: "Sanción Firme",
};

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HashBadge({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);

  const copyHash = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copyHash}
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-600 hover:bg-slate-200 transition-colors"
      title="Click para copiar hash completo"
    >
      <Hash className="h-3 w-3" />
      {hash.slice(0, 8)}...{hash.slice(-8)}
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function EventoCard({ evento, isLast }: { evento: EventoTimeline; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const IconComponent = ICONOS[evento.tipo] || FileText;
  const colores = COLORES[evento.tipo] || { bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-500" };
  const label = LABELS[evento.tipo] || evento.tipo;

  const hasMetadata = evento.metadata && Object.keys(evento.metadata).length > 0;

  return (
    <div className="flex gap-4">
      {/* Timeline line and dot */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${colores.dot} ring-4 ring-white`} />
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
      </div>

      {/* Event content */}
      <div className={`flex-1 pb-6 ${isLast ? "" : ""}`}>
        <div className={`rounded-lg border ${colores.border} ${colores.bg} p-4`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-white/80`}>
                <IconComponent className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{evento.titulo || label}</p>
                <p className="text-sm text-slate-600">{evento.descripcion}</p>
              </div>
            </div>
            <time className="text-xs text-slate-500 whitespace-nowrap">
              {formatDate(evento.timestamp)}
            </time>
          </div>

          {/* Hash badge */}
          {evento.hash && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-500">Hash:</span>
              <HashBadge hash={evento.hash} />
            </div>
          )}

          {/* Metadata expandible */}
          {hasMetadata && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? "Ocultar detalles" : "Ver detalles"}
              </button>

              {expanded && (
                <div className="mt-2 p-2 bg-white/50 rounded text-xs font-mono">
                  <pre className="whitespace-pre-wrap text-slate-600">
                    {JSON.stringify(evento.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TimelineNotificacion({ eventos, className = "" }: TimelineNotificacionProps) {
  if (!eventos || eventos.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay eventos registrados aún
          </p>
        </CardContent>
      </Card>
    );
  }

  // Agrupar eventos por fecha
  const eventosPorFecha = eventos.reduce((acc, evento) => {
    const fecha = new Date(evento.timestamp).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(evento);
    return acc;
  }, {} as Record<string, EventoTimeline[]>);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline de Eventos
          </CardTitle>
          <Badge variant="outline">{eventos.length} eventos</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(eventosPorFecha).map(([fecha, eventosDelDia]) => (
            <div key={fecha}>
              <h4 className="text-sm font-medium text-slate-500 mb-4 capitalize">
                {fecha}
              </h4>
              <div className="pl-2">
                {eventosDelDia.map((evento, idx) => (
                  <EventoCard
                    key={`${evento.tipo}-${evento.timestamp}-${idx}`}
                    evento={evento}
                    isLast={idx === eventosDelDia.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TimelineCompacto({ eventos, maxEventos = 5 }: { eventos: EventoTimeline[]; maxEventos?: number }) {
  const eventosVisibles = eventos.slice(0, maxEventos);
  const eventosRestantes = eventos.length - maxEventos;

  return (
    <div className="space-y-3">
      {eventosVisibles.map((evento, idx) => {
        const IconComponent = ICONOS[evento.tipo] || FileText;
        const colores = COLORES[evento.tipo] || { dot: "bg-gray-500" };

        return (
          <div key={`${evento.tipo}-${evento.timestamp}-${idx}`} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${colores.dot}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{evento.titulo}</p>
            </div>
            <time className="text-xs text-muted-foreground">
              {formatDate(evento.timestamp)}
            </time>
          </div>
        );
      })}

      {eventosRestantes > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          +{eventosRestantes} eventos más
        </p>
      )}
    </div>
  );
}
