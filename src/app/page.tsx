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
  Building2,
  Users,
  BadgeCheck,
  Download,
  Mail,
  MessageSquare,
  UserCheck,
  Camera,
  ClipboardList,
  ChevronDown,
  FileText,
  Gavel,
  FileSignature,
  Fingerprint,
  ShieldCheck,
  BookOpen,
  Hash,
  Globe,
  CircleCheck,
  CircleX,
  Minus,
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
          <nav className="hidden md:flex items-center gap-6">
            <a href="#como-funciona" className="text-slate-600 hover:text-slate-900 text-sm">
              Como Funciona
            </a>
            <a href="#validacion-legal" className="text-slate-600 hover:text-slate-900 text-sm">
              Validacion Legal
            </a>
            <a href="#precio" className="text-slate-600 hover:text-slate-900 text-sm">
              Precios
            </a>
            <a href="#faq" className="text-slate-600 hover:text-slate-900 text-sm">
              FAQ
            </a>
          </nav>
          <Link href="/login">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Empezar Gratis
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero - Validado legalmente */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-sm font-medium mb-8 border border-red-500/30">
              <AlertTriangle className="h-4 w-4" />
              El 73% de las PyMEs pierde juicios laborales por falta de prueba
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              El escudo legal que tu PyME
              <span className="text-emerald-400"> necesita</span>
            </h1>

            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Notificarte construye <strong className="text-white">expedientes probatorios blindados</strong> para
              tus sanciones laborales. Validado por abogados. Respaldado por la ley.
            </p>

            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-3xl font-bold text-emerald-400">$72M</div>
                <div className="text-sm text-slate-400">Costo promedio de perder un juicio</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-3xl font-bold text-emerald-400">30 días</div>
                <div className="text-sm text-slate-400">Plazo Ley 27.742 para impugnar</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-3xl font-bold text-emerald-400">6.716%</div>
                <div className="text-sm text-slate-400">ROI de 1 juicio evitado</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="text-lg px-8 bg-emerald-500 hover:bg-emerald-600 text-white">
                  Crear Cuenta Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#como-funciona">
                <Button size="lg" variant="outline" className="text-lg px-8 border-white/30 text-white hover:bg-white/10">
                  Ver Como Funciona
                </Button>
              </a>
            </div>

            <p className="text-sm text-slate-500 mt-6">
              Sin tarjeta de credito · Primeras 3 sanciones gratis
            </p>
          </div>
        </div>
      </section>

      {/* El Problema Real */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                El problema que nadie te cuenta
              </h2>
              <p className="text-lg text-slate-600">
                No alcanza con notificar. Tenes que <strong>probar</strong> que notificaste.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-8 mb-8">
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    El escenario que destruye PyMEs
                  </h3>
                  <p className="text-slate-700 mb-4">
                    Despedis a un empleado con causa despues de 3 sanciones. En el juicio, el empleado dice:
                  </p>
                  <blockquote className="border-l-4 border-red-400 pl-4 italic text-slate-600 mb-4">
                    &ldquo;Nunca me notificaron nada. No firme ningun apercibimiento.
                    No sabia que tenia sanciones.&rdquo;
                  </blockquote>
                  <p className="text-slate-700">
                    <strong>Sin prueba fehaciente de notificacion:</strong> El juez le cree.
                    Tu despido con causa se convierte en despido sin causa.
                    Pagas indemnizacion completa + multas + intereses.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CircleX className="h-6 w-6 text-red-500" />
                  <h4 className="font-semibold text-slate-900">Firma en el legajo</h4>
                </div>
                <ul className="space-y-2 text-slate-600 text-sm">
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <span>&ldquo;Me obligaron a firmar bajo coaccion&rdquo;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <span>&ldquo;Esa no es mi firma&rdquo;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <span>No prueba que el hecho ocurrio</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CircleX className="h-6 w-6 text-red-500" />
                  <h4 className="font-semibold text-slate-900">Carta documento</h4>
                </div>
                <ul className="space-y-2 text-slate-600 text-sm">
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <span>$15.000+ por cada una</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <span>Demora 3-5 dias habiles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <span>Tampoco prueba el hecho, solo el envio</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* La Solucion: Notificarte */}
      <section className="py-16 bg-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Notificarte no es solo notificar
            </h2>
            <p className="text-xl text-emerald-100 mb-12 max-w-2xl mx-auto">
              Es construir un <strong className="text-white">expediente probatorio completo</strong> que
              demuestra el hecho, la notificacion, la identidad y el derecho de defensa.
            </p>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
                <FileSignature className="h-10 w-10 mx-auto mb-4 text-emerald-200" />
                <h3 className="font-semibold mb-2">Convenio Previo</h3>
                <p className="text-sm text-emerald-100">
                  Ancla juridica que valida todo lo digital
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
                <Fingerprint className="h-10 w-10 mx-auto mb-4 text-emerald-200" />
                <h3 className="font-semibold mb-2">Identidad Verificada</h3>
                <p className="text-sm text-emerald-100">
                  CUIL + OTP + Selfie = imposible negar
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
                <Hash className="h-10 w-10 mx-auto mb-4 text-emerald-200" />
                <h3 className="font-semibold mb-2">Inmutable</h3>
                <p className="text-sm text-emerald-100">
                  Hash SHA-256 + Blockchain = no se puede alterar
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
                <Scale className="h-10 w-10 mx-auto mb-4 text-emerald-200" />
                <h3 className="font-semibold mb-2">Validado Legalmente</h3>
                <p className="text-sm text-emerald-100">
                  Acordadas CSJN + Art. 288 CCyC
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FASE 0: El Ancla Juridica */}
      <section className="py-16 bg-slate-50" id="como-funciona">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
                <Zap className="h-4 w-4" />
                El secreto que otros sistemas no tienen
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Fase 0: El Convenio de Domicilio Electronico
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Antes de notificar, el empleado firma un convenio donde acepta recibir
                notificaciones digitales. Este documento es el <strong>&ldquo;ancla juridica&rdquo;</strong> que
                da validez a todo lo demas.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-emerald-100 p-2 rounded-lg">
                      <FileSignature className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Convenio de Domicilio Electronico</h3>
                  </div>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Empleado constituye email y telefono como domicilios legales</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Acepta recibir notificaciones laborales por esos medios</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Incluye consentimiento Ley 25.326 (datos personales)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Firma en papel o digital con verificacion de identidad</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Fundamento legal</p>
                      <p className="text-sm text-amber-700">
                        Acordada N° 31/2011 CSJN: &ldquo;La constitucion de domicilio electronico
                        y registro previo son requisitos para que la notificacion produzca efectos.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-4">Por que es obligatorio</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 p-1.5 rounded">
                      <XCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Sin convenio</p>
                      <p className="text-sm text-slate-600">
                        &ldquo;Nunca acepte recibir notificaciones por WhatsApp&rdquo;
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-emerald-100 p-1.5 rounded">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Con convenio</p>
                      <p className="text-sm text-slate-600">
                        Documento firmado donde el empleado constituyo ese WhatsApp como domicilio legal
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-sm text-slate-500 italic">
                    &ldquo;El convenio es el ancla fisica/legal que da validez a todo lo digital posterior.
                    Sin este documento, cualquier defensa electronica es mas debil.&rdquo;
                  </p>
                  <p className="text-sm text-slate-400 mt-2">— Evaluacion legal del sistema</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Validacion de Identidad */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Identidad verificada en 3 pasos
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Cuando el empleado abre la notificacion, verificamos que sea el
                y no otra persona. Imposible de negar en juicio.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="relative">
                <div className="absolute -top-3 -left-3 bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <Card className="h-full pt-6">
                  <CardContent className="p-6">
                    <div className="bg-slate-100 p-3 rounded-lg w-fit mb-4">
                      <UserCheck className="h-6 w-6 text-slate-700" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">Ingresa su CUIL</h3>
                    <p className="text-sm text-slate-600">
                      El empleado debe ingresar su CUIL completo. Si no coincide con el
                      registrado, no puede acceder.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="relative">
                <div className="absolute -top-3 -left-3 bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <Card className="h-full pt-6">
                  <CardContent className="p-6">
                    <div className="bg-slate-100 p-3 rounded-lg w-fit mb-4">
                      <Smartphone className="h-6 w-6 text-slate-700" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">Recibe codigo OTP</h3>
                    <p className="text-sm text-slate-600">
                      Enviamos un codigo de 6 digitos al telefono que el empleado
                      constituyo en el convenio. Debe ingresarlo para continuar.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="relative">
                <div className="absolute -top-3 -left-3 bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <Card className="h-full pt-6">
                  <CardContent className="p-6">
                    <div className="bg-slate-100 p-3 rounded-lg w-fit mb-4">
                      <Camera className="h-6 w-6 text-slate-700" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">Toma una selfie</h3>
                    <p className="text-sm text-slate-600">
                      El empleado se toma una foto con la pantalla visible.
                      Guardamos la selfie con hash, IP y timestamp.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 p-2 rounded-lg shrink-0">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">
                    &ldquo;Si el sistema guarda la foto del empleado leyendo la sancion...&rdquo;
                  </h4>
                  <p className="text-slate-700">
                    ...la carga de la prueba de que &lsquo;no fue el&rsquo; se vuelve casi imposible de remontar
                    para el trabajador en juicio.
                  </p>
                  <p className="text-sm text-slate-500 mt-2">— Evaluacion de abogado laboralista</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Los 5 Pilares de Evidencia */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                5 capas de evidencia para blindar tu caso
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                No es solo la notificacion. Es un expediente probatorio completo
                que ataca cada posible argumento de la defensa del empleado.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-500/20 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold">Testigos Digitales</h3>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Declaraciones firmadas digitalmente con hash SHA-256, IP y timestamp.
                </p>
                <div className="text-xs text-slate-500 bg-white/5 rounded p-2">
                  <strong className="text-slate-400">Ataca:</strong> &ldquo;No hay testigos del hecho&rdquo;
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-500/20 p-2 rounded-lg">
                    <Camera className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold">Evidencia Multimedia</h3>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Fotos y videos con metadatos EXIF: GPS, fecha, dispositivo, hash.
                </p>
                <div className="text-xs text-slate-500 bg-white/5 rounded p-2">
                  <strong className="text-slate-400">Ataca:</strong> &ldquo;No hay prueba del hecho&rdquo;
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-500/20 p-2 rounded-lg">
                    <ClipboardList className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold">Bitacora de Novedades</h3>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Registro de 6 meses de gestion progresiva: llamados de atencion, charlas, advertencias.
                </p>
                <div className="text-xs text-slate-500 bg-white/5 rounded p-2">
                  <strong className="text-slate-400">Ataca:</strong> &ldquo;Es persecucion/mobbing&rdquo;
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-500/20 p-2 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold">Audiencia de Descargo</h3>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Empleado puede presentar su version. Si ejerce: posibles confesiones. Si no: renuncia documentada.
                </p>
                <div className="text-xs text-slate-500 bg-white/5 rounded p-2">
                  <strong className="text-slate-400">Ataca:</strong> &ldquo;No tuve derecho de defensa&rdquo;
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-500/20 p-2 rounded-lg">
                    <Download className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold">Pack de Evidencias</h3>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  ZIP completo con todo: convenio, sancion, logs, selfie, cadena de custodia JSON para peritos.
                </p>
                <div className="text-xs text-slate-500 bg-white/5 rounded p-2">
                  <strong className="text-slate-400">Listo para:</strong> Presentar en juicio
                </div>
              </div>

              <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-500/30 p-2 rounded-lg">
                    <Globe className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold">Blockchain Timestamp</h3>
                </div>
                <p className="text-sm text-slate-300 mb-4">
                  Hash anclado en blockchain Bitcoin via OpenTimestamp. Fecha cierta irrefutable.
                </p>
                <div className="text-xs text-emerald-400/70 bg-emerald-500/10 rounded p-2">
                  <strong>Verificable:</strong> Por cualquier perito, para siempre
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flujo Simplificado */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Como funciona en 4 pasos
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileSignature className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="text-sm font-medium text-emerald-600 mb-1">Paso 0</div>
                <h3 className="font-semibold text-slate-900 mb-2">Onboarding</h3>
                <p className="text-sm text-slate-600">
                  Empleado firma convenio de domicilio electronico
                </p>
              </div>

              <div className="text-center">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="text-sm font-medium text-emerald-600 mb-1">Paso 1</div>
                <h3 className="font-semibold text-slate-900 mb-2">Creas la sancion</h3>
                <p className="text-sm text-slate-600">
                  Completas formulario, agregas testigos y evidencia
                </p>
              </div>

              <div className="text-center">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="text-sm font-medium text-emerald-600 mb-1">Paso 2</div>
                <h3 className="font-semibold text-slate-900 mb-2">Notificas</h3>
                <p className="text-sm text-slate-600">
                  Email + SMS + WhatsApp automatico al empleado
                </p>
              </div>

              <div className="text-center">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="text-sm font-medium text-emerald-600 mb-1">Paso 3</div>
                <h3 className="font-semibold text-slate-900 mb-2">Queda firme</h3>
                <p className="text-sm text-slate-600">
                  30 dias sin impugnar = sancion firme (Ley 27.742)
                </p>
              </div>
            </div>

            <div className="mt-10 bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="bg-amber-100 p-2 rounded-lg shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">
                    Si el empleado no confirma en 48 horas
                  </h4>
                  <p className="text-slate-700 text-sm">
                    El sistema te alerta y genera una <strong>Cedula de Aviso</strong> que podes
                    imprimir y hacer firmar en persona. El plazo de 30 dias corre desde esa firma.
                    Siempre tenes un fallback fisico.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Validacion Legal */}
      <section className="py-16 bg-slate-50" id="validacion-legal">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                <Gavel className="h-4 w-4" />
                Validado por abogados laboralistas
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Fundamento legal solido
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Cada elemento del sistema esta respaldado por normativa vigente.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-emerald-600" />
                  Normativa aplicable
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Acordada 31/2011 CSJN</p>
                      <p className="text-sm text-slate-600">Domicilio electronico y notificaciones</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Art. 288 Codigo Civil y Comercial</p>
                      <p className="text-sm text-slate-600">Equivalencia de firma digital</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Ley 27.742 (Reforma Laboral 2025)</p>
                      <p className="text-sm text-slate-600">Plazo de 30 dias para impugnar</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Art. 67 LCT</p>
                      <p className="text-sm text-slate-600">Poder disciplinario del empleador</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Ley 25.326</p>
                      <p className="text-sm text-slate-600">Proteccion de datos personales (cumplimos)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Veredicto legal
                </h3>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                  <p className="text-emerald-800 font-medium">
                    &ldquo;Bien ejecutado, el plan dara a las PyMEs una proteccion probatoria
                    muy fuerte que reducira significativamente el riesgo de perder pleitos
                    por falta de prueba.&rdquo;
                  </p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-700">Arquitectura validada legalmente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-700">Convenio de domicilio alineado con CSJN</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-700">Verificacion de identidad robusta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-700">Hash + PKI aceptados por tribunales</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparativa */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Compara tus opciones
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Caracteristica</th>
                    <th className="text-center py-4 px-4 text-slate-400 font-medium">Firma Legajo</th>
                    <th className="text-center py-4 px-4 text-slate-400 font-medium">Carta Doc.</th>
                    <th className="text-center py-4 px-4 font-medium text-emerald-400">Notificarte</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-white/10">
                    <td className="py-4 px-4">Prueba de entrega</td>
                    <td className="text-center py-4 px-4"><CircleX className="h-5 w-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleCheck className="h-5 w-5 text-emerald-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleCheck className="h-5 w-5 text-emerald-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-4 px-4">Prueba de identidad</td>
                    <td className="text-center py-4 px-4"><CircleX className="h-5 w-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleX className="h-5 w-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleCheck className="h-5 w-5 text-emerald-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-4 px-4">Prueba del hecho</td>
                    <td className="text-center py-4 px-4"><CircleX className="h-5 w-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleX className="h-5 w-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleCheck className="h-5 w-5 text-emerald-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-4 px-4">Testigos digitales</td>
                    <td className="text-center py-4 px-4"><CircleX className="h-5 w-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleX className="h-5 w-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleCheck className="h-5 w-5 text-emerald-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-4 px-4">Evidencia multimedia</td>
                    <td className="text-center py-4 px-4"><CircleX className="h-5 w-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleX className="h-5 w-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleCheck className="h-5 w-5 text-emerald-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-4 px-4">Blockchain timestamp</td>
                    <td className="text-center py-4 px-4"><CircleX className="h-5 w-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleX className="h-5 w-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleCheck className="h-5 w-5 text-emerald-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-4 px-4">Audiencia de descargo</td>
                    <td className="text-center py-4 px-4"><Minus className="h-5 w-5 text-slate-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleX className="h-5 w-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleCheck className="h-5 w-5 text-emerald-400 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-4 px-4">Pack para juicio</td>
                    <td className="text-center py-4 px-4"><CircleX className="h-5 w-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleX className="h-5 w-5 text-red-400 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CircleCheck className="h-5 w-5 text-emerald-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Costo por sancion</td>
                    <td className="text-center py-4 px-4 text-slate-400">$0</td>
                    <td className="text-center py-4 px-4 text-slate-400">$15.000+</td>
                    <td className="text-center py-4 px-4 text-emerald-400 font-medium">Desde $1.780</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ROI */}
      <section className="py-16 bg-gradient-to-b from-emerald-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">
              El calculo que no podes ignorar
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <DollarSign className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <div className="text-4xl font-bold text-red-600 mb-2">$72.000.000</div>
                <p className="text-slate-600">Costo promedio de perder un juicio laboral</p>
                <p className="text-sm text-slate-500 mt-2">
                  (Indemnizacion + multas + intereses)
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <Shield className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
                <div className="text-4xl font-bold text-emerald-600 mb-2">$89.000/mes</div>
                <p className="text-slate-600">Plan PyME de Notificarte</p>
                <p className="text-sm text-slate-500 mt-2">
                  (Hasta 50 empleados, sanciones ilimitadas)
                </p>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-8">
              <p className="text-lg mb-2">Un solo juicio evitado equivale a</p>
              <div className="text-5xl font-bold text-emerald-400 mb-2">67 años</div>
              <p className="text-slate-400">de suscripcion a Notificarte</p>
              <div className="mt-4 pt-4 border-t border-white/20">
                <span className="text-2xl font-bold text-emerald-400">ROI: 6.716%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-white" id="precio">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Planes simples y transparentes
              </h2>
              <p className="text-lg text-slate-600">
                Sin costos ocultos. Sin sorpresas. Cancela cuando quieras.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Starter */}
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Starter</h3>
                  <p className="text-sm text-slate-500 mb-4">Para microempresas</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900">$45.000</span>
                    <span className="text-slate-500">/mes</span>
                  </div>
                  <ul className="space-y-3 mb-6 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Hasta 10 empleados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Sanciones ilimitadas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Notificacion multicanal</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Pack de evidencias</span>
                    </li>
                  </ul>
                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full">Empezar</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* PyME - Destacado */}
              <Card className="border-emerald-500 border-2 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Mas Popular
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">PyME</h3>
                  <p className="text-sm text-slate-500 mb-4">Para pequeñas y medianas</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900">$89.000</span>
                    <span className="text-slate-500">/mes</span>
                  </div>
                  <ul className="space-y-3 mb-6 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Hasta 50 empleados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Todo lo de Starter</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Testigos digitales</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Evidencia multimedia</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Blockchain timestamp</span>
                    </li>
                  </ul>
                  <Link href="/login" className="block">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Empezar</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Empresa */}
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Empresa</h3>
                  <p className="text-sm text-slate-500 mb-4">Para empresas grandes</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900">$149.000</span>
                    <span className="text-slate-500">/mes</span>
                  </div>
                  <ul className="space-y-3 mb-6 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Empleados ilimitados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Todo lo de PyME</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Firma digital PKI</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>API de integracion</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Soporte prioritario</span>
                    </li>
                  </ul>
                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full">Contactar</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-sm text-slate-500 mt-8">
              Todos los precios en ARS. Ajuste trimestral por inflacion. IVA no incluido.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50" id="faq">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Preguntas frecuentes
              </h2>
            </div>

            <div className="space-y-4">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <span className="font-medium text-slate-900 text-left">¿Tiene validez legal en Argentina?</span>
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 bg-white border border-t-0 border-slate-200 rounded-b-lg">
                  <p className="text-slate-600">
                    Si. El sistema esta diseñado en base a la Acordada 31/2011 de la CSJN (domicilio electronico),
                    el Art. 288 del Codigo Civil y Comercial (firma digital), la Ley 27.742 (plazo de 30 dias),
                    y el Art. 67 de la LCT (poder disciplinario). Fue validado por abogados laboralistas.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <span className="font-medium text-slate-900 text-left">¿Por que necesito el Convenio de Domicilio Electronico?</span>
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 bg-white border border-t-0 border-slate-200 rounded-b-lg">
                  <p className="text-slate-600">
                    Es el &ldquo;ancla juridica&rdquo; que da validez a todas las notificaciones digitales.
                    Sin este convenio, el empleado puede alegar &ldquo;nunca acepte recibir notificaciones por WhatsApp&rdquo;.
                    Con el convenio firmado, esa defensa se desmorona porque el mismo constituyo esos medios como domicilios legales.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <span className="font-medium text-slate-900 text-left">¿Que pasa si el empleado dice que no fue el quien leyo la notificacion?</span>
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 bg-white border border-t-0 border-slate-200 rounded-b-lg">
                  <p className="text-slate-600">
                    Para acceder a la notificacion, el empleado debe: (1) ingresar su CUIL completo,
                    (2) recibir e ingresar un codigo OTP enviado al telefono que el mismo constituyo,
                    y (3) tomarse una selfie con la pantalla visible. Tenemos la foto del empleado leyendo la sancion,
                    su IP, timestamp y el codigo OTP validado. Es casi imposible sostener que &ldquo;no fue el&rdquo;.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <span className="font-medium text-slate-900 text-left">¿Que pasa si el empleado no confirma la lectura?</span>
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 bg-white border border-t-0 border-slate-200 rounded-b-lg">
                  <p className="text-slate-600">
                    Si no confirma en 48 horas, el sistema te alerta y genera una &ldquo;Cedula de Aviso de Notificacion Pendiente&rdquo;
                    que podes imprimir y hacer firmar en persona. Si se niega a firmar, lo documentas con dos testigos.
                    El plazo de 30 dias corre desde esa instancia fisica. Siempre tenes un fallback.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <span className="font-medium text-slate-900 text-left">¿Como demuestro que el documento no fue alterado?</span>
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 bg-white border border-t-0 border-slate-200 rounded-b-lg">
                  <p className="text-slate-600">
                    Cada documento tiene un hash SHA-256 (huella digital unica) que se ancla en la blockchain de Bitcoin
                    via OpenTimestamp. Cualquier modificacion al documento cambiaria el hash. Un perito informatico
                    puede verificar la integridad en segundos comparando el hash original con el del documento presentado.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <span className="font-medium text-slate-900 text-left">¿Como pruebo que el hecho realmente ocurrio?</span>
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 bg-white border border-t-0 border-slate-200 rounded-b-lg">
                  <p className="text-slate-600">
                    Con el sistema de 5 capas: (1) Testigos digitales que firman declaraciones bajo juramento con hash,
                    (2) Evidencia multimedia con metadatos EXIF (GPS, fecha, dispositivo),
                    (3) Bitacora de novedades que muestra gestion progresiva (no mobbing),
                    (4) Audiencia de descargo donde el empleado puede confesar o contradecirse,
                    (5) Pack de evidencias completo para el juicio.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <span className="font-medium text-slate-900 text-left">¿Es seguro? ¿Que pasa con los datos personales?</span>
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 bg-white border border-t-0 border-slate-200 rounded-b-lg">
                  <p className="text-slate-600">
                    Cumplimos con la Ley 25.326 de Proteccion de Datos Personales. La base de datos esta registrada
                    ante la AAIP. El Convenio de Domicilio Electronico incluye el consentimiento expreso para el
                    tratamiento de datos. Los datos se almacenan encriptados y se retienen por el tiempo legal necesario.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <span className="font-medium text-slate-900 text-left">¿Puedo usar esto para despidos?</span>
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 bg-white border border-t-0 border-slate-200 rounded-b-lg">
                  <p className="text-slate-600">
                    El sistema esta diseñado para sanciones disciplinarias (apercibimientos y suspensiones).
                    Para el despido en si, recomendamos carta documento por la mayor solemnidad del acto.
                    Pero todo el historial de sanciones documentado en Notificarte sera evidencia crucial
                    para justificar un despido con causa.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Protege tu PyME hoy
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Las primeras 3 sanciones son gratis. Sin tarjeta de credito.
              <br />
              Empeza a construir tu escudo legal ahora.
            </p>
            <Link href="/login">
              <Button size="lg" className="text-lg px-10 bg-white text-emerald-600 hover:bg-emerald-50">
                Crear Cuenta Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-emerald-500" />
                <span className="font-semibold">Notificarte</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-400">
                <a href="#como-funciona" className="hover:text-white">Como Funciona</a>
                <a href="#validacion-legal" className="hover:text-white">Validacion Legal</a>
                <a href="#precio" className="hover:text-white">Precios</a>
                <a href="#faq" className="hover:text-white">FAQ</a>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
              <p>© 2026 Notificarte. El escudo legal para PyMEs argentinas.</p>
              <p className="mt-2">
                Validado por abogados laboralistas · Acordada 31/2011 CSJN · Art. 288 CCyC · Ley 27.742
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
