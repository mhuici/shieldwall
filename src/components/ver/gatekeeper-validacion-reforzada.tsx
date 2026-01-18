"use client";

import { useState, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Loader2,
  AlertTriangle,
  Clock,
  Lock,
  Phone,
  Camera,
  CheckCircle,
} from "lucide-react";
import { TEXTOS_LEGALES } from "@/lib/types";

type Paso = "cuil" | "otp" | "selfie" | "completado";

interface GatekeeperValidacionReforzadaProps {
  token: string;
  empresaNombre: string;
  empleadoNombre: string;
  empleadoTelefono?: string;
  requiereSelfie?: boolean; // Si el empleado consintió biométricos
  onValidacionExitosa: () => void;
}

export function GatekeeperValidacionReforzada({
  token,
  empresaNombre,
  empleadoNombre,
  empleadoTelefono,
  requiereSelfie = false,
  onValidacionExitosa,
}: GatekeeperValidacionReforzadaProps) {
  const [paso, setPaso] = useState<Paso>("cuil");

  // Estado CUIL
  const [cuil, setCuil] = useState("");
  const [legajo, setLegajo] = useState("");
  const [loadingCuil, setLoadingCuil] = useState(false);
  const [errorCuil, setErrorCuil] = useState<string | null>(null);
  const [intentosFallidos, setIntentosFallidos] = useState(0);

  // Estado OTP
  const [codigoOTP, setCodigoOTP] = useState("");
  const [loadingEnviarOTP, setLoadingEnviarOTP] = useState(false);
  const [loadingVerificarOTP, setLoadingVerificarOTP] = useState(false);
  const [errorOTP, setErrorOTP] = useState<string | null>(null);
  const [otpEnviado, setOtpEnviado] = useState(false);
  const [telefonoOfuscado, setTelefonoOfuscado] = useState("");

  // Estado Selfie
  const [capturandoSelfie, setCapturandoSelfie] = useState(false);
  const [errorSelfie, setErrorSelfie] = useState<string | null>(null);
  const [selfieCapturada, setSelfieCapturada] = useState(false);
  const [subiendoSelfie, setSubiendoSelfie] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Formatear CUIL
  const handleCuilChange = (value: string) => {
    const numeros = value.replace(/\D/g, "");
    let formatted = numeros;
    if (numeros.length > 2) {
      formatted = numeros.slice(0, 2) + "-" + numeros.slice(2);
    }
    if (numeros.length > 10) {
      formatted =
        numeros.slice(0, 2) +
        "-" +
        numeros.slice(2, 10) +
        "-" +
        numeros.slice(10, 11);
    }
    setCuil(formatted);
    setErrorCuil(null);
  };

  // PASO 1: Validar CUIL
  const handleValidarCuil = async () => {
    const cuilLimpio = cuil.replace(/\D/g, "");

    if (!cuilLimpio && !legajo.trim()) {
      setErrorCuil("Debe ingresar su CUIL o número de legajo");
      return;
    }

    if (cuilLimpio && cuilLimpio.length !== 11) {
      setErrorCuil("El CUIL debe tener 11 dígitos");
      return;
    }

    setLoadingCuil(true);
    setErrorCuil(null);

    try {
      const response = await fetch(`/api/ver/${token}/validar-identidad`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuil: cuilLimpio || null,
          legajo: legajo.trim() || null,
          userAgent: navigator.userAgent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIntentosFallidos((prev) => prev + 1);
        if (data.bloqueado) {
          setErrorCuil(
            "Demasiados intentos fallidos. Por favor, contacte a su empleador."
          );
        } else {
          setErrorCuil(
            data.error || "Los datos ingresados no coinciden con los registrados"
          );
        }
        return;
      }

      // CUIL validado - pasar a OTP
      setPaso("otp");
    } catch {
      setErrorCuil("Error de conexión. Intente nuevamente.");
    } finally {
      setLoadingCuil(false);
    }
  };

  // PASO 2a: Enviar OTP
  const handleEnviarOTP = async () => {
    setLoadingEnviarOTP(true);
    setErrorOTP(null);

    try {
      const response = await fetch(`/api/ver/${token}/enviar-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canal: "sms" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorOTP(data.error || "Error al enviar código");
        return;
      }

      setOtpEnviado(true);
      setTelefonoOfuscado(data.telefono_ofuscado || "");
    } catch {
      setErrorOTP("Error de conexión. Intente nuevamente.");
    } finally {
      setLoadingEnviarOTP(false);
    }
  };

  // PASO 2b: Verificar OTP
  const handleVerificarOTP = async () => {
    if (codigoOTP.length !== 6) {
      setErrorOTP("Ingrese el código de 6 dígitos");
      return;
    }

    setLoadingVerificarOTP(true);
    setErrorOTP(null);

    try {
      const response = await fetch(`/api/ver/${token}/verificar-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo_otp: codigoOTP }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorOTP(data.error || "Código incorrecto");
        return;
      }

      // OTP verificado
      if (requiereSelfie) {
        setPaso("selfie");
      } else {
        setPaso("completado");
        onValidacionExitosa();
      }
    } catch {
      setErrorOTP("Error de conexión. Intente nuevamente.");
    } finally {
      setLoadingVerificarOTP(false);
    }
  };

  // PASO 3: Iniciar cámara
  const iniciarCamara = useCallback(async () => {
    setCapturandoSelfie(true);
    setErrorSelfie(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setErrorSelfie(
        "No se pudo acceder a la cámara. Verifique los permisos."
      );
      setCapturandoSelfie(false);
    }
  }, []);

  // Capturar foto
  const capturarFoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // Detener stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Convertir a blob
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setErrorSelfie("Error al procesar la imagen");
          return;
        }

        setSubiendoSelfie(true);

        try {
          const formData = new FormData();
          formData.append("selfie", blob, "selfie.jpg");
          formData.append(
            "metadata",
            JSON.stringify({
              screen_width: window.screen.width,
              screen_height: window.screen.height,
              user_agent: navigator.userAgent,
              timestamp: new Date().toISOString(),
            })
          );

          const response = await fetch(`/api/ver/${token}/selfie`, {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            setErrorSelfie(data.error || "Error al guardar la imagen");
            return;
          }

          setSelfieCapturada(true);
          setCapturandoSelfie(false);
          setPaso("completado");
          onValidacionExitosa();
        } catch {
          setErrorSelfie("Error de conexión. Intente nuevamente.");
        } finally {
          setSubiendoSelfie(false);
        }
      },
      "image/jpeg",
      0.8
    );
  };

  // Omitir selfie
  const omitirSelfie = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setPaso("completado");
    onValidacionExitosa();
  };

  const bloqueado = intentosFallidos >= 5;

  // Renderizar indicador de progreso
  const renderProgreso = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          paso === "cuil"
            ? "bg-blue-600 text-white"
            : "bg-green-500 text-white"
        }`}
      >
        {paso === "cuil" ? "1" : <CheckCircle className="w-5 h-5" />}
      </div>
      <div className="w-12 h-1 bg-gray-200">
        <div
          className={`h-full ${
            paso !== "cuil" ? "bg-green-500" : "bg-gray-200"
          }`}
        />
      </div>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          paso === "otp"
            ? "bg-blue-600 text-white"
            : paso === "selfie" || paso === "completado"
            ? "bg-green-500 text-white"
            : "bg-gray-200 text-gray-500"
        }`}
      >
        {paso === "selfie" || paso === "completado" ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          "2"
        )}
      </div>
      {requiereSelfie && (
        <>
          <div className="w-12 h-1 bg-gray-200">
            <div
              className={`h-full ${
                paso === "completado" ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          </div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              paso === "selfie"
                ? "bg-blue-600 text-white"
                : paso === "completado"
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {paso === "completado" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              "3"
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-lg">NotiLegal</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          {/* Card principal */}
          <Card>
            <CardHeader className="text-center">
              {renderProgreso()}
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                {paso === "cuil" && <Lock className="h-6 w-6 text-blue-600" />}
                {paso === "otp" && <Phone className="h-6 w-6 text-blue-600" />}
                {paso === "selfie" && (
                  <Camera className="h-6 w-6 text-blue-600" />
                )}
                {paso === "completado" && (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
              </div>
              <CardTitle className="text-xl">
                {paso === "cuil" && "Verificación de Identidad"}
                {paso === "otp" && "Verificación por SMS"}
                {paso === "selfie" && "Captura de Selfie"}
                {paso === "completado" && "Verificación Completada"}
              </CardTitle>
              <CardDescription className="text-base">
                <strong>{empresaNombre}</strong> le ha enviado una comunicación
                laboral
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* PASO 1: CUIL */}
              {paso === "cuil" && (
                <>
                  <p className="text-sm text-muted-foreground text-center">
                    Estimado/a <strong>{empleadoNombre}</strong>, para acceder
                    al documento por favor verifique su identidad:
                  </p>

                  {bloqueado ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Demasiados intentos fallidos. Por favor, contacte a su
                        empleador.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="cuil">CUIL</Label>
                          <Input
                            id="cuil"
                            type="text"
                            placeholder="XX-XXXXXXXX-X"
                            value={cuil}
                            onChange={(e) => handleCuilChange(e.target.value)}
                            disabled={loadingCuil}
                            maxLength={13}
                            className="font-mono text-center text-lg"
                          />
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground">
                              o
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="legajo">Número de Legajo</Label>
                          <Input
                            id="legajo"
                            type="text"
                            placeholder="Ingrese su número de legajo"
                            value={legajo}
                            onChange={(e) => {
                              setLegajo(e.target.value);
                              setErrorCuil(null);
                            }}
                            disabled={loadingCuil}
                            className="text-center"
                          />
                        </div>
                      </div>

                      {errorCuil && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{errorCuil}</AlertDescription>
                        </Alert>
                      )}

                      {intentosFallidos > 0 && intentosFallidos < 5 && (
                        <p className="text-sm text-amber-600 text-center">
                          Intentos restantes: {5 - intentosFallidos}
                        </p>
                      )}

                      <Button
                        onClick={handleValidarCuil}
                        disabled={loadingCuil}
                        className="w-full"
                        size="lg"
                      >
                        {loadingCuil ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          "Verificar CUIL"
                        )}
                      </Button>
                    </>
                  )}
                </>
              )}

              {/* PASO 2: OTP */}
              {paso === "otp" && (
                <>
                  {!otpEnviado ? (
                    <>
                      <p className="text-sm text-muted-foreground text-center">
                        Para mayor seguridad, le enviaremos un código de
                        verificación por SMS.
                      </p>

                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <Phone className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                        <p className="font-mono">
                          {empleadoTelefono || "Número registrado"}
                        </p>
                      </div>

                      {errorOTP && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{errorOTP}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        onClick={handleEnviarOTP}
                        disabled={loadingEnviarOTP}
                        className="w-full"
                        size="lg"
                      >
                        {loadingEnviarOTP ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando código...
                          </>
                        ) : (
                          <>
                            <Phone className="mr-2 h-4 w-4" />
                            Enviar Código por SMS
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground text-center">
                        Ingrese el código de 6 dígitos enviado a{" "}
                        <strong>{telefonoOfuscado}</strong>:
                      </p>

                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={codigoOTP}
                        onChange={(e) =>
                          setCodigoOTP(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="000000"
                        className="text-center text-2xl font-mono tracking-widest h-14"
                      />

                      {errorOTP && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{errorOTP}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        onClick={handleVerificarOTP}
                        disabled={codigoOTP.length !== 6 || loadingVerificarOTP}
                        className="w-full"
                        size="lg"
                      >
                        {loadingVerificarOTP ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          "Verificar Código"
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleEnviarOTP}
                        disabled={loadingEnviarOTP}
                        className="w-full"
                      >
                        Reenviar código
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        El código expira en 10 minutos.
                      </p>
                    </>
                  )}
                </>
              )}

              {/* PASO 3: SELFIE */}
              {paso === "selfie" && (
                <>
                  <p className="text-sm text-muted-foreground text-center">
                    Como paso final, tome una selfie para confirmar su identidad.
                  </p>

                  {!capturandoSelfie ? (
                    <>
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <Camera className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                        <p className="text-sm text-gray-600">
                          La selfie se almacenará de forma segura como prueba de
                          que usted personalmente accedió a este documento.
                        </p>
                      </div>

                      {errorSelfie && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{errorSelfie}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        onClick={iniciarCamara}
                        className="w-full"
                        size="lg"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Iniciar Cámara
                      </Button>

                      <Button
                        variant="outline"
                        onClick={omitirSelfie}
                        className="w-full"
                      >
                        Omitir este paso
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                      </div>

                      {errorSelfie && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{errorSelfie}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        onClick={capturarFoto}
                        disabled={subiendoSelfie}
                        className="w-full"
                        size="lg"
                      >
                        {subiendoSelfie ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-4 w-4" />
                            Capturar Foto
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </>
              )}

              {/* PASO 4: COMPLETADO */}
              {paso === "completado" && (
                <div className="text-center py-4">
                  <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                  <p className="text-lg font-semibold text-green-700">
                    Identidad Verificada
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cargando documento...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aviso de procedimiento (solo en paso cuil) */}
          {paso === "cuil" && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2 text-sm">
                      Aviso de Procedimiento - Ley 27.742
                    </h4>
                    <p className="text-sm text-amber-800 whitespace-pre-line">
                      {TEXTOS_LEGALES.AVISO_PROCEDIMIENTO_72HS}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-4">
        <p>Sistema de notificaciones laborales con validez legal</p>
      </div>
    </div>
  );
}
