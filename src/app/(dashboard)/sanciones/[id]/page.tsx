export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ArrowLeft,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Hash,
  Calendar,
  Mail,
  MessageSquare,
  Send,
  Package,
  Shield,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { formatearCUIL } from "@/lib/validators";
import { EnviarNotificacionButton } from "@/components/sanciones/enviar-notificacion-button";
import { SemaforoBadge } from "@/components/notificaciones/semaforo-notificacion";
import { SeccionDescargoEmpleador } from "@/components/descargo";
import { TimelineUnificado } from "@/components/timeline";
import { AccionesFirmaTiempo } from "@/components/sanciones/acciones-firma-tiempo";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SancionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: empresa } = await supabase
    .from("empresas")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!empresa) redirect("/onboarding");

  const { data: notificacion } = await supabase
    .from("notificaciones")
    .select(`
      *,
      empleado:empleados(id, nombre, cuil, email, telefono, convenio_firmado)
    `)
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .single();

  if (!notificacion) {
    notFound();
  }

  const empleado = notificacion.empleado as unknown as {
    id: string;
    nombre: string;
    cuil: string;
    email: string | null;
    telefono: string | null;
    convenio_firmado: boolean | null;
  } | null;

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "borrador":
        return <Badge variant="outline" className="text-lg px-3 py-1">Borrador</Badge>;
      case "enviado":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-lg px-3 py-1">Enviado</Badge>;
      case "leido":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-lg px-3 py-1">Leído</Badge>;
      case "firme":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-lg px-3 py-1">Firme</Badge>;
      case "vencido":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-lg px-3 py-1">Vencido</Badge>;
      case "impugnado":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 text-lg px-3 py-1">Impugnado</Badge>;
      default:
        return <Badge variant="secondary" className="text-lg px-3 py-1">{estado}</Badge>;
    }
  };

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

  // Calcular días restantes
  const diasRestantes = notificacion.fecha_vencimiento
    ? Math.ceil((new Date(notificacion.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sanciones">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Detalle de Sanción</h1>
            <p className="text-muted-foreground capitalize">
              {notificacion.tipo} - {empleado?.nombre || "Sin empleado"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getEstadoBadge(notificacion.estado)}
          {notificacion.semaforo && (
            <SemaforoBadge estado={notificacion.semaforo} />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información de la Sanción
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Sanción</p>
              <p className="font-medium capitalize">{notificacion.tipo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Motivo</p>
              <p className="font-medium">{notificacion.motivo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Descripción de los Hechos</p>
              <p className="text-sm bg-slate-50 p-3 rounded-lg mt-1">{notificacion.descripcion}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha del Hecho</p>
              <p className="font-medium">{formatDate(notificacion.fecha_hecho)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Empleado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Empleado Notificado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre Completo</p>
              <p className="font-medium">{empleado?.nombre || "Sin nombre"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CUIL</p>
              <p className="font-mono">{empleado?.cuil ? formatearCUIL(empleado.cuil) : "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p>{empleado?.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p>{empleado?.telefono || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Validez Legal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Validez Legal
            </CardTitle>
            <CardDescription>
              Información criptográfica para prueba judicial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Hash SHA-256</p>
              <p className="font-mono text-xs bg-slate-100 p-2 rounded break-all">
                {notificacion.hash_sha256}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Timestamp de Generación</p>
              <p className="font-mono text-sm">{notificacion.timestamp_generacion}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID de Notificación</p>
              <p className="font-mono text-xs">{notificacion.id}</p>
            </div>

            {/* Estado Firma Digital PKI */}
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 mb-1">
                <Shield className={`h-4 w-4 ${notificacion.firma_digital_aplicada ? 'text-green-600' : 'text-gray-400'}`} />
                <p className="text-sm font-medium">Firma Digital PKI</p>
              </div>
              {notificacion.firma_digital_aplicada ? (
                <div className="text-xs bg-green-50 p-2 rounded text-green-700">
                  <p>Firmado por: {notificacion.firma_digital_firmante}</p>
                  <p>Algoritmo: {notificacion.firma_digital_algoritmo}</p>
                  <p className="font-mono">Cert: {notificacion.firma_digital_certificado_serial}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Pendiente de aplicar</p>
              )}
            </div>

            {/* Estado Timestamp Blockchain */}
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 mb-1">
                <Link2 className={`h-4 w-4 ${notificacion.ots_timestamp_at ? 'text-green-600' : 'text-gray-400'}`} />
                <p className="text-sm font-medium">Timestamp Blockchain</p>
              </div>
              {notificacion.ots_timestamp_at ? (
                <div className="text-xs bg-green-50 p-2 rounded text-green-700">
                  <p>Anclado: {new Date(notificacion.ots_timestamp_at).toLocaleString('es-AR')}</p>
                  {notificacion.ots_confirmado && (
                    <p className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Confirmado en blockchain
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Pendiente de anclar</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fechas y Vencimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fechas y Vencimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Creación</p>
              <p className="font-medium">{formatDateTime(notificacion.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
              <p className="font-medium">
                {notificacion.fecha_vencimiento
                  ? formatDate(notificacion.fecha_vencimiento)
                  : "-"}
              </p>
            </div>
            {diasRestantes !== null && notificacion.estado === "enviado" && (
              <div className={`p-3 rounded-lg ${
                diasRestantes <= 5
                  ? "bg-red-50 border border-red-200"
                  : diasRestantes <= 15
                  ? "bg-yellow-50 border border-yellow-200"
                  : "bg-green-50 border border-green-200"
              }`}>
                <div className="flex items-center gap-2">
                  {diasRestantes <= 5 ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : diasRestantes <= 15 ? (
                    <Clock className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <p className={`font-medium ${
                    diasRestantes <= 5
                      ? "text-red-700"
                      : diasRestantes <= 15
                      ? "text-yellow-700"
                      : "text-green-700"
                  }`}>
                    {diasRestantes > 0
                      ? `${diasRestantes} días para que quede firme`
                      : "Plazo vencido"}
                  </p>
                </div>
              </div>
            )}
            {notificacion.estado === "firme" && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="font-medium text-green-700">
                    Sanción firme - Tiene valor de prueba plena
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información Legal */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Regla de los 30 días</h4>
              <p className="text-sm text-blue-700">
                Según la reforma laboral vigente, las sanciones no impugnadas dentro de los 30 días
                corridos desde su notificación quedan firmes y constituyen prueba plena en caso de
                juicio laboral. El hash SHA-256 garantiza la integridad del documento original.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audiencia de Descargo */}
      <SeccionDescargoEmpleador notificacionId={notificacion.id} />

      {/* Timeline de Cadena de Custodia */}
      <TimelineUnificado notificacionId={notificacion.id} />

      {/* Acciones de Firma Digital y Timestamp */}
      {notificacion.hash_sha256 && (
        <AccionesFirmaTiempo
          notificacionId={notificacion.id}
          tieneHash={!!notificacion.hash_sha256}
          firmaAplicada={!!notificacion.firma_digital_aplicada}
          timestampAplicado={!!notificacion.ots_timestamp_at}
        />
      )}

      {/* Enviar Notificación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Notificación
          </CardTitle>
          <CardDescription>
            Enviá la notificación al empleado por email y/o SMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!notificacion.email_enviado_at ? (
            <>
              {!empleado?.email ? (
                <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <p className="text-yellow-700">
                    El empleado no tiene email registrado.
                    <Link href="/empleados" className="underline ml-1">
                      Agregá uno primero
                    </Link>
                  </p>
                </div>
              ) : (
                <EnviarNotificacionButton
                  notificacionId={notificacion.id}
                  tieneEmail={!!empleado?.email}
                  tieneTelefono={!!empleado?.telefono}
                  tieneConvenio={!!empleado?.convenio_firmado}
                />
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">Notificación enviada</p>
                  <p className="text-sm text-green-600">
                    {formatDateTime(notificacion.email_enviado_at)}
                  </p>
                </div>
              </div>

              {/* Timeline de eventos */}
              <div className="space-y-2 text-sm">
                <p className="font-medium">Estado de entrega:</p>
                <div className="space-y-1 ml-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    <span>Email enviado: {formatDateTime(notificacion.email_enviado_at)}</span>
                  </div>

                  {notificacion.email_entregado_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Email entregado: {formatDateTime(notificacion.email_entregado_at)}</span>
                    </div>
                  )}

                  {notificacion.link_abierto_at && (
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span>Link abierto: {formatDateTime(notificacion.link_abierto_at)}</span>
                    </div>
                  )}

                  {notificacion.lectura_confirmada_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Lectura confirmada: {formatDateTime(notificacion.lectura_confirmada_at)}</span>
                    </div>
                  )}

                  {notificacion.sms_enviado_at && (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      <span>SMS enviado: {formatDateTime(notificacion.sms_enviado_at)}</span>
                    </div>
                  )}

                  {notificacion.email_rebotado && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-red-600">Email rebotado</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex gap-3 flex-wrap">
        <a href={`/api/pdf/${notificacion.id}`} target="_blank">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </a>
        <a href={`/api/evidencia/${notificacion.id}`}>
          <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
            <Package className="h-4 w-4 mr-2" />
            Paquete de Evidencia
          </Button>
        </a>
        <Link href={`/ver/${notificacion.token_acceso || notificacion.id}`} target="_blank">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Ver como Empleado
          </Button>
        </Link>
        {notificacion.email_enviado_at && !notificacion.lectura_confirmada_at && (
          <>
            <Link href={`/sanciones/${notificacion.id}/reenviar`}>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Reenviar Digital
              </Button>
            </Link>
            <Link href={`/sanciones/${notificacion.id}/pdf-fisico`}>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Carta Documento
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
