"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileSignature,
  Clock,
  CheckCircle,
  Send,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { formatearCUIL } from "@/lib/validators";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Convenio {
  id: string;
  estado: string;
  firmado_at: string | null;
}

interface Empleado {
  id: string;
  nombre: string;
  cuil: string;
  email?: string;
  telefono?: string;
  convenio_firmado?: boolean;
  convenio_id?: string;
  convenio?: Convenio | Convenio[];
}

interface TablaEmpleadosProps {
  empleados: Empleado[];
  empresaId: string;
  empresaNombre: string;
}

export function TablaEmpleados({
  empleados,
  empresaId,
  empresaNombre,
}: TablaEmpleadosProps) {
  const [enviando, setEnviando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const getConvenioData = (empleado: Empleado): Convenio | null => {
    if (!empleado.convenio) return null;
    if (Array.isArray(empleado.convenio)) {
      return empleado.convenio[0] || null;
    }
    return empleado.convenio;
  };

  const getEstadoConvenio = (empleado: Empleado) => {
    const convenio = getConvenioData(empleado);

    if (empleado.convenio_firmado) {
      return {
        estado: "firmado",
        label: "Convenio Firmado",
        variant: "default" as const,
        icon: CheckCircle,
        color: "text-green-600",
      };
    }

    if (convenio) {
      if (convenio.estado === "pendiente") {
        return {
          estado: "pendiente",
          label: "Pendiente Firma",
          variant: "secondary" as const,
          icon: Clock,
          color: "text-amber-600",
        };
      }
      if (convenio.estado === "expirado") {
        return {
          estado: "expirado",
          label: "Expirado",
          variant: "destructive" as const,
          icon: AlertTriangle,
          color: "text-red-600",
        };
      }
    }

    return {
      estado: "sin_convenio",
      label: "Sin Convenio",
      variant: "outline" as const,
      icon: FileSignature,
      color: "text-gray-400",
    };
  };

  const handleCrearConvenio = async (empleadoId: string) => {
    setEnviando(empleadoId);
    setError(null);
    setExito(null);

    try {
      const response = await fetch("/api/convenio/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empleado_id: empleadoId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al crear convenio");
        return;
      }

      setExito(empleadoId);
      // Recargar la página para ver el nuevo estado
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setEnviando(null);
    }
  };

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="p-0">
          {error && (
            <div className="bg-red-50 border-b border-red-100 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="text-left p-4 font-medium">Nombre</th>
                <th className="text-left p-4 font-medium">CUIL</th>
                <th className="text-left p-4 font-medium hidden sm:table-cell">
                  Email
                </th>
                <th className="text-left p-4 font-medium hidden md:table-cell">
                  Teléfono
                </th>
                <th className="text-left p-4 font-medium">Convenio</th>
                <th className="text-right p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map((empleado) => {
                const estadoConvenio = getEstadoConvenio(empleado);
                const IconoEstado = estadoConvenio.icon;
                const estaEnviando = enviando === empleado.id;
                const tieneExito = exito === empleado.id;

                return (
                  <tr key={empleado.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{empleado.nombre}</td>
                    <td className="p-4 font-mono text-sm">
                      {formatearCUIL(empleado.cuil)}
                    </td>
                    <td className="p-4 hidden sm:table-cell text-muted-foreground">
                      {empleado.email || "-"}
                    </td>
                    <td className="p-4 hidden md:table-cell text-muted-foreground">
                      {empleado.telefono || "-"}
                    </td>
                    <td className="p-4">
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            variant={estadoConvenio.variant}
                            className="gap-1"
                          >
                            <IconoEstado
                              className={`h-3 w-3 ${estadoConvenio.color}`}
                            />
                            <span className="hidden lg:inline">
                              {estadoConvenio.label}
                            </span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{estadoConvenio.label}</p>
                          {estadoConvenio.estado === "firmado" && (
                            <p className="text-xs text-muted-foreground">
                              Puede recibir notificaciones electrónicas
                            </p>
                          )}
                          {estadoConvenio.estado === "sin_convenio" && (
                            <p className="text-xs text-muted-foreground">
                              Debe firmar convenio para notificaciones
                              electrónicas
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="p-4 text-right">
                      {estadoConvenio.estado === "sin_convenio" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={estaEnviando}
                            >
                              {estaEnviando ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">
                                    Enviar Convenio
                                  </span>
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Enviar Convenio de Domicilio Electrónico
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Se enviará un email a{" "}
                                <strong>
                                  {empleado.email || "la dirección registrada"}
                                </strong>{" "}
                                para que <strong>{empleado.nombre}</strong>{" "}
                                firme el Convenio de Domicilio Electrónico.
                                <br />
                                <br />
                                Este convenio es requisito legal para enviar
                                notificaciones laborales electrónicas conforme a
                                la Acordada N° 31/2011 CSJN.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCrearConvenio(empleado.id)}
                              >
                                Enviar Convenio
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {estadoConvenio.estado === "pendiente" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCrearConvenio(empleado.id)}
                              disabled={estaEnviando}
                            >
                              {estaEnviando ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">
                                    Reenviar
                                  </span>
                                </>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Reenviar invitación de convenio
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {estadoConvenio.estado === "expirado" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCrearConvenio(empleado.id)}
                          disabled={estaEnviando}
                        >
                          {estaEnviando ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">
                                Nuevo Convenio
                              </span>
                            </>
                          )}
                        </Button>
                      )}

                      {estadoConvenio.estado === "firmado" && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-200"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Listo
                        </Badge>
                      )}

                      {tieneExito && (
                        <span className="text-sm text-green-600 ml-2">
                          Enviado!
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
