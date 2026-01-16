"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Scale,
  Clock,
  FileText,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Save,
  Loader2,
} from "lucide-react";
import type { DescargoResumen, DecisionDescargo } from "@/lib/types";
import { DECISION_DESCARGO_LABELS, DECISION_DESCARGO_COLORES } from "@/lib/types";

interface SeccionDescargoEmpleadorProps {
  notificacionId: string;
}

export function SeccionDescargoEmpleador({ notificacionId }: SeccionDescargoEmpleadorProps) {
  const [loading, setLoading] = useState(true);
  const [descargo, setDescargo] = useState<DescargoResumen | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Estados de análisis
  const [contieneAdmision, setContieneAdmision] = useState(false);
  const [contieneContradiccion, setContieneContradiccion] = useState(false);
  const [notasEmpleador, setNotasEmpleador] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const fetchDescargo = async () => {
      try {
        // Usar la función RPC de PostgreSQL
        const response = await fetch(`/api/descargo/resumen/${notificacionId}`);
        if (response.ok) {
          const data = await response.json();
          setDescargo(data.descargo);
          if (data.descargo?.contiene_admision) setContieneAdmision(true);
          if (data.descargo?.contiene_contradiccion) setContieneContradiccion(true);
          if (data.descargo?.notas_empleador) setNotasEmpleador(data.descargo.notas_empleador);
        }
      } catch (err) {
        console.error("Error fetching descargo:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDescargo();
  }, [notificacionId]);

  const handleCopiarHash = async () => {
    if (!descargo?.hash_sha256) return;
    try {
      await navigator.clipboard.writeText(descargo.hash_sha256);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error("Error copiando:", err);
    }
  };

  const handleGuardarAnalisis = async () => {
    if (!descargo?.id) return;
    setGuardando(true);
    try {
      await fetch(`/api/descargo/resumen/${notificacionId}/analisis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contiene_admision: contieneAdmision,
          contiene_contradiccion: contieneContradiccion,
          notas_empleador: notasEmpleador,
        }),
      });
    } catch (err) {
      console.error("Error guardando análisis:", err);
    } finally {
      setGuardando(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!descargo || !descargo.existe) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5" />
            Audiencia de Descargo
          </CardTitle>
          <CardDescription>
            El descargo se crea automáticamente cuando el empleado confirma lectura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>El empleado aún no ha confirmado lectura de la sanción.</p>
            <p className="text-sm mt-1">
              Una vez confirmada, se generará automáticamente la audiencia de descargo.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const decision = descargo.decision as DecisionDescargo;
  const colores = DECISION_DESCARGO_COLORES[decision];
  const esConfirmado = !!descargo.confirmado_at;
  const tieneTexto = !!descargo.texto_descargo;

  return (
    <Card className={esConfirmado ? colores.border : "border-yellow-200"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5" />
            Audiencia de Descargo
          </CardTitle>
          <Badge className={`${colores.bg} ${colores.text}`}>
            {DECISION_DESCARGO_LABELS[decision]}
          </Badge>
        </div>
        <CardDescription>
          {esConfirmado
            ? `Confirmado el ${formatDate(descargo.confirmado_at!)}`
            : descargo.dias_restantes !== undefined
            ? `${descargo.dias_restantes} días restantes para presentar descargo`
            : "Pendiente de decisión"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estado pendiente */}
        {decision === "pendiente" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Esperando decisión del empleado</p>
                <p className="text-sm text-yellow-700 mt-1">
                  El empleado tiene {descargo.dias_restantes} días para decidir si presenta
                  descargo o declina el derecho.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Estado vencido */}
        {decision === "vencido" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Plazo vencido sin respuesta</p>
                <p className="text-sm text-red-700 mt-1">
                  El empleado no ejerció su derecho a descargo dentro del plazo.
                  Esto queda registrado como prueba de que se le dio la oportunidad.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Declinó descargo */}
        {decision === "declinar_descargo" && esConfirmado && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">El empleado declinó presentar descargo</p>
                <p className="text-sm text-gray-700 mt-1">
                  Queda constancia de que se le ofreció el derecho a defensa y
                  voluntariamente decidió no ejercerlo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Texto del descargo */}
        {decision === "ejercer_descargo" && tieneTexto && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-blue-800 mb-2">Descargo presentado por el empleado:</p>
                  <div className="bg-white rounded-lg p-3 border border-blue-100 max-h-64 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-sm">{descargo.texto_descargo}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Análisis del empleador */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Análisis del Descargo
              </h4>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="admision"
                    checked={contieneAdmision}
                    onCheckedChange={(checked) => setContieneAdmision(checked === true)}
                  />
                  <label htmlFor="admision" className="text-sm cursor-pointer">
                    Contiene admisión del hecho
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="contradiccion"
                    checked={contieneContradiccion}
                    onCheckedChange={(checked) => setContieneContradiccion(checked === true)}
                  />
                  <label htmlFor="contradiccion" className="text-sm cursor-pointer">
                    Contiene contradicciones
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Notas internas (no visible para el empleado)</label>
                <Textarea
                  placeholder="Ej: En línea 3 admite haber llegado tarde. Contradice la versión del testigo X."
                  value={notasEmpleador}
                  onChange={(e) => setNotasEmpleador(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGuardarAnalisis}
                disabled={guardando}
              >
                {guardando ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Análisis
              </Button>
            </div>
          </div>
        )}

        {/* Hash de integridad */}
        {esConfirmado && descargo.hash_sha256 && (
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Hash de Integridad</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopiarHash}
                className="h-7"
              >
                {copiado ? (
                  <>
                    <Check className="h-3 w-3 mr-1 text-green-600" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <code className="block text-xs font-mono bg-white p-2 rounded border break-all">
              {descargo.hash_sha256}
            </code>
          </div>
        )}

        {/* Info legal */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <Scale className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-green-800">
              <p className="font-medium">Valor probatorio (Art. 67 LCT)</p>
              <p className="mt-1">
                {decision === "ejercer_descargo" && tieneTexto
                  ? "El descargo presentado puede contener admisiones o contradicciones útiles para el empleador."
                  : decision === "declinar_descargo"
                  ? "La declinación voluntaria demuestra que se respetó el derecho a defensa."
                  : decision === "vencido"
                  ? "El vencimiento sin respuesta prueba que se otorgó el derecho y no se ejerció."
                  : "Se está otorgando derecho a defensa al empleado."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
