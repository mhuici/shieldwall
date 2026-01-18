export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Printer,
  Mail,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { formatearCUIL } from "@/lib/validators";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PdfFisicoPage({ params }: PageProps) {
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
      empleado:empleados(id, nombre, cuil, email, telefono)
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
  } | null;

  // Calcular horas desde envío
  const horasDesdeEnvio = notificacion.email_enviado_at
    ? Math.floor((Date.now() - new Date(notificacion.email_enviado_at).getTime()) / (1000 * 60 * 60))
    : 0;

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/sanciones/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Notificación Física</h1>
          <p className="text-muted-foreground">
            Generar carta documento para {empleado?.nombre}
          </p>
        </div>
      </div>

      {/* Alerta de estado */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">
                Notificación digital sin confirmar
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                Han pasado <strong>{horasDesdeEnvio} horas</strong> desde el envío y el empleado no ha
                confirmado la recepción con la declaración jurada.
              </p>
              <div className="mt-3 space-y-1 text-sm text-amber-800">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Email enviado: {notificacion.email_enviado_at ? formatDateTime(notificacion.email_enviado_at) : "No"}</span>
                </div>
                {notificacion.whatsapp_enviado_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>WhatsApp enviado: {formatDateTime(notificacion.whatsapp_enviado_at)}</span>
                  </div>
                )}
                {notificacion.identidad_validada_at ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Identidad validada: {formatDateTime(notificacion.identidad_validada_at)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span>Identidad: No validada (no ingresó CUIL)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opciones */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Opción 1: Descargar PDF */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Descargar PDF
            </CardTitle>
            <CardDescription>
              Genera el acta de notificación física lista para imprimir
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>El PDF incluye:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Datos completos de la sanción</li>
                <li>Espacios para firmas (empleador, empleado)</li>
                <li>Espacios para 2 testigos</li>
                <li>Campo para fecha/hora de entrega</li>
                <li>Hash SHA-256 para validación</li>
              </ul>
            </div>
            <a href={`/api/pdf-fisico/${id}`} className="block">
              <Button className="w-full" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Descargar Carta Documento
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Opción 2: Reenviar digital */}
        <Card className="border-2 hover:border-blue-500/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              Reenviar Digital
            </CardTitle>
            <CardDescription>
              Vuelve a enviar la notificación por email y WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Útil cuando:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>El empleado no vio los mensajes anteriores</li>
                <li>Se actualizaron datos de contacto</li>
                <li>Hubo problemas técnicos temporales</li>
                <li>El empleado pidió reenvío</li>
              </ul>
            </div>
            <Link href={`/sanciones/${id}/reenviar`} className="block">
              <Button variant="outline" className="w-full" size="lg">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reenviar Notificación
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Instrucciones para carta documento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Instrucciones para Notificación Física
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Métodos de envío */}
          <div>
            <h4 className="font-medium mb-3">Métodos de envío disponibles:</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <Badge variant="default">Recomendado</Badge>
                </div>
                <h5 className="font-medium">Carta Documento</h5>
                <p className="text-sm text-muted-foreground mt-1">
                  Correo Argentino o servicio privado. Máxima validez legal.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <h5 className="font-medium">Correo Certificado</h5>
                <p className="text-sm text-muted-foreground mt-1">
                  Alternativa más económica con aviso de retorno.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Printer className="h-5 w-5 text-green-600" />
                </div>
                <h5 className="font-medium">Entrega en Mano</h5>
                <p className="text-sm text-muted-foreground mt-1">
                  Requiere firma del empleado + 2 testigos.
                </p>
              </div>
            </div>
          </div>

          {/* Pasos */}
          <div>
            <h4 className="font-medium mb-3">Pasos a seguir:</h4>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <div>
                  <p className="font-medium">Descargá el PDF</p>
                  <p className="text-sm text-muted-foreground">
                    Usá el botón &quot;Descargar Carta Documento&quot; para obtener el acta lista para imprimir.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <div>
                  <p className="font-medium">Imprimí en duplicado</p>
                  <p className="text-sm text-muted-foreground">
                    Una copia para el empleado, otra para tu archivo. Firmá ambas como empleador.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <div>
                  <p className="font-medium">Enviá o entregá</p>
                  <p className="text-sm text-muted-foreground">
                    Por carta documento, correo certificado, o en mano con testigos.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <div>
                  <p className="font-medium">Guardá el comprobante</p>
                  <p className="text-sm text-muted-foreground">
                    Conservá el acuse de recibo o copia firmada con testigos como prueba de notificación.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Info legal */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Importante</h4>
              <p className="text-sm text-blue-700">
                La notificación física tiene la misma validez legal que la digital. El plazo de
                30 días para impugnar comienza a correr desde la fecha de recepción efectiva
                (fecha del acuse de recibo o firma del empleado).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos del empleado */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del Empleado para Envío</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Nombre Completo</p>
              <p className="font-medium">{empleado?.nombre}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CUIL</p>
              <p className="font-mono">{empleado?.cuil ? formatearCUIL(empleado.cuil) : "-"}</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Necesitarás el domicilio del empleado para el envío físico.
              Si no lo tenés registrado, solicitalo antes de enviar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex gap-3">
        <Link href={`/sanciones/${id}`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la Sanción
          </Button>
        </Link>
      </div>
    </div>
  );
}
