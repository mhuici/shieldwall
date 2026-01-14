import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Registrar fuente (usando Helvetica por defecto)
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  header: {
    borderBottom: "2 solid #1e3a5f",
    paddingBottom: 15,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a5f",
    textAlign: "center",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 8,
    borderBottom: "1 solid #e0e0e0",
    paddingBottom: 3,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 140,
    fontWeight: "bold",
    color: "#444",
  },
  value: {
    flex: 1,
    color: "#222",
  },
  descripcion: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 4,
    marginTop: 5,
  },
  legalNotice: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#e8f4fd",
    borderLeft: "3 solid #1e3a5f",
  },
  legalTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 5,
  },
  legalText: {
    fontSize: 9,
    color: "#333",
    lineHeight: 1.4,
  },
  hashSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f9f9f9",
    border: "1 solid #ddd",
  },
  hashTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5,
  },
  hashValue: {
    fontFamily: "Courier",
    fontSize: 8,
    backgroundColor: "#fff",
    padding: 5,
    wordBreak: "break-all",
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
    fontSize: 8,
    color: "#999",
  },
  watermark: {
    position: "absolute",
    top: "40%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-45deg)",
    fontSize: 60,
    color: "#f0f0f0",
    opacity: 0.3,
  },
});

interface SancionPDFProps {
  notificacion: {
    id: string;
    tipo: string;
    motivo: string;
    descripcion: string;
    fecha_hecho: string;
    hash_sha256: string;
    timestamp_generacion: string;
    fecha_vencimiento: string;
    created_at: string;
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
}

export function SancionPDF({ notificacion, empresa, empleado }: SancionPDFProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCUIT = (cuit: string) => {
    const clean = cuit.replace(/\D/g, "");
    if (clean.length !== 11) return cuit;
    return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
  };

  const tipoLabel = {
    apercibimiento: "APERCIBIMIENTO",
    suspension: "SUSPENSIÓN",
    otro: "OTRA SANCIÓN",
  }[notificacion.tipo] || notificacion.tipo.toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>NOTIFICACIÓN DE {tipoLabel}</Text>
          <Text style={styles.headerSubtitle}>
            Documento con validez legal - Art. 67 LCT y Reforma Laboral 2024
          </Text>
        </View>

        {/* Datos del Empleador */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL EMPLEADOR</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Razón Social:</Text>
            <Text style={styles.value}>{empresa.razon_social}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>CUIT:</Text>
            <Text style={styles.value}>{formatCUIT(empresa.cuit)}</Text>
          </View>
          {empresa.direccion && (
            <View style={styles.row}>
              <Text style={styles.label}>Dirección:</Text>
              <Text style={styles.value}>{empresa.direccion}</Text>
            </View>
          )}
        </View>

        {/* Datos del Empleado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL EMPLEADO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre Completo:</Text>
            <Text style={styles.value}>{empleado.nombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>CUIL:</Text>
            <Text style={styles.value}>{formatCUIT(empleado.cuil)}</Text>
          </View>
        </View>

        {/* Detalles de la Sanción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALLES DE LA SANCIÓN</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tipo de Sanción:</Text>
            <Text style={styles.value}>{tipoLabel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Motivo:</Text>
            <Text style={styles.value}>{notificacion.motivo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha del Hecho:</Text>
            <Text style={styles.value}>{formatDate(notificacion.fecha_hecho)}</Text>
          </View>
          <Text style={{ ...styles.label, marginTop: 10 }}>Descripción de los Hechos:</Text>
          <View style={styles.descripcion}>
            <Text>{notificacion.descripcion}</Text>
          </View>
        </View>

        {/* Aviso Legal */}
        <View style={styles.legalNotice}>
          <Text style={styles.legalTitle}>IMPORTANTE - LEA ATENTAMENTE</Text>
          <Text style={styles.legalText}>
            Conforme a la normativa laboral vigente, usted dispone de TREINTA (30) DÍAS CORRIDOS
            desde la recepción de esta notificación para impugnar la presente sanción.
            Transcurrido dicho plazo sin objeciones, la sanción quedará firme y tendrá valor
            de PRUEBA PLENA en caso de litigio laboral.
          </Text>
          <Text style={{ ...styles.legalText, marginTop: 5 }}>
            Fecha límite para impugnar: {formatDate(notificacion.fecha_vencimiento)}
          </Text>
        </View>

        {/* Hash de Verificación */}
        <View style={styles.hashSection}>
          <Text style={styles.hashTitle}>CERTIFICACIÓN CRIPTOGRÁFICA</Text>
          <Text style={{ fontSize: 9, marginBottom: 5 }}>
            Este documento ha sido generado digitalmente con hash SHA-256 para garantizar
            su integridad y autenticidad.
          </Text>
          <View style={styles.row}>
            <Text style={{ ...styles.label, width: 80 }}>ID:</Text>
            <Text style={{ fontSize: 8, fontFamily: "Courier" }}>{notificacion.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ ...styles.label, width: 80 }}>Timestamp:</Text>
            <Text style={{ fontSize: 8, fontFamily: "Courier" }}>{notificacion.timestamp_generacion}</Text>
          </View>
          <Text style={{ ...styles.label, marginTop: 5 }}>Hash SHA-256:</Text>
          <Text style={styles.hashValue}>{notificacion.hash_sha256}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generado por NotiLegal - {formatDate(notificacion.created_at)}
          </Text>
          <Text style={styles.footerText}>
            Verificar en: notilegal.com.ar/ver/{notificacion.id}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
