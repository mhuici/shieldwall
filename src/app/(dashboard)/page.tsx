export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Shield, Plus, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  SemaforoBadge,
  AlertaUrgencia,
} from "@/components/notificaciones/semaforo-notificacion";
import {
  calcularEstadoSemaforo,
  type EstadoSemaforo,
} from "@/lib/notifications/semaforo";
import { TIPO_SANCION_LABELS } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Obtener empresa
  const { data: empresa } = await supabase
    .from("empresas")
    .select("id, razon_social")
    .eq("user_id", user!.id)
    .single();

  if (!empresa) {
    return null;
  }

  // Obtener estadísticas
  const [empleadosRes, notificacionesRes] = await Promise.all([
    supabase
      .from("empleados")
      .select("id", { count: "exact" })
      .eq("empresa_id", empresa.id)
      .eq("activo", true),
    supabase
      .from("notificaciones")
      .select(
        `
        id,
        tipo,
        estado,
        email_enviado_at,
        identidad_validada_at,
        link_abierto_at,
        lectura_confirmada_at,
        fecha_vencimiento,
        created_at,
        empleado:empleados(nombre, cuil)
      `
      )
      .eq("empresa_id", empresa.id)
      .order("created_at", { ascending: false }),
  ]);

  const totalEmpleados = empleadosRes.count || 0;
  const notificaciones = notificacionesRes.data || [];
  const totalNotificaciones = notificaciones.length;

  // Calcular estado semáforo para cada notificación
  const notificacionesConSemaforo = notificaciones.map((n) => ({
    ...n,
    estadoSemaforo: calcularEstadoSemaforo({
      estado: n.estado,
      email_enviado_at: n.email_enviado_at,
      identidad_validada_at: n.identidad_validada_at,
      link_abierto_at: n.link_abierto_at,
      lectura_confirmada_at: n.lectura_confirmada_at,
      fecha_vencimiento: n.fecha_vencimiento,
    }),
  }));

  // Contar por estado del semáforo
  const conteosPorEstado = notificacionesConSemaforo.reduce(
    (acc, n) => {
      acc[n.estadoSemaforo] = (acc[n.estadoSemaforo] || 0) + 1;
      return acc;
    },
    {} as Record<EstadoSemaforo, number>
  );

  // Sanciones que requieren atención (alerta + pendiente_fisico)
  const requierenAtencion = notificacionesConSemaforo.filter(
    (n) =>
      n.estadoSemaforo === "alerta" || n.estadoSemaforo === "pendiente_fisico"
  );

  // Sanciones por vencer (menos de 5 días)
  const porVencer = notificacionesConSemaforo.filter(
    (n) => n.estadoSemaforo === "por_vencer"
  );

  // Estadísticas simplificadas
  const firmes = conteosPorEstado.firme || 0;
  const enProceso =
    (conteosPorEstado.enviado || 0) +
    (conteosPorEstado.validado || 0) +
    (conteosPorEstado.leido || 0);
  const pendientes = conteosPorEstado.pendiente || 0;

  // Últimas 5 notificaciones
  const ultimasNotificaciones = notificacionesConSemaforo.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-muted-foreground">{empresa.razon_social}</p>
        </div>
        <Link href="/sanciones/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Sanción
          </Button>
        </Link>
      </div>

      {/* Alerta de urgencia si hay sanciones que requieren atención */}
      <AlertaUrgencia cantidad={requierenAtencion.length} />

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Empleados
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmpleados}</div>
            <p className="text-xs text-muted-foreground">activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sanciones
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotificaciones}</div>
            <p className="text-xs text-muted-foreground">totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Proceso
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enProceso}</div>
            <p className="text-xs text-muted-foreground">esperando 30 días</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">
              Firmes
            </CardTitle>
            <Shield className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{firmes}</div>
            <p className="text-xs text-emerald-600">prueba plena</p>
          </CardContent>
        </Card>
      </div>

      {/* Sanciones que requieren atención */}
      {requierenAtencion.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-700 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Requieren Atención Inmediata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requierenAtencion.slice(0, 3).map((notif) => {
                const empleado = notif.empleado as unknown as {
                  nombre: string;
                  cuil: string;
                } | null;
                return (
                  <div
                    key={notif.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <SemaforoBadge estado={notif.estadoSemaforo} />
                      <div>
                        <p className="font-medium text-sm">
                          {empleado?.nombre || "Sin nombre"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {TIPO_SANCION_LABELS[
                            notif.tipo as keyof typeof TIPO_SANCION_LABELS
                          ] || notif.tipo}
                        </p>
                      </div>
                    </div>
                    <Link href={`/sanciones/${notif.id}`}>
                      <Button variant="outline" size="sm">
                        Ver <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
              {requierenAtencion.length > 3 && (
                <Link href="/sanciones" className="block">
                  <Button variant="ghost" size="sm" className="w-full">
                    Ver todas ({requierenAtencion.length})
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Por vencer */}
      {porVencer.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-amber-700">
              Por Vencer (menos de 5 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {porVencer.slice(0, 3).map((notif) => {
                const empleado = notif.empleado as unknown as {
                  nombre: string;
                } | null;
                const diasRestantes = notif.fecha_vencimiento
                  ? Math.ceil(
                      (new Date(notif.fecha_vencimiento).getTime() -
                        Date.now()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0;
                return (
                  <div
                    key={notif.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <SemaforoBadge estado={notif.estadoSemaforo} />
                      <div>
                        <p className="font-medium text-sm">
                          {empleado?.nombre || "Sin nombre"}
                        </p>
                        <p className="text-xs text-amber-600">
                          {diasRestantes === 1
                            ? "Vence mañana"
                            : `Vence en ${diasRestantes} días`}
                        </p>
                      </div>
                    </div>
                    <Link href={`/sanciones/${notif.id}`}>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions + Recent */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Últimas notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimas Sanciones</CardTitle>
          </CardHeader>
          <CardContent>
            {ultimasNotificaciones && ultimasNotificaciones.length > 0 ? (
              <div className="space-y-3">
                {ultimasNotificaciones.map((notif) => {
                  const empleado = notif.empleado as unknown as {
                    nombre: string;
                  } | null;
                  return (
                    <Link
                      key={notif.id}
                      href={`/sanciones/${notif.id}`}
                      className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {empleado?.nombre || "Sin nombre"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {TIPO_SANCION_LABELS[
                            notif.tipo as keyof typeof TIPO_SANCION_LABELS
                          ] || notif.tipo}
                        </p>
                      </div>
                      <SemaforoBadge estado={notif.estadoSemaforo} />
                    </Link>
                  );
                })}
                <Link href="/sanciones" className="block pt-2">
                  <Button variant="ghost" size="sm" className="w-full">
                    Ver todas las sanciones
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay sanciones todavía</p>
                <Link href="/sanciones/nueva">
                  <Button variant="link" size="sm">
                    Crear la primera
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/sanciones/nueva" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Sanción
              </Button>
            </Link>
            <Link href="/empleados" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Gestionar Empleados
              </Button>
            </Link>
            <Link href="/sanciones" className="block">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Ver Todas las Sanciones
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Alerta informativa para nuevos usuarios */}
      {totalEmpleados === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-100 p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  Empezá cargando tus empleados
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Para poder emitir sanciones, primero necesitás cargar a tus
                  empleados con su CUIL, email y teléfono.
                </p>
                <Link href="/empleados">
                  <Button size="sm" className="mt-3">
                    Cargar Empleados
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
