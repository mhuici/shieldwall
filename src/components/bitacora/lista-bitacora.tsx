"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";
import {
  type TipoNovedad,
  type CategoriaNovedad,
  TIPO_NOVEDAD_LABELS,
  CATEGORIA_NOVEDAD_LABELS,
  TIPO_NOVEDAD_COLORES,
} from "@/lib/types";
import { AgregarNovedadDialog } from "./agregar-novedad-dialog";

interface NovedadListItem {
  id: string;
  tipo: TipoNovedad;
  categoria: CategoriaNovedad | null;
  titulo: string;
  descripcion: string;
  fecha_hecho: string;
  hora_hecho: string | null;
  lugar: string | null;
  empleado_actitud: string | null;
  hash_sha256: string;
  created_at: string;
  empleado: {
    id: string;
    nombre: string;
    cuil: string;
  };
}

interface EmpleadoSimple {
  id: string;
  nombre: string;
  cuil: string;
}

interface ListaBitacoraProps {
  empleados: EmpleadoSimple[];
  empleadoIdFiltro?: string;
}

const TIPOS_NOVEDAD: TipoNovedad[] = [
  "recordatorio_verbal",
  "conversacion_informal",
  "permiso_concedido",
  "felicitacion",
  "capacitacion",
  "incidente_menor",
  "ajuste_horario",
  "comunicacion_general",
  "otro",
];

const CATEGORIAS: CategoriaNovedad[] = [
  "puntualidad",
  "seguridad",
  "conducta",
  "rendimiento",
  "comunicacion",
  "normativa_interna",
  "otro",
];

const PAGE_SIZE = 20;

export function ListaBitacora({ empleados, empleadoIdFiltro }: ListaBitacoraProps) {
  const [loading, setLoading] = useState(true);
  const [novedades, setNovedades] = useState<NovedadListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  // Filtros
  const [filtroEmpleado, setFiltroEmpleado] = useState<string>(empleadoIdFiltro || "");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchNovedades = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(page * PAGE_SIZE));

      if (filtroEmpleado) params.set("empleado_id", filtroEmpleado);
      if (filtroTipo) params.set("tipo", filtroTipo);
      if (filtroCategoria) params.set("categoria", filtroCategoria);
      if (filtroFechaDesde) params.set("fecha_desde", filtroFechaDesde);
      if (filtroFechaHasta) params.set("fecha_hasta", filtroFechaHasta);

      const response = await fetch(`/api/bitacora?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setNovedades(data.novedades || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Error fetching bitácora:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filtroEmpleado, filtroTipo, filtroCategoria, filtroFechaDesde, filtroFechaHasta]);

  useEffect(() => {
    fetchNovedades();
  }, [fetchNovedades]);

  const handleClearFilters = () => {
    setFiltroEmpleado("");
    setFiltroTipo("");
    setFiltroCategoria("");
    setFiltroFechaDesde("");
    setFiltroFechaHasta("");
    setPage(0);
  };

  const hasActiveFilters =
    filtroEmpleado || filtroTipo || filtroCategoria || filtroFechaDesde || filtroFechaHasta;

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Bitácora de Novedades</h2>
          {total > 0 && (
            <Badge variant="secondary">{total} registros</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? "border-primary" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="default" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                !
              </Badge>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={fetchNovedades}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          <AgregarNovedadDialog
            empleados={empleados}
            onNovedadCreada={fetchNovedades}
          />
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Filtrar novedades</p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Empleado */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Empleado
              </label>
              <Select value={filtroEmpleado} onValueChange={setFiltroEmpleado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {empleados.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Tipo</label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {TIPOS_NOVEDAD.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {TIPO_NOVEDAD_LABELS[tipo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categoría */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Categoría</label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORIA_NOVEDAD_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha desde */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Desde
              </label>
              <Input
                type="date"
                value={filtroFechaDesde}
                onChange={(e) => setFiltroFechaDesde(e.target.value)}
              />
            </div>

            {/* Fecha hasta */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Hasta
              </label>
              <Input
                type="date"
                value={filtroFechaHasta}
                onChange={(e) => setFiltroFechaHasta(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && novedades.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No hay novedades registradas</p>
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mt-1">
              Probá ajustando los filtros
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-4 max-w-md mx-auto">
            La bitácora de novedades documenta hechos NO sancionatorios para demostrar
            "dirección y organización" (Art. 64 LCT) y descartar acusaciones de mobbing.
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && novedades.length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Empleado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Categoría</TableHead>
                <TableHead className="hidden lg:table-cell">Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {novedades.map((novedad) => (
                <TableRow key={novedad.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm">{formatDate(novedad.fecha_hecho)}</div>
                    {novedad.hora_hecho && (
                      <div className="text-xs text-muted-foreground">
                        {novedad.hora_hecho.slice(0, 5)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{novedad.empleado.nombre}</div>
                    <div className="text-xs text-muted-foreground">
                      {novedad.empleado.cuil}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getColorClass(novedad.tipo)}>
                      {TIPO_NOVEDAD_LABELS[novedad.tipo]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="font-medium truncate" title={novedad.titulo}>
                      {novedad.titulo}
                    </div>
                    <div
                      className="text-xs text-muted-foreground truncate"
                      title={novedad.descripcion}
                    >
                      {novedad.descripcion}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {novedad.categoria ? (
                      <Badge variant="outline">
                        {CATEGORIA_NOVEDAD_LABELS[novedad.categoria]}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <code className="text-xs text-muted-foreground">
                      {novedad.hash_sha256.slice(0, 8)}...
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, total)} de {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Footer info */}
      {!loading && novedades.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Cada novedad tiene hash SHA-256 que garantiza su integridad. Este registro
          demuestra gestión progresiva del empleador (Art. 64 LCT).
        </p>
      )}
    </div>
  );
}
