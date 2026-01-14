"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { validarCUIL, formatearCUIL, limpiarCUIL, validarEmail } from "@/lib/validators";

interface AgregarEmpleadoDialogProps {
  empresaId: string;
  children?: React.ReactNode;
}

export function AgregarEmpleadoDialog({ empresaId, children }: AgregarEmpleadoDialogProps) {
  const router = useRouter();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cuil: "",
    nombre: "",
    email: "",
    telefono: "",
  });

  const handleCuilChange = (value: string) => {
    const limpio = limpiarCUIL(value);
    if (limpio.length <= 11) {
      setFormData({ ...formData, cuil: formatearCUIL(limpio) });
    }
  };

  const resetForm = () => {
    setFormData({ cuil: "", nombre: "", email: "", telefono: "" });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    const cuilLimpio = limpiarCUIL(formData.cuil);
    if (!validarCUIL(cuilLimpio)) {
      setError("El CUIL ingresado no es válido");
      return;
    }

    if (formData.nombre.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }

    if (formData.email && !validarEmail(formData.email)) {
      setError("El email no es válido");
      return;
    }

    setLoading(true);

    const { error: insertError } = await supabase.from("empleados").insert({
      empresa_id: empresaId,
      cuil: cuilLimpio,
      nombre: formData.nombre.trim(),
      email: formData.email.trim() || null,
      telefono: formData.telefono.trim() || null,
    });

    setLoading(false);

    if (insertError) {
      if (insertError.code === "23505") {
        setError("Ya existe un empleado con ese CUIL");
      } else {
        setError("Error al crear el empleado. Intentá de nuevo.");
        console.error(insertError);
      }
      return;
    }

    // Cerrar modal y refrescar
    setOpen(false);
    resetForm();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Empleado
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Empleado</DialogTitle>
          <DialogDescription>
            Completá los datos del empleado para poder enviarle notificaciones.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cuil">CUIL *</Label>
            <Input
              id="cuil"
              type="text"
              placeholder="20-12345678-9"
              value={formData.cuil}
              onChange={(e) => handleCuilChange(e.target.value)}
              required
              disabled={loading}
              maxLength={13}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo *</Label>
            <Input
              id="nombre"
              type="text"
              placeholder="Juan Pérez"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="juan@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              type="tel"
              placeholder="+54 9 223 456-7890"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              disabled={loading}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
