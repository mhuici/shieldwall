"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  RefreshCw,
  Mail,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { formatearCUIL } from "@/lib/validators";

interface Notificacion {
  id: string;
  tipo: string;
  motivo: string;
  estado: string;
  email_enviado_at: string | null;
  whatsapp_enviado_at: string | null;
  identidad_validada_at: string | null;
  lectura_confirmada_at: string | null;
  alertas_enviadas_empleador: number;
  empleado: {
    id: string;
    nombre: string;
    cuil: string;
    email: string | null;
    telefono: string | null;
  } | null;
}

export default function ReenviarPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [notificacion, setNotificacion] = useState<Notificacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{
    success: boolean;
    canales?: {
      email_empleado?: { enviado: boolean; error?: string };
      whatsapp_empleado?: { enviado: boolean; error?: string };
    };
    error?: string;
  } | null>(null);

  useEffect(() => {
    async function fetchNotificacion() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: empresa } = await supabase
        .from("empresas")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!empresa) {
        router.push("/onboarding");
        return;
      }

      const { data } = await supabase
        .from("notificaciones")
        .select(`
          id, tipo, motivo, estado,
          email_enviado_at, whatsapp_enviado_at,
          identidad_validada_at, lectura_confirmada_at,
          alertas_enviadas_empleador,
          empleado:empleados(id, nombre, cuil, email, telefono)
        `)
        .eq("id", id)
        .eq("empresa_id", empresa.id)
        .single();

      if (data) {
        setNotificacion(data as unknown as Notificacion);
      }
      setLoading(false);
    }

    fetchNotificacion();
  }, [id, router]);

  const handleReenviar = async () => {
    setEnviando(true);
    setResultado(null);

    try {
      const response = await fetch(`/api/notificar/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forzarReenvio: true }),
      });

      const data = await response.json();

      if (response.ok) {
        setResultado({ success: true, canales: data.canales });
      } else {
        setResultado({ success: false, error: data.error || "Error al reenviar" });
      }
    } catch {
      setResultado({ success: false, error: "Error de conexión" });
    } finally {
      setEnviando(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!notificacion) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Notificación no encontrada</h2>
        <Link href="/sanciones">
          <Button variant="link">Volver a sanciones</Button>
        </Link>
      </div>
    );
  }

  const empleado = notificacion.empleado;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/sanciones/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Reenviar Notificación</h1>
          <p className="text-muted-foreground">
            Volver a enviar a {empleado?.nombre}
          </p>
        </div>
      </div>

      {/* Estado actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Estado Actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notificacion.email_enviado_at && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-green-600" />
              <span>Email enviado: {formatDateTime(notificacion.email_enviado_at)}</span>
            </div>
          )}
          {notificacion.whatsapp_enviado_at && (
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-green-600" />
              <span>WhatsApp enviado: {formatDateTime(notificacion.whatsapp_enviado_at)}</span>
            </div>
          )}
          {notificacion.identidad_validada_at && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span>Identidad validada: {formatDateTime(notificacion.identidad_validada_at)}</span>
            </div>
          )}
          {!notificacion.lectura_confirmada_at && (
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span>Lectura NO confirmada</span>
            </div>
          )}
          {notificacion.alertas_enviadas_empleador > 0 && (
            <Badge variant="secondary">
              {notificacion.alertas_enviadas_empleador} alerta(s) enviada(s)
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Datos del empleado */}
      <Card>
        <CardHeader>
          <CardTitle>Datos de Contacto</CardTitle>
          <CardDescription>
            Se enviará a estos canales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{empleado?.nombre || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CUIL</p>
              <p className="font-mono">{empleado?.cuil ? formatearCUIL(empleado.cuil) : "-"}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className={empleado?.email ? "font-medium" : "text-muted-foreground"}>
                  {empleado?.email || "No registrado"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <p className={empleado?.telefono ? "font-medium" : "text-muted-foreground"}>
                  {empleado?.telefono || "No registrado"}
                </p>
              </div>
            </div>
          </div>

          {!empleado?.email && !empleado?.telefono && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                El empleado no tiene email ni teléfono registrado.
                <Link href="/empleados" className="underline ml-1">
                  Actualizá sus datos primero
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultado del envío */}
      {resultado && (
        <Card className={resultado.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="pt-6">
            {resultado.success ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="font-medium text-green-800">Notificación reenviada</p>
                </div>
                <div className="space-y-1 text-sm">
                  {resultado.canales?.email_empleado?.enviado && (
                    <div className="flex items-center gap-2 text-green-700">
                      <Mail className="h-4 w-4" />
                      <span>Email enviado correctamente</span>
                    </div>
                  )}
                  {resultado.canales?.whatsapp_empleado?.enviado && (
                    <div className="flex items-center gap-2 text-green-700">
                      <MessageSquare className="h-4 w-4" />
                      <span>WhatsApp enviado correctamente</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="font-medium text-red-800">{resultado.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botón de reenvío */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Se enviará nuevamente la notificación por email y WhatsApp al empleado.
            </p>
            <Button
              size="lg"
              onClick={handleReenviar}
              disabled={enviando || (!empleado?.email && !empleado?.telefono)}
            >
              {enviando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reenviar Notificación
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-700">
            <strong>Nota:</strong> El reenvío actualiza la fecha de envío pero no reinicia el
            plazo de 30 días para impugnación. El plazo comienza cuando el empleado confirma
            la lectura con la declaración jurada.
          </p>
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
        <Link href={`/sanciones/${id}/pdf-fisico`}>
          <Button variant="outline">
            Generar Carta Documento
          </Button>
        </Link>
      </div>
    </div>
  );
}
