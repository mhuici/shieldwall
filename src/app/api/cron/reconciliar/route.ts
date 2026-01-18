import { NextRequest, NextResponse } from 'next/server'
import {
  ejecutarReconciliacion,
  activarSubsidiariedadExpirada,
} from '@/lib/webhooks'

/**
 * POST /api/cron/reconciliar
 *
 * Endpoint para ejecutar la reconciliación de webhooks.
 * Debe ser llamado por un cron job cada 6 horas.
 *
 * Seguridad: Verificar CRON_SECRET en header Authorization
 *
 * Ejemplo de cron (usando servicios como Vercel Cron, Railway, etc):
 * ```
 * 0 0,6,12,18 * * * curl -X POST https://notilegal.com/api/cron/reconciliar -H "Authorization: Bearer $CRON_SECRET"
 * ```
 */
export async function POST(request: NextRequest) {
  // Verificar autorización
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron] Intento no autorizado de ejecutar reconciliación')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('[Cron] Iniciando reconciliación programada')

    // 1. Ejecutar reconciliación de webhooks
    const reconciliacionResult = await ejecutarReconciliacion('cron')

    // 2. Activar subsidiariedad para notificaciones expiradas
    const subsidiariedadResult = await activarSubsidiariedadExpirada()

    // Log resumen
    console.log('[Cron] Reconciliación completada:', {
      reconciliacion: {
        revisadas: reconciliacionResult.notificaciones_revisadas,
        recuperadas: reconciliacionResult.eventos_recuperados,
        errores: reconciliacionResult.errores,
      },
      subsidiariedad: {
        activadas: subsidiariedadResult.activadas,
      },
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      reconciliacion: {
        notificaciones_revisadas: reconciliacionResult.notificaciones_revisadas,
        eventos_recuperados: reconciliacionResult.eventos_recuperados,
        errores: reconciliacionResult.errores,
        duracion_ms: reconciliacionResult.duracion_ms,
      },
      subsidiariedad: {
        activadas: subsidiariedadResult.activadas,
        ids: subsidiariedadResult.ids,
      },
    })
  } catch (error) {
    console.error('[Cron] Error en reconciliación:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/reconciliar
 *
 * Obtiene el estado de la última reconciliación
 */
export async function GET(request: NextRequest) {
  // Verificar autorización
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Importar Supabase aquí para evitar problemas de inicialización
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener últimos logs de reconciliación
    const { data: logs, error } = await supabase
      .from('reconciliacion_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    // Estadísticas generales
    const { data: stats } = await supabase
      .from('reconciliacion_logs')
      .select('eventos_recuperados, errores')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const ultimas24h = stats?.reduce<{
      eventos_recuperados: number
      errores: number
      ejecuciones: number
    }>(
      (acc, log) => ({
        eventos_recuperados: acc.eventos_recuperados + (log.eventos_recuperados || 0),
        errores: acc.errores + (log.errores || 0),
        ejecuciones: acc.ejecuciones + 1,
      }),
      { eventos_recuperados: 0, errores: 0, ejecuciones: 0 }
    )

    return NextResponse.json({
      success: true,
      ultima_reconciliacion: logs?.[0] || null,
      ultimos_logs: logs,
      estadisticas_24h: ultimas24h,
    })
  } catch (error) {
    console.error('[Cron] Error obteniendo estado:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
