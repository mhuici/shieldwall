export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener empresa del usuario
  const { data: empresa } = await supabase
    .from("empresas")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Si no tiene empresa, redirigir a onboarding
  if (!empresa) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar empresa={empresa} userEmail={user.email || ""} />
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
