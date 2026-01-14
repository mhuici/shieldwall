export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, AlertTriangle, CheckCircle, Plus } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Obtener empresa
  const { data: empresa } = await supabase
    .from("empresas")
    .select("id")
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
      .select("id, estado", { count: "exact" })
      .eq("empresa_id", empresa.id),
  ]);

  const totalEmpleados = empleadosRes.count || 0;
  const notificaciones = notificacionesRes.data || [];
  const totalNotificaciones = notificacionesRes.count || 0;

  const enviadas = notificaciones.filter((n) => n.estado === "enviado").length;
  const leidas = notificaciones.filter((n) => n.estado === "leido").length;
  const firmes = notificaciones.filter((n) => n.estado === "firme").length;

  // Obtener últimas notificaciones
  const { data: ultimasNotificaciones } = await supabase
    .from("notificaciones")
    .select(`
      id,
      tipo,
      estado,
      created_at,
      empleado:empleados(nombre)
    `)
    .eq("empresa_id", empresa.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "enviado":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Enviado</Badge>;
      case "leido":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Leído</Badge>;
      case "firme":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Firme</Badge>;
      case "vencido":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Vencido</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de tu actividad en NotiLegal
          </p>
        </div>
        <Link href="/sanciones/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Sanción
          </Button>
        </Link>
      </div>

      {/* Stats */}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enviadas + leidas}</div>
            <p className="text-xs text-muted-foreground">
              Esperando vencimiento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Firmes
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{firmes}</div>
            <p className="text-xs text-muted-foreground">
              Prueba plena
            </p>
          </CardContent>
        </Card>
      </div>

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
                  const empleado = notif.empleado as unknown as { nombre: string } | null;
                  return (
                    <div
                      key={notif.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {empleado?.nombre || "Sin nombre"}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {notif.tipo}
                        </p>
                      </div>
                      {getEstadoBadge(notif.estado)}
                    </div>
                  );
                })}
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

      {/* Alerta informativa */}
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
                  Para poder emitir sanciones, primero necesitás cargar a tus empleados
                  con su CUIL, email y teléfono.
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
