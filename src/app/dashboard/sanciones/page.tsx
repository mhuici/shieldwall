export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Filter } from "lucide-react";
import Link from "next/link";
import { SemaforoBadge } from "@/components/notificaciones/semaforo-notificacion";
import { calcularEstadoSemaforo } from "@/lib/notifications/semaforo";
import { TIPO_SANCION_LABELS, type TipoSancion } from "@/lib/types";

export default async function SancionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: empresa } = await supabase
    .from("empresas")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const { data: notificaciones } = await supabase
    .from("notificaciones")
    .select(
      `
      *,
      empleado:empleados(nombre, cuil)
    `
    )
    .eq("empresa_id", empresa!.id)
    .order("created_at", { ascending: false });

  // Calcular estado semáforo para cada notificación
  const notificacionesConSemaforo = (notificaciones || []).map((n) => ({
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Calcular días restantes o días desde firmeza
  const getDiasInfo = (notif: (typeof notificacionesConSemaforo)[0]) => {
    if (notif.estadoSemaforo === "firme") {
      return { tipo: "firme", texto: "Prueba plena" };
    }
    if (notif.fecha_vencimiento) {
      const dias = Math.ceil(
        (new Date(notif.fecha_vencimiento).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      if (dias < 0) {
        return { tipo: "vencido", texto: `Venció hace ${Math.abs(dias)} días` };
      }
      if (dias === 0) {
        return { tipo: "hoy", texto: "Vence hoy" };
      }
      if (dias <= 5) {
        return { tipo: "urgente", texto: `${dias} días` };
      }
      return { tipo: "normal", texto: `${dias} días` };
    }
    return { tipo: "sin-fecha", texto: "-" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sanciones</h1>
          <p className="text-muted-foreground">
            Historial de notificaciones emitidas
          </p>
        </div>
        <Link href="/dashboard/sanciones/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Sanción
          </Button>
        </Link>
      </div>

      {notificacionesConSemaforo && notificacionesConSemaforo.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="text-left p-4 font-medium">Empleado</th>
                    <th className="text-left p-4 font-medium">Tipo</th>
                    <th className="text-left p-4 font-medium hidden sm:table-cell">
                      Fecha
                    </th>
                    <th className="text-left p-4 font-medium">Estado</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">
                      Plazo
                    </th>
                    <th className="text-right p-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {notificacionesConSemaforo.map((notif) => {
                    const empleado = notif.empleado as unknown as {
                      nombre: string;
                      cuil: string;
                    } | null;
                    const diasInfo = getDiasInfo(notif);

                    return (
                      <tr
                        key={notif.id}
                        className="border-b last:border-0 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-medium">
                              {empleado?.nombre || "Sin nombre"}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {empleado?.cuil || "-"}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">
                            {TIPO_SANCION_LABELS[notif.tipo as TipoSancion] ||
                              notif.tipo}
                          </span>
                        </td>
                        <td className="p-4 hidden sm:table-cell text-sm text-muted-foreground">
                          {formatDate(notif.created_at)}
                        </td>
                        <td className="p-4">
                          <SemaforoBadge estado={notif.estadoSemaforo} />
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span
                            className={`text-sm ${
                              diasInfo.tipo === "urgente"
                                ? "text-amber-600 font-medium"
                                : diasInfo.tipo === "firme"
                                  ? "text-emerald-600 font-medium"
                                  : diasInfo.tipo === "vencido"
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                            }`}
                          >
                            {diasInfo.texto}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/sanciones/${notif.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No hay sanciones</h3>
              <p className="text-muted-foreground mb-4">
                Cuando emitas una sanción, aparecerá acá
              </p>
              <Link href="/dashboard/sanciones/nueva">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Sanción
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
