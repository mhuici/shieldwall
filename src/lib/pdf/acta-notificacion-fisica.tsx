/**
 * PDF: Acta de Notificación Física
 *
 * Se genera cuando la notificación digital falla (semáforo rojo).
 * Incluye:
 * - Datos completos de la sanción
 * - Espacios para firmas (Empleador, Empleado, 2 Testigos)
 * - Texto legal adecuado según normativa laboral argentina
 * - Campo para fecha/hora de entrega
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatearCUIL } from "@/lib/validators";

// Estilos
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  header: {
    textAlign: "center",
    marginBottom: 25,
    borderBottom: "2pt solid #000",
    paddingBottom: 15,
  },
  titulo: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  subtitulo: {
    fontSize: 12,
    color: "#444",
  },
  seccion: {
    marginBottom: 20,
  },
  seccionTitulo: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
    padding: 5,
  },
  fila: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: "35%",
    fontFamily: "Helvetica-Bold",
  },
  valor: {
    width: "65%",
  },
  parrafo: {
    marginBottom: 10,
    textAlign: "justify",
  },
  parrafoLegal: {
    marginBottom: 10,
    textAlign: "justify",
    fontSize: 10,
    color: "#333",
  },
  firmaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  firmaBox: {
    width: "45%",
    borderTop: "1pt solid #000",
    paddingTop: 8,
    marginTop: 60,
  },
  firmaLabel: {
    fontSize: 10,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },
  firmaLinea: {
    fontSize: 9,
    textAlign: "center",
    color: "#666",
    marginTop: 3,
  },
  testigos: {
    marginTop: 30,
    borderTop: "1pt solid #ccc",
    paddingTop: 20,
  },
  testigoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  testigoBox: {
    width: "45%",
  },
  testigoLinea: {
    borderBottom: "1pt solid #000",
    height: 20,
    marginBottom: 5,
  },
  testigoLabel: {
    fontSize: 9,
    color: "#666",
  },
  alerta: {
    backgroundColor: "#fff3cd",
    border: "1pt solid #ffc107",
    padding: 10,
    marginBottom: 20,
  },
  alertaTexto: {
    fontSize: 10,
    color: "#856404",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    fontSize: 8,
    color: "#999",
    textAlign: "center",
    borderTop: "1pt solid #eee",
    paddingTop: 10,
  },
  campoFecha: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f9f9f9",
    border: "1pt solid #ddd",
  },
  campoFechaLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  campoFechaLinea: {
    borderBottom: "1pt solid #000",
    height: 25,
  },
});

// Props
interface ActaNotificacionFisicaProps {
  notificacion: {
    id: string;
    tipo: string;
    motivo: string;
    descripcion: string;
    fecha_hecho: string;
    fecha_vencimiento: string;
    hash_sha256: string;
    timestamp_generacion: string;
  };
  empresa: {
    razon_social: string;
    cuit: string;
    direccion?: string;
  };
  empleado: {
    nombre: string;
    cuil: string;
  };
  motivoContingencia?: string;
}

export function ActaNotificacionFisica({
  notificacion,
  empresa,
  empleado,
  motivoContingencia = "Notificación digital no confirmada en el plazo establecido",
}: ActaNotificacionFisicaProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const tipoLabel =
    notificacion.tipo === "apercibimiento" ? "APERCIBIMIENTO" :
    notificacion.tipo === "suspension" ? "SUSPENSIÓN" :
    notificacion.tipo === "apercibimiento_previo_despido" ? "APERCIBIMIENTO PREVIO AL DESPIDO" :
    notificacion.tipo.toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.titulo}>ACTA DE NOTIFICACIÓN FÍSICA</Text>
          <Text style={styles.subtitulo}>Sanción Disciplinaria Laboral</Text>
        </View>

        {/* Alerta de contingencia */}
        <View style={styles.alerta}>
          <Text style={styles.alertaTexto}>
            MOTIVO DE NOTIFICACIÓN FÍSICA: {motivoContingencia}
          </Text>
        </View>

        {/* Datos del Empleador */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>DATOS DEL EMPLEADOR</Text>
          <View style={styles.fila}>
            <Text style={styles.label}>Razón Social:</Text>
            <Text style={styles.valor}>{empresa.razon_social}</Text>
          </View>
          <View style={styles.fila}>
            <Text style={styles.label}>CUIT:</Text>
            <Text style={styles.valor}>{formatearCUIL(empresa.cuit)}</Text>
          </View>
          {empresa.direccion && (
            <View style={styles.fila}>
              <Text style={styles.label}>Domicilio Legal:</Text>
              <Text style={styles.valor}>{empresa.direccion}</Text>
            </View>
          )}
        </View>

        {/* Datos del Empleado */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>DATOS DEL EMPLEADO NOTIFICADO</Text>
          <View style={styles.fila}>
            <Text style={styles.label}>Nombre y Apellido:</Text>
            <Text style={styles.valor}>{empleado.nombre}</Text>
          </View>
          <View style={styles.fila}>
            <Text style={styles.label}>CUIL:</Text>
            <Text style={styles.valor}>{formatearCUIL(empleado.cuil)}</Text>
          </View>
        </View>

        {/* Datos de la Sanción */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>SANCIÓN COMUNICADA</Text>
          <View style={styles.fila}>
            <Text style={styles.label}>Tipo de Sanción:</Text>
            <Text style={styles.valor}>{tipoLabel}</Text>
          </View>
          <View style={styles.fila}>
            <Text style={styles.label}>Motivo:</Text>
            <Text style={styles.valor}>{notificacion.motivo}</Text>
          </View>
          <View style={styles.fila}>
            <Text style={styles.label}>Fecha del Hecho:</Text>
            <Text style={styles.valor}>{formatDate(notificacion.fecha_hecho)}</Text>
          </View>
          <Text style={{ marginTop: 10, fontFamily: "Helvetica-Bold" }}>
            Descripción de los Hechos:
          </Text>
          <Text style={{ marginTop: 5, padding: 8, backgroundColor: "#f5f5f5" }}>
            {notificacion.descripcion}
          </Text>
        </View>

        {/* Texto Legal */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>CONSTANCIA DE NOTIFICACIÓN</Text>
          <Text style={styles.parrafo}>
            Por la presente, se deja constancia de que el/la trabajador/a arriba mencionado/a
            queda formalmente NOTIFICADO/A de la sanción disciplinaria detallada en el
            presente documento, de conformidad con lo dispuesto en los artículos 67, 68,
            218 y concordantes de la Ley de Contrato de Trabajo N° 20.744.
          </Text>
          <Text style={styles.parrafo}>
            Se hace saber que dispone de TREINTA (30) DÍAS CORRIDOS contados desde la
            fecha de la presente notificación para impugnar la sanción aplicada.
            Transcurrido dicho plazo sin que se formule oposición, la sanción quedará
            FIRME y adquirirá valor de PRUEBA PLENA en caso de litigio laboral.
          </Text>
          <Text style={styles.parrafoLegal}>
            PLAZO DE IMPUGNACIÓN: Hasta el {formatDate(notificacion.fecha_vencimiento)}
          </Text>
        </View>

        {/* Campo para fecha/hora de entrega */}
        <View style={styles.campoFecha}>
          <Text style={styles.campoFechaLabel}>
            FECHA Y HORA DE ENTREGA (completar al momento de la notificación):
          </Text>
          <View style={styles.campoFechaLinea} />
        </View>

        {/* Firmas principales */}
        <View style={styles.firmaContainer}>
          <View style={styles.firmaBox}>
            <Text style={styles.firmaLabel}>EMPLEADOR / REPRESENTANTE</Text>
            <Text style={styles.firmaLinea}>Firma, aclaración y cargo</Text>
          </View>
          <View style={styles.firmaBox}>
            <Text style={styles.firmaLabel}>EMPLEADO/A NOTIFICADO/A</Text>
            <Text style={styles.firmaLinea}>Firma y aclaración</Text>
          </View>
        </View>

        {/* Testigos */}
        <View style={styles.testigos}>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 5 }}>
            TESTIGOS DE LA NOTIFICACIÓN:
          </Text>
          <Text style={{ fontSize: 9, color: "#666", marginBottom: 10 }}>
            (En caso de negativa del empleado a firmar, la notificación será válida
            con la firma de dos testigos que certifiquen la entrega)
          </Text>

          <View style={styles.testigoRow}>
            <View style={styles.testigoBox}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>TESTIGO 1:</Text>
              <View style={styles.testigoLinea} />
              <Text style={styles.testigoLabel}>Nombre y Apellido</Text>
              <View style={styles.testigoLinea} />
              <Text style={styles.testigoLabel}>DNI</Text>
              <View style={styles.testigoLinea} />
              <Text style={styles.testigoLabel}>Firma</Text>
            </View>
            <View style={styles.testigoBox}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>TESTIGO 2:</Text>
              <View style={styles.testigoLinea} />
              <Text style={styles.testigoLabel}>Nombre y Apellido</Text>
              <View style={styles.testigoLinea} />
              <Text style={styles.testigoLabel}>DNI</Text>
              <View style={styles.testigoLinea} />
              <Text style={styles.testigoLabel}>Firma</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>ID: {notificacion.id}</Text>
          <Text>Generado por NotiLegal - Sistema de Notificaciones Laborales</Text>
          <Text>Hash de integridad: {notificacion.hash_sha256?.substring(0, 32)}...</Text>
        </View>
      </Page>
    </Document>
  );
}
