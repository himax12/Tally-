/**
 * Retry Logic for Transient Failures
 * Implements exponential backoff for database deadlocks and connection issues
 */

export interface RetryOptions {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if error is retryable (deadlock, connection timeout, etc.)
 */
function isRetryableError(error: any): boolean {
  if (!error) return false

  const errorMessage = error.message?.toLowerCase() || ''
  const errorCode = error.code?.toLowerCase() || ''

  // PostgreSQL error codes for retryable errors
  const retryableErrors = [
    'deadlock', // Deadlock detected
    'lock_timeout', // Lock timeout
    'connection', // Connection errors
    'econnrefused', // Connection refused
    'etimedout', // Connection timeout
    'p2024', // Prisma connection pool timeout
    'p2034', // Prisma transaction conflict
  ]

  return retryableErrors.some(
    (retryable) =>
      errorMessage.includes(retryable) || errorCode.includes(retryable)
  )
}

/**
 * Retry a function with exponential backoff
 * Only retries on transient errors (deadlocks, connection issues)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw lastError
      }

      // Don't retry on last attempt
      if (attempt === opts.maxAttempts) {
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelayMs
      )

      console.warn(
        `Retryable error on attempt ${attempt}/${opts.maxAttempts}. Retrying in ${delay}ms...`,
        lastError.message
      )

      await sleep(delay)
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed')
}
