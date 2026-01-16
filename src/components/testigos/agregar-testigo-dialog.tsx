"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus, AlertCircle } from "lucide-react";
import { validarCUIL, formatearCUIL, limpiarCUIL, validarEmail } from "@/lib/validators";
import {
  type CrearTestigoForm,
  type RelacionTestigo,
  RELACION_TESTIGO_LABELS,
} from "@/lib/types";

interface AgregarTestigoDialogProps {
  onTestigoAgregado: (testigo: CrearTestigoForm) => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

const RELACIONES: RelacionTestigo[] = ["empleado", "supervisor", "cliente", "proveedor", "otro"];

export function AgregarTestigoDialog({
  onTestigoAgregado,
  children,
  disabled = false,
}: AgregarTestigoDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CrearTestigoForm>({
    nombre_completo: "",
    cargo: "",
    cuil: "",
    email: "",
    telefono: "",
    relacion: "empleado",
    presente_en_hecho: true,
  });

  const handleCuilChange = (value: string) => {
    const limpio = limpiarCUIL(value);
    if (limpio.length <= 11) {
      setFormData({ ...formData, cuil: formatearCUIL(limpio) });
    }
  };

  const resetForm = () => {
    setFormData({
      nombre_completo: "",
      cargo: "",
      cuil: "",
      email: "",
      telefono: "",
      relacion: "empleado",
      presente_en_hecho: true,
    });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar nombre
    if (formData.nombre_completo.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }

    // Validar que tenga al menos email o teléfono
    const tieneEmail = formData.email && formData.email.trim().length > 0;
    const tieneTelefono = formData.telefono && formData.telefono.trim().length > 0;

    if (!tieneEmail && !tieneTelefono) {
      setError("Debés ingresar al menos un email o teléfono para poder contactar al testigo");
      return;
    }

    // Validar email si se ingresó
    if (tieneEmail && !validarEmail(formData.email!)) {
      setError("El email no es válido");
      return;
    }

    // Validar CUIL si se ingresó
    if (formData.cuil && formData.cuil.length > 0) {
      const cuilLimpio = limpiarCUIL(formData.cuil);
      if (cuilLimpio.length > 0 && !validarCUIL(cuilLimpio)) {
        setError("El CUIL ingresado no es válido");
        return;
      }
    }

    // Preparar datos limpios
    const testigoLimpio: CrearTestigoForm = {
      nombre_completo: formData.nombre_completo.trim(),
      cargo: formData.cargo?.trim() || undefined,
      cuil: formData.cuil ? limpiarCUIL(formData.cuil) || undefined : undefined,
      email: formData.email?.trim() || undefined,
      telefono: formData.telefono?.trim() || undefined,
      relacion: formData.relacion,
      presente_en_hecho: formData.presente_en_hecho,
    };

    // Notificar al padre
    onTestigoAgregado(testigoLimpio);

    // Cerrar y resetear
    setOpen(false);
    resetForm();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" disabled={disabled}>
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar Testigo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Testigo</DialogTitle>
          <DialogDescription>
            Los testigos recibirán una invitación para confirmar su declaración de forma digital y
            bajo juramento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre completo */}
          <div className="space-y-2">
            <Label htmlFor="nombre_completo">Nombre completo *</Label>
            <Input
              id="nombre_completo"
              type="text"
              placeholder="Juan Pérez"
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              required
            />
          </div>

          {/* Cargo */}
          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo</Label>
            <Input
              id="cargo"
              type="text"
              placeholder="Encargado de turno"
              value={formData.cargo || ""}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
            />
          </div>

          {/* Relación con la empresa */}
          <div className="space-y-2">
            <Label htmlFor="relacion">Relación con la empresa</Label>
            <Select
              value={formData.relacion}
              onValueChange={(value: RelacionTestigo) =>
                setFormData({ ...formData, relacion: value })
              }
            >
              <SelectTrigger id="relacion">
                <SelectValue placeholder="Seleccionar relación" />
              </SelectTrigger>
              <SelectContent>
                {RELACIONES.map((rel) => (
                  <SelectItem key={rel} value={rel}>
                    {RELACION_TESTIGO_LABELS[rel]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-muted-foreground text-xs">(para enviar invitación)</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="testigo@email.com"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono">
              Teléfono{" "}
              <span className="text-muted-foreground text-xs">(para WhatsApp/SMS)</span>
            </Label>
            <Input
              id="telefono"
              type="tel"
              placeholder="+54 9 223 456-7890"
              value={formData.telefono || ""}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            />
          </div>

          {/* CUIL (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="cuil">
              CUIL <span className="text-muted-foreground text-xs">(opcional, para validación)</span>
            </Label>
            <Input
              id="cuil"
              type="text"
              placeholder="20-12345678-9"
              value={formData.cuil || ""}
              onChange={(e) => handleCuilChange(e.target.value)}
              maxLength={13}
            />
          </div>

          {/* Presente en el hecho */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="presente_en_hecho"
              checked={formData.presente_en_hecho}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, presente_en_hecho: checked as boolean })
              }
            />
            <Label htmlFor="presente_en_hecho" className="text-sm font-normal cursor-pointer">
              El testigo estuvo presente en el momento del hecho
            </Label>
          </div>

          {/* Aviso informativo */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">El testigo recibirá:</p>
                <ul className="list-disc list-inside mt-1 text-xs">
                  <li>Un link único para completar su declaración</li>
                  <li>Deberá describir lo que vio/escuchó</li>
                  <li>Firmará bajo declaración jurada</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}

          {/* Botones */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Testigo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
