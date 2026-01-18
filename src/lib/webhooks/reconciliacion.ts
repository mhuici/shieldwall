import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

interface NotificacionPendiente {
  id: string
  sendgrid_message_id: string
  email_enviado_at: string
  horas_desde_envio: number
  en_grace_period: boolean
}

interface ReconciliacionResult {
  notificaciones_revisadas: number
  eventos_recuperados: number
  errores: number
  detalles: {
    id: string
    resultado: 'evento_recuperado' | 'sin_cambios' | 'error'
    mensaje?: string
  }[]
  duracion_ms: number
}

/**
 * Consulta la API de SendGrid para obtener eventos de un mensaje
 * https://docs.sendgrid.com/api-reference/e-mail-activity/filter-messages-by-message-id
 */
async function consultarEventosSendGrid(messageId: string): Promise<{
  success: boolean
  events?: { event: string; timestamp: number; ip?: string; useragent?: string }[]
  error?: string
}> {
  const apiKey = process.env.SENDGRID_API_KEY

  if (!apiKey) {
    return { success: false, error: 'SENDGRID_API_KEY not configured' }
  }

  try {
    // La API de Email Activity requiere el plan Pro de SendGrid
    // Si no está disponible, usamos un fallback más simple
    const response = await fetch(
      `https://api.sendgrid.com/v3/messages?msg_id=${encodeURIComponent(messageId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.status === 404) {
      // Mensaje no encontrado o API no disponible en el plan
      return { success: true, events: [] }
    }

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `SendGrid API error: ${response.status} - ${errorText}` }
    }

    const data = await response.json()

    // Extraer eventos del mensaje
    if (data.messages && data.messages.length > 0) {
      const message = data.messages[0]
      return {
        success: true,
        events: message.events || [],
      }
    }

    return { success: true, events: [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Ejecuta el proceso de reconciliación
 * Busca notificaciones sin "open" que deberían tenerlo
 */
export async function ejecutarReconciliacion(
  ejecutadoPor: 'cron' | 'manual' | 'api' = 'cron'
): Promise<ReconciliacionResult> {
  const startTime = Date.now()
  const supabase = getSupabaseAdmin()

  const result: ReconciliacionResult = {
    notificaciones_revisadas: 0,
    eventos_recuperados: 0,
    errores: 0,
    detalles: [],
    duracion_ms: 0,
  }

  try {
    // Obtener notificaciones pendientes de reconciliación
    const { data: pendientes, error: queryError } = await supabase
      .rpc('obtener_pendientes_reconciliacion') as {
        data: NotificacionPendiente[] | null
        error: Error | null
      }

    if (queryError) {
      console.error('[Reconciliacion] Error obteniendo pendientes:', queryError)
      throw queryError
    }

    if (!pendientes || pendientes.length === 0) {
      console.log('[Reconciliacion] No hay notificaciones pendientes')
      result.duracion_ms = Date.now() - startTime
      await guardarLogReconciliacion(supabase, result, ejecutadoPor)
      return result
    }

    console.log(`[Reconciliacion] Procesando ${pendientes.length} notificaciones`)
    result.notificaciones_revisadas = pendientes.length

    // Procesar cada notificación
    for (const notif of pendientes) {
      try {
        // Consultar SendGrid por eventos
        const sgResult = await consultarEventosSendGrid(notif.sendgrid_message_id)

        if (!sgResult.success) {
          result.errores++
          result.detalles.push({
            id: notif.id,
            resultado: 'error',
            mensaje: sgResult.error,
          })
          continue
        }

        // Buscar evento "open" que no hayamos recibido
        const openEvent = sgResult.events?.find((e) => e.event === 'open')

        if (openEvent) {
          // Encontramos un "open" que no teníamos!
          const timestamp = new Date(openEvent.timestamp * 1000).toISOString()

          // Registrar evento recuperado
          await supabase.rpc('registrar_evento_reconciliado', {
            p_notificacion_id: notif.id,
            p_evento_tipo: 'email_abierto',
            p_timestamp_original: timestamp,
            p_metadata: {
              ip: openEvent.ip,
              useragent: openEvent.useragent,
              sg_timestamp: openEvent.timestamp,
            },
          })

          result.eventos_recuperados++
          result.detalles.push({
            id: notif.id,
            resultado: 'evento_recuperado',
            mensaje: `Open recuperado de ${timestamp}`,
          })

          console.log(`[Reconciliacion] Evento "open" recuperado para ${notif.id}`)
        } else {
          // No hay evento "open" - evaluar grace period
          await supabase.rpc('evaluar_grace_period', {
            p_notificacion_id: notif.id,
          })

          result.detalles.push({
            id: notif.id,
            resultado: 'sin_cambios',
            mensaje: notif.en_grace_period
              ? 'En grace period, sin evento open'
              : 'Sin evento open',
          })
        }
      } catch (error) {
        result.errores++
        result.detalles.push({
          id: notif.id,
          resultado: 'error',
          mensaje: error instanceof Error ? error.message : 'Error desconocido',
        })
      }
    }
  } catch (error) {
    console.error('[Reconciliacion] Error general:', error)
    result.errores++
  }

  result.duracion_ms = Date.now() - startTime

  // Guardar log de reconciliación
  await guardarLogReconciliacion(supabase, result, ejecutadoPor)

  console.log(
    `[Reconciliacion] Completada en ${result.duracion_ms}ms: ` +
    `${result.notificaciones_revisadas} revisadas, ` +
    `${result.eventos_recuperados} recuperados, ` +
    `${result.errores} errores`
  )

  return result
}

/**
 * Guarda el log de reconciliación en la base de datos
 */
async function guardarLogReconciliacion(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  result: ReconciliacionResult,
  ejecutadoPor: string
) {
  try {
    const estado = result.errores > 0
      ? (result.eventos_recuperados > 0 ? 'parcial' : 'fallido')
      : 'completado'

    await supabase.from('reconciliacion_logs').insert({
      notificaciones_revisadas: result.notificaciones_revisadas,
      eventos_recuperados: result.eventos_recuperados,
      errores: result.errores,
      notificaciones_ids: result.detalles.map((d) => d.id),
      eventos_recuperados_ids: result.detalles
        .filter((d) => d.resultado === 'evento_recuperado')
        .map((d) => d.id),
      duracion_ms: result.duracion_ms,
      estado,
      ejecutado_por: ejecutadoPor,
      metadata: { detalles: result.detalles },
    })
  } catch (error) {
    console.error('[Reconciliacion] Error guardando log:', error)
  }
}

/**
 * Evalúa y activa subsidiariedad física para notificaciones que expiraron el grace period
 */
export async function activarSubsidiariedadExpirada(): Promise<{
  activadas: number
  ids: string[]
}> {
  const supabase = getSupabaseAdmin()

  try {
    // Buscar notificaciones con grace period expirado
    const { data: expiradas, error } = await supabase
      .from('notificaciones')
      .select('id')
      .is('email_abierto_at', null)
      .is('link_abierto_at', null)
      .is('subsidiariedad_activada_at', null)
      .not('email_enviado_at', 'is', null)
      .lte('email_enviado_at', new Date(Date.now() - 54 * 60 * 60 * 1000).toISOString())

    if (error || !expiradas) {
      console.error('[Subsidiariedad] Error buscando expiradas:', error)
      return { activadas: 0, ids: [] }
    }

    if (expiradas.length === 0) {
      return { activadas: 0, ids: [] }
    }

    const ids = expiradas.map((n) => n.id)

    // Activar subsidiariedad
    const { error: updateError } = await supabase
      .from('notificaciones')
      .update({
        subsidiariedad_activada_at: new Date().toISOString(),
        requiere_notificacion_fisica: true,
        semaforo: 'alerta',
      })
      .in('id', ids)

    if (updateError) {
      console.error('[Subsidiariedad] Error activando:', updateError)
      return { activadas: 0, ids: [] }
    }

    console.log(`[Subsidiariedad] Activada para ${ids.length} notificaciones`)
    return { activadas: ids.length, ids }
  } catch (error) {
    console.error('[Subsidiariedad] Error:', error)
    return { activadas: 0, ids: [] }
  }
}
