"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  Search,
  Hash,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Lock,
  Scale,
} from "lucide-react";
import Link from "next/link";

export default function VerificarPage() {
  const router = useRouter();
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const hashLimpio = hash.trim().toLowerCase();

    if (!hashLimpio) {
      setError("Ingrese un hash SHA-256 para verificar");
      return;
    }

    // Validar formato de hash SHA-256 (64 caracteres hexadecimales)
    if (!/^[a-f0-9]{64}$/i.test(hashLimpio)) {
      setError("El hash debe ser SHA-256 válido (64 caracteres hexadecimales)");
      return;
    }

    setLoading(true);
    router.push(`/verificar/${hashLimpio}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl">NotiLegal</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            Verificación Pública
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Título principal */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Verificador de Integridad Documental
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Verifique que un documento generado por NotiLegal no ha sido alterado.
            Este servicio está disponible para peritos, jueces, abogados y cualquier parte interesada.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Formulario de verificación */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Verificar Hash SHA-256
              </CardTitle>
              <CardDescription>
                Ingrese el hash del documento que desea verificar. Lo encontrará en el pie de página
                del PDF o en el paquete de evidencia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hash">Hash SHA-256 del documento</Label>
                  <Textarea
                    id="hash"
                    placeholder="Ej: a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    className="font-mono text-sm h-20 resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    El hash SHA-256 es una cadena de 64 caracteres hexadecimales que identifica
                    únicamente el contenido del documento.
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Verificar Documento
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Cómo funciona */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash className="h-5 w-5 text-purple-600" />
                ¿Cómo funciona?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-medium text-xs">
                  1
                </div>
                <p className="text-slate-600">
                  Cada documento generado por NotiLegal incluye un hash SHA-256 único calculado
                  sobre su contenido.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-medium text-xs">
                  2
                </div>
                <p className="text-slate-600">
                  Este hash actúa como una "huella digital" que cambia si se modifica aunque sea
                  un solo carácter del documento.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-medium text-xs">
                  3
                </div>
                <p className="text-slate-600">
                  Al verificar, comparamos el hash que usted ingresa con el almacenado en nuestro
                  sistema al momento de la creación.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Para peritos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="h-5 w-5 text-emerald-600" />
                Para Peritos y Jueces
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-slate-600">
                Este sistema cumple con los estándares de cadena de custodia digital:
              </p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Hashes SHA-256 generados al momento de creación</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Timestamps inmutables con trazabilidad completa</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Registro de todos los accesos y verificaciones</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Exportación de paquete de evidencia completo</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Tipos de documentos verificables */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Documentos Verificables</CardTitle>
            <CardDescription>
              Puede verificar la integridad de cualquiera de estos tipos de documentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">Sanciones</p>
                  <p className="text-xs text-muted-foreground">Apercibimientos, suspensiones</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">Declaraciones de Testigos</p>
                  <p className="text-xs text-muted-foreground">Firmadas digitalmente</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-sm">Evidencia Multimedia</p>
                  <p className="text-xs text-muted-foreground">Fotos, videos, documentos</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <FileText className="h-5 w-5 text-cyan-600" />
                <div>
                  <p className="font-medium text-sm">Descargos</p>
                  <p className="text-xs text-muted-foreground">Respuestas del empleado</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-sm">Bitácora de Novedades</p>
                  <p className="text-xs text-muted-foreground">Registros de gestión</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <FileText className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-sm">Paquetes de Evidencia</p>
                  <p className="text-xs text-muted-foreground">ZIP completos exportados</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            NotiLegal - Sistema de Notificación Fehaciente conforme a la Ley 27.742
          </p>
          <p className="mt-1">
            Para consultas técnicas:{" "}
            <a href="mailto:soporte@notilegal.com.ar" className="text-blue-600 hover:underline">
              soporte@notilegal.com.ar
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
