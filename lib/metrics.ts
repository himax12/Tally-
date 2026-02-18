/**
 * Metrics Collection for Wallet Operations
 * Provides observability into transaction performance and errors
 */

export interface TransactionMetrics {
  operation: 'topup' | 'bonus' | 'spend' | 'balance'
  status: 'success' | 'error'
  latencyMs: number
  amount?: number
  errorType?: string
  timestamp: Date
}

export interface MetricsStats {
  total: number
  success: number
  errors: number
  avgLatency: number
  errorRate: number
}

/**
 * Singleton metrics collector
 * Stores metrics in memory and logs in structured format
 */
export class MetricsCollector {
  private static instance: MetricsCollector
  private metrics: TransactionMetrics[] = []
  private readonly MAX_METRICS = 1000

  private constructor() {}

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
    }
    return MetricsCollector.instance
  }

  /**
   * Record a transaction metric
   * Logs in JSON format for log aggregation systems
   */
  record(metric: TransactionMetrics): void {
    this.metrics.push(metric)

    // Log in structured format (JSON for log aggregation)
    console.log(JSON.stringify({
      type: 'metric',
      ...metric,
      timestamp: metric.timestamp.toISOString()
    }))

    // Keep only last N metrics in memory to prevent memory leaks
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift()
    }
  }

  /**
   * Get statistics for the last N minutes
   */
  getStats(windowMinutes: number = 5): MetricsStats {
    const now = Date.now()
    const windowMs = windowMinutes * 60 * 1000
    
    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp.getTime() < windowMs
    )

    const total = recentMetrics.length
    const success = recentMetrics.filter(m => m.status === 'success').length
    const errors = recentMetrics.filter(m => m.status === 'error').length
    const avgLatency = total > 0
      ? recentMetrics.reduce((sum, m) => sum + m.latencyMs, 0) / total
      : 0
    const errorRate = total > 0 ? errors / total : 0

    return {
      total,
      success,
      errors,
      avgLatency: Math.round(avgLatency * 100) / 100, // Round to 2 decimals
      errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimals
    }
  }

  /**
   * Get all metrics (for debugging/testing)
   */
  getAllMetrics(): TransactionMetrics[] {
    return [...this.metrics]
  }

  /**
   * Clear all metrics (for testing)
   */
  clear(): void {
    this.metrics = []
  }
}

/**
 * Helper function to measure operation latency
 */
export async function withMetrics<T>(
  operation: TransactionMetrics['operation'],
  amount: number | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  
  try {
    const result = await fn()
    
    MetricsCollector.getInstance().record({
      operation,
      status: 'success',
      latencyMs: Date.now() - startTime,
      amount,
      timestamp: new Date()
    })
    
    return result
  } catch (error) {
    MetricsCollector.getInstance().record({
      operation,
      status: 'error',
      latencyMs: Date.now() - startTime,
      amount,
      errorType: error instanceof Error ? error.name : 'Unknown',
      timestamp: new Date()
    })
    
    throw error
  }
}
