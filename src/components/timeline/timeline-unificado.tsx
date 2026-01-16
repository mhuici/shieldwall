"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  FileText,
  Mail,
  CheckCircle,
  Eye,
  UserCheck,
  MessageSquare,
  AlertTriangle,
  Camera,
  Shield,
  Gavel,
  ClipboardList,
  Download,
  ChevronDown,
  ChevronUp,
  Hash,
} from "lucide-react";
import {
  EventoTimeline,
  TimelineNotificacion,
  TIPO_EVENTO_TIMELINE_LABELS,
  TIPO_EVENTO_TIMELINE_COLORES,
} from "@/lib/types";

interface TimelineUnificadoProps {
  notificacionId: string;
}

const iconosPorTipo: Record<string, React.ReactNode> = {
  sancion_creada: <FileText className="h-4 w-4" />,
  email_enviado: <Mail className="h-4 w-4" />,
  email_entregado: <CheckCircle className="h-4 w-4" />,
  email_rebotado: <AlertTriangle className="h-4 w-4" />,
  sms_enviado: <MessageSquare className="h-4 w-4" />,
  link_abierto: <Eye className="h-4 w-4" />,
  lectura_confirmada: <UserCheck className="h-4 w-4" />,
  testigo_agregado: <UserCheck className="h-4 w-4" />,
  testigo_invitado: <Mail className="h-4 w-4" />,
  testigo_declaro: <Gavel className="h-4 w-4" />,
  evidencia_agregada: <Camera className="h-4 w-4" />,
  descargo_creado: <ClipboardList className="h-4 w-4" />,
  descargo_identidad_validada: <Shield className="h-4 w-4" />,
  descargo_ejercido: <FileText className="h-4 w-4" />,
  descargo_declinado: <AlertTriangle className="h-4 w-4" />,
  descargo_confirmado: <CheckCircle className="h-4 w-4" />,
  descargo_analizado: <Eye className="h-4 w-4" />,
  bitacora_vinculada: <ClipboardList className="h-4 w-4" />,
  sancion_firme: <Gavel className="h-4 w-4" />,
};

export function TimelineUnificado({ notificacionId }: TimelineUnificadoProps) {
  const [timeline, setTimeline] = useState<TimelineNotificacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    cargarTimeline();
  }, [notificacionId]);

  const cargarTimeline = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/evidencia/timeline/${notificacionId}`
      );
      if (!response.ok) throw new Error("Error al cargar timeline");
      const data = await response.json();
      setTimeline(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const obtenerColor = (tipo: string): string => {
    return TIPO_EVENTO_TIMELINE_COLORES[tipo] || "gray";
  };

  const obtenerClaseColor = (color: string): string => {
    const clases: Record<string, string> = {
      green: "bg-green-100 text-green-800 border-green-300",
      blue: "bg-blue-100 text-blue-800 border-blue-300",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
      red: "bg-red-100 text-red-800 border-red-300",
      purple: "bg-purple-100 text-purple-800 border-purple-300",
      orange: "bg-orange-100 text-orange-800 border-orange-300",
      indigo: "bg-indigo-100 text-indigo-800 border-indigo-300",
      gray: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return clases[color] || clases.gray;
  };

  const obtenerClaseBorde = (color: string): string => {
    const clases: Record<string, string> = {
      green: "border-green-500",
      blue: "border-blue-500",
      yellow: "border-yellow-500",
      red: "border-red-500",
      purple: "border-purple-500",
      orange: "border-orange-500",
      indigo: "border-indigo-500",
      gray: "border-gray-500",
    };
    return clases[color] || clases.gray;
  };

  const obtenerClasePunto = (color: string): string => {
    const clases: Record<string, string> = {
      green: "bg-green-500",
      blue: "bg-blue-500",
      yellow: "bg-yellow-500",
      red: "bg-red-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      indigo: "bg-indigo-500",
      gray: "bg-gray-500",
    };
    return clases[color] || clases.gray;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cadena de Custodia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timeline) return null;

  const eventosVisibles = expandido
    ? timeline.eventos
    : timeline.eventos.slice(0, 5);
  const tieneOcultos = timeline.eventos.length > 5;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cadena de Custodia
          </CardTitle>
          <Badge variant="secondary">{timeline.total_eventos} eventos</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Línea vertical */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-4">
            {eventosVisibles.map((evento: EventoTimeline, index: number) => {
              const color = obtenerColor(evento.tipo);
              const icono = iconosPorTipo[evento.tipo] || (
                <Clock className="h-4 w-4" />
              );

              return (
                <div key={index} className="relative flex gap-4 pl-2">
                  {/* Punto en la línea */}
                  <div
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${obtenerClasePunto(color)} text-white`}
                  >
                    {icono}
                  </div>

                  {/* Contenido */}
                  <div
                    className={`flex-1 rounded-lg border-l-4 ${obtenerClaseBorde(color)} bg-white p-3 shadow-sm`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{evento.titulo}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${obtenerClaseColor(color)}`}
                          >
                            {TIPO_EVENTO_TIMELINE_LABELS[evento.tipo] ||
                              evento.tipo}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {evento.descripcion}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatearFecha(evento.timestamp)}
                      </span>
                    </div>

                    {/* Hash si existe */}
                    {evento.hash ? (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        <code className="font-mono bg-gray-100 px-1 rounded truncate max-w-[200px]">
                          {evento.hash.slice(0, 16)}...
                        </code>
                      </div>
                    ) : null}

                    {/* Metadata relevante */}
                    {evento.metadata?.ip ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        IP: {String(evento.metadata.ip)}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón expandir/colapsar */}
          {tieneOcultos && (
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandido(!expandido)}
                className="text-muted-foreground"
              >
                {expandido ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Ver {timeline.eventos.length - 5} eventos más
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Botón de exportar */}
        <div className="mt-6 pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              window.open(
                `/api/evidencia/exportar/${notificacionId}`,
                "_blank"
              )
            }
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Paquete de Evidencia
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
