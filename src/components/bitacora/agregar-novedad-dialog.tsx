"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  type TipoNovedad,
  type CategoriaNovedad,
  type ActitudEmpleado,
  TIPO_NOVEDAD_LABELS,
  CATEGORIA_NOVEDAD_LABELS,
  ACTITUD_EMPLEADO_LABELS,
} from "@/lib/types";

interface EmpleadoSimple {
  id: string;
  nombre: string;
  cuil: string;
}

interface AgregarNovedadDialogProps {
  empleados: EmpleadoSimple[];
  empleadoPreseleccionado?: string;
  onNovedadCreada?: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

const TIPOS_NOVEDAD: TipoNovedad[] = [
  "recordatorio_verbal",
  "conversacion_informal",
  "permiso_concedido",
  "felicitacion",
  "capacitacion",
  "incidente_menor",
  "ajuste_horario",
  "comunicacion_general",
  "otro",
];

const CATEGORIAS: CategoriaNovedad[] = [
  "puntualidad",
  "seguridad",
  "conducta",
  "rendimiento",
  "comunicacion",
  "normativa_interna",
  "otro",
];

const ACTITUDES: ActitudEmpleado[] = ["colaborativa", "neutral", "reticente", "no_aplica"];

export function AgregarNovedadDialog({
  empleados,
  empleadoPreseleccionado,
  onNovedadCreada,
  children,
  disabled = false,
}: AgregarNovedadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    empleado_id: empleadoPreseleccionado || "",
    tipo: "recordatorio_verbal" as TipoNovedad,
    categoria: "" as CategoriaNovedad | "",
    titulo: "",
    descripcion: "",
    fecha_hecho: new Date().toISOString().split("T")[0],
    hora_hecho: "",
    lugar: "",
    testigos_presentes: "",
    empleado_respuesta: "",
    empleado_actitud: "no_aplica" as ActitudEmpleado,
  });

  const resetForm = () => {
    setFormData({
      empleado_id: empleadoPreseleccionado || "",
      tipo: "recordatorio_verbal",
      categoria: "",
      titulo: "",
      descripcion: "",
      fecha_hecho: new Date().toISOString().split("T")[0],
      hora_hecho: "",
      lugar: "",
      testigos_presentes: "",
      empleado_respuesta: "",
      empleado_actitud: "no_aplica",
    });
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validaciones
      if (!formData.empleado_id) {
        setError("Seleccioná un empleado");
        setLoading(false);
        return;
      }

      if (formData.titulo.trim().length < 5) {
        setError("El título debe tener al menos 5 caracteres");
        setLoading(false);
        return;
      }

      if (formData.descripcion.trim().length < 10) {
        setError("La descripción debe tener al menos 10 caracteres");
        setLoading(false);
        return;
      }

      // Preparar testigos como array
      const testigosArray = formData.testigos_presentes
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Enviar al servidor
      const response = await fetch("/api/bitacora", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empleado_id: formData.empleado_id,
          tipo: formData.tipo,
          categoria: formData.categoria || undefined,
          titulo: formData.titulo.trim(),
          descripcion: formData.descripcion.trim(),
          fecha_hecho: formData.fecha_hecho,
          hora_hecho: formData.hora_hecho || undefined,
          lugar: formData.lugar.trim() || undefined,
          testigos_presentes: testigosArray.length > 0 ? testigosArray : undefined,
          empleado_respuesta: formData.empleado_respuesta.trim() || undefined,
          empleado_actitud: formData.empleado_actitud,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al crear la novedad");
        setLoading(false);
        return;
      }

      // Éxito
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        resetForm();
        onNovedadCreada?.();
      }, 1500);
    } catch (err) {
      console.error("Error:", err);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
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
            <Plus className="h-4 w-4 mr-2" />
            Nueva Novedad
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Novedad</DialogTitle>
          <DialogDescription>
            Documentá hechos NO sancionatorios para demostrar gestión progresiva (Art. 64 LCT).
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-green-700">Novedad registrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              El registro quedó guardado con hash de integridad
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Empleado */}
            <div className="space-y-2">
              <Label htmlFor="empleado">Empleado *</Label>
              <Select
                value={formData.empleado_id}
                onValueChange={(value) => setFormData({ ...formData, empleado_id: value })}
                disabled={!!empleadoPreseleccionado}
              >
                <SelectTrigger id="empleado">
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de novedad */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de novedad *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: TipoNovedad) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_NOVEDAD.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {TIPO_NOVEDAD_LABELS[tipo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label htmlFor="categoria">
                Categoría <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Select
                value={formData.categoria}
                onValueChange={(value: CategoriaNovedad) =>
                  setFormData({ ...formData, categoria: value })
                }
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORIA_NOVEDAD_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                type="text"
                placeholder="Ej: Se le recordó uso de EPP"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción detallada *</Label>
              <Textarea
                id="descripcion"
                placeholder="Describí el hecho de forma objetiva..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                required
              />
            </div>

            {/* Fecha y hora */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_hecho">Fecha del hecho *</Label>
                <Input
                  id="fecha_hecho"
                  type="date"
                  value={formData.fecha_hecho}
                  onChange={(e) => setFormData({ ...formData, fecha_hecho: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora_hecho">Hora (aprox)</Label>
                <Input
                  id="hora_hecho"
                  type="time"
                  value={formData.hora_hecho}
                  onChange={(e) => setFormData({ ...formData, hora_hecho: e.target.value })}
                />
              </div>
            </div>

            {/* Lugar */}
            <div className="space-y-2">
              <Label htmlFor="lugar">Lugar</Label>
              <Input
                id="lugar"
                type="text"
                placeholder="Ej: Oficina principal, Depósito"
                value={formData.lugar}
                onChange={(e) => setFormData({ ...formData, lugar: e.target.value })}
              />
            </div>

            {/* Testigos presentes */}
            <div className="space-y-2">
              <Label htmlFor="testigos">
                Testigos presentes{" "}
                <span className="text-muted-foreground text-xs">(separados por coma)</span>
              </Label>
              <Input
                id="testigos"
                type="text"
                placeholder="Juan Pérez, María García"
                value={formData.testigos_presentes}
                onChange={(e) => setFormData({ ...formData, testigos_presentes: e.target.value })}
              />
            </div>

            {/* Actitud del empleado */}
            <div className="space-y-2">
              <Label htmlFor="actitud">Actitud del empleado</Label>
              <Select
                value={formData.empleado_actitud}
                onValueChange={(value: ActitudEmpleado) =>
                  setFormData({ ...formData, empleado_actitud: value })
                }
              >
                <SelectTrigger id="actitud">
                  <SelectValue placeholder="Seleccionar actitud" />
                </SelectTrigger>
                <SelectContent>
                  {ACTITUDES.map((act) => (
                    <SelectItem key={act} value={act}>
                      {ACTITUD_EMPLEADO_LABELS[act]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Respuesta del empleado */}
            <div className="space-y-2">
              <Label htmlFor="respuesta">
                Respuesta del empleado{" "}
                <span className="text-muted-foreground text-xs">(si la hubo)</span>
              </Label>
              <Textarea
                id="respuesta"
                placeholder="¿Qué dijo el empleado?"
                value={formData.empleado_respuesta}
                onChange={(e) => setFormData({ ...formData, empleado_respuesta: e.target.value })}
                rows={2}
              />
            </div>

            {/* Aviso informativo */}
            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Valor probatorio:</p>
                  <ul className="list-disc list-inside mt-1 text-xs">
                    <li>Se genera hash SHA-256 para garantizar integridad</li>
                    <li>Se registra timestamp, IP y usuario</li>
                    <li>Demuestra "dirección y organización" (Art. 64 LCT)</li>
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
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Novedad
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
