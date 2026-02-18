import { PrismaClient } from '@prisma/client'
import { LimitExceededError } from './errors'
import { config } from './config'

/**
 * Transaction Limits Configuration
 * Prevents fraud, fat-finger errors, and enforces business rules
 */

export interface TransactionLimits {
  maxTopupAmount: number
  maxSpendAmount: number
  maxDailySpend: number
  maxMonthlySpend: number
}

// NOTE: DEFAULT_LIMITS is now deprecated in favor of config.transactionLimits
// Keeping the interface for backward compatibility if needed, but not exporting the object.

/**
 * Check if a transaction would exceed configured limits
 * Throws LimitExceededError if any limit is violated
 */
export async function checkTransactionLimits(
  prisma: PrismaClient,
  params: {
    userId: string
    assetTypeId: string
    amount: number
    operation: 'topup' | 'spend'
  }
): Promise<void> {
  const { userId, assetTypeId, amount, operation } = params
  const limits = config.transactionLimits

  // Check single transaction limit
  if (operation === 'topup' && amount > limits.maxTopupAmount) {
    throw new LimitExceededError('Max top-up', amount, limits.maxTopupAmount)
  }
  if (operation === 'spend' && amount > limits.maxSpendAmount) {
    throw new LimitExceededError('Max spend', amount, limits.maxSpendAmount)
  }

  // Check daily spend limit (only for spend operations)
  if (operation === 'spend') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get all spend transactions for this user/asset today
    const dailySpend = await prisma.transaction.aggregate({
      where: {
        type: 'SPEND',
        status: 'SUCCESS',
        createdAt: { gte: today },
        ledgerEntries: {
          some: {
            wallet: {
              userId,
              assetTypeId
            },
            entryType: 'DEBIT' // User's wallet is debited on spend
          }
        }
      },
      _sum: { amount: true }
    })

    const totalDailySpend = Number(dailySpend._sum.amount || 0) + amount
    if (totalDailySpend > limits.maxDailySpend) {
      throw new LimitExceededError(
        'Daily spend',
        totalDailySpend,
        limits.maxDailySpend
      )
    }

    // Check monthly spend limit
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const monthlySpend = await prisma.transaction.aggregate({
      where: {
        type: 'SPEND',
        status: 'SUCCESS',
        createdAt: { gte: firstDayOfMonth },
        ledgerEntries: {
          some: {
            wallet: {
              userId,
              assetTypeId
            },
            entryType: 'DEBIT'
          }
        }
      },
      _sum: { amount: true }
    })

    const totalMonthlySpend = Number(monthlySpend._sum.amount || 0) + amount
    if (totalMonthlySpend > limits.maxMonthlySpend) {
      throw new LimitExceededError(
        'Monthly spend',
        totalMonthlySpend,
        limits.maxMonthlySpend
      )
    }
  }
}
