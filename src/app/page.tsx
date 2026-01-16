import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Clock,
  FileCheck,
  Smartphone,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  Scale,
  Zap,
  Lock,
  XCircle,
  DollarSign,
  TrendingDown,
  Building2,
  Users,
  BadgeCheck,
  Download,
  Mail,
  MessageSquare,
  UserCheck,
  Camera,
  ClipboardList,
  MessageCircle,
  ChevronDown,
  FileText,
  Gavel,
  ExternalLink,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-emerald-600" />
            <span className="text-xl font-bold text-slate-900">Notificarte</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#precio" className="text-slate-600 hover:text-slate-900 hidden sm:block">
              Precios
            </a>
            <a href="#como-funciona" className="text-slate-600 hover:text-slate-900 hidden sm:block">
              Como Funciona
            </a>
            <Link href="/login">
              <Button>Empezar Ahora</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero - Hook emocional fuerte */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-red-50 via-white to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-6">
              <AlertTriangle className="h-4 w-4" />
              El 73% de las PyMEs pierde juicios laborales por falta de documentacion
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Cada sancion sin prueba fehaciente <br />
              <span className="text-red-600">te puede costar $72 millones</span>
            </h1>
            <p className="text-xl text-slate-600 mb-4 max-w-3xl mx-auto">
              Un empleado que despedis con causa puede decir &quot;nunca me notificaron las sanciones&quot;.
              Sin prueba de entrega, el juez le cree. Tu despido con causa se convierte en
              <strong> despido sin causa</strong>. Y pagas todo.
            </p>
            <div className="bg-slate-100 rounded-lg p-4 max-w-2xl mx-auto mb-8">
              <p className="text-slate-700">
                <strong>Indemnizacion promedio por despido sin causa:</strong> $72.000.000 ARS
                <br />
                <span className="text-sm text-slate-500">(6 meses de salario + multas Ley 25.323 + intereses)</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="text-lg px-8 bg-emerald-600 hover:bg-emerald-700">
                  Proteger Mi Empresa
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#como-funciona">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Ver Como Funciona
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Que es - Explicacion clara */}
      <section className="py-16 bg-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">
                Que es Notificarte?
              </h2>
              <p className="text-xl text-emerald-100">
                Un sistema digital que convierte tus sanciones laborales en prueba irrefutable para juicios.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 rounded-lg p-6 text-center">
                <Mail className="h-12 w-12 mx-auto mb-4 text-emerald-200" />
                <h3 className="font-semibold text-lg mb-2">Notificacion Digital</h3>
                <p className="text-emerald-100 text-sm">
                  Envias apercibimientos y suspensiones por email + WhatsApp. Instantaneo.
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-6 text-center">
                <BadgeCheck className="h-12 w-12 mx-auto mb-4 text-emerald-200" />
                <h3 className="font-semibold text-lg mb-2">Confirmacion Fehaciente</h3>
                <p className="text-emerald-100 text-sm">
                  El empleado valida su identidad con CUIL y firma una declaracion jurada digital.
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-emerald-200" />
                <h3 className="font-semibold text-lg mb-2">Prueba para Juicios</h3>
                <p className="text-emerald-100 text-sm">
                  Descargas un paquete de evidencia con cadena de custodia completa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Por que gana juicios - NUEVO */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Por que Notificarte gana juicios?
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                No es solo notificar. Es construir un expediente probatorio completo que destruye
                los argumentos tipicos del abogado del empleado.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Testigos Digitales */}
              <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-100 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-100 rounded-lg flex-shrink-0">
                    <UserCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Testigos Digitales</h3>
                    <p className="text-slate-600 text-sm mb-3">
                      Los testigos declaran EN EL MOMENTO del hecho, no meses despues en juicio
                      cuando &quot;no recuerdan&quot;.
                    </p>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs text-slate-500 mb-1">Valor probatorio:</p>
                      <ul className="text-xs text-slate-700 space-y-1">
                        <li>• Declaracion firmada con hash SHA-256</li>
                        <li>• Timestamp exacto (horas del hecho, no meses)</li>
                        <li>• IP de origen (prueba que no fue coaccion)</li>
                        <li>• Declaracion jurada bajo Art. 275 CP</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidencia Multimedia */}
              <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    <Camera className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Evidencia Multimedia</h3>
                    <p className="text-slate-600 text-sm mb-3">
                      Fotos y videos con metadatos EXIF que prueban cuando y donde se tomaron.
                      Imposible de falsificar.
                    </p>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs text-slate-500 mb-1">Valor probatorio:</p>
                      <ul className="text-xs text-slate-700 space-y-1">
                        <li>• GPS de donde se tomo la foto</li>
                        <li>• Fecha y hora exacta de captura</li>
                        <li>• Modelo de dispositivo</li>
                        <li>• Hash SHA-256 (no fue alterada)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bitacora de Novedades */}
              <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-100 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 rounded-lg flex-shrink-0">
                    <ClipboardList className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Bitacora de Novedades</h3>
                    <p className="text-slate-600 text-sm mb-3">
                      6 meses de gestion progresiva documentada. Destruye el argumento de
                      &quot;mobbing&quot; o &quot;persecucion&quot;.
                    </p>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs text-slate-500 mb-1">Valor probatorio:</p>
                      <ul className="text-xs text-slate-700 space-y-1">
                        <li>• Recordatorios verbales documentados</li>
                        <li>• Conversaciones sobre conducta</li>
                        <li>• Capacitaciones y comunicaciones</li>
                        <li>• Demuestra Art. 64 LCT (direccion)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audiencia de Descargo */}
              <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0">
                    <MessageCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Audiencia de Descargo</h3>
                    <p className="text-slate-600 text-sm mb-3">
                      El empleado puede dar su version. Si confiesa, miente o calla:
                      todas las opciones te benefician.
                    </p>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs text-slate-500 mb-1">La trampa legal:</p>
                      <ul className="text-xs text-slate-700 space-y-1">
                        <li>• Si confiesa → Admitio el hecho</li>
                        <li>• Si miente → GPS/evidencia lo contradice</li>
                        <li>• Si calla → &quot;Declino ejercer su derecho&quot;</li>
                        <li>• Demuestra debido proceso (Art. 67 LCT)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-emerald-600 rounded-xl p-6 text-center text-white">
              <p className="text-lg font-semibold mb-2">
                Resultado: Expediente probatorio completo
              </p>
              <p className="text-emerald-100">
                Cuando el abogado del empleado dice &quot;es persecucion&quot;, vos tenes testigos, fotos,
                6 meses de gestion y la confesion del propio empleado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ley 27.742 - La oportunidad */}
      <section className="py-16 bg-slate-50 border-y">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <div className="p-3 bg-emerald-100 rounded-lg flex-shrink-0">
                <Scale className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Ley 27.742 - Reforma Laboral 2025
                </h2>
                <p className="text-slate-600 text-lg">
                  La nueva ley te da una herramienta poderosa: <strong>la regla de los 30 dias</strong>.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-emerald-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-6 w-6 text-emerald-600" />
                <h3 className="text-xl font-bold text-slate-900">Como funciona la regla:</h3>
              </div>
              <ol className="space-y-3 text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</span>
                  <span>Notificas una sancion al empleado con Notificarte</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</span>
                  <span>El empleado tiene <strong>30 dias corridos</strong> para impugnar</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">3</span>
                  <span>Si no impugna, la sancion queda <strong>firme automaticamente</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">4</span>
                  <span>Esa sancion firme tiene <strong>valor de prueba plena en juicio</strong></span>
                </li>
              </ol>
              <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
                <p className="text-emerald-800 font-medium">
                  Resultado: Con 2-3 sanciones firmes acumuladas, tu despido con causa es practicamente inobjetable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona - Paso a paso */}
      <section className="py-16" id="como-funciona">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Como funciona en 3 pasos
            </h2>
            <p className="text-lg text-slate-600">
              De sancion a prueba legal en menos de 5 minutos
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="bg-white border-2 border-slate-200 rounded-xl p-6 h-full hover:border-emerald-300 transition-colors">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Creas la sancion</h3>
                  <p className="text-slate-600 mb-4">
                    Seleccionas empleado, tipo de sancion (apercibimiento, suspension), motivo y descripcion.
                  </p>
                  <div className="text-sm text-slate-500 bg-slate-50 rounded p-3">
                    <Lock className="h-4 w-4 inline mr-1 text-emerald-600" />
                    Se genera automaticamente un PDF con hash SHA-256 que garantiza que el documento no fue alterado.
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-white border-2 border-slate-200 rounded-xl p-6 h-full hover:border-emerald-300 transition-colors">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-xl font-bold text-white">2</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">El empleado confirma</h3>
                  <p className="text-slate-600 mb-4">
                    Recibe la notificacion por email y WhatsApp. Para ver el contenido debe:
                  </p>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      Validar su identidad con CUIL
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      Leer el contenido completo
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      Firmar declaracion jurada
                    </li>
                  </ul>
                </div>
              </div>
              <div className="relative">
                <div className="bg-white border-2 border-slate-200 rounded-xl p-6 h-full hover:border-emerald-300 transition-colors">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-xl font-bold text-white">3</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Queda firme</h3>
                  <p className="text-slate-600 mb-4">
                    Pasan 30 dias sin impugnacion. La sancion adquiere firmeza legal automaticamente.
                  </p>
                  <div className="text-sm bg-emerald-50 rounded p-3 text-emerald-800">
                    <Download className="h-4 w-4 inline mr-1" />
                    Descargas el <strong>paquete de evidencia</strong>: PDF original + cadena de custodia + metadata para presentar ante un juez.
                  </div>
                </div>
              </div>
            </div>

            {/* Fallback 72hs */}
            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Y si el empleado no confirma?</h4>
                  <p className="text-slate-600">
                    Si pasan 72 horas sin confirmacion, te avisamos automaticamente y te damos el PDF listo
                    para enviar por <strong>carta documento tradicional</strong>. Siempre tenes un backup legal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparativa - Tabla completa */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              Comparativa de metodos de notificacion
            </h2>
            <p className="text-center text-slate-400 mb-10">
              Notificarte vs los metodos tradicionales
            </p>

            {/* Tabla comparativa */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-4 px-4 font-normal text-slate-400">Aspecto</th>
                    <th className="text-center py-4 px-4">
                      <div className="flex flex-col items-center">
                        <XCircle className="h-6 w-6 text-red-400 mb-1" />
                        <span className="font-semibold">Firma en legajo</span>
                      </div>
                    </th>
                    <th className="text-center py-4 px-4">
                      <div className="flex flex-col items-center">
                        <AlertTriangle className="h-6 w-6 text-amber-400 mb-1" />
                        <span className="font-semibold">Carta Documento</span>
                      </div>
                    </th>
                    <th className="text-center py-4 px-4 bg-emerald-900/30 rounded-t-lg">
                      <div className="flex flex-col items-center">
                        <CheckCircle className="h-6 w-6 text-emerald-400 mb-1" />
                        <span className="font-semibold">Notificarte</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-4 px-4 text-slate-300">Costo por sancion</td>
                    <td className="py-4 px-4 text-center text-slate-400">$0</td>
                    <td className="py-4 px-4 text-center text-slate-400">$15.000+</td>
                    <td className="py-4 px-4 text-center bg-emerald-900/20 text-emerald-300 font-medium">Ilimitado</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-slate-300">Tiempo de entrega</td>
                    <td className="py-4 px-4 text-center text-slate-400">Inmediato</td>
                    <td className="py-4 px-4 text-center text-slate-400">3-7 dias</td>
                    <td className="py-4 px-4 text-center bg-emerald-900/20 text-emerald-300 font-medium">60 segundos</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-slate-300">Prueba de recepcion</td>
                    <td className="py-4 px-4 text-center">
                      <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                      <span className="text-xs text-slate-500 block mt-1">&quot;No firme&quot;</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <CheckCircle className="h-4 w-4 text-amber-400 mx-auto" />
                      <span className="text-xs text-slate-500 block mt-1">Acuse de recibo</span>
                    </td>
                    <td className="py-4 px-4 text-center bg-emerald-900/20">
                      <CheckCircle className="h-4 w-4 text-emerald-400 mx-auto" />
                      <span className="text-xs text-emerald-400 block mt-1">CUIL + Declaracion jurada</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-slate-300">Prueba de lectura</td>
                    <td className="py-4 px-4 text-center">
                      <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center bg-emerald-900/20">
                      <CheckCircle className="h-4 w-4 text-emerald-400 mx-auto" />
                      <span className="text-xs text-emerald-400 block mt-1">Tracking completo</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-slate-300">Testigos incluidos</td>
                    <td className="py-4 px-4 text-center">
                      <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center bg-emerald-900/20">
                      <CheckCircle className="h-4 w-4 text-emerald-400 mx-auto" />
                      <span className="text-xs text-emerald-400 block mt-1">Declaraciones firmadas</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-slate-300">Evidencia multimedia</td>
                    <td className="py-4 px-4 text-center">
                      <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center bg-emerald-900/20">
                      <CheckCircle className="h-4 w-4 text-emerald-400 mx-auto" />
                      <span className="text-xs text-emerald-400 block mt-1">Fotos + GPS + EXIF</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-slate-300">Derecho a descargo</td>
                    <td className="py-4 px-4 text-center">
                      <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center bg-emerald-900/20">
                      <CheckCircle className="h-4 w-4 text-emerald-400 mx-auto" />
                      <span className="text-xs text-emerald-400 block mt-1">Audiencia virtual</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-slate-300">Cadena de custodia</td>
                    <td className="py-4 px-4 text-center">
                      <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-xs text-slate-500">Solo acuse</span>
                    </td>
                    <td className="py-4 px-4 text-center bg-emerald-900/20">
                      <CheckCircle className="h-4 w-4 text-emerald-400 mx-auto" />
                      <span className="text-xs text-emerald-400 block mt-1">Hash + IP + timestamp</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-slate-300">Impugnabilidad</td>
                    <td className="py-4 px-4 text-center text-red-400">Alta</td>
                    <td className="py-4 px-4 text-center text-amber-400">Media</td>
                    <td className="py-4 px-4 text-center bg-emerald-900/20 text-emerald-300 font-medium rounded-b-lg">Baja</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 text-center">
              <p className="text-slate-400 text-sm">
                La firma en legajo es la opcion mas comun pero la mas debil juridicamente.
                El empleado puede decir &quot;no firme&quot;, &quot;me obligaron&quot;, o simplemente &quot;no me acuerdo&quot;.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI - El numero que importa */}
      <section className="py-16 bg-gradient-to-b from-emerald-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              La matematica es simple
            </h2>
            <p className="text-lg text-slate-600 mb-10">
              Una sola demanda evitada paga decadas de suscripcion
            </p>

            <div className="bg-white rounded-2xl shadow-xl border p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-left">
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Costo promedio de demanda laboral perdida</p>
                      <p className="text-4xl font-bold text-red-600">$72.000.000</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Suscripcion mensual Notificarte</p>
                      <p className="text-4xl font-bold text-emerald-600">$89.000</p>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-600 text-white rounded-xl p-6 text-center">
                  <p className="text-sm uppercase tracking-wide mb-2 text-emerald-200">Una demanda evitada equivale a</p>
                  <p className="text-6xl font-bold mb-2">67</p>
                  <p className="text-xl">anos de suscripcion</p>
                  <div className="mt-4 pt-4 border-t border-emerald-500">
                    <p className="text-sm text-emerald-200">ROI: <span className="font-bold text-white">6.716%</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Precio */}
      <section className="py-16" id="precio">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Planes simples, sin letra chica
            </h2>
            <p className="text-lg text-slate-600">
              Suscripcion mensual. Cancela cuando quieras.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Plan Starter */}
            <Card className="border-2 hover:border-emerald-200 transition-colors">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <Building2 className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold">Starter</h3>
                  <p className="text-sm text-slate-500">Hasta 10 empleados</p>
                </div>
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">$45.000</span>
                  <span className="text-slate-500">/mes</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Notificaciones ilimitadas
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Email + WhatsApp
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Paquete de evidencia
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Soporte por email
                  </li>
                </ul>
                <Link href="/login" className="block">
                  <Button className="w-full" variant="outline">Empezar</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plan PyME - Destacado */}
            <Card className="border-2 border-emerald-500 shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                Mas Popular
              </div>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <Users className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                  <h3 className="text-xl font-bold">PyME</h3>
                  <p className="text-sm text-slate-500">Hasta 50 empleados</p>
                </div>
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">$89.000</span>
                  <span className="text-slate-500">/mes</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Todo de Starter
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Alertas automaticas 72hs
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Dashboard de seguimiento
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Soporte prioritario
                  </li>
                </ul>
                <Link href="/login" className="block">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Empezar</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plan Empresa */}
            <Card className="border-2 hover:border-emerald-200 transition-colors">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <Building2 className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold">Empresa</h3>
                  <p className="text-sm text-slate-500">Empleados ilimitados</p>
                </div>
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">$149.000</span>
                  <span className="text-slate-500">/mes</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Todo de PyME
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Multiples empresas
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    API de integracion
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Soporte telefonico
                  </li>
                </ul>
                <Link href="/login" className="block">
                  <Button className="w-full" variant="outline">Contactar</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ expandido - Para empresas y abogados */}
      <section className="py-16 bg-slate-50" id="faq">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2">Preguntas frecuentes</h2>
              <p className="text-slate-600">Para empresas y abogados laboralistas</p>
            </div>

            <div className="space-y-3">
              {/* Preguntas generales */}
              <Collapsible className="bg-white rounded-lg border">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-5 text-left">
                  <span className="font-semibold">Tiene validez legal en Argentina?</span>
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-5 pb-5">
                  <p className="text-slate-600 text-sm">
                    Si. El sistema cumple con: <strong>Ley 27.742</strong> (Reforma Laboral 2025) para plazo de 30 dias
                    e impugnacion, <strong>Art. 67 LCT</strong> sobre poder disciplinario, <strong>Art. 220 LCT</strong> sobre
                    limites de suspension, y <strong>Ley 25.506</strong> de Firma Digital. El hash SHA-256 + timestamp
                    constituyen firma electronica valida.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible className="bg-white rounded-lg border">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-5 text-left">
                  <span className="font-semibold">Como prueba esto que el hecho realmente ocurrio?</span>
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-5 pb-5">
                  <p className="text-slate-600 text-sm mb-3">
                    Notificarte no es solo un notificador. Construye un <strong>expediente probatorio completo</strong>:
                  </p>
                  <ul className="text-slate-600 text-sm space-y-1 ml-4">
                    <li>1. <strong>Testigos digitales</strong>: Declaraciones firmadas EN EL MOMENTO del hecho</li>
                    <li>2. <strong>Evidencia multimedia</strong>: Fotos/videos con metadatos EXIF verificables</li>
                    <li>3. <strong>Bitacora</strong>: 6 meses de gestion progresiva documentada</li>
                    <li>4. <strong>Descargo</strong>: Confesiones o contradicciones del propio empleado</li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible className="bg-white rounded-lg border">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-5 text-left">
                  <span className="font-semibold">Que pasa si el testigo dice algo distinto en juicio?</span>
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-5 pb-5">
                  <p className="text-slate-600 text-sm">
                    Tenes su declaracion original firmada digitalmente con: hash SHA-256 inmutable,
                    timestamp exacto (horas del hecho, no meses despues), IP de origen (prueba que declaro
                    desde su dispositivo, no bajo coaccion), y declaracion jurada bajo apercibimiento de
                    falso testimonio (Art. 275 CP). Si cambia su version, presentas la declaracion original
                    y queda evidenciada la contradiccion.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible className="bg-white rounded-lg border">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-5 text-left">
                  <span className="font-semibold">Como demuestra que no es mobbing/persecucion?</span>
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-5 pb-5">
                  <p className="text-slate-600 text-sm mb-3">
                    La <strong>Bitacora de Novedades</strong> documenta 6 meses de gestion progresiva:
                    recordatorios verbales, conversaciones sobre conducta, capacitaciones. Cuando el abogado
                    dice &quot;es persecucion&quot;, el empleador muestra:
                  </p>
                  <ul className="text-slate-600 text-sm space-y-1 ml-4 italic">
                    <li>&quot;El 15/03 se le recordo uso de EPP&quot;</li>
                    <li>&quot;El 20/04 se hablo sobre puntualidad&quot;</li>
                    <li>&quot;El 10/05 se le dio capacitacion de seguridad&quot;</li>
                    <li>&quot;El 15/06, despues de 3 meses de gestion, se aplico sancion&quot;</li>
                  </ul>
                  <p className="text-slate-600 text-sm mt-3">
                    Esto demuestra <strong>direccion y organizacion</strong> (Art. 64 LCT), no persecucion.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible className="bg-white rounded-lg border">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-5 text-left">
                  <span className="font-semibold">Y si el empleado dice que no le dieron derecho a defensa?</span>
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-5 pb-5">
                  <p className="text-slate-600 text-sm">
                    La <strong>Audiencia de Descargo Virtual</strong> soluciona esto. Al notificar, el sistema
                    crea automaticamente un registro de descargo. El empleado recibe link para presentar su
                    version (30 dias de plazo). Puede elegir: EJERCER descargo (escribir su version) o
                    DECLINAR (no presentar). Todo queda registrado con hash, IP y timestamp. Si calla,
                    el registro dice &quot;Declino ejercer su derecho a defensa&quot;.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible className="bg-white rounded-lg border">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-5 text-left">
                  <span className="font-semibold">Como verifico que un documento no fue alterado?</span>
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-5 pb-5">
                  <p className="text-slate-600 text-sm">
                    Cada documento tiene: <strong>Hash SHA-256</strong> (codigo unico del contenido),
                    <strong> Timestamp</strong> (momento exacto de generacion), y un
                    <strong> Endpoint de verificacion</strong> que permite a cualquiera (juez, perito, abogado)
                    verificar la integridad. Si alguien altera un solo caracter, el hash cambia completamente.
                    Incluimos documentacion tecnica para peritos informaticos.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible className="bg-white rounded-lg border">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-5 text-left">
                  <span className="font-semibold">Que pasa si el empleado no tiene email o WhatsApp?</span>
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-5 pb-5">
                  <p className="text-slate-600 text-sm">
                    Te generamos automaticamente el PDF formateado para enviar por carta documento tradicional.
                    El sistema tiene fallback fisico: si no confirma en 72 horas, te alertamos y te damos
                    el PDF listo. Se registra que se intento notificacion digital primero.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible className="bg-white rounded-lg border">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-5 text-left">
                  <span className="font-semibold">Y si el empleado dice que lo obligaron a firmar?</span>
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-5 pb-5">
                  <p className="text-slate-600 text-sm">
                    El sistema registra: <strong>IP de origen</strong> (geolocalizable - si firmo desde su casa,
                    no desde la empresa), <strong>User-Agent</strong> (si uso su celular personal),
                    <strong> Timestamp</strong> (si firmo a las 22:00, fuera de horario laboral). Si alega
                    coaccion, debe explicar por que el IP corresponde a su zona habitual, por que uso su
                    dispositivo personal, y por que acepto la declaracion jurada voluntariamente.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
      </section>

      {/* Validacion Legal - NUEVO */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                <Gavel className="h-4 w-4" />
                Marco Legal Argentino
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Validacion Legal Completa
              </h2>
              <p className="text-lg text-slate-600">
                Notificarte cumple con toda la normativa laboral argentina vigente
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-50 rounded-xl p-6 border">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-emerald-600" />
                  Leyes que cumplimos
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Ley 27.742</strong> - Reforma Laboral 2025
                      <p className="text-slate-500">Plazo de 30 dias para impugnar, notificacion fehaciente</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Art. 67 LCT</strong> - Poder disciplinario
                      <p className="text-slate-500">Facultades del empleador para sancionar</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Art. 220 LCT</strong> - Limite de suspensiones
                      <p className="text-slate-500">Maximo 30 dias de suspension por ano</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Ley 25.506</strong> - Firma Digital
                      <p className="text-slate-500">Hash SHA-256 + timestamp = firma electronica valida</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 border">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Paquete de Evidencia
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Cada sancion genera un paquete ZIP con cadena de custodia completa:
                </p>
                <div className="bg-white rounded-lg p-4 border text-xs font-mono">
                  <div className="text-slate-400">paquete_evidencia_[id].zip</div>
                  <div className="ml-2 space-y-1 text-slate-600">
                    <div>├── sancion_original.pdf</div>
                    <div>├── cadena_custodia.pdf</div>
                    <div>├── protocolo_preservacion.pdf</div>
                    <div>├── /evidencia/ (fotos + metadatos)</div>
                    <div>├── /testigos/ (declaraciones)</div>
                    <div>├── /descargo/ (respuesta empleado)</div>
                    <div>├── /bitacora/ (6 meses de contexto)</div>
                    <div>└── /verificacion/ (hashes.json)</div>
                  </div>
                </div>
                <Link href="/verificar" className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mt-4">
                  Ver verificador de integridad
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
              <p className="text-emerald-800">
                <strong>Para peritos informaticos:</strong> Incluimos documentacion tecnica completa sobre
                SHA-256, almacenamiento inmutable, y cadena de custodia para facilitar el analisis pericial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA para Abogados - NUEVO */}
      <section className="py-16 bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-6">
              <Scale className="h-4 w-4" />
              Para Profesionales
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Sos abogado laboralista?
            </h2>
            <p className="text-lg text-slate-300 mb-8">
              Agenda una demo tecnica donde te mostramos la cadena de custodia,
              el protocolo de preservacion, y como el sistema resiste objeciones en juicio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:demo@notificarte.com.ar?subject=Demo%20tecnica%20para%20abogado">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8">
                  Agendar Demo Tecnica
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <a href="#faq">
                <Button size="lg" variant="outline" className="text-lg px-8 border-slate-600 text-slate-300 hover:bg-slate-800">
                  Ver FAQ Juridico
                </Button>
              </a>
            </div>
            <p className="text-sm text-slate-500 mt-6">
              Tambien ofrecemos programa de referidos para estudios juridicos
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-emerald-600">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Cada dia sin documentacion es un riesgo
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Empeza hoy a construir el historial de sanciones que va a proteger tu empresa manana.
            </p>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="text-lg px-12">
                Crear Cuenta Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-emerald-200 mt-4">
              Primeras 5 notificaciones gratis. Sin tarjeta de credito.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-emerald-500" />
              <span className="text-white font-semibold">Notificarte</span>
            </div>
            <p className="text-sm">
              Sistema de notificaciones laborales fehacientes para PyMEs argentinas
            </p>
            <div className="flex gap-4 text-sm">
              <a href="#" className="hover:text-white">
                Terminos
              </a>
              <a href="#" className="hover:text-white">
                Privacidad
              </a>
              <a href="#" className="hover:text-white">
                Contacto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
