"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  Plus,
  X,
  User,
  Calendar,
  Clock,
  MapPin,
  Users,
  ImagePlus,
} from "lucide-react";
import type { Empresa, TipoSancion, Gravedad, NivelReincidencia, Testigo, MotivoSancion, CrearTestigoForm } from "@/lib/types";
import { TIPO_SANCION_LABELS, GRAVEDAD_LABELS, LIMITE_DIAS_SUSPENSION_ANUAL } from "@/lib/types";
import { ListaTestigos } from "@/components/testigos";
import { UploadEvidencia, type EvidenciaLocal } from "@/components/evidencia";
import { ResumenBitacora } from "@/components/bitacora";
import SHA256 from "crypto-js/sha256";
import { format, addDays } from "date-fns";
import {
  agruparMotivosPorGravedad,
  obtenerRecomendacion,
  analizarEmpleado,
  validarSuspensionLocal,
  validarEspecificidadMotivo,
  generarTemplateDescripcion,
  colorGravedad,
  colorTipoSancion,
  sugerirFechasSuspension,
  type ResultadoAnalisisEmpleado,
} from "@/lib/sanciones";

interface Empleado {
  id: string;
  nombre: string;
  cuil: string;
}

interface NuevaSancionFormProps {
  empresa: Empresa;
  empleados: Empleado[];
}

export function NuevaSancionForm({ empresa, empleados }: NuevaSancionFormProps) {
  const router = useRouter();
  const supabase = createClient();

  // Estados del formulario
  const [loading, setLoading] = useState(false);
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sancionId, setSancionId] = useState<string | null>(null);

  // Datos del formulario
  const [empleadoId, setEmpleadoId] = useState("");
  const [motivoCodigo, setMotivoCodigo] = useState("");
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<MotivoSancion | null>(null);
  const [tipoSancion, setTipoSancion] = useState<TipoSancion>("apercibimiento");
  const [descripcion, setDescripcion] = useState("");
  const [fechaHecho, setFechaHecho] = useState(format(new Date(), "yyyy-MM-dd"));
  const [horaHecho, setHoraHecho] = useState("");
  const [lugarHecho, setLugarHecho] = useState("");

  // Suspensión
  const [diasSuspension, setDiasSuspension] = useState(1);
  const [fechaInicioSuspension, setFechaInicioSuspension] = useState("");
  const [fechaFinSuspension, setFechaFinSuspension] = useState("");

  // Testigos (nuevo sistema digital)
  const [testigos, setTestigos] = useState<CrearTestigoForm[]>([]);

  // Evidencia multimedia
  const [evidencias, setEvidencias] = useState<EvidenciaLocal[]>([]);

  // Análisis del empleado
  const [analisisEmpleado, setAnalisisEmpleado] = useState<ResultadoAnalisisEmpleado | null>(null);

  // Validación de descripción
  const [validacionDescripcion, setValidacionDescripcion] = useState<{
    valido: boolean;
    errores: string[];
    advertencias: string[];
    score: number;
  } | null>(null);

  // Obtener motivos agrupados por gravedad según rubro
  const motivosAgrupados = agruparMotivosPorGravedad(empresa.rubro);

  // Analizar empleado cuando se selecciona
  const analizarEmpleadoSeleccionado = useCallback(async () => {
    if (!empleadoId) {
      setAnalisisEmpleado(null);
      return;
    }

    setLoadingAnalisis(true);
    try {
      const resultado = await analizarEmpleado(
        supabase,
        empleadoId,
        motivoCodigo || undefined,
        motivoSeleccionado?.nombre
      );
      setAnalisisEmpleado(resultado);
    } catch (err) {
      console.error("Error analizando empleado:", err);
    } finally {
      setLoadingAnalisis(false);
    }
  }, [empleadoId, motivoCodigo, motivoSeleccionado, supabase]);

  useEffect(() => {
    analizarEmpleadoSeleccionado();
  }, [analizarEmpleadoSeleccionado]);

  // Validar descripción cuando cambia
  useEffect(() => {
    if (descripcion.length > 20) {
      // Mapear testigos al formato esperado por la función de validación
      const testigosParaValidacion = testigos.length > 0
        ? testigos.map(t => ({
            nombre: t.nombre_completo,
            cargo: t.cargo || "",
            presente_en_hecho: t.presente_en_hecho,
          }))
        : undefined;

      const resultado = validarEspecificidadMotivo({
        descripcion,
        fechaHecho,
        horaHecho: horaHecho || undefined,
        lugarHecho: lugarHecho || undefined,
        testigos: testigosParaValidacion,
        motivoCodigo: motivoCodigo || undefined,
      });
      setValidacionDescripcion(resultado);
    } else {
      setValidacionDescripcion(null);
    }
  }, [descripcion, fechaHecho, horaHecho, lugarHecho, testigos, motivoCodigo]);

  // Actualizar tipo sugerido cuando cambia motivo o reincidencia
  useEffect(() => {
    if (motivoSeleccionado && analisisEmpleado) {
      const recomendacion = obtenerRecomendacion({
        motivoCodigo: motivoCodigo,
        motivoNombre: motivoSeleccionado.nombre,
        gravedad: motivoSeleccionado.gravedad,
        reincidencia: analisisEmpleado.reincidenciaParaMotivo,
        historial: analisisEmpleado.resumen,
      });
      setTipoSancion(recomendacion.tipoSugerido);

      // Si es suspensión, sugerir días
      if (recomendacion.tipoSugerido === "suspension" && recomendacion.diasSuspensionMin) {
        const diasSugeridos = Math.ceil(
          ((recomendacion.diasSuspensionMin || 1) + (recomendacion.diasSuspensionMax || 1)) / 2
        );
        setDiasSuspension(Math.min(diasSugeridos, analisisEmpleado.diasSuspension.diasDisponibles));

        // Sugerir fechas
        const fechas = sugerirFechasSuspension(diasSugeridos);
        setFechaInicioSuspension(fechas.fechaInicio);
        setFechaFinSuspension(fechas.fechaFin);
      }
    }
  }, [motivoSeleccionado, motivoCodigo, analisisEmpleado]);

  // Handlers
  const handleMotivoChange = (codigo: string) => {
    setMotivoCodigo(codigo);

    // Buscar el motivo en los grupos
    for (const motivos of Object.values(motivosAgrupados)) {
      const encontrado = motivos.find((m) => m.codigo === codigo);
      if (encontrado) {
        setMotivoSeleccionado(encontrado);

        // Cargar template de descripción
        if (!descripcion || descripcion.length < 30) {
          setDescripcion(generarTemplateDescripcion(codigo));
        }
        break;
      }
    }
  };

  // Handlers de testigos (nuevo sistema digital)
  const handleAgregarTestigo = (testigo: CrearTestigoForm) => {
    setTestigos([...testigos, testigo]);
  };

  const handleEliminarTestigo = (index: number) => {
    setTestigos(testigos.filter((_, i) => i !== index));
  };

  // Handlers de evidencia
  const handleAgregarEvidencia = (evidencia: EvidenciaLocal) => {
    setEvidencias([...evidencias, evidencia]);
  };

  const handleEliminarEvidencia = (id: string) => {
    const ev = evidencias.find((e) => e.id === id);
    if (ev?.url_preview) {
      URL.revokeObjectURL(ev.url_preview);
    }
    setEvidencias(evidencias.filter((e) => e.id !== id));
  };

  const handleTogglePrincipal = (id: string) => {
    setEvidencias(
      evidencias.map((e) => ({
        ...e,
        es_prueba_principal: e.id === id,
      }))
    );
  };

  const generarHash = (contenido: string): string => {
    return SHA256(contenido).toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!empleadoId) {
      setError("Seleccioná un empleado");
      return;
    }

    if (!motivoCodigo) {
      setError("Seleccioná un motivo de sanción");
      return;
    }

    if (!validacionDescripcion?.valido) {
      setError("La descripción no cumple los requisitos de especificidad. Revisá los errores indicados.");
      return;
    }

    // Validar suspensión si aplica
    if (tipoSancion === "suspension") {
      const validacionSusp = validarSuspensionLocal(
        diasSuspension,
        analisisEmpleado?.diasSuspension.diasUsados || 0,
        fechaInicioSuspension,
        fechaFinSuspension
      );

      if (!validacionSusp.permitido) {
        const errorMsg = validacionSusp.alertas.find((a) => a.tipo === "error")?.mensaje;
        setError(errorMsg || "Error en la validación de la suspensión");
        return;
      }
    }

    setLoading(true);

    try {
      const empleado = empleados.find((e) => e.id === empleadoId);
      if (!empleado) throw new Error("Empleado no encontrado");

      const fechaHoy = new Date();
      const fechaVencimiento = addDays(fechaHoy, 30);
      const timestamp = fechaHoy.toISOString();

      // Contenido para el hash
      const contenidoHash = JSON.stringify({
        empresa: empresa.razon_social,
        cuit: empresa.cuit,
        empleado: empleado.nombre,
        cuil: empleado.cuil,
        tipo: tipoSancion,
        motivo: motivoSeleccionado?.nombre,
        motivo_codigo: motivoCodigo,
        gravedad: motivoSeleccionado?.gravedad,
        descripcion,
        fecha_hecho: fechaHecho,
        hora_hecho: horaHecho,
        lugar_hecho: lugarHecho,
        dias_suspension: tipoSancion === "suspension" ? diasSuspension : null,
        testigos,
        timestamp,
      });

      const hash = generarHash(contenidoHash);

      // Crear la notificación
      const insertData: Record<string, unknown> = {
        empresa_id: empresa.id,
        empleado_id: empleadoId,
        tipo: tipoSancion,
        motivo: motivoSeleccionado?.nombre,
        gravedad: motivoSeleccionado?.gravedad,
        descripcion: descripcion.trim(),
        fecha_hecho: fechaHecho,
        hora_hecho: horaHecho || null,
        lugar_hecho: lugarHecho || null,
        hash_sha256: hash,
        timestamp_generacion: timestamp,
        estado: "enviado",
        fecha_vencimiento: format(fechaVencimiento, "yyyy-MM-dd"),
        nivel_reincidencia: analisisEmpleado?.reincidenciaParaMotivo,
        sanciones_previas_count: analisisEmpleado?.resumen.totalSanciones,
      };

      // Campos de suspensión
      if (tipoSancion === "suspension") {
        insertData.dias_suspension = diasSuspension;
        insertData.fecha_inicio_suspension = fechaInicioSuspension;
        insertData.fecha_fin_suspension = fechaFinSuspension;
      }

      // Testigos (convertir al formato legacy para BD, los digitales se crean después)
      if (testigos.length > 0) {
        // Guardar en formato simplificado para compatibilidad
        insertData.testigos = testigos.map((t) => ({
          nombre: t.nombre_completo,
          cargo: t.cargo || "",
          presente_en_hecho: t.presente_en_hecho,
        }));
      }

      const { data: notificacion, error: insertError } = await supabase
        .from("notificaciones")
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Crear testigos digitales en la nueva tabla
      if (testigos.length > 0) {
        const testigosDigitales = testigos.map((t) => ({
          empresa_id: empresa.id,
          notificacion_id: notificacion.id,
          nombre_completo: t.nombre_completo,
          cargo: t.cargo || null,
          cuil: t.cuil || null,
          email: t.email || null,
          telefono: t.telefono || null,
          relacion: t.relacion,
          presente_en_hecho: t.presente_en_hecho,
          estado: "pendiente",
        }));

        const { error: testigosError } = await supabase
          .from("declaraciones_testigos")
          .insert(testigosDigitales);

        if (testigosError) {
          console.error("Error al crear testigos digitales:", testigosError);
          // No fallar la operación principal, los testigos se pueden agregar después
        }
      }

      // Subir evidencia multimedia
      if (evidencias.length > 0) {
        for (let i = 0; i < evidencias.length; i++) {
          const ev = evidencias[i];
          try {
            const formData = new FormData();
            formData.append("file", ev.file);
            formData.append("tipo", ev.tipo);
            formData.append("notificacion_id", notificacion.id);
            formData.append("hash_sha256", ev.hash_sha256);
            formData.append("es_prueba_principal", ev.es_prueba_principal.toString());
            formData.append("orden", i.toString());
            if (ev.descripcion) formData.append("descripcion", ev.descripcion);
            if (ev.exif_fecha_captura) formData.append("exif_fecha_captura", ev.exif_fecha_captura);
            if (ev.exif_latitud) formData.append("exif_latitud", ev.exif_latitud.toString());
            if (ev.exif_longitud) formData.append("exif_longitud", ev.exif_longitud.toString());

            const response = await fetch("/api/evidencia/upload", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              console.error("Error subiendo evidencia:", await response.text());
            }
          } catch (uploadErr) {
            console.error("Error subiendo evidencia:", uploadErr);
            // No fallar la operación principal
          }
        }
      }

      setSancionId(notificacion.id);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Error al crear la sanción. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de éxito
  if (success && sancionId) {
    const empleado = empleados.find((e) => e.id === empleadoId);

    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Sanción Creada</h3>
        <p className="text-muted-foreground mb-6">
          Se generó la notificación para <strong>{empleado?.nombre}</strong>
        </p>

        <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
          <p className="text-sm">
            <strong>Tipo:</strong> {TIPO_SANCION_LABELS[tipoSancion]}
          </p>
          <p className="text-sm">
            <strong>Motivo:</strong> {motivoSeleccionado?.nombre}
          </p>
          <p className="text-sm">
            <strong>Gravedad:</strong> {GRAVEDAD_LABELS[motivoSeleccionado?.gravedad || "moderada"]}
          </p>
          {tipoSancion === "suspension" && (
            <p className="text-sm">
              <strong>Días de suspensión:</strong> {diasSuspension}
            </p>
          )}
          <p className="text-sm">
            <strong>Vence:</strong> {format(addDays(new Date(), 30), "dd/MM/yyyy")}
          </p>
          <p className="text-sm font-mono text-xs mt-2 break-all">
            <strong>ID:</strong> {sancionId}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push("/sanciones")}>
            Ver Sanciones
          </Button>
          <Button
            onClick={() => {
              setSuccess(false);
              setSancionId(null);
              setEmpleadoId("");
              setMotivoCodigo("");
              setMotivoSeleccionado(null);
              setTipoSancion("apercibimiento");
              setDescripcion("");
              setTestigos([]);
              setEvidencias([]);
              setAnalisisEmpleado(null);
            }}
          >
            Crear Otra
          </Button>
        </div>
      </div>
    );
  }

  // Obtener recomendación si hay datos suficientes
  const recomendacion =
    motivoSeleccionado && analisisEmpleado
      ? obtenerRecomendacion({
          motivoCodigo,
          motivoNombre: motivoSeleccionado.nombre,
          gravedad: motivoSeleccionado.gravedad,
          reincidencia: analisisEmpleado.reincidenciaParaMotivo,
          historial: analisisEmpleado.resumen,
        })
      : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Paso 1: Seleccionar Empleado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Empleado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={empleadoId} onValueChange={setEmpleadoId} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccioná un empleado" />
            </SelectTrigger>
            <SelectContent>
              {empleados.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.nombre} ({emp.cuil})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mostrar análisis del empleado */}
          {loadingAnalisis && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analizando historial...
            </div>
          )}

          {analisisEmpleado && !loadingAnalisis && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sanciones totales:</span>
                <span className="font-medium">{analisisEmpleado.resumen.totalSanciones}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Últimos 12 meses:</span>
                <span className="font-medium">{analisisEmpleado.resumen.sancionesUltimos12Meses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Días suspensión este año:</span>
                <span className="font-medium">
                  {analisisEmpleado.diasSuspension.diasUsados} / {LIMITE_DIAS_SUSPENSION_ANUAL}
                </span>
              </div>
              {analisisEmpleado.patrones.mensaje && (
                <div className="pt-2 border-t">
                  <p className="text-amber-700">{analisisEmpleado.patrones.mensaje}</p>
                </div>
              )}
            </div>
          )}

          {/* Historial de Gestión (Bitácora) */}
          {empleadoId && (
            <div className="mt-4">
              <ResumenBitacora empleadoId={empleadoId} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paso 2: Seleccionar Motivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Motivo de la Sanción
          </CardTitle>
          <CardDescription>Seleccioná el motivo del catálogo según tu rubro ({empresa.rubro})</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={motivoCodigo} onValueChange={handleMotivoChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccioná un motivo" />
            </SelectTrigger>
            <SelectContent>
              {/* Faltas Leves */}
              <SelectGroup>
                <SelectLabel className="text-green-700">Faltas Leves</SelectLabel>
                {motivosAgrupados.leve.map((motivo) => (
                  <SelectItem key={motivo.codigo} value={motivo.codigo}>
                    {motivo.nombre}
                  </SelectItem>
                ))}
              </SelectGroup>

              {/* Faltas Moderadas */}
              <SelectGroup>
                <SelectLabel className="text-yellow-700">Faltas Moderadas</SelectLabel>
                {motivosAgrupados.moderada.map((motivo) => (
                  <SelectItem key={motivo.codigo} value={motivo.codigo}>
                    {motivo.nombre}
                  </SelectItem>
                ))}
              </SelectGroup>

              {/* Faltas Graves */}
              <SelectGroup>
                <SelectLabel className="text-red-700">Faltas Graves</SelectLabel>
                {motivosAgrupados.grave.map((motivo) => (
                  <SelectItem key={motivo.codigo} value={motivo.codigo}>
                    {motivo.nombre}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Mostrar info del motivo seleccionado */}
          {motivoSeleccionado && (
            <div
              className={`p-3 rounded-lg border ${colorGravedad(motivoSeleccionado.gravedad).bg} ${colorGravedad(motivoSeleccionado.gravedad).border}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{motivoSeleccionado.nombre}</span>
                <Badge
                  variant="outline"
                  className={colorGravedad(motivoSeleccionado.gravedad).text}
                >
                  {GRAVEDAD_LABELS[motivoSeleccionado.gravedad]}
                </Badge>
              </div>
              {motivoSeleccionado.descripcion_legal && (
                <p className="text-sm text-muted-foreground">{motivoSeleccionado.descripcion_legal}</p>
              )}
              {motivoSeleccionado.requiere_testigos && (
                <p className="text-sm text-amber-700 mt-2">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Este motivo requiere testigos para tener validez
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paso 3: Recomendación de Sanción */}
      {recomendacion && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
              <Lightbulb className="h-5 w-5" />
              Recomendación del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className={`${colorTipoSancion(recomendacion.tipoSugerido).bg} ${colorTipoSancion(recomendacion.tipoSugerido).text} px-3 py-1`}>
                {TIPO_SANCION_LABELS[recomendacion.tipoSugerido]}
              </Badge>
              {recomendacion.diasSuspensionMin && (
                <span className="text-sm text-blue-700">
                  ({recomendacion.diasSuspensionMin}-{recomendacion.diasSuspensionMax} días sugeridos)
                </span>
              )}
            </div>
            <p className="text-sm text-blue-800">{recomendacion.explicacion}</p>

            {recomendacion.advertencias.length > 0 && (
              <div className="space-y-2">
                {recomendacion.advertencias.map((adv, i) => (
                  <p key={i} className="text-sm text-amber-800 bg-amber-50 p-2 rounded">
                    {adv}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Paso 4: Tipo de Sanción (puede modificar la recomendación) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tipo de Sanción</CardTitle>
          <CardDescription>Podés modificar la recomendación si lo considerás necesario</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={tipoSancion}
            onValueChange={(v) => setTipoSancion(v as TipoSancion)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apercibimiento">Apercibimiento</SelectItem>
              <SelectItem value="suspension">Suspensión</SelectItem>
              <SelectItem value="apercibimiento_previo_despido">
                Apercibimiento Previo al Despido
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Campos adicionales para suspensión */}
          {tipoSancion === "suspension" && (
            <div className="mt-4 space-y-4 p-4 bg-slate-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Días de suspensión</Label>
                  <Input
                    type="number"
                    min={1}
                    max={analisisEmpleado?.diasSuspension.diasDisponibles || 30}
                    value={diasSuspension}
                    onChange={(e) => setDiasSuspension(parseInt(e.target.value) || 1)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha inicio</Label>
                  <Input
                    type="date"
                    value={fechaInicioSuspension}
                    onChange={(e) => setFechaInicioSuspension(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha fin</Label>
                  <Input
                    type="date"
                    value={fechaFinSuspension}
                    onChange={(e) => setFechaFinSuspension(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {analisisEmpleado && (
                <p className="text-sm text-muted-foreground">
                  Días disponibles este año: {analisisEmpleado.diasSuspension.diasDisponibles} de{" "}
                  {LIMITE_DIAS_SUSPENSION_ANUAL} (Art. 220 LCT)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paso 5: Datos del Hecho */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos del Hecho</CardTitle>
          <CardDescription>
            Completá todos los datos para que la sanción tenga validez legal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Fecha del hecho *
              </Label>
              <Input
                type="date"
                value={fechaHecho}
                onChange={(e) => setFechaHecho(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Hora (aprox.)
              </Label>
              <Input
                type="time"
                value={horaHecho}
                onChange={(e) => setHoraHecho(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Lugar
              </Label>
              <Input
                placeholder="Ej: Sector caja, Oficina 2"
                value={lugarHecho}
                onChange={(e) => setLugarHecho(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label>Descripción detallada de los hechos *</Label>
            <Textarea
              placeholder="Describí con detalle lo que sucedió..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={loading}
              rows={6}
              className={
                validacionDescripcion && !validacionDescripcion.valido
                  ? "border-red-300"
                  : validacionDescripcion?.valido
                    ? "border-green-300"
                    : ""
              }
            />

            {/* Indicador de especificidad */}
            {validacionDescripcion && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        validacionDescripcion.score >= 70
                          ? "bg-green-500"
                          : validacionDescripcion.score >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${validacionDescripcion.score}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {validacionDescripcion.score}% específico
                  </span>
                </div>

                {validacionDescripcion.errores.length > 0 && (
                  <div className="space-y-1">
                    {validacionDescripcion.errores.map((err, i) => (
                      <p key={i} className="text-sm text-red-600 flex items-start gap-1">
                        <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {err}
                      </p>
                    ))}
                  </div>
                )}

                {validacionDescripcion.advertencias.length > 0 && (
                  <div className="space-y-1">
                    {validacionDescripcion.advertencias.map((adv, i) => (
                      <p key={i} className="text-sm text-amber-600 flex items-start gap-1">
                        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {adv}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Paso 6: Testigos Digitales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Testigos Digitales
          </CardTitle>
          <CardDescription>
            Los testigos recibirán un link para completar su declaración bajo juramento.
            Esto genera evidencia con valor probatorio reforzado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ListaTestigos
            testigosTemporales={testigos}
            onAgregarTestigo={handleAgregarTestigo}
            onEliminarTestigo={handleEliminarTestigo}
            requiereTestigos={motivoSeleccionado?.requiere_testigos}
          />
        </CardContent>
      </Card>

      {/* Paso 7: Evidencia Multimedia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImagePlus className="h-5 w-5" />
            Evidencia Multimedia
          </CardTitle>
          <CardDescription>
            Adjuntá fotos, videos o documentos que prueben el hecho.
            Los metadatos EXIF (fecha, ubicación) quedarán registrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadEvidencia
            evidencias={evidencias}
            onAdd={handleAgregarEvidencia}
            onRemove={handleEliminarEvidencia}
            onTogglePrincipal={handleTogglePrincipal}
            disabled={loading}
          />
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Info Legal */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">¿Qué pasa cuando creás la sanción?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Se genera un hash SHA-256 único del contenido</li>
                <li>• Se registra el timestamp exacto de generación</li>
                <li>• El empleado tiene 30 días corridos para impugnar</li>
                <li>• Si no impugna, la sanción queda firme (prueba plena)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón Submit */}
      <Button
        type="submit"
        className="w-full"
        disabled={loading || !empleadoId || !motivoCodigo || !validacionDescripcion?.valido}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Crear Sanción
          </>
        )}
      </Button>
    </form>
  );
}
