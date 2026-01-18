"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Phone,
  Shield,
  Clock,
  Building,
  User,
  Loader2,
} from "lucide-react";
import { TEXTOS_CONVENIO } from "@/lib/types";

interface ConvenioData {
  id: string;
  estado: string;
  email_constituido: string;
  telefono_constituido?: string;
  version_convenio: string;
  empleado_nombre: string;
  empleado_cuil: string;
  empresa_nombre: string;
  empresa_cuit: string;
  token_valido: boolean;
  dias_para_expirar: number;
  otp_enviado: boolean;
  checkbox_aceptado: boolean;
  otp_verificado: boolean;
}

type Paso = "cargando" | "error" | "convenio" | "otp" | "firmado" | "expirado" | "ya_firmado";

export function ConvenioClient({ token }: { token: string }) {
  const [paso, setPaso] = useState<Paso>("cargando");
  const [convenio, setConvenio] = useState<ConvenioData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Paso convenio
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaBiometricos, setAceptaBiometricos] = useState(false);
  const [cargandoAceptar, setCargandoAceptar] = useState(false);

  // Paso OTP
  const [codigoOTP, setCodigoOTP] = useState("");
  const [enviandoOTP, setEnviandoOTP] = useState(false);
  const [verificandoOTP, setVerificandoOTP] = useState(false);
  const [otpEnviado, setOtpEnviado] = useState(false);
  const [telefonoOfuscado, setTelefonoOfuscado] = useState("");

  // Paso firmado
  const [hashConvenio, setHashConvenio] = useState("");

  // Cargar datos del convenio
  useEffect(() => {
    async function cargarConvenio() {
      try {
        const response = await fetch(`/api/convenio/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Error al cargar el convenio");
          setPaso("error");
          return;
        }

        setConvenio(data);

        if (!data.token_valido) {
          if (data.estado === "firmado_digital" || data.estado === "firmado_papel") {
            setPaso("ya_firmado");
          } else {
            setPaso("expirado");
          }
        } else if (data.checkbox_aceptado && !data.otp_verificado) {
          setOtpEnviado(data.otp_enviado);
          setPaso("otp");
        } else if (data.otp_verificado) {
          setPaso("ya_firmado");
        } else {
          setPaso("convenio");
        }
      } catch {
        setError("Error de conexión. Intente nuevamente.");
        setPaso("error");
      }
    }

    cargarConvenio();
  }, [token]);

  // Aceptar términos del convenio
  async function handleAceptarTerminos() {
    if (!aceptaTerminos) return;

    setCargandoAceptar(true);
    setError(null);

    try {
      const response = await fetch(`/api/convenio/${token}/aceptar-terminos`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al aceptar términos");
        setCargandoAceptar(false);
        return;
      }

      // Pasar al paso OTP
      setPaso("otp");
    } catch {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setCargandoAceptar(false);
    }
  }

  // Enviar código OTP
  async function handleEnviarOTP() {
    setEnviandoOTP(true);
    setError(null);

    try {
      const response = await fetch(`/api/convenio/${token}/enviar-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canal: "sms" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al enviar código");
        setEnviandoOTP(false);
        return;
      }

      setOtpEnviado(true);
      setTelefonoOfuscado(data.telefono_ofuscado || "");
    } catch {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setEnviandoOTP(false);
    }
  }

  // Verificar OTP y firmar
  async function handleFirmar() {
    if (codigoOTP.length !== 6) {
      setError("Ingrese el código de 6 dígitos");
      return;
    }

    setVerificandoOTP(true);
    setError(null);

    try {
      const response = await fetch(`/api/convenio/${token}/firmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo_otp: codigoOTP,
          acepta_notificaciones_digitales: true,
          acepta_biometricos: aceptaBiometricos,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al firmar convenio");
        setVerificandoOTP(false);
        return;
      }

      setHashConvenio(data.hash_convenio);
      setPaso("firmado");
    } catch {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setVerificandoOTP(false);
    }
  }

  // Renderizar según el paso
  if (paso === "cargando") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Cargando convenio...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paso === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paso === "expirado") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Enlace Expirado
            </h2>
            <p className="text-gray-600 mb-4">
              Este enlace de firma ha expirado. Por favor, solicite a su empleador
              un nuevo enlace para firmar el convenio.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paso === "ya_firmado") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Convenio Ya Firmado
            </h2>
            <p className="text-gray-600">
              Este convenio ya fue firmado anteriormente. No es necesario realizar
              ninguna acción adicional.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paso === "firmado") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="bg-green-50 border-b border-green-100">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-6 w-6" />
              Convenio Firmado Exitosamente
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <p className="text-gray-700 text-lg mb-2">
                <strong>{convenio?.empleado_nombre}</strong>
              </p>
              <p className="text-gray-600">
                Ha firmado exitosamente el Convenio de Domicilio Electrónico con{" "}
                <strong>{convenio?.empresa_nombre}</strong>.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Hash de verificación:</p>
              <p className="font-mono text-xs text-gray-700 break-all">
                {hashConvenio}
              </p>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                A partir de ahora recibirá las notificaciones laborales en su email{" "}
                <strong>{convenio?.email_constituido}</strong>.
                Si en algún momento prefiere recibir notificaciones físicas, puede
                solicitarlo a su empleador.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Paso convenio - Mostrar texto y checkbox
  if (paso === "convenio") {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <Card className="mb-6">
            <CardHeader className="bg-blue-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Convenio de Domicilio Electrónico
              </CardTitle>
              <p className="text-blue-100 text-sm mt-1">
                Conforme Acordada N° 31/2011 CSJN
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-start gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    <strong>{convenio?.empresa_nombre}</strong>
                    <br />
                    <span className="text-gray-400">CUIT: {convenio?.empresa_cuit}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    <strong>{convenio?.empleado_nombre}</strong>
                    <br />
                    <span className="text-gray-400">CUIL: {convenio?.empleado_cuil}</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Texto del convenio */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {TEXTOS_CONVENIO.TEXTO_CONVENIO}
                </pre>
              </div>

              {/* Datos del domicilio electrónico */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Domicilio Electrónico a Constituir
                </h3>
                <p className="text-sm text-blue-700">
                  <strong>Email:</strong> {convenio?.email_constituido}
                </p>
                {convenio?.telefono_constituido && (
                  <p className="text-sm text-blue-700">
                    <strong>Teléfono:</strong> {convenio.telefono_constituido}
                  </p>
                )}
              </div>

              {/* Checkbox principal */}
              <div className="border rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="acepta-terminos"
                    checked={aceptaTerminos}
                    onCheckedChange={(checked) => setAceptaTerminos(checked === true)}
                  />
                  <label
                    htmlFor="acepta-terminos"
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {TEXTOS_CONVENIO.CHECKBOX_ACEPTACION}
                  </label>
                </div>
              </div>

              {/* Checkbox biométricos (opcional) */}
              <div className="border rounded-lg p-4 mb-6 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="acepta-biometricos"
                    checked={aceptaBiometricos}
                    onCheckedChange={(checked) => setAceptaBiometricos(checked === true)}
                  />
                  <label
                    htmlFor="acepta-biometricos"
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    <span className="font-semibold text-amber-800">
                      Consentimiento para datos biométricos (opcional)
                    </span>
                    <br />
                    <span className="text-gray-600 text-xs">
                      Autorizo la captura de mi imagen para verificación de identidad
                      según Ley 25.326.
                    </span>
                  </label>
                </div>
              </div>

              {error && (
                <Alert className="mb-4 bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {/* Plazo */}
              <Alert className="mb-6 bg-amber-50 border-amber-200">
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  Este enlace expira en <strong>{convenio?.dias_para_expirar} días</strong>.
                </AlertDescription>
              </Alert>

              <Button
                className="w-full"
                size="lg"
                onClick={handleAceptarTerminos}
                disabled={!aceptaTerminos || cargandoAceptar}
              >
                {cargandoAceptar ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Acepto los Términos - Continuar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Alternativa física */}
          <Card className="bg-gray-50">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-gray-600">
                <strong>Nota:</strong> {TEXTOS_CONVENIO.AVISO_ALTERNATIVA_FISICA}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Paso OTP - Verificación por SMS
  if (paso === "otp") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-6 w-6" />
              Verificación de Identidad
            </CardTitle>
            <p className="text-blue-100 text-sm mt-1">
              Para confirmar su identidad, le enviaremos un código a su teléfono.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {!otpEnviado ? (
              <>
                <p className="text-gray-700 mb-4">
                  Se enviará un código de verificación por SMS al número registrado:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
                  <Phone className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="font-mono text-lg">
                    {convenio?.telefono_constituido || "No disponible"}
                  </p>
                </div>

                {error && (
                  <Alert className="mb-4 bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleEnviarOTP}
                  disabled={enviandoOTP || !convenio?.telefono_constituido}
                >
                  {enviandoOTP ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando código...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Enviar Código por SMS
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <p className="text-gray-700 mb-4">
                  Ingrese el código de 6 dígitos enviado a{" "}
                  <strong>{telefonoOfuscado}</strong>:
                </p>

                <div className="mb-6">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={codigoOTP}
                    onChange={(e) => setCodigoOTP(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="text-center text-2xl font-mono tracking-widest h-14"
                  />
                </div>

                {error && (
                  <Alert className="mb-4 bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full mb-4"
                  size="lg"
                  onClick={handleFirmar}
                  disabled={codigoOTP.length !== 6 || verificandoOTP}
                >
                  {verificandoOTP ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verificando y firmando...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Verificar y Firmar Convenio
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleEnviarOTP}
                  disabled={enviandoOTP}
                >
                  {enviandoOTP ? "Enviando..." : "Reenviar código"}
                </Button>

                <p className="text-sm text-gray-500 text-center mt-4">
                  El código expira en 10 minutos.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
