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
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesion</Button>
            </Link>
            <Link href="/login">
              <Button>Probar Gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
              <Scale className="h-4 w-4" />
              Ley 27.742 - Reforma Laboral 2025
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Notificaciones laborales que{" "}
              <span className="text-emerald-600">ganan juicios</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Sistema digital de notificaciones fehacientes con cadena de custodia
              completa. Apercibimientos y suspensiones que quedan{" "}
              <strong>firmes en 30 dias</strong> sin impugnacion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="text-lg px-8">
                  Empezar Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#como-funciona">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Ver como funciona
                </Button>
              </a>
            </div>
            <p className="text-sm text-slate-500 mt-4">
              Sin tarjeta de credito. Primeras 5 notificaciones gratis.
            </p>
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="py-20 bg-red-50 border-y border-red-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  El problema que enfrentas
                </h2>
                <p className="text-slate-600">
                  Sin prueba fehaciente de notificacion, las sanciones no tienen
                  valor legal.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-red-200 bg-white">
                <CardContent className="pt-6">
                  <p className="font-semibold text-red-700 mb-2">
                    Empleado dice "nunca me avisaron"
                  </p>
                  <p className="text-sm text-slate-600">
                    Sin prueba de entrega, el juez le cree al trabajador y tu
                    sancion no vale nada.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-white">
                <CardContent className="pt-6">
                  <p className="font-semibold text-red-700 mb-2">
                    Carta documento cara y lenta
                  </p>
                  <p className="text-sm text-slate-600">
                    $15.000+ por carta, demora dias en llegar, y el empleado
                    puede rechazarla.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-white">
                <CardContent className="pt-6">
                  <p className="font-semibold text-red-700 mb-2">
                    Perdes el juicio laboral
                  </p>
                  <p className="text-sm text-slate-600">
                    Sin historial de sanciones firmes, un despido con causa se
                    convierte en despido sin causa.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Solucion */}
      <section className="py-20" id="como-funciona">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Como funciona Notificarte
            </h2>
            <p className="text-lg text-slate-600">
              En 3 pasos tenes una sancion con valor de prueba plena
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-600">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Creas la sancion</h3>
              <p className="text-slate-600">
                Completas tipo, motivo y descripcion. Se genera un PDF con hash
                SHA-256 inalterable.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-600">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                El empleado confirma
              </h3>
              <p className="text-slate-600">
                Recibe email/SMS/WhatsApp, valida su CUIL, lee la sancion y firma
                una declaracion jurada.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-600">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Queda firme</h3>
              <p className="text-slate-600">
                30 dias sin impugnacion = sancion firme con valor de prueba plena
                en juicio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Todo lo que necesitas para ganar
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <Lock className="h-10 w-10 text-emerald-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Hash SHA-256</h3>
                <p className="text-slate-600">
                  Cada documento tiene un hash unico que prueba que no fue
                  modificado.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Smartphone className="h-10 w-10 text-emerald-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  Email + SMS + WhatsApp
                </h3>
                <p className="text-slate-600">
                  Triple canal de notificacion. El empleado no puede decir que no
                  recibio.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <FileCheck className="h-10 w-10 text-emerald-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  Declaracion jurada
                </h3>
                <p className="text-slate-600">
                  El empleado confirma con checkbox bajo declaracion jurada que
                  leyo y comprendio.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Clock className="h-10 w-10 text-emerald-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  Regla de los 30 dias
                </h3>
                <p className="text-slate-600">
                  Sin impugnacion en 30 dias, la sancion queda firme
                  automaticamente.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Shield className="h-10 w-10 text-emerald-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  Paquete de evidencia
                </h3>
                <p className="text-slate-600">
                  ZIP descargable con PDF, cadena de custodia y metadata para
                  presentar en juicio.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Zap className="h-10 w-10 text-emerald-600 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Carta documento</h3>
                <p className="text-slate-600">
                  Si el empleado no responde en 72hs, genera el PDF para enviar
                  carta documento.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Calculadora */}
      <section className="py-20 bg-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Cuanto te ahorra?</h2>
            <p className="text-emerald-100 mb-8">
              Compara el costo de Notificarte vs carta documento tradicional
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Carta Documento</h3>
                <ul className="text-left space-y-2 text-emerald-100">
                  <li className="flex justify-between">
                    <span>Costo por carta:</span>
                    <span className="font-bold text-white">$15.000</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Tiempo de entrega:</span>
                    <span className="font-bold text-white">3-7 dias</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Empleado puede rechazar:</span>
                    <span className="font-bold text-white">Si</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white text-slate-900 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4 text-emerald-600">
                  Notificarte
                </h3>
                <ul className="text-left space-y-2">
                  <li className="flex justify-between">
                    <span className="text-slate-600">Costo por notificacion:</span>
                    <span className="font-bold">$500</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-600">Tiempo de entrega:</span>
                    <span className="font-bold">Instantaneo</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-600">Empleado puede rechazar:</span>
                    <span className="font-bold">No</span>
                  </li>
                </ul>
              </div>
            </div>
            <p className="mt-8 text-xl">
              <span className="font-bold text-3xl">96% mas barato</span>
              <br />
              <span className="text-emerald-100">y 100x mas rapido</span>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Empeza a proteger tu empresa hoy
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Las primeras 5 notificaciones son gratis. Sin tarjeta de credito.
            </p>
            <Link href="/login">
              <Button size="lg" className="text-lg px-12">
                Crear cuenta gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
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
