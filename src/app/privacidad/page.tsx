import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, FileText, Mail, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidad - NotiLegal",
  description: "Política de privacidad y tratamiento de datos personales conforme a la Ley 25.326",
};

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Política de Privacidad
          </h1>
          <p className="text-gray-600">
            Conforme a la Ley 25.326 de Protección de Datos Personales
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Última actualización: Enero 2026
          </p>
        </div>

        <div className="space-y-8">
          {/* Introducción */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                1. Introducción
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                NotiLegal es un sistema de notificaciones laborales que procesa datos
                personales en cumplimiento de la Ley 25.326 de Protección de Datos
                Personales de la República Argentina y su Decreto Reglamentario 1558/2001.
              </p>
              <p>
                Esta Política de Privacidad describe cómo recopilamos, utilizamos,
                almacenamos y protegemos los datos personales de los usuarios del sistema.
              </p>
            </CardContent>
          </Card>

          {/* Responsable del Tratamiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                2. Responsable del Tratamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                El responsable del tratamiento de los datos personales es la empresa
                empleadora que utiliza NotiLegal para gestionar las notificaciones
                laborales de sus empleados.
              </p>
              <p>
                NotiLegal actúa como encargado del tratamiento, procesando los datos
                por cuenta del empleador conforme a las instrucciones recibidas.
              </p>
            </CardContent>
          </Card>

          {/* Datos que Recopilamos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                3. Datos Personales que Recopilamos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  3.1 Datos de Identificación
                </h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Nombre completo</li>
                  <li>CUIL/CUIT</li>
                  <li>Número de legajo</li>
                  <li>Dirección de correo electrónico</li>
                  <li>Número de teléfono</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  3.2 Datos de Acceso y Verificación
                </h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Dirección IP</li>
                  <li>Información del navegador (User-Agent)</li>
                  <li>Fecha y hora de acceso</li>
                  <li>Códigos de verificación OTP</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 mb-2">
                  3.3 Datos Biométricos (con consentimiento expreso)
                </h4>
                <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                  <li>Imagen facial (selfie) para verificación de identidad</li>
                  <li>Datos de detección de vida (liveness)</li>
                </ul>
                <p className="text-sm text-amber-600 mt-2">
                  Estos datos solo se recopilan si usted otorga consentimiento expreso
                  al firmar el Convenio de Domicilio Electrónico.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Finalidad del Tratamiento */}
          <Card>
            <CardHeader>
              <CardTitle>4. Finalidad del Tratamiento</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>Los datos personales son tratados para las siguientes finalidades:</p>
              <ul>
                <li>
                  <strong>Notificaciones laborales:</strong> Envío de comunicaciones
                  laborales fehacientes conforme a la normativa vigente.
                </li>
                <li>
                  <strong>Verificación de identidad:</strong> Confirmar que el
                  destinatario de la notificación es efectivamente el empleado.
                </li>
                <li>
                  <strong>Generación de prueba:</strong> Crear registros con valor
                  probatorio para eventuales procesos laborales.
                </li>
                <li>
                  <strong>Cumplimiento legal:</strong> Dar cumplimiento a las
                  obligaciones establecidas por la Ley 27.742 y normativa laboral.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Base Legal */}
          <Card>
            <CardHeader>
              <CardTitle>5. Base Legal del Tratamiento</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <ul>
                <li>
                  <strong>Relación laboral:</strong> El tratamiento es necesario para
                  la ejecución de la relación laboral entre empleador y empleado.
                </li>
                <li>
                  <strong>Obligación legal:</strong> Cumplimiento de la Ley 27.742 de
                  Modernización Laboral y la Acordada 31/2011 CSJN.
                </li>
                <li>
                  <strong>Consentimiento:</strong> Para datos biométricos, se requiere
                  consentimiento expreso del titular.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Tiempo de Conservación */}
          <Card>
            <CardHeader>
              <CardTitle>6. Tiempo de Conservación</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Los datos personales se conservarán durante el tiempo necesario para
                cumplir las finalidades para las que fueron recopilados:
              </p>
              <ul>
                <li>
                  <strong>Durante la relación laboral:</strong> Mientras dure el
                  vínculo entre empleador y empleado.
                </li>
                <li>
                  <strong>Después de finalizada:</strong> Por un período mínimo de
                  2 años, conforme a los plazos de prescripción de acciones laborales.
                </li>
                <li>
                  <strong>Documentos con valor probatorio:</strong> Se conservarán
                  por el tiempo necesario para eventuales procesos judiciales.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Derechos ARCO */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">
                7. Sus Derechos (ARCO)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-blue-700">
                Conforme a la Ley 25.326, usted tiene los siguientes derechos sobre
                sus datos personales:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-blue-800 mb-1">Acceso</h4>
                  <p className="text-sm text-gray-600">
                    Conocer qué datos personales suyos están siendo tratados.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-blue-800 mb-1">Rectificación</h4>
                  <p className="text-sm text-gray-600">
                    Solicitar la corrección de datos inexactos o incompletos.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-blue-800 mb-1">Cancelación</h4>
                  <p className="text-sm text-gray-600">
                    Solicitar la supresión de sus datos cuando ya no sean necesarios.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-blue-800 mb-1">Oposición</h4>
                  <p className="text-sm text-gray-600">
                    Oponerse al tratamiento de sus datos en ciertos casos.
                  </p>
                </div>
              </div>

              <p className="text-sm text-blue-700">
                Para ejercer estos derechos, contacte a su empleador o envíe un
                correo a <strong>privacidad@notilegal.com</strong>
              </p>
            </CardContent>
          </Card>

          {/* Seguridad */}
          <Card>
            <CardHeader>
              <CardTitle>8. Medidas de Seguridad</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Implementamos medidas técnicas y organizativas para proteger sus datos:
              </p>
              <ul>
                <li>Cifrado de datos en tránsito (HTTPS/TLS)</li>
                <li>Cifrado de datos en reposo</li>
                <li>Hash SHA-256 para integridad de documentos</li>
                <li>Firma digital PKI para autenticidad</li>
                <li>Timestamp en blockchain (OpenTimestamps) para fecha cierta</li>
                <li>Verificación de identidad multi-factor (CUIL + OTP + Selfie)</li>
                <li>Registro de auditoría de todos los accesos</li>
                <li>Copias de seguridad cifradas</li>
              </ul>
            </CardContent>
          </Card>

          {/* Transferencias */}
          <Card>
            <CardHeader>
              <CardTitle>9. Transferencias de Datos</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Los datos personales pueden ser compartidos con:
              </p>
              <ul>
                <li>
                  <strong>Empleador:</strong> Como responsable del tratamiento.
                </li>
                <li>
                  <strong>Proveedores de servicios:</strong> SendGrid (email),
                  Twilio (SMS/WhatsApp), Supabase (almacenamiento), bajo contratos
                  de confidencialidad.
                </li>
                <li>
                  <strong>Autoridades judiciales:</strong> Cuando sea requerido por
                  orden judicial o proceso legal.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* AAIP */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">
                10. Registro AAIP
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-green-700">
              <p>
                La base de datos de NotiLegal está registrada ante la Agencia de
                Acceso a la Información Pública (AAIP) conforme lo establecido por
                la Ley 25.326.
              </p>
              <p>
                <strong>Número de registro:</strong> [Pendiente de tramitación]
              </p>
              <p>
                La AAIP es el órgano de control para la protección de datos
                personales en Argentina. Puede presentar reclamos ante:
                <br />
                <a
                  href="https://www.argentina.gob.ar/aaip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-800 underline"
                >
                  www.argentina.gob.ar/aaip
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>11. Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Para consultas sobre esta política o el tratamiento de sus datos:
              </p>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span>privacidad@notilegal.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span>+54 11 XXXX-XXXX</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer legal */}
          <div className="text-center text-sm text-gray-500 mt-8 pb-8">
            <p>
              Esta política cumple con la Ley 25.326, su Decreto Reglamentario
              1558/2001, y las disposiciones de la AAIP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
