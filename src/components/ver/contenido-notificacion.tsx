"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Hash,
  Calendar,
  Building2,
  User,
  AlertTriangle,
  CheckCircle,
  Shield,
  Clock,
} from "lucide-react";
import { formatearCUIL } from "@/lib/validators";
import { CheckboxDeclaracionJurada } from "./checkbox-declaracion-jurada";

interface NotificacionData {
  id: string;
  token: string;
  tipo: string;
  motivo: string;
  descripcion: string;
  fecha_hecho: string;
  fecha_vencimiento: string | null;
  hash_sha256: string | null;
  timestamp_generacion: string;
  estado: string;
  dias_suspension?: number;
  fecha_inicio_suspension?: string;
  fecha_fin_suspension?: string;
  lectura_confirmada_at?: string | null;
  fecha_lectura?: string | null;
}

interface EmpresaData {
  razon_social: string;
  cuit: string;
}

interface EmpleadoData {
  nombre: string;
  cuil: string;
}

interface ContenidoNotificacionProps {
  notificacion: NotificacionData;
  empresa: EmpresaData | null;
  empleado: EmpleadoData | null;
  lecturaConfirmada: boolean;
  onLecturaConfirmada: () => void;
}

export function ContenidoNotificacion({
  notificacion,
  empresa,
  empleado,
  lecturaConfirmada,
  onLecturaConfirmada,
}: ContenidoNotificacionProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tipoLabels: Record<string, string> = {
    apercibimiento: "Apercibimiento",
    suspension: "Suspensión",
    apercibimiento_previo_despido: "Apercibimiento Previo al Despido",
    otro: "Otra Sanción",
  };
  const tipoLabel = tipoLabels[notificacion.tipo] || notificacion.tipo;

  // Calcular días restantes
  const diasRestantes = notificacion.fecha_vencimiento
    ? Math.ceil(
        (new Date(notificacion.fecha_vencimiento).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-lg">NotiLegal</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Encabezado */}
        <div className="text-center">
          <Badge variant="outline" className="mb-3 text-base px-4 py-1">
            {tipoLabel}
          </Badge>
          <h1 className="text-2xl font-bold mb-2">Notificación de Sanción Laboral</h1>
          <p className="text-muted-foreground">
            Documento con validez legal según Ley 27.742
          </p>
        </div>

        {/* Estado de lectura confirmada */}
        {lecturaConfirmada && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-700">
                    Notificación Confirmada
                  </p>
                  <p className="text-sm text-green-600">
                    {notificacion.lectura_confirmada_at || notificacion.fecha_lectura
                      ? `Confirmada el ${formatDateTime(
                          notificacion.lectura_confirmada_at || notificacion.fecha_lectura!
                        )}`
                      : "La lectura de esta notificación ha sido confirmada"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado - Plazo de impugnación */}
        {!lecturaConfirmada && notificacion.estado !== "firme" && diasRestantes !== null && (
          <Card
            className={`${
              diasRestantes <= 5
                ? "border-red-200 bg-red-50"
                : diasRestantes <= 15
                ? "border-yellow-200 bg-yellow-50"
                : "border-blue-200 bg-blue-50"
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {diasRestantes <= 5 ? (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                ) : (
                  <Clock className="h-6 w-6 text-blue-600" />
                )}
                <div>
                  <p
                    className={`font-semibold ${
                      diasRestantes <= 5
                        ? "text-red-700"
                        : diasRestantes <= 15
                        ? "text-yellow-700"
                        : "text-blue-700"
                    }`}
                  >
                    {diasRestantes > 0
                      ? `Plazo de impugnación: ${diasRestantes} días restantes`
                      : "El plazo para impugnar ha vencido"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Fecha límite: {formatDate(notificacion.fecha_vencimiento!)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {notificacion.estado === "firme" && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-700">Sanción Firme</p>
                  <p className="text-sm text-emerald-600">
                    Esta sanción tiene valor de prueba plena por no haber sido
                    impugnada en término.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Datos del Empleador */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Empleador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Razón Social</p>
              <p className="font-medium">{empresa?.razon_social || "No disponible"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CUIT</p>
              <p className="font-mono">{empresa?.cuit ? formatearCUIL(empresa.cuit) : "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Datos del Empleado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Empleado Notificado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nombre Completo</p>
              <p className="font-medium">{empleado?.nombre || "No disponible"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CUIL</p>
              <p className="font-mono">
                {empleado?.cuil ? formatearCUIL(empleado.cuil) : "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Detalles de la Sanción */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Detalles de la Sanción
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium capitalize">{tipoLabel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha del Hecho</p>
                <p className="font-medium">{formatDate(notificacion.fecha_hecho)}</p>
              </div>
            </div>

            {/* Días de suspensión si aplica */}
            {notificacion.tipo === "suspension" && notificacion.dias_suspension && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Días de Suspensión</p>
                  <p className="font-medium">{notificacion.dias_suspension} días</p>
                </div>
                {notificacion.fecha_inicio_suspension && notificacion.fecha_fin_suspension && (
                  <div>
                    <p className="text-sm text-muted-foreground">Período</p>
                    <p className="font-medium">
                      {formatDate(notificacion.fecha_inicio_suspension)} -{" "}
                      {formatDate(notificacion.fecha_fin_suspension)}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Motivo</p>
              <p className="font-medium">{notificacion.motivo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Descripción de los Hechos</p>
              <div className="bg-slate-50 p-4 rounded-lg mt-1">
                <p className="text-sm whitespace-pre-wrap">{notificacion.descripcion}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verificación Criptográfica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hash className="h-5 w-5" />
              Verificación de Autenticidad
            </CardTitle>
            <CardDescription>
              Este documento está protegido criptográficamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">ID de Notificación</p>
              <p className="font-mono text-xs bg-slate-100 p-2 rounded">
                {notificacion.id}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Timestamp de Generación</p>
              <p className="font-mono text-sm">{notificacion.timestamp_generacion}</p>
            </div>
            {notificacion.hash_sha256 && (
              <div>
                <p className="text-sm text-muted-foreground">Hash SHA-256</p>
                <p className="font-mono text-xs bg-slate-100 p-2 rounded break-all">
                  {notificacion.hash_sha256}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aviso Legal */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">
                  Información Legal Importante
                </h4>
                <p className="text-sm text-blue-700 mb-2">
                  De acuerdo con la Ley 27.742 de Modernización Laboral, usted tiene{" "}
                  <strong>30 días corridos</strong> desde la confirmación de esta
                  notificación para impugnar la sanción.
                </p>
                <p className="text-sm text-blue-700">
                  Transcurrido ese plazo sin objeciones, la sanción quedará{" "}
                  <strong>firme</strong> y tendrá valor de <strong>prueba plena</strong>{" "}
                  en caso de litigio laboral.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checkbox de confirmación de lectura */}
        {!lecturaConfirmada && (
          <CheckboxDeclaracionJurada
            notificacionId={notificacion.id}
            token={notificacion.token}
            onConfirmado={onLecturaConfirmada}
          />
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>Documento generado por NotiLegal</p>
          <p>Sistema de notificaciones laborales con validez legal</p>
        </div>
      </div>
    </div>
  );
}
