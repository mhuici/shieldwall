import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { SancionPDF } from "@/lib/pdf/sancion-pdf";
import {
  CadenaCustodiaPDF,
  type EventoCadena,
} from "@/lib/pdf/cadena-custodia-pdf";
import JSZip from "jszip";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verificar autenticacion
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener empresa del usuario
    const { data: empresa } = await supabase
      .from("empresas")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Obtener notificacion con datos del empleado
    const { data: notificacion } = await supabase
      .from("notificaciones")
      .select(
        `
        *,
        empleado:empleados(nombre, cuil, email, telefono)
      `
      )
      .eq("id", id)
      .eq("empresa_id", empresa.id)
      .single();

    if (!notificacion) {
      return NextResponse.json(
        { error: "Notificacion no encontrada" },
        { status: 404 }
      );
    }

    // Obtener eventos de la notificacion
    const { data: eventosDB } = await supabase
      .from("eventos")
      .select("*")
      .eq("notificacion_id", id)
      .order("created_at", { ascending: true });

    const empleado = notificacion.empleado as unknown as {
      nombre: string;
      cuil: string;
      email: string | null;
      telefono: string | null;
    };

    const fechaGeneracion = new Date().toISOString();

    // Construir timeline de eventos
    const eventos: EventoCadena[] = [];

    // Evento de creacion
    eventos.push({
      fecha: notificacion.created_at,
      tipo: "creacion",
      titulo: "Sancion creada",
      detalle: `Tipo: ${notificacion.tipo} - Motivo: ${notificacion.motivo}`,
      ip: notificacion.ip_emisor || undefined,
    });

    // Evento de envio de email
    if (notificacion.email_enviado_at) {
      eventos.push({
        fecha: notificacion.email_enviado_at,
        tipo: "envio_email",
        titulo: "Email de notificacion enviado",
        detalle: `Destinatario: ${empleado.email || "N/A"}`,
      });
    }

    // Evento de envio de SMS
    if (notificacion.sms_enviado_at) {
      eventos.push({
        fecha: notificacion.sms_enviado_at,
        tipo: "envio_sms",
        titulo: "SMS de notificacion enviado",
        detalle: `Destinatario: ${empleado.telefono || "N/A"}`,
      });
    }

    // Evento de envio de WhatsApp
    if (notificacion.whatsapp_enviado_at) {
      eventos.push({
        fecha: notificacion.whatsapp_enviado_at,
        tipo: "envio_whatsapp",
        titulo: "WhatsApp de notificacion enviado",
        detalle: `Destinatario: ${empleado.telefono || "N/A"}`,
      });
    }

    // Evento de entrega de email
    if (notificacion.email_entregado_at) {
      eventos.push({
        fecha: notificacion.email_entregado_at,
        tipo: "email_entregado",
        titulo: "Email entregado al servidor destino",
        detalle: "Confirmado por webhook del proveedor",
      });
    }

    // Evento de apertura de link
    if (notificacion.link_abierto_at) {
      eventos.push({
        fecha: notificacion.link_abierto_at,
        tipo: "link_abierto",
        titulo: "Link de notificacion abierto",
        ip: notificacion.ip_lector || undefined,
      });
    }

    // Evento de validacion de identidad (Gatekeeper)
    if (notificacion.identidad_validada_at) {
      eventos.push({
        fecha: notificacion.identidad_validada_at,
        tipo: "identidad_validada",
        titulo: "Identidad validada (CUIL verificado)",
        detalle: `CUIL ingresado: ${notificacion.identidad_cuil_ingresado || "N/A"}`,
        ip: notificacion.identidad_ip || undefined,
      });
    }

    // Evento de confirmacion de lectura
    if (notificacion.lectura_confirmada_at) {
      eventos.push({
        fecha: notificacion.lectura_confirmada_at,
        tipo: "lectura_confirmada",
        titulo: "Lectura confirmada con declaracion jurada",
        detalle:
          "El empleado marco el checkbox de declaracion jurada confirmando haber leido y comprendido la notificacion",
        ip: notificacion.lectura_ip || undefined,
      });
    }

    // Eventos adicionales de la tabla eventos
    if (eventosDB) {
      for (const evento of eventosDB) {
        // Evitar duplicar eventos que ya agregamos
        const tiposYaAgregados = [
          "envio_email",
          "envio_sms",
          "envio_whatsapp",
          "apertura_link",
          "validacion_identidad",
          "confirmacion_lectura",
        ];
        if (!tiposYaAgregados.includes(evento.tipo)) {
          eventos.push({
            fecha: evento.created_at,
            tipo: evento.tipo,
            titulo: formatEventTitle(evento.tipo),
            detalle:
              evento.metadata && typeof evento.metadata === "object"
                ? JSON.stringify(evento.metadata)
                : undefined,
            ip: evento.ip || undefined,
          });
        }
      }
    }

    // Evento de firmeza si aplica
    if (notificacion.estado === "firme") {
      const fechaFirmeza = notificacion.fecha_vencimiento
        ? new Date(
            new Date(notificacion.fecha_vencimiento).getTime() +
              24 * 60 * 60 * 1000
          ).toISOString()
        : fechaGeneracion;
      eventos.push({
        fecha: fechaFirmeza,
        tipo: "firmeza",
        titulo: "Sancion adquirio firmeza",
        detalle:
          "30 dias corridos sin impugnacion - Constituye prueba plena segun Ley 27.742",
      });
    }

    // Ordenar eventos por fecha
    eventos.sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    // 1. Generar PDF de la sancion original
    const sancionPdfBuffer = await renderToBuffer(
      SancionPDF({
        notificacion: {
          id: notificacion.id,
          tipo: notificacion.tipo,
          motivo: notificacion.motivo,
          descripcion: notificacion.descripcion,
          fecha_hecho: notificacion.fecha_hecho,
          hash_sha256: notificacion.hash_sha256,
          timestamp_generacion: notificacion.timestamp_generacion,
          fecha_vencimiento: notificacion.fecha_vencimiento,
          created_at: notificacion.created_at,
        },
        empresa: {
          razon_social: empresa.razon_social,
          cuit: empresa.cuit,
          direccion: empresa.direccion_legal || undefined,
        },
        empleado: {
          nombre: empleado.nombre,
          cuil: empleado.cuil,
        },
      })
    );

    // 2. Generar PDF de cadena de custodia
    const cadenaPdfBuffer = await renderToBuffer(
      CadenaCustodiaPDF({
        notificacion: {
          id: notificacion.id,
          tipo: notificacion.tipo,
          motivo: notificacion.motivo,
          fecha_hecho: notificacion.fecha_hecho,
          hash_sha256: notificacion.hash_sha256,
          timestamp_generacion: notificacion.timestamp_generacion,
          fecha_vencimiento: notificacion.fecha_vencimiento,
          created_at: notificacion.created_at,
          estado: notificacion.estado,
        },
        empresa: {
          razon_social: empresa.razon_social,
          cuit: empresa.cuit,
        },
        empleado: {
          nombre: empleado.nombre,
          cuil: empleado.cuil,
        },
        eventos,
        fechaGeneracion,
      })
    );

    // 3. Crear metadata JSON
    const metadata = {
      version: "1.0",
      generado_por: "NotiLegal",
      fecha_generacion: fechaGeneracion,
      notificacion: {
        id: notificacion.id,
        tipo: notificacion.tipo,
        motivo: notificacion.motivo,
        fecha_hecho: notificacion.fecha_hecho,
        estado: notificacion.estado,
        fecha_vencimiento: notificacion.fecha_vencimiento,
      },
      empleador: {
        razon_social: empresa.razon_social,
        cuit: empresa.cuit,
      },
      empleado: {
        nombre: empleado.nombre,
        cuil: empleado.cuil,
      },
      integridad: {
        algoritmo: "SHA-256",
        hash_documento: notificacion.hash_sha256,
        timestamp_original: notificacion.timestamp_generacion,
      },
      cadena_custodia: {
        total_eventos: eventos.length,
        eventos: eventos.map((e) => ({
          fecha: e.fecha,
          tipo: e.tipo,
          titulo: e.titulo,
          ip: e.ip || null,
        })),
      },
      verificacion: {
        url: `https://notilegal.com.ar/ver/${notificacion.id}`,
        instrucciones:
          "Para verificar la integridad del documento, calcule el hash SHA-256 del archivo sancion_original.pdf y compare con el valor en integridad.hash_documento",
      },
    };

    // 4. Crear archivo ZIP
    const zip = new JSZip();
    zip.file("sancion_original.pdf", sancionPdfBuffer);
    zip.file("cadena_de_custodia.pdf", cadenaPdfBuffer);
    zip.file("metadata.json", JSON.stringify(metadata, null, 2));

    // Agregar README
    const readme = `PAQUETE DE EVIDENCIA - NOTILEGAL
================================

Este paquete contiene la evidencia digital de una notificacion laboral
generada a traves de NotiLegal.

CONTENIDO:
----------
1. sancion_original.pdf
   Documento original de la sancion con hash SHA-256 embebido.

2. cadena_de_custodia.pdf
   Cronologia completa de todos los eventos relacionados con esta
   notificacion: creacion, envio, apertura, confirmacion, etc.

3. metadata.json
   Datos tecnicos en formato estructurado para verificacion
   programatica de la integridad del documento.

VERIFICACION DE INTEGRIDAD:
---------------------------
Para verificar que el documento no fue alterado:

1. Calcule el hash SHA-256 del archivo sancion_original.pdf
2. Compare con el valor en metadata.json > integridad > hash_documento
3. Si coinciden, el documento es autentico e inalterado

En Linux/Mac: sha256sum sancion_original.pdf
En Windows: certutil -hashfile sancion_original.pdf SHA256

VALIDEZ LEGAL:
--------------
Este paquete de evidencia constituye prueba de:
- Existencia del documento en la fecha indicada
- Intento de notificacion fehaciente al empleado
- Recepcion y lectura por parte del empleado (si aplica)
- Transcurso del plazo de 30 dias sin impugnacion (si aplica)

Conforme a la Ley 27.742 de Modernizacion Laboral, las sanciones
no impugnadas dentro de los 30 dias corridos constituyen prueba
plena en caso de litigio laboral.

---
Generado: ${fechaGeneracion}
ID: ${notificacion.id}
NotiLegal - https://notilegal.com.ar
`;
    zip.file("README.txt", readme);

    // Generar el ZIP
    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    // Nombre del archivo
    const fileName = `evidencia_${empleado.nombre.replace(/\s+/g, "_")}_${new Date(notificacion.created_at).toISOString().split("T")[0]}.zip`;

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error generando paquete de evidencia:", error);
    return NextResponse.json(
      { error: "Error al generar el paquete de evidencia" },
      { status: 500 }
    );
  }
}

function formatEventTitle(tipo: string): string {
  const titles: Record<string, string> = {
    creacion: "Sancion creada",
    envio_email: "Email enviado",
    envio_sms: "SMS enviado",
    envio_whatsapp: "WhatsApp enviado",
    email_entregado: "Email entregado",
    email_rebotado: "Email rebotado",
    sms_entregado: "SMS entregado",
    whatsapp_entregado: "WhatsApp entregado",
    link_abierto: "Link abierto",
    apertura_link: "Link abierto",
    identidad_validada: "Identidad validada",
    validacion_identidad: "Identidad validada",
    lectura_confirmada: "Lectura confirmada",
    confirmacion_lectura: "Lectura confirmada",
    alerta_72hs: "Alerta de 72hs enviada",
    alerta_5dias: "Alerta de 5 dias enviada",
    alerta_7dias: "Alerta de 7 dias enviada",
    firmeza: "Sancion firme",
  };
  return titles[tipo] || tipo.replace(/_/g, " ");
}
