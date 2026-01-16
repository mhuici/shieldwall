import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { TEXTOS_LEGALES } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  header: {
    borderBottom: "2 solid #166534",
    paddingBottom: 15,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#166534",
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
    color: "#166534",
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
  declaracionBox: {
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderRadius: 4,
    marginTop: 10,
    border: "1 solid #86efac",
  },
  declaracionText: {
    fontSize: 11,
    color: "#14532d",
    fontStyle: "italic",
  },
  juramentoBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#fefce8",
    borderLeft: "3 solid #ca8a04",
  },
  juramentoTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#854d0e",
    marginBottom: 5,
  },
  juramentoText: {
    fontSize: 9,
    color: "#713f12",
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
    fontSize: 8,
    fontFamily: "Courier",
    color: "#333",
    wordBreak: "break-all",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 8,
    color: "#888",
    borderTop: "1 solid #ddd",
    paddingTop: 10,
  },
  firmaSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f0f9ff",
    border: "1 solid #0ea5e9",
    borderRadius: 4,
  },
  firmaTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0c4a6e",
    marginBottom: 8,
  },
  firmaCheck: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  checkBox: {
    width: 12,
    height: 12,
    border: "1 solid #0ea5e9",
    marginRight: 8,
    backgroundColor: "#0ea5e9",
  },
  checkText: {
    fontSize: 9,
    color: "#0c4a6e",
  },
});

interface DeclaracionTestigoPDFProps {
  testigo: {
    nombre_completo: string;
    cargo?: string;
    cuil?: string;
    relacion: string;
    presente_en_hecho: boolean;
  };
  declaracion: {
    descripcion: string;
    timestamp: string;
    ip: string;
    hash: string;
  };
  incidente: {
    fecha_hecho: string;
    hora_hecho?: string;
    lugar_hecho?: string;
    motivo: string;
    empleado_nombre: string;
  };
  empresa: {
    razon_social: string;
    cuit: string;
  };
}

export function DeclaracionTestigoPDF({
  testigo,
  declaracion,
  incidente,
  empresa,
}: DeclaracionTestigoPDFProps) {
  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return fecha;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return timestamp;
    }
  };

  const relacionLabels: Record<string, string> = {
    empleado: "Empleado",
    supervisor: "Supervisor",
    cliente: "Cliente",
    proveedor: "Proveedor",
    otro: "Otro",
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>DECLARACIÓN TESTIMONIAL</Text>
          <Text style={styles.headerSubtitle}>
            Documento con validez legal - Firmado digitalmente
          </Text>
        </View>

        {/* Datos de la Empresa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EMPRESA SOLICITANTE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Razón Social:</Text>
            <Text style={styles.value}>{empresa.razon_social}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>CUIT:</Text>
            <Text style={styles.value}>{empresa.cuit}</Text>
          </View>
        </View>

        {/* Datos del Testigo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL TESTIGO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre Completo:</Text>
            <Text style={styles.value}>{testigo.nombre_completo}</Text>
          </View>
          {testigo.cargo && (
            <View style={styles.row}>
              <Text style={styles.label}>Cargo:</Text>
              <Text style={styles.value}>{testigo.cargo}</Text>
            </View>
          )}
          {testigo.cuil && (
            <View style={styles.row}>
              <Text style={styles.label}>CUIL:</Text>
              <Text style={styles.value}>{testigo.cuil}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Relación:</Text>
            <Text style={styles.value}>{relacionLabels[testigo.relacion] || testigo.relacion}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Presente en el hecho:</Text>
            <Text style={styles.value}>{testigo.presente_en_hecho ? "Sí" : "No"}</Text>
          </View>
        </View>

        {/* Datos del Incidente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INCIDENTE REFERIDO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha del hecho:</Text>
            <Text style={styles.value}>
              {formatFecha(incidente.fecha_hecho)}
              {incidente.hora_hecho && ` a las ${incidente.hora_hecho}`}
            </Text>
          </View>
          {incidente.lugar_hecho && (
            <View style={styles.row}>
              <Text style={styles.label}>Lugar:</Text>
              <Text style={styles.value}>{incidente.lugar_hecho}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Motivo:</Text>
            <Text style={styles.value}>{incidente.motivo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Empleado involucrado:</Text>
            <Text style={styles.value}>{incidente.empleado_nombre}</Text>
          </View>
        </View>

        {/* Declaración del Testigo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DECLARACIÓN DEL TESTIGO</Text>
          <View style={styles.declaracionBox}>
            <Text style={styles.declaracionText}>
              &quot;{declaracion.descripcion}&quot;
            </Text>
          </View>
        </View>

        {/* Declaración Jurada */}
        <View style={styles.juramentoBox}>
          <Text style={styles.juramentoTitle}>DECLARACIÓN JURADA</Text>
          <Text style={styles.juramentoText}>
            {TEXTOS_LEGALES.CHECKBOX_DECLARACION_TESTIGO}
          </Text>
        </View>

        {/* Confirmación de firma */}
        <View style={styles.firmaSection}>
          <Text style={styles.firmaTitle}>CONFIRMACIÓN DE FIRMA DIGITAL</Text>
          <View style={styles.firmaCheck}>
            <View style={styles.checkBox} />
            <Text style={styles.checkText}>
              El testigo aceptó la declaración jurada y firmó digitalmente
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha y hora de firma:</Text>
            <Text style={styles.value}>{formatTimestamp(declaracion.timestamp)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>IP de origen:</Text>
            <Text style={styles.value}>{declaracion.ip}</Text>
          </View>
        </View>

        {/* Certificación Criptográfica */}
        <View style={styles.hashSection}>
          <Text style={styles.hashTitle}>CERTIFICACIÓN CRIPTOGRÁFICA</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Hash SHA-256:</Text>
          </View>
          <Text style={styles.hashValue}>{declaracion.hash}</Text>
          <Text style={{ fontSize: 8, color: "#666", marginTop: 5 }}>
            Este hash garantiza que el contenido de esta declaración no ha sido alterado.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Documento generado por NotiLegal - Sistema de Gestión Laboral Digital
          </Text>
          <Text>
            Este documento constituye prueba testimonial válida conforme a la legislación vigente.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
