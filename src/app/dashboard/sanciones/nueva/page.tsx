export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { NuevaSancionForm } from "@/components/sanciones/nueva-sancion-form";

export default async function NuevaSancionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: empresa } = await supabase
    .from("empresas")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!empresa) redirect("/onboarding");

  const { data: empleados } = await supabase
    .from("empleados")
    .select("id, nombre, cuil")
    .eq("empresa_id", empresa.id)
    .eq("activo", true)
    .order("nombre");

  if (!empleados || empleados.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Nueva Sanción</h1>
          <p className="text-muted-foreground">
            Genera una notificación fehaciente con validez legal
          </p>
        </div>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Primero cargá empleados</h3>
              <p className="text-muted-foreground mb-4">
                Para emitir una sanción necesitás tener al menos un empleado cargado.
              </p>
              <a href="/dashboard/empleados" className="text-blue-600 hover:underline">
                Ir a cargar empleados →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nueva Sanción</h1>
        <p className="text-muted-foreground">
          Genera una notificación fehaciente con validez legal
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Datos de la Sanción
          </CardTitle>
          <CardDescription>
            Completá los datos y se generará un PDF con hash criptográfico y timestamp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NuevaSancionForm
            empresa={empresa}
            empleados={empleados}
          />
        </CardContent>
      </Card>
    </div>
  );
}
