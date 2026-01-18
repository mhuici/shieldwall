import crypto from 'crypto'

/**
 * Verificación de firma de webhooks de SendGrid
 * https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
 */
export function verifySendGridSignature(
  payload: string,
  signature: string | null,
  timestamp: string | null
): { valid: boolean; error?: string } {
  const publicKey = process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY

  // Si no hay key configurada, skip verificación (desarrollo)
  if (!publicKey) {
    console.warn('[Webhook] SendGrid verification key not configured, skipping signature check')
    return { valid: true }
  }

  if (!signature || !timestamp) {
    return { valid: false, error: 'Missing signature or timestamp headers' }
  }

  try {
    // SendGrid usa ECDSA con SHA256
    const timestampPayload = timestamp + payload
    const decodedSignature = Buffer.from(signature, 'base64')

    const verifier = crypto.createVerify('sha256')
    verifier.update(timestampPayload)

    const isValid = verifier.verify(
      {
        key: publicKey,
        format: 'pem',
      },
      decodedSignature
    )

    return { valid: isValid, error: isValid ? undefined : 'Invalid signature' }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Signature verification failed',
    }
  }
}

/**
 * Verificación de firma de webhooks de Twilio
 * https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string | null
): { valid: boolean; error?: string } {
  const authToken = process.env.TWILIO_AUTH_TOKEN

  // Si no hay token configurado, skip verificación (desarrollo)
  if (!authToken) {
    console.warn('[Webhook] Twilio auth token not configured, skipping signature check')
    return { valid: true }
  }

  if (!signature) {
    return { valid: false, error: 'Missing X-Twilio-Signature header' }
  }

  try {
    // Ordenar parámetros alfabéticamente y concatenar
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => acc + key + params[key], '')

    const data = url + sortedParams

    // Calcular HMAC-SHA1
    const expectedSignature = crypto
      .createHmac('sha1', authToken)
      .update(data)
      .digest('base64')

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )

    return { valid: isValid, error: isValid ? undefined : 'Invalid signature' }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Signature verification failed',
    }
  }
}

/**
 * Calcula SHA256 de un payload para auditoría
 */
export function hashPayload(payload: string | object): string {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Verifica timestamp para prevenir replay attacks
 * Acepta eventos de hasta 5 minutos de antigüedad
 */
export function verifyTimestamp(
  timestamp: string | number,
  maxAgeSeconds: number = 300
): { valid: boolean; error?: string } {
  try {
    const eventTime = typeof timestamp === 'string'
      ? parseInt(timestamp, 10) * 1000
      : timestamp * 1000

    const now = Date.now()
    const age = now - eventTime

    if (age > maxAgeSeconds * 1000) {
      return {
        valid: false,
        error: `Event too old: ${Math.round(age / 1000)} seconds`
      }
    }

    if (age < -60000) { // 1 minuto en el futuro (tolerancia de clock skew)
      return {
        valid: false,
        error: 'Event timestamp is in the future'
      }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid timestamp format' }
  }
}
