import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Verificar si el usuario tiene empresa
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: empresa } = await supabase
          .from("empresas")
          .select("id")
          .eq("user_id", user.id)
          .single();

        // Si no tiene empresa, redirigir a onboarding
        if (!empresa) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Si hay error, redirigir a login con mensaje de error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
