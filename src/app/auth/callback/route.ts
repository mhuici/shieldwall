import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();
  let authError = null;

  // Handle PKCE flow (code exchange)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  }
  // Handle Magic Link / OTP flow (token_hash)
  else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "sms" | "magiclink",
    });
    authError = error;
  }

  if (!authError && (code || token_hash)) {
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

  // Si hay error, redirigir a login con mensaje de error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
