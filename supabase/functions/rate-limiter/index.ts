/**
 * Rate Limiter Middleware para Edge Functions
 */

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyPrefix: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return req.headers.get('cf-connecting-ip') || 
         req.headers.get('x-real-ip') || 
         'unknown'
}

/**
 * Implementação simples de rate limiter
 * Nota: Para produção, considere usar Redis ou similar
 */
export async function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const key = `ratelimit:${config.keyPrefix}:${ip}`
    const now = Date.now()
    
    // Simulação: em produção usar KV Store
    const windowStart = now - config.windowMs
    const allowed = true // Placeholder
    
    return {
      allowed,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
      retryAfter: undefined
    }
  } catch (error) {
    console.error('[rate-limiter] Erro:', error)
    return {
      allowed: true,
      remaining: -1,
      resetTime: 0
    }
  }
}

export function createRateLimitResponse(result: RateLimitResult): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
  }
  
  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString()
  }
  
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      retryAfter: result.retryAfter
    }),
    { status: 429, headers }
  )
}
