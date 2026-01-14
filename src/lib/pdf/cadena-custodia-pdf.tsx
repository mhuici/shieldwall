import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  header: {
    borderBottom: "2 solid #1e3a5f",
    paddingBottom: 15,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e3a5f",
    textAlign: "center",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 9,
    color: "#666",
    textAlign: "center",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 8,
    borderBottom: "1 solid #e0e0e0",
    paddingBottom: 3,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: 120,
    fontWeight: "bold",
    color: "#444",
    fontSize: 9,
  },
  value: {
    flex: 1,
    color: "#222",
    fontSize: 9,
  },
  timelineContainer: {
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 10,
    borderLeft: "2 solid #1e3a5f",
  },
  timelineTime: {
    width: 130,
    fontSize: 8,
    fontFamily: "Courier",
    color: "#666",
  },
  timelineEvent: {
    flex: 1,
  },
  timelineEventTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#333",
  },
  timelineEventDetail: {
    fontSize: 8,
    color: "#666",
    marginTop: 1,
  },
  hashBox: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    marginTop: 10,
    borderRadius: 4,
  },
  hashLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 3,
  },
  hashValue: {
    fontFamily: "Courier",
    fontSize: 7,
    color: "#333",
    wordBreak: "break-all",
  },
  legalNotice: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#e8f4fd",
    borderLeft: "3 solid #1e3a5f",
  },
  legalText: {
    fontSize: 8,
    color: "#333",
    lineHeight: 1.3,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    borderTop: "1 solid #e0e0e0",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#999",
  },
  summaryBox: {
    backgroundColor: "#f0fdf4",
    padding: 12,
    marginTop: 15,
    border: "1 solid #86efac",
    borderRadius: 4,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 9,
    color: "#166534",
  },
});

export interface EventoCadena {
  fecha: string;
  tipo: string;
  titulo: string;
  detalle?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

interface CadenaCustodiaPDFProps {
  notificacion: {
    id: string;
    tipo: string;
    motivo: string;
    fecha_hecho: string;
    hash_sha256: string;
    timestamp_generacion: string;
    fecha_vencimiento: string | null;
    created_at: string;
    estado: string;
  };
  empresa: {
    razon_social: string;
    cuit: string;
  };
  empleado: {
    nombre: string;
    cuil: string;
  };
  eventos: EventoCadena[];
  fechaGeneracion: string;
}

export function CadenaCustodiaPDF({
  notificacion,
  empresa,
  empleado,
  eventos,
  fechaGeneracion,
}: CadenaCustodiaPDFProps) {
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
      second: "2-digit",
    });
  };

  const formatCUIT = (cuit: string) => {
    const clean = cuit.replace(/\D/g, "");
    if (clean.length !== 11) return cuit;
    return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
  };

  // Determinar si la sancion es firme
  const esFirme = notificacion.estado === "firme";
  const tieneConfirmacion = eventos.some(
    (e) => e.tipo === "lectura_confirmada" || e.tipo === "confirmacion_lectura"
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CADENA DE CUSTODIA DIGITAL</Text>
          <Text style={styles.headerSubtitle}>
            Paquete de Evidencia - Notificación Laboral Fehaciente
          </Text>
        </View>

        {/* Datos de la Notificación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IDENTIFICACION DEL DOCUMENTO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>ID Notificacion:</Text>
            <Text style={{ ...styles.value, fontFamily: "Courier", fontSize: 8 }}>
              {notificacion.id}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tipo de Sancion:</Text>
            <Text style={styles.value}>{notificacion.tipo.toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Motivo:</Text>
            <Text style={styles.value}>{notificacion.motivo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha del Hecho:</Text>
            <Text style={styles.value}>{formatDate(notificacion.fecha_hecho)}</Text>
          </View>
        </View>

        {/* Partes Involucradas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PARTES INVOLUCRADAS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Empleador:</Text>
            <Text style={styles.value}>
              {empresa.razon_social} (CUIT: {formatCUIT(empresa.cuit)})
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Empleado:</Text>
            <Text style={styles.value}>
              {empleado.nombre} (CUIL: {formatCUIT(empleado.cuil)})
            </Text>
          </View>
        </View>

        {/* Timeline de Eventos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CRONOLOGIA DE EVENTOS</Text>
          <View style={styles.timelineContainer}>
            {eventos.map((evento, index) => (
              <View key={index} style={styles.timelineItem}>
                <Text style={styles.timelineTime}>
                  {formatDateTime(evento.fecha)}
                </Text>
                <View style={styles.timelineEvent}>
                  <Text style={styles.timelineEventTitle}>{evento.titulo}</Text>
                  {evento.detalle && (
                    <Text style={styles.timelineEventDetail}>{evento.detalle}</Text>
                  )}
                  {evento.ip && (
                    <Text style={styles.timelineEventDetail}>IP: {evento.ip}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Hash del Documento */}
        <View style={styles.hashBox}>
          <Text style={styles.hashLabel}>INTEGRIDAD CRIPTOGRAFICA</Text>
          <View style={styles.row}>
            <Text style={{ ...styles.label, fontSize: 8 }}>Algoritmo:</Text>
            <Text style={{ ...styles.value, fontSize: 8 }}>SHA-256</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ ...styles.label, fontSize: 8 }}>Timestamp:</Text>
            <Text style={{ ...styles.value, fontSize: 8, fontFamily: "Courier" }}>
              {notificacion.timestamp_generacion}
            </Text>
          </View>
          <Text style={{ ...styles.hashLabel, marginTop: 5 }}>Hash del Documento:</Text>
          <Text style={styles.hashValue}>{notificacion.hash_sha256}</Text>
        </View>

        {/* Resumen Legal */}
        {esFirme && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>SANCION FIRME</Text>
            <Text style={styles.summaryText}>
              Esta sancion ha adquirido firmeza al transcurrir 30 dias corridos
              sin impugnacion por parte del trabajador, conforme a la Ley 27.742
              de Modernizacion Laboral. El presente documento constituye PRUEBA
              PLENA en cualquier proceso judicial o administrativo.
            </Text>
          </View>
        )}

        {!esFirme && tieneConfirmacion && notificacion.fecha_vencimiento && (
          <View style={styles.legalNotice}>
            <Text style={styles.legalText}>
              El trabajador confirmo recepcion de esta notificacion. El plazo de
              30 dias para impugnar vence el {formatDate(notificacion.fecha_vencimiento)}.
              Si no se registra impugnacion fehaciente antes de esa fecha, la
              sancion adquirira firmeza automaticamente.
            </Text>
          </View>
        )}

        {/* Aviso Legal */}
        <View style={styles.legalNotice}>
          <Text style={styles.legalText}>
            Este documento es parte del Paquete de Evidencia generado por NotiLegal
            y constituye registro inalterable de la cadena de custodia digital de
            la notificacion laboral. La integridad del documento original puede
            verificarse comparando el hash SHA-256 con el contenido del archivo
            "sancion_original.pdf" incluido en este paquete.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generado: {formatDateTime(fechaGeneracion)}
          </Text>
          <Text style={styles.footerText}>
            NotiLegal - notilegal.com.ar/ver/{notificacion.id}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
