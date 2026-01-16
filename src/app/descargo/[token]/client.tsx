"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Shield } from "lucide-react";
import {
  GatekeeperDescargo,
  SelectorDecision,
  FormularioDescargo,
  ConfirmacionDescargo,
  ExitoDescargo,
} from "@/components/descargo";
import type { DecisionDescargo, DescargoPublico } from "@/lib/types";

interface DescargoClientProps {
  token: string;
}

type Paso = "cargando" | "gatekeeper" | "decision" | "formulario" | "confirmacion" | "exito" | "error" | "expirado" | "ya_confirmado";

export function DescargoClient({ token }: DescargoClientProps) {
  const [paso, setPaso] = useState<Paso>("cargando");
  const [descargo, setDescargo] = useState<DescargoPublico | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [textoDescargo, setTextoDescargo] = useState("");
  const [hashFinal, setHashFinal] = useState("");

  // Cargar datos del descargo
  useEffect(() => {
    const fetchDescargo = async () => {
      try {
        const response = await fetch(`/api/descargo/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Token inválido");
          setPaso("error");
          return;
        }

        setDescargo(data.descargo);

        // Determinar paso inicial según estado
        if (data.descargo.expirado) {
          setPaso("expirado");
        } else if (data.descargo.confirmado) {
          setPaso("ya_confirmado");
        } else if (!data.descargo.identidad_validada) {
          setPaso("gatekeeper");
        } else if (data.descargo.decision === "pendiente") {
          setPaso("decision");
        } else if (data.descargo.decision === "ejercer_descargo") {
          setPaso("formulario");
        } else if (data.descargo.decision === "declinar_descargo") {
          setPaso("confirmacion");
        } else {
          setPaso("error");
        }
      } catch (err) {
        console.error("Error cargando descargo:", err);
        setError("Error de conexión");
        setPaso("error");
      }
    };

    fetchDescargo();
  }, [token]);

  // Manejar validación exitosa
  const handleValidacionExitosa = () => {
    setPaso("decision");
  };

  // Manejar decisión tomada
  const handleDecisionTomada = (decision: DecisionDescargo) => {
    if (decision === "ejercer_descargo") {
      setPaso("formulario");
    } else {
      setPaso("confirmacion");
    }
  };

  // Manejar continuar desde formulario
  const handleContinuarFormulario = (texto: string) => {
    setTextoDescargo(texto);
    setPaso("confirmacion");
  };

  // Manejar volver a editar
  const handleVolverAEditar = () => {
    setPaso("formulario");
  };

  // Manejar confirmación exitosa
  const handleConfirmado = (hash: string) => {
    setHashFinal(hash);
    setPaso("exito");
  };

  // Pantalla de carga
  if (paso === "cargando") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white border-b">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-lg">NotiLegal</span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (paso === "error") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white border-b">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-lg">NotiLegal</span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-red-200">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p className="text-muted-foreground">{error || "No se pudo cargar el descargo"}</p>
              <p className="text-sm text-muted-foreground mt-4">
                Si cree que esto es un error, contacte a su empleador.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pantalla de expirado
  if (paso === "expirado") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white border-b">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-lg">NotiLegal</span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-amber-200 bg-amber-50">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-amber-900 mb-2">Plazo Vencido</h2>
              <p className="text-amber-800">
                El plazo para presentar descargo ha expirado.
              </p>
              <p className="text-sm text-amber-700 mt-4">
                Se registrará que el plazo venció sin que se ejerciera el derecho a descargo.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pantalla de ya confirmado
  if (paso === "ya_confirmado") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white border-b">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-lg">NotiLegal</span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-green-900 mb-2">Descargo Ya Registrado</h2>
              <p className="text-green-800">
                Este descargo ya fue confirmado anteriormente.
              </p>
              <p className="text-sm text-green-700 mt-4">
                No es posible modificar un descargo una vez confirmado.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!descargo) return null;

  // Gatekeeper - Validación de identidad
  if (paso === "gatekeeper") {
    return (
      <GatekeeperDescargo
        token={token}
        empresaNombre={descargo.empresa_nombre}
        empleadoNombre={descargo.empleado_nombre}
        sancionTipo={descargo.sancion_tipo}
        sancionMotivo={descargo.sancion_motivo}
        diasRestantes={descargo.dias_restantes}
        onValidacionExitosa={handleValidacionExitosa}
      />
    );
  }

  // Selector de decisión
  if (paso === "decision") {
    return (
      <SelectorDecision
        token={token}
        empleadoNombre={descargo.empleado_nombre}
        sancionTipo={descargo.sancion_tipo}
        sancionMotivo={descargo.sancion_motivo}
        sancionDescripcion={descargo.sancion_descripcion}
        sancionFechaHecho={descargo.sancion_fecha_hecho}
        diasRestantes={descargo.dias_restantes}
        onDecisionTomada={handleDecisionTomada}
      />
    );
  }

  // Formulario de descargo
  if (paso === "formulario") {
    return (
      <FormularioDescargo
        token={token}
        empleadoNombre={descargo.empleado_nombre}
        sancionMotivo={descargo.sancion_motivo}
        sancionDescripcion={descargo.sancion_descripcion}
        diasRestantes={descargo.dias_restantes}
        textoInicial={textoDescargo}
        onContinuar={handleContinuarFormulario}
      />
    );
  }

  // Confirmación
  if (paso === "confirmacion") {
    return (
      <ConfirmacionDescargo
        token={token}
        decision={textoDescargo ? "ejercer_descargo" : "declinar_descargo"}
        textoDescargo={textoDescargo || undefined}
        empleadoNombre={descargo.empleado_nombre}
        onVolver={textoDescargo ? handleVolverAEditar : undefined}
        onConfirmado={handleConfirmado}
      />
    );
  }

  // Éxito
  if (paso === "exito") {
    return (
      <ExitoDescargo
        decision={textoDescargo ? "ejercer_descargo" : "declinar_descargo"}
        hash={hashFinal}
        empleadoNombre={descargo.empleado_nombre}
      />
    );
  }

  return null;
}
