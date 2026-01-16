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
  headerVersion: {
    fontSize: 8,
    color: "#999",
    textAlign: "center",
    marginTop: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 8,
    backgroundColor: "#f0f7ff",
    padding: 5,
  },
  sectionNumber: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 5,
  },
  paragraph: {
    fontSize: 9,
    color: "#333",
    marginBottom: 6,
    textAlign: "justify",
  },
  bulletItem: {
    fontSize: 9,
    color: "#333",
    marginBottom: 3,
    paddingLeft: 15,
  },
  codeBlock: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    marginVertical: 8,
    fontFamily: "Courier",
    fontSize: 8,
    color: "#333",
    borderLeft: "3 solid #1e3a5f",
  },
  infoBox: {
    backgroundColor: "#e8f4fd",
    padding: 10,
    marginVertical: 10,
    borderLeft: "3 solid #1e3a5f",
  },
  infoBoxTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 5,
  },
  infoBoxText: {
    fontSize: 8,
    color: "#333",
  },
  table: {
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e0e0e0",
    paddingVertical: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    paddingVertical: 5,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 8,
    fontWeight: "bold",
    color: "white",
    paddingHorizontal: 5,
  },
  tableCell: {
    flex: 1,
    fontSize: 8,
    color: "#333",
    paddingHorizontal: 5,
  },
  hashBox: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    marginVertical: 10,
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
  },
  warningBox: {
    backgroundColor: "#fff3cd",
    padding: 10,
    marginVertical: 10,
    borderLeft: "3 solid #ffc107",
  },
  warningText: {
    fontSize: 8,
    color: "#856404",
  },
  successBox: {
    backgroundColor: "#d4edda",
    padding: 10,
    marginVertical: 10,
    borderLeft: "3 solid #28a745",
  },
  successText: {
    fontSize: 8,
    color: "#155724",
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
  pageNumber: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  },
});

interface ProtocoloPreservacionPDFProps {
  notificacion: {
    id: string;
    tipo: string;
    hash_sha256: string;
    timestamp_generacion: string;
    created_at: string;
    estado: string;
  };
  empresa: {
    razon_social: string;
    cuit: string;
  };
  fechaGeneracion: string;
  totalArchivos: number;
  totalHashes: number;
}

export function ProtocoloPreservacionPDF({
  notificacion,
  empresa,
  fechaGeneracion,
  totalArchivos,
  totalHashes,
}: ProtocoloPreservacionPDFProps) {
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

  return (
    <Document>
      {/* Página 1: Introducción y Sistema */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            PROTOCOLO DE PRESERVACION DE EVIDENCIA DIGITAL
          </Text>
          <Text style={styles.headerSubtitle}>
            Sistema NotiLegal - Documentación Técnica para Peritaje Informático
          </Text>
          <Text style={styles.headerVersion}>
            Versión 1.0.0 - {formatDateTime(fechaGeneracion)}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>PROPÓSITO DE ESTE DOCUMENTO</Text>
          <Text style={styles.infoBoxText}>
            Este documento describe los mecanismos técnicos utilizados por NotiLegal
            para garantizar la integridad y autenticidad de la evidencia digital.
            Está dirigido a peritos informáticos, profesionales legales y jueces
            que requieran validar la cadena de custodia digital.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionNumber}>1. DESCRIPCIÓN DEL SISTEMA</Text>
          <Text style={styles.paragraph}>
            NotiLegal es una plataforma SaaS (Software as a Service) diseñada para
            la gestión de sanciones laborales con validez probatoria digital,
            conforme a la Ley 27.742 de Modernización Laboral.
          </Text>

          <Text style={{ ...styles.sectionTitle, fontSize: 10, marginTop: 10 }}>
            Stack Tecnológico:
          </Text>
          <Text style={styles.bulletItem}>• Framework: Next.js 15 (React Server Components)</Text>
          <Text style={styles.bulletItem}>• Base de datos: PostgreSQL (gestionada por Supabase)</Text>
          <Text style={styles.bulletItem}>• Almacenamiento: S3-compatible (Supabase Storage)</Text>
          <Text style={styles.bulletItem}>• Autenticación: Supabase Auth con RLS (Row Level Security)</Text>
          <Text style={styles.bulletItem}>• Región: AWS South America (São Paulo)</Text>
          <Text style={styles.bulletItem}>• Algoritmo de hash: SHA-256 (Secure Hash Algorithm)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionNumber}>2. MECANISMOS DE INTEGRIDAD</Text>

          <Text style={{ ...styles.sectionTitle, fontSize: 10, marginTop: 10 }}>
            2.1 Hash SHA-256
          </Text>
          <Text style={styles.paragraph}>
            Cada documento crítico tiene un hash SHA-256 único que actúa como
            "huella digital". El hash se calcula sobre el contenido completo del
            documento más metadatos como timestamp e IP de origen.
          </Text>

          <View style={styles.codeBlock}>
            <Text>hash = SHA256(contenido + timestamp + IP + metadata)</Text>
          </View>

          <Text style={styles.paragraph}>
            Propiedades del algoritmo SHA-256:
          </Text>
          <Text style={styles.bulletItem}>• Determinístico: mismo input produce siempre mismo hash</Text>
          <Text style={styles.bulletItem}>• Unidireccional: imposible revertir el hash al contenido</Text>
          <Text style={styles.bulletItem}>• Colisión-resistente: extremadamente improbable generar colisiones</Text>
          <Text style={styles.bulletItem}>• Efecto avalancha: cambiar 1 bit modifica ~50% del hash</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            NotiLegal - Protocolo de Preservación v1.0.0
          </Text>
          <Text style={styles.footerText}>
            Página 1 de 3
          </Text>
        </View>
      </Page>

      {/* Página 2: Timestamps y Cadena de Custodia */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, fontSize: 10 }}>
            2.2 Timestamps Certificados
          </Text>
          <Text style={styles.paragraph}>
            Todos los eventos se registran con:
          </Text>
          <Text style={styles.bulletItem}>• Formato: ISO 8601 con timezone (ej: 2026-01-15T14:30:00Z)</Text>
          <Text style={styles.bulletItem}>• Fuente: Servidor sincronizado vía NTP (Network Time Protocol)</Text>
          <Text style={styles.bulletItem}>• Precisión: Milisegundos</Text>
          <Text style={styles.bulletItem}>• Almacenamiento: Columnas TIMESTAMPTZ de PostgreSQL</Text>

          <Text style={{ ...styles.sectionTitle, fontSize: 10, marginTop: 15 }}>
            2.3 Registro de Origen
          </Text>
          <Text style={styles.paragraph}>
            Cada operación registra:
          </Text>
          <Text style={styles.bulletItem}>• Dirección IP del cliente (geolocalizable)</Text>
          <Text style={styles.bulletItem}>• User-Agent del navegador (identificación del dispositivo)</Text>
          <Text style={styles.bulletItem}>• Timestamp exacto de la operación</Text>
          <Text style={styles.bulletItem}>• Usuario autenticado (si aplica)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionNumber}>3. CADENA DE CUSTODIA DIGITAL</Text>

          <Text style={{ ...styles.sectionTitle, fontSize: 10 }}>
            3.1 Logs de Auditoría (Append-Only)
          </Text>
          <Text style={styles.paragraph}>
            Los eventos se registran en tablas de auditoría donde:
          </Text>
          <Text style={styles.bulletItem}>• Solo se permite INSERT (nunca UPDATE ni DELETE)</Text>
          <Text style={styles.bulletItem}>• Políticas RLS impiden modificación por usuarios</Text>
          <Text style={styles.bulletItem}>• Cada evento tiene hash propio para verificación</Text>

          <Text style={{ ...styles.sectionTitle, fontSize: 10, marginTop: 15 }}>
            3.2 Row Level Security (RLS)
          </Text>
          <Text style={styles.paragraph}>
            PostgreSQL implementa RLS que garantiza:
          </Text>
          <Text style={styles.bulletItem}>• Cada empresa solo accede a sus propios datos</Text>
          <Text style={styles.bulletItem}>• Las políticas se aplican a nivel de base de datos</Text>
          <Text style={styles.bulletItem}>• No es posible evadir estas restricciones desde la aplicación</Text>

          <Text style={{ ...styles.sectionTitle, fontSize: 10, marginTop: 15 }}>
            3.3 Almacenamiento Inmutable
          </Text>
          <Text style={styles.paragraph}>
            Los archivos en Storage se configuran para:
          </Text>
          <Text style={styles.bulletItem}>• No permitir sobreescritura de archivos existentes</Text>
          <Text style={styles.bulletItem}>• Mantener versiones si se actualiza</Text>
          <Text style={styles.bulletItem}>• Registrar quién subió cada archivo y cuándo</Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            IMPORTANTE: Los registros almacenados en NotiLegal NO pueden ser
            modificados retroactivamente, eliminados por el usuario, ni alterados
            sin generar un nuevo hash distinto. Cualquier intento de modificación
            es registrado en logs de auditoría y genera un nuevo hash que evidencia
            la alteración.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            NotiLegal - Protocolo de Preservación v1.0.0
          </Text>
          <Text style={styles.footerText}>
            Página 2 de 3
          </Text>
        </View>
      </Page>

      {/* Página 3: Verificación y Datos Específicos */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionNumber}>4. VERIFICACIÓN DE INTEGRIDAD</Text>
          <Text style={styles.paragraph}>
            Para verificar que un documento no fue alterado:
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Paso</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 3 }}>Acción</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>1</Text>
              <Text style={{ ...styles.tableCell, flex: 3 }}>
                Obtener el hash SHA-256 almacenado del documento
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>2</Text>
              <Text style={{ ...styles.tableCell, flex: 3 }}>
                Recalcular el hash del archivo usando SHA-256
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>3</Text>
              <Text style={{ ...styles.tableCell, flex: 3 }}>
                Comparar ambos hashes - Si coinciden, el documento es íntegro
              </Text>
            </View>
          </View>

          <Text style={styles.paragraph}>
            Comandos para calcular hash:
          </Text>
          <View style={styles.codeBlock}>
            <Text>Linux/Mac: sha256sum archivo.pdf</Text>
            <Text>Windows: certutil -hashfile archivo.pdf SHA256</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionNumber}>5. DATOS DE ESTA SANCIÓN</Text>

          <View style={styles.hashBox}>
            <Text style={styles.hashLabel}>ID de Notificación:</Text>
            <Text style={styles.hashValue}>{notificacion.id}</Text>

            <Text style={{ ...styles.hashLabel, marginTop: 8 }}>Empresa:</Text>
            <Text style={styles.hashValue}>
              {empresa.razon_social} (CUIT: {formatCUIT(empresa.cuit)})
            </Text>

            <Text style={{ ...styles.hashLabel, marginTop: 8 }}>Fecha de Creación:</Text>
            <Text style={styles.hashValue}>{formatDateTime(notificacion.created_at)}</Text>

            <Text style={{ ...styles.hashLabel, marginTop: 8 }}>Timestamp de Generación:</Text>
            <Text style={styles.hashValue}>{notificacion.timestamp_generacion}</Text>

            <Text style={{ ...styles.hashLabel, marginTop: 8 }}>Hash SHA-256 Original:</Text>
            <Text style={styles.hashValue}>{notificacion.hash_sha256}</Text>

            <Text style={{ ...styles.hashLabel, marginTop: 8 }}>Estado Actual:</Text>
            <Text style={styles.hashValue}>{notificacion.estado.toUpperCase()}</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Métrica</Text>
              <Text style={styles.tableHeaderCell}>Valor</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Total de archivos en paquete</Text>
              <Text style={styles.tableCell}>{totalArchivos}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Hashes verificables</Text>
              <Text style={styles.tableCell}>{totalHashes}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Fecha de generación del paquete</Text>
              <Text style={styles.tableCell}>{formatDateTime(fechaGeneracion)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.successBox}>
          <Text style={styles.successText}>
            DECLARACIÓN DE INTEGRIDAD: Este paquete de evidencia fue generado
            automáticamente por NotiLegal y contiene todos los elementos necesarios
            para verificar la autenticidad e integridad de la notificación laboral
            y documentos asociados. Para consultas técnicas: soporte@notilegal.ar
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            NotiLegal - Protocolo de Preservación v1.0.0
          </Text>
          <Text style={styles.footerText}>
            Página 3 de 3
          </Text>
        </View>
      </Page>
    </Document>
  );
}
