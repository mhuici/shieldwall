export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, Info, Shield } from "lucide-react";
import { ListaBitacora } from "@/components/bitacora";

export default async function BitacoraPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: empresa } = await supabase
    .from("empresas")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const { data: empleados } = await supabase
    .from("empleados")
    .select("id, nombre, cuil")
    .eq("empresa_id", empresa!.id)
    .eq("activo", true)
    .order("nombre");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Bitácora de Novedades
        </h1>
        <p className="text-muted-foreground mt-1">
          Registro de hechos NO sancionatorios para demostrar gestión progresiva
        </p>
      </div>

      {/* Info banner */}
      <Alert className="bg-blue-50 border-blue-200">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Valor probatorio (Art. 64 LCT):</strong> La bitácora documenta el ejercicio
          de las facultades de "dirección y organización" del empleador. Este historial
          descarta acusaciones de "mobbing" al demostrar gestión progresiva y razonable.
        </AlertDescription>
      </Alert>

      {/* Tips */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-green-800 flex items-center gap-2">
            <Info className="h-4 w-4" />
            ¿Qué registrar?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-green-700 space-y-1">
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Recordatorios verbales:</strong> "Se le recordó uso de EPP", "Se habló
              sobre puntualidad"
            </li>
            <li>
              <strong>Permisos concedidos:</strong> "Se autorizó salida anticipada", "Se
              concedió permiso médico"
            </li>
            <li>
              <strong>Felicitaciones:</strong> "Se reconoció buen desempeño en proyecto X"
            </li>
            <li>
              <strong>Capacitaciones:</strong> "Participó en charla de seguridad e higiene"
            </li>
            <li>
              <strong>Incidentes menores:</strong> "Llegó 5 min tarde, primera vez en el
              mes"
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Lista principal */}
      <Card>
        <CardContent className="pt-6">
          <ListaBitacora empleados={empleados || []} />
        </CardContent>
      </Card>
    </div>
  );
}
