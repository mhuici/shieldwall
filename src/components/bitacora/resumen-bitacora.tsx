"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import {
  type TipoNovedad,
  type CategoriaNovedad,
  TIPO_NOVEDAD_LABELS,
  CATEGORIA_NOVEDAD_LABELS,
  TIPO_NOVEDAD_COLORES,
  MESES_BITACORA_CONTEXTO,
} from "@/lib/types";

interface NovedadResumen {
  id: string;
  tipo: TipoNovedad;
  categoria?: CategoriaNovedad;
  titulo: string;
  descripcion: string;
  fecha_hecho: string;
  hora_hecho?: string;
  empleado_actitud?: string;
  hash_sha256?: string;
  created_at: string;
}

interface ResumenData {
  total_novedades: number;
  novedades_por_tipo: Record<string, number>;
  novedades_por_categoria: Record<string, number>;
  primera_novedad?: string;
  ultima_novedad?: string;
  meses_analizados: number;
  empleado: {
    id: string;
    nombre: string;
  };
}

interface ResumenBitacoraProps {
  empleadoId: string;
  onDataLoaded?: (data: { resumen: ResumenData; novedades: NovedadResumen[] }) => void;
}

export function ResumenBitacora({ empleadoId, onDataLoaded }: ResumenBitacoraProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ResumenData | null>(null);
  const [novedades, setNovedades] = useState<NovedadResumen[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!empleadoId) {
      setLoading(false);
      return;
    }

    const fetchResumen = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/bitacora/resumen/${empleadoId}?meses=${MESES_BITACORA_CONTEXTO}`
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Error al cargar la bitácora");
          return;
        }

        setResumen(data.resumen);
        setNovedades(data.novedades || []);
        onDataLoaded?.({ resumen: data.resumen, novedades: data.novedades || [] });
      } catch (err) {
        console.error("Error:", err);
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    };

    fetchResumen();
  }, [empleadoId, onDataLoaded]);

  if (!empleadoId) {
    return null;
  }

  if (loading) {
    return (
      <div className="border rounded-lg p-4 space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-lg p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!resumen || resumen.total_novedades === 0) {
    return (
      <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Sin historial de gestión</p>
            <p className="text-sm text-yellow-700 mt-1">
              No hay novedades registradas para este empleado en los últimos{" "}
              {MESES_BITACORA_CONTEXTO} meses. Registrar antecedentes de gestión fortalece la
              posición ante una eventual demanda por "mobbing".
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getColorClass = (tipo: TipoNovedad) => {
    const color = TIPO_NOVEDAD_COLORES[tipo];
    const colorMap: Record<string, string> = {
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      green: "bg-green-100 text-green-800 border-green-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      cyan: "bg-cyan-100 text-cyan-800 border-cyan-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      gray: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-green-200 bg-green-50 rounded-lg overflow-hidden">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-green-100 transition-colors">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-green-800">
                  Historial de Gestión ({resumen.meses_analizados} meses)
                </p>
                <p className="text-sm text-green-700">
                  {resumen.total_novedades} novedad{resumen.total_novedades !== 1 ? "es" : ""}{" "}
                  registrada{resumen.total_novedades !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                Demuestra progresividad
              </Badge>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-green-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-green-600" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Contenido expandible */}
        <CollapsibleContent>
          <div className="border-t border-green-200 p-4 space-y-4">
            {/* Resumen por tipo */}
            <div>
              <p className="text-sm font-medium text-green-800 mb-2">Por tipo de novedad:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(resumen.novedades_por_tipo).map(([tipo, count]) => (
                  <Badge
                    key={tipo}
                    variant="outline"
                    className={getColorClass(tipo as TipoNovedad)}
                  >
                    {TIPO_NOVEDAD_LABELS[tipo as TipoNovedad] || tipo}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Resumen por categoría */}
            {Object.keys(resumen.novedades_por_categoria).length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-800 mb-2">Por categoría:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(resumen.novedades_por_categoria).map(([cat, count]) => (
                    <Badge key={cat} variant="outline" className="bg-white">
                      {CATEGORIA_NOVEDAD_LABELS[cat as CategoriaNovedad] || cat}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline de novedades */}
            {novedades.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-800 mb-2">Últimas novedades:</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {novedades.slice(0, 5).map((nov) => (
                    <div
                      key={nov.id}
                      className="bg-white rounded-md p-3 border border-green-100 flex items-start gap-3"
                    >
                      <div className="flex-shrink-0">
                        <Calendar className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-green-600 font-medium">
                            {formatDate(nov.fecha_hecho)}
                          </span>
                          <Badge variant="outline" className={`text-xs ${getColorClass(nov.tipo)}`}>
                            {TIPO_NOVEDAD_LABELS[nov.tipo]}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                          {nov.titulo}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                          {nov.descripcion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {novedades.length > 5 && (
                  <p className="text-xs text-green-600 mt-2 text-center">
                    +{novedades.length - 5} más novedades
                  </p>
                )}
              </div>
            )}

            {/* Nota legal */}
            <div className="bg-green-100 rounded-md p-3 text-xs text-green-800">
              <div className="flex items-start gap-2">
                <MessageCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Valor probatorio (Art. 64 LCT):</p>
                  <p className="mt-1">
                    Este historial documenta el ejercicio de las facultades de "dirección y
                    organización" del empleador, demostrando gestión progresiva y descartando
                    acusaciones de "mobbing" o persecución.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
