import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { SancionPDF } from "@/lib/pdf/sancion-pdf";
import {
  CadenaCustodiaPDF,
  type EventoCadena,
} from "@/lib/pdf/cadena-custodia-pdf";
import { DeclaracionTestigoPDF } from "@/lib/pdf/declaracion-testigo-pdf";
import { ProtocoloPreservacionPDF } from "@/lib/pdf/protocolo-preservacion-pdf";
import JSZip from "jszip";
import crypto from "crypto";

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

    // Obtener testigos firmados de la notificacion
    const { data: testigosDB } = await supabase
      .from("declaraciones_testigos")
      .select("*")
      .eq("notificacion_id", id)
      .eq("estado", "firmado")
      .order("juramento_timestamp", { ascending: true });

    // Obtener evidencia multimedia de la notificacion
    const { data: evidenciaDB } = await supabase
      .from("evidencia_incidentes")
      .select("*")
      .eq("notificacion_id", id)
      .order("orden", { ascending: true });

    // Obtener descargo del empleado (Fase 4)
    const { data: descargoDB } = await supabase
      .from("descargos")
      .select("*")
      .eq("notificacion_id", id)
      .single();

    // Obtener bitacora de contexto del empleado (Fase 3)
    const { data: bitacoraDB } = notificacion.empleado_id
      ? await supabase
          .from("bitacora_novedades")
          .select("*")
          .eq("empleado_id", notificacion.empleado_id)
          .lte("fecha_hecho", notificacion.fecha_hecho)
          .order("fecha_hecho", { ascending: true })
      : { data: null };

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

    // Eventos de declaraciones de testigos firmadas
    if (testigosDB && testigosDB.length > 0) {
      for (const testigo of testigosDB) {
        if (testigo.juramento_timestamp) {
          eventos.push({
            fecha: testigo.juramento_timestamp,
            tipo: "declaracion_testigo",
            titulo: `Declaracion testimonial firmada: ${testigo.nombre_completo}`,
            detalle: `Hash: ${testigo.hash_declaracion || "N/A"}`,
            ip: testigo.juramento_ip || undefined,
          });
        }
      }
    }

    // Eventos de evidencia multimedia subida
    if (evidenciaDB && evidenciaDB.length > 0) {
      for (const ev of evidenciaDB) {
        eventos.push({
          fecha: ev.created_at,
          tipo: "evidencia_subida",
          titulo: `Evidencia ${ev.tipo} subida: ${ev.nombre_archivo}`,
          detalle: ev.exif_fecha_captura
            ? `Fecha EXIF: ${ev.exif_fecha_captura}${ev.exif_latitud ? " - GPS verificado" : ""}`
            : `Hash: ${ev.hash_sha256.substring(0, 16)}...`,
          ip: ev.subido_desde_ip || undefined,
        });
      }
    }

    // Eventos de descargo (Fase 4)
    if (descargoDB) {
      eventos.push({
        fecha: descargoDB.created_at,
        tipo: "descargo_habilitado",
        titulo: "Derecho a descargo habilitado",
        detalle: `Vence: ${descargoDB.token_expira_at || "30 días desde notificación"}`,
      });

      if (descargoDB.identidad_validada_at) {
        eventos.push({
          fecha: descargoDB.identidad_validada_at,
          tipo: "descargo_identidad",
          titulo: "Identidad validada para descargo",
          ip: descargoDB.decision_ip || undefined,
        });
      }

      if (descargoDB.decision_timestamp && descargoDB.decision !== "pendiente") {
        eventos.push({
          fecha: descargoDB.decision_timestamp,
          tipo: `descargo_${descargoDB.decision}`,
          titulo:
            descargoDB.decision === "ejercer_descargo"
              ? "Empleado decidió ejercer descargo"
              : descargoDB.decision === "declinar_descargo"
                ? "Empleado declinó ejercer descargo"
                : `Descargo: ${descargoDB.decision}`,
          ip: descargoDB.decision_ip || undefined,
        });
      }

      if (descargoDB.confirmado_at) {
        eventos.push({
          fecha: descargoDB.confirmado_at,
          tipo: "descargo_confirmado",
          titulo: "Descargo confirmado con declaración jurada",
          detalle: `Hash: ${descargoDB.hash_sha256?.substring(0, 16) || "N/A"}...`,
          ip: descargoDB.decision_ip || undefined,
        });
      }
    }

    // Eventos de bitácora vinculada (Fase 3)
    if (bitacoraDB && bitacoraDB.length > 0) {
      for (const entrada of bitacoraDB) {
        if (entrada.sancion_relacionada_id === id) {
          eventos.push({
            fecha: entrada.created_at,
            tipo: "bitacora_vinculada",
            titulo: `Antecedente: ${entrada.titulo}`,
            detalle: `${entrada.tipo} - ${entrada.fecha_hecho}`,
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
      testigos: {
        total: testigosDB?.length || 0,
        declaraciones_firmadas: testigosDB
          ?.filter((t) => t.estado === "firmado")
          .map((t) => ({
            nombre: t.nombre_completo,
            relacion: t.relacion,
            presente_en_hecho: t.presente_en_hecho,
            fecha_firma: t.juramento_timestamp,
            hash: t.hash_declaracion,
          })) || [],
      },
      evidencia_multimedia: {
        total: evidenciaDB?.length || 0,
        archivos: evidenciaDB?.map((ev) => ({
          nombre: ev.nombre_archivo,
          tipo: ev.tipo,
          tamano_bytes: ev.tamano_bytes,
          hash: ev.hash_sha256,
          exif: ev.exif_fecha_captura
            ? {
                fecha_captura: ev.exif_fecha_captura,
                latitud: ev.exif_latitud,
                longitud: ev.exif_longitud,
                dispositivo: ev.exif_dispositivo,
              }
            : null,
          descripcion: ev.descripcion,
          es_prueba_principal: ev.es_prueba_principal,
        })) || [],
      },
      descargo: descargoDB
        ? {
            decision: descargoDB.decision,
            decision_timestamp: descargoDB.decision_timestamp,
            texto_descargo: descargoDB.texto_descargo ? "[TEXTO INCLUIDO]" : null,
            confirmado_at: descargoDB.confirmado_at,
            hash: descargoDB.hash_sha256,
            contiene_admision: descargoDB.contiene_admision,
            contiene_contradiccion: descargoDB.contiene_contradiccion,
          }
        : null,
      bitacora_contexto: {
        total_entradas: bitacoraDB?.length || 0,
        entradas: bitacoraDB?.map((b) => ({
          fecha: b.fecha_hecho,
          tipo: b.tipo,
          titulo: b.titulo,
          hash: b.hash_sha256,
        })) || [],
      },
      verificacion: {
        url: `https://notilegal.com.ar/ver/${notificacion.id}`,
        instrucciones:
          "Para verificar la integridad del documento, calcule el hash SHA-256 del archivo sancion_original.pdf y compare con el valor en integridad.hash_documento",
      },
    };

    // 4. Generar PDFs de declaraciones de testigos
    const testigosPdfs: { nombre: string; buffer: Buffer }[] = [];
    if (testigosDB && testigosDB.length > 0) {
      for (let i = 0; i < testigosDB.length; i++) {
        const testigo = testigosDB[i];
        if (testigo.descripcion_testigo && testigo.hash_declaracion) {
          const testigoPdfBuffer = await renderToBuffer(
            DeclaracionTestigoPDF({
              testigo: {
                nombre_completo: testigo.nombre_completo,
                cargo: testigo.cargo || undefined,
                cuil: testigo.cuil || undefined,
                relacion: testigo.relacion,
                presente_en_hecho: testigo.presente_en_hecho,
              },
              declaracion: {
                descripcion: testigo.descripcion_testigo,
                timestamp: testigo.juramento_timestamp,
                ip: testigo.juramento_ip || "N/A",
                hash: testigo.hash_declaracion,
              },
              incidente: {
                fecha_hecho: notificacion.fecha_hecho,
                hora_hecho: notificacion.hora_hecho || undefined,
                lugar_hecho: notificacion.lugar_hecho || undefined,
                motivo: notificacion.motivo,
                empleado_nombre: empleado.nombre,
              },
              empresa: {
                razon_social: empresa.razon_social,
                cuit: empresa.cuit,
              },
            })
          );
          const nombreArchivo = `testigo_${(i + 1).toString().padStart(2, "0")}_${testigo.nombre_completo.replace(/\s+/g, "_")}.pdf`;
          testigosPdfs.push({ nombre: nombreArchivo, buffer: testigoPdfBuffer });
        }
      }
    }

    // 5. Descargar archivos de evidencia multimedia desde storage
    const evidenciaFiles: { nombre: string; buffer: ArrayBuffer; tipo: string }[] = [];
    if (evidenciaDB && evidenciaDB.length > 0) {
      for (const ev of evidenciaDB) {
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from("evidencia")
            .download(ev.storage_path);

          if (!downloadError && fileData) {
            const buffer = await fileData.arrayBuffer();
            // Generar nombre seguro con índice
            const idx = evidenciaDB.indexOf(ev) + 1;
            const extension = ev.nombre_archivo.split(".").pop() || "";
            const nombreSeguro = `${idx.toString().padStart(2, "0")}_${ev.tipo}_${ev.nombre_archivo.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            evidenciaFiles.push({
              nombre: nombreSeguro,
              buffer,
              tipo: ev.tipo,
            });
          }
        } catch (err) {
          console.error("Error descargando evidencia:", ev.storage_path, err);
        }
      }
    }

    // 6. Generar PDF de protocolo de preservación (Fase 5)
    const totalArchivos = 3 + testigosPdfs.length + evidenciaFiles.length + (descargoDB ? 1 : 0) + (bitacoraDB?.length ? 1 : 0);
    const protocoloPdfBuffer = await renderToBuffer(
      ProtocoloPreservacionPDF({
        notificacion: {
          id: notificacion.id,
          tipo: notificacion.tipo,
          hash_sha256: notificacion.hash_sha256,
          timestamp_generacion: notificacion.timestamp_generacion,
          created_at: notificacion.created_at,
          estado: notificacion.estado,
        },
        empresa: {
          razon_social: empresa.razon_social,
          cuit: empresa.cuit,
        },
        fechaGeneracion,
        totalArchivos,
        totalHashes: totalArchivos,
      })
    );

    // 7. Crear archivo ZIP
    const zip = new JSZip();
    zip.file("sancion_original.pdf", sancionPdfBuffer);
    zip.file("cadena_de_custodia.pdf", cadenaPdfBuffer);
    zip.file("protocolo_preservacion.pdf", protocoloPdfBuffer);
    zip.file("metadata.json", JSON.stringify(metadata, null, 2));

    // Agregar PDFs de testigos en carpeta separada
    if (testigosPdfs.length > 0) {
      const testigosFolder = zip.folder("declaraciones_testigos");
      for (const testigo of testigosPdfs) {
        testigosFolder?.file(testigo.nombre, testigo.buffer);
      }
    }

    // Agregar archivos de evidencia multimedia en carpeta separada
    if (evidenciaFiles.length > 0) {
      const evidenciaFolder = zip.folder("evidencia_multimedia");
      for (const file of evidenciaFiles) {
        evidenciaFolder?.file(file.nombre, file.buffer);
      }
    }

    // Agregar descargo del empleado (Fase 4)
    if (descargoDB && descargoDB.confirmado_at) {
      const descargoFolder = zip.folder("descargo");
      const descargoContent = {
        id: descargoDB.id,
        decision: descargoDB.decision,
        decision_timestamp: descargoDB.decision_timestamp,
        texto_descargo: descargoDB.texto_descargo,
        identidad_cuil_ingresado: descargoDB.identidad_cuil_ingresado,
        confirmado_at: descargoDB.confirmado_at,
        hash_sha256: descargoDB.hash_sha256,
        contiene_admision: descargoDB.contiene_admision,
        contiene_contradiccion: descargoDB.contiene_contradiccion,
        notas_empleador: descargoDB.notas_empleador,
      };
      descargoFolder?.file("descargo.json", JSON.stringify(descargoContent, null, 2));

      // Generar texto legible del descargo
      let descargoTxt = `DESCARGO DEL EMPLEADO
${"=".repeat(60)}

Decisión: ${descargoDB.decision === "ejercer_descargo" ? "EJERCIÓ SU DERECHO A DESCARGO" : "DECLINÓ SU DERECHO A DESCARGO"}
Fecha de decisión: ${descargoDB.decision_timestamp}
CUIL validado: ${descargoDB.identidad_cuil_ingresado || "N/A"}

`;
      if (descargoDB.texto_descargo) {
        descargoTxt += `TEXTO DEL DESCARGO:
${"-".repeat(40)}
${descargoDB.texto_descargo}

`;
      }
      if (descargoDB.hash_sha256) {
        descargoTxt += `Hash SHA-256: ${descargoDB.hash_sha256}\n`;
      }
      if (descargoDB.contiene_admision !== null) {
        descargoTxt += `
ANÁLISIS DEL EMPLEADOR:
Contiene admisión: ${descargoDB.contiene_admision ? "SÍ" : "NO"}
Contiene contradicción: ${descargoDB.contiene_contradiccion ? "SÍ" : "NO"}
`;
        if (descargoDB.notas_empleador) {
          descargoTxt += `Notas: ${descargoDB.notas_empleador}\n`;
        }
      }
      descargoFolder?.file("descargo.txt", descargoTxt);
    }

    // Agregar bitácora de contexto (Fase 3)
    if (bitacoraDB && bitacoraDB.length > 0) {
      const bitacoraFolder = zip.folder("bitacora_contexto");
      bitacoraFolder?.file("contexto_conducta.json", JSON.stringify(bitacoraDB, null, 2));

      let bitacoraTxt = `CONTEXTO DE CONDUCTA - BITÁCORA DE NOVEDADES
${"=".repeat(60)}

Este documento contiene el historial de gestión progresiva
del empleado previo a la sanción. Demuestra que el empleador
ejerció su facultad de dirección y organización (Art. 64 LCT)
de manera gradual y documentada.

Total de entradas: ${bitacoraDB.length}
${"=".repeat(60)}

`;
      for (const entrada of bitacoraDB) {
        bitacoraTxt += `[${entrada.fecha_hecho}] ${(entrada.tipo || "").toUpperCase()}
Título: ${entrada.titulo}
Descripción: ${entrada.descripcion}
`;
        if (entrada.hash_sha256) {
          bitacoraTxt += `Hash: ${entrada.hash_sha256}\n`;
        }
        bitacoraTxt += "\n";
      }
      bitacoraFolder?.file("contexto_conducta.txt", bitacoraTxt);
    }

    // Agregar carpeta de verificación con hashes
    const verificacionFolder = zip.folder("verificacion");
    const hashes: Record<string, string> = {
      "sancion_original.pdf": notificacion.hash_sha256,
    };
    if (descargoDB?.hash_sha256) {
      hashes["descargo/descargo.json"] = descargoDB.hash_sha256;
    }
    testigosDB?.forEach((t, i) => {
      if (t.hash_declaracion) {
        hashes[`declaraciones_testigos/testigo_${(i + 1).toString().padStart(2, "0")}.pdf`] = t.hash_declaracion;
      }
    });
    evidenciaDB?.forEach((ev, i) => {
      hashes[`evidencia_multimedia/${(i + 1).toString().padStart(2, "0")}_${ev.tipo}_${ev.nombre_archivo}`] = ev.hash_sha256;
    });
    bitacoraDB?.forEach((b) => {
      if (b.hash_sha256) {
        hashes[`bitacora_contexto/${b.id}`] = b.hash_sha256;
      }
    });
    verificacionFolder?.file("hashes.json", JSON.stringify(hashes, null, 2));

    let hashesTxt = `LISTADO DE HASHES SHA-256
${"=".repeat(60)}

Generado: ${fechaGeneracion}

`;
    for (const [archivo, hash] of Object.entries(hashes)) {
      hashesTxt += `${hash}  ${archivo}\n`;
    }
    verificacionFolder?.file("hashes.txt", hashesTxt);

    const instrucciones = `INSTRUCCIONES PARA VERIFICACIÓN DE INTEGRIDAD
${"=".repeat(60)}

Para verificar que un archivo no fue alterado:

1. Calcule el hash SHA-256 del archivo
   Linux/Mac: sha256sum nombre_archivo
   Windows: certutil -hashfile nombre_archivo SHA256

2. Compare con el hash correspondiente en hashes.json

3. Si coinciden, el archivo es íntegro

${"=".repeat(60)}
`;
    verificacionFolder?.file("instrucciones.txt", instrucciones);

    // Agregar README
    let folderIndex = 5;
    const testigosInfo = testigosPdfs.length > 0
      ? `
${folderIndex++}. declaraciones_testigos/
   Carpeta con ${testigosPdfs.length} declaracion(es) testimonial(es) firmada(s)
   digitalmente. Cada PDF contiene:
   - Datos del testigo y su relacion con el incidente
   - Descripcion de lo que presencio
   - Declaracion jurada bajo apercibimiento de falso testimonio (Art. 275 CP)
   - Hash SHA-256 de la declaracion
   - Timestamp e IP de firma

`
      : "";
    const evidenciaInfo = evidenciaFiles.length > 0
      ? `
${folderIndex++}. evidencia_multimedia/
   Carpeta con ${evidenciaFiles.length} archivo(s) de evidencia:
${evidenciaDB?.map((ev) => `   - ${ev.nombre_archivo} (${ev.tipo})${ev.exif_fecha_captura ? " [EXIF verificado]" : ""}`).join("\n") || ""}

   Los archivos incluyen metadatos EXIF originales (fecha, GPS, dispositivo)
   que prueban cuando y donde fueron capturados.

`
      : "";
    const descargoInfo = descargoDB?.confirmado_at
      ? `
${folderIndex++}. descargo/
   Carpeta con el descargo del empleado:
   - descargo.json: Datos estructurados del descargo
   - descargo.txt: Version legible

   Decision: ${descargoDB.decision === "ejercer_descargo" ? "EJERCIO DESCARGO" : "DECLINO DESCARGO"}
${descargoDB.contiene_admision ? "   ⚠️ CONTIENE ADMISION DE HECHOS" : ""}
${descargoDB.contiene_contradiccion ? "   ⚠️ CONTIENE CONTRADICCION" : ""}

`
      : "";
    const bitacoraInfo = bitacoraDB && bitacoraDB.length > 0
      ? `
${folderIndex++}. bitacora_contexto/
   Carpeta con el historial de gestion progresiva del empleado:
   - contexto_conducta.json: Datos estructurados
   - contexto_conducta.txt: Version legible

   Total de entradas de contexto: ${bitacoraDB.length}
   Demuestra gestion progresiva (Art. 64 LCT), no persecucion.

`
      : "";
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

3. protocolo_preservacion.pdf
   Documentacion tecnica para peritos informaticos. Explica como
   funciona SHA-256, la cadena de custodia y como verificar integridad.

4. metadata.json
   Datos tecnicos en formato estructurado para verificacion
   programatica de la integridad del documento.
${testigosInfo}${evidenciaInfo}${descargoInfo}${bitacoraInfo}${folderIndex}. verificacion/
   Carpeta con hashes SHA-256 de todos los archivos e instrucciones
   para verificar que ningun documento fue alterado.

VERIFICACION DE INTEGRIDAD:
---------------------------
Para verificar que el documento no fue alterado:

1. Calcule el hash SHA-256 del archivo sancion_original.pdf
2. Compare con el valor en metadata.json > integridad > hash_documento
3. Si coinciden, el documento es autentico e inalterado

En Linux/Mac: sha256sum sancion_original.pdf
En Windows: certutil -hashfile sancion_original.pdf SHA256
${testigosPdfs.length > 0 ? `
DECLARACIONES TESTIMONIALES:
----------------------------
Este paquete incluye ${testigosPdfs.length} declaracion(es) de testigo(s).
Cada declaracion fue firmada digitalmente EN EL MOMENTO del incidente,
no meses despues en un juicio. Esto es clave porque:

- El testigo declaro cuando los hechos estaban frescos
- La declaracion tiene hash SHA-256 inmutable
- Si el testigo cambia su version en juicio, tenes la declaracion original
- Constituye prueba bajo apercibimiento de falso testimonio (Art. 275 CP)
` : ""}${evidenciaFiles.length > 0 ? `
EVIDENCIA MULTIMEDIA:
---------------------
Este paquete incluye ${evidenciaFiles.length} archivo(s) de evidencia multimedia.
Los metadatos EXIF extraidos (si existen) prueban:

- Fecha y hora exacta de captura (no la fecha de subida)
- Ubicacion GPS donde se tomo la foto/video
- Dispositivo utilizado

Cada archivo tiene un hash SHA-256 unico que garantiza que no fue modificado.
` : ""}
VALIDEZ LEGAL:
--------------
Este paquete de evidencia constituye prueba de:
- Existencia del documento en la fecha indicada
- Intento de notificacion fehaciente al empleado
- Recepcion y lectura por parte del empleado (si aplica)
- Transcurso del plazo de 30 dias sin impugnacion (si aplica)${testigosPdfs.length > 0 ? `
- Declaraciones testimoniales firmadas bajo juramento (Art. 275 CP)` : ""}${evidenciaFiles.length > 0 ? `
- Evidencia multimedia con metadatos EXIF verificados` : ""}${descargoDB?.confirmado_at ? `
- Ejercicio del derecho a defensa (Art. 67 LCT) - El empleado ${descargoDB.decision === "ejercer_descargo" ? "presento su descargo" : "declino presentar descargo"}` : ""}${bitacoraDB && bitacoraDB.length > 0 ? `
- Gestion progresiva documentada (Art. 64 LCT) - ${bitacoraDB.length} antecedentes registrados` : ""}

Conforme a la Ley 27.742 de Modernizacion Laboral, las sanciones
no impugnadas dentro de los 30 dias corridos constituyen prueba
plena en caso de litigio laboral.
${descargoDB?.contiene_admision ? `
⚠️ IMPORTANTE: El descargo del empleado CONTIENE ADMISION DE HECHOS.
Esto puede ser utilizado como prueba en juicio.
` : ""}${descargoDB?.contiene_contradiccion ? `
⚠️ IMPORTANTE: El descargo del empleado CONTIENE CONTRADICCIONES.
Esto puede ser utilizado para impugnar su version.
` : ""}
---
Generado: ${fechaGeneracion}
ID: ${notificacion.id}
Testigos firmados: ${testigosPdfs.length}
Archivos de evidencia: ${evidenciaFiles.length}
Descargo: ${descargoDB?.confirmado_at ? (descargoDB.decision === "ejercer_descargo" ? "PRESENTADO" : "DECLINADO") : "PENDIENTE"}
Entradas de bitacora: ${bitacoraDB?.length || 0}
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
    declaracion_testigo: "Declaracion testimonial firmada",
    invitacion_testigo: "Invitacion a testigo enviada",
    evidencia_subida: "Evidencia multimedia subida",
  };
  return titles[tipo] || tipo.replace(/_/g, " ");
}
