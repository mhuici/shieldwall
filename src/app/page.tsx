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
} from "lucide-react";

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

      {/* Comparativa - Por que es mejor */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Por que Notificarte y no carta documento?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Carta Documento */}
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <XCircle className="h-8 w-8 text-red-400" />
                  <h3 className="text-xl font-bold">Carta Documento</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">$15.000+ por carta</span>
                      <p className="text-sm text-slate-400">10 sanciones = $150.000</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">3-7 dias de demora</span>
                      <p className="text-sm text-slate-400">El empleado puede irse antes</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Puede rechazarla</span>
                      <p className="text-sm text-slate-400">No la recibe = no hay prueba</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Sin cadena de custodia digital</span>
                      <p className="text-sm text-slate-400">Solo el acuse de recibo</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Notificarte */}
              <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                  <h3 className="text-xl font-bold">Notificarte</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Suscripcion mensual fija</span>
                      <p className="text-sm text-slate-400">Notificaciones ilimitadas incluidas</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Entrega instantanea</span>
                      <p className="text-sm text-slate-400">Email + WhatsApp al mismo tiempo</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">No puede rechazarla</span>
                      <p className="text-sm text-slate-400">Si no confirma en 72hs, activas carta documento</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Cadena de custodia completa</span>
                      <p className="text-sm text-slate-400">Hash + IP + timestamp + declaracion jurada</p>
                    </div>
                  </li>
                </ul>
              </div>
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

      {/* FAQ rapido */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10">Preguntas frecuentes</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="font-semibold mb-2">Tiene validez legal?</h3>
                <p className="text-slate-600 text-sm">
                  Si. El sistema cumple con la Ley 27.742 de Reforma Laboral. La declaracion jurada digital
                  tiene el mismo valor que una firma holografa segun la Ley de Firma Digital (25.506).
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="font-semibold mb-2">Que pasa si el empleado no tiene email o WhatsApp?</h3>
                <p className="text-slate-600 text-sm">
                  Te generamos automaticamente el PDF formateado para enviar por carta documento tradicional.
                  Siempre tenes un metodo de backup legal.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="font-semibold mb-2">Puedo cancelar cuando quiera?</h3>
                <p className="text-slate-600 text-sm">
                  Si, la suscripcion es mensual y podes cancelar en cualquier momento. Tus datos y
                  paquetes de evidencia quedan disponibles para descarga por 5 anos.
                </p>
              </div>
            </div>
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
