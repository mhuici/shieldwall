"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Building2 } from "lucide-react";
import { validarCUIL, formatearCUIL, limpiarCUIL } from "@/lib/validators";
import { RUBROS } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cuit: "",
    razon_social: "",
    rubro: "otro" as const,
  });

  const handleCuitChange = (value: string) => {
    // Formatear mientras escribe
    const limpio = limpiarCUIL(value);
    if (limpio.length <= 11) {
      setFormData({ ...formData, cuit: formatearCUIL(limpio) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar CUIT
    const cuitLimpio = limpiarCUIL(formData.cuit);
    if (!validarCUIL(cuitLimpio)) {
      setError("El CUIT ingresado no es válido");
      return;
    }

    if (formData.razon_social.length < 3) {
      setError("La razón social debe tener al menos 3 caracteres");
      return;
    }

    setLoading(true);

    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Sesión expirada. Por favor, volvé a ingresar.");
      setLoading(false);
      return;
    }

    // Crear empresa
    const { error: insertError } = await supabase.from("empresas").insert({
      user_id: user.id,
      cuit: cuitLimpio,
      razon_social: formData.razon_social.trim(),
      rubro: formData.rubro,
    });

    setLoading(false);

    if (insertError) {
      if (insertError.code === "23505") {
        setError("Ya existe una empresa con ese CUIT");
      } else {
        setError("Error al crear la empresa. Intentá de nuevo.");
        console.error(insertError);
      }
      return;
    }

    // Redirigir al dashboard
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Configurá tu empresa</CardTitle>
          <CardDescription>
            Completá los datos de tu empresa para empezar a usar NotiLegal
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT</Label>
              <Input
                id="cuit"
                type="text"
                placeholder="30-12345678-9"
                value={formData.cuit}
                onChange={(e) => handleCuitChange(e.target.value)}
                required
                disabled={loading}
                maxLength={13}
              />
              <p className="text-xs text-muted-foreground">
                Formato: XX-XXXXXXXX-X
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="razon_social">Razón Social</Label>
              <Input
                id="razon_social"
                type="text"
                placeholder="Mi Empresa S.R.L."
                value={formData.razon_social}
                onChange={(e) =>
                  setFormData({ ...formData, razon_social: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rubro">Rubro</Label>
              <Select
                value={formData.rubro}
                onValueChange={(value) =>
                  setFormData({ ...formData, rubro: value as typeof formData.rubro })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná un rubro" />
                </SelectTrigger>
                <SelectContent>
                  {RUBROS.map((rubro) => (
                    <SelectItem key={rubro.value} value={rubro.value}>
                      {rubro.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Esto personaliza los templates de sanciones
              </p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Empresa"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
