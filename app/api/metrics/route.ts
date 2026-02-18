import { NextRequest, NextResponse } from 'next/server'
import { MetricsCollector } from '@/lib/metrics'
import { config } from '@/lib/config'

/**
 * GET /api/metrics
 * Returns current metrics and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const collector = MetricsCollector.getInstance()
    
    // Get query parameter for time window (default from config)
    const searchParams = request.nextUrl.searchParams
    const windowMinutes = parseInt(
      searchParams.get('window') || String(config.metrics.defaultWindowMinutes), 
      10
    )
    
    const stats = collector.getStats(windowMinutes)
    
    return NextResponse.json({
      success: true,
      window: `${windowMinutes} minutes`,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch metrics'
      },
      { status: 500 }
    )
  }
}
