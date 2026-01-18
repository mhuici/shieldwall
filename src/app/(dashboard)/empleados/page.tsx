export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { AgregarEmpleadoDialog } from "@/components/empleados/agregar-empleado-dialog";
import { formatearCUIL } from "@/lib/validators";
import { TablaEmpleados } from "@/components/empleados/tabla-empleados";

export default async function EmpleadosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: empresa } = await supabase
    .from("empresas")
    .select("id, razon_social")
    .eq("user_id", user!.id)
    .single();

  const { data: empleados } = await supabase
    .from("empleados")
    .select("*, convenio:convenios_domicilio(id, estado, firmado_at)")
    .eq("empresa_id", empresa!.id)
    .eq("activo", true)
    .order("nombre");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Empleados</h1>
          <p className="text-muted-foreground">
            Gestión de empleados de tu empresa
          </p>
        </div>
        <AgregarEmpleadoDialog empresaId={empresa!.id} />
      </div>

      {empleados && empleados.length > 0 ? (
        <TablaEmpleados
          empleados={empleados}
          empresaId={empresa!.id}
          empresaNombre={empresa!.razon_social}
        />
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No hay empleados cargados</h3>
              <p className="text-muted-foreground mb-4">
                Cargá a tus empleados para poder emitir sanciones
              </p>
              <AgregarEmpleadoDialog empresaId={empresa!.id}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Empleado
                </Button>
              </AgregarEmpleadoDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
