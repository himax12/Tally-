import { PrismaClient, TransactionType } from '@prisma/client'
import {
  InsufficientBalanceError,
  WalletNotFoundError,
  SystemWalletNotFoundError,
  DuplicateTransactionError,
} from './errors'
import { calculateBalance, getWalletWithLock, createTransaction } from './ledger'
import { validateAmount } from './validation'
import { withRetry } from './retry'
import { checkTransactionLimits } from './limits'
import { withMetrics } from './metrics'

/**
 * High-Level Wallet Operations
 * Implements the three core flows: Top-up, Bonus, and Spend
 */

export interface OperationResult {
  success: boolean
  transactionId: string
  newBalance: number
  message: string
}

/**
 * Top-up: User purchases credits (System → User)
 * Money flows from System Wallet to User Wallet
 * Implements Invariant 2, 4, 8
 */
export async function topUp(
  prisma: PrismaClient,
  params: {
    userId: string
    assetTypeId: string
    amount: number
    referenceId: string
    metadata?: Record<string, any>
  }
): Promise<OperationResult> {
  const { userId, assetTypeId, amount, referenceId, metadata } = params

  // Validate amount
  validateAmount(amount)

  // Check transaction limits
  await checkTransactionLimits(prisma, {
    userId,
    assetTypeId,
    amount,
    operation: 'topup'
  })

  return withMetrics('topup', amount, async () => {
    return withRetry(async () => {
      return await prisma.$transaction(async (tx) => {
      // Check for duplicate transaction
      const existing = await tx.transaction.findUnique({
        where: { referenceId },
      })

      if (existing) {
        throw new DuplicateTransactionError(referenceId)
      }

      // Find user wallet
      const userWallet = await tx.wallet.findUnique({
        where: {
          userId_assetTypeId: {
            userId,
            assetTypeId,
          },
        },
      })

      if (!userWallet) {
        throw new WalletNotFoundError(userId, assetTypeId)
      }

      // Find system wallet
      const systemWallet = await tx.systemWallet.findFirst({
        where: { assetTypeId },
      })

      if (!systemWallet) {
        throw new SystemWalletNotFoundError(assetTypeId)
      }

      // Lock the user wallet
      await getWalletWithLock(tx as any, userWallet.id)

      // Create double-entry transaction
      const result = await createTransaction(tx as any, {
        type: TransactionType.TOPUP,
        amount,
        fromSystemWalletId: systemWallet.id,
        toWalletId: userWallet.id,
        referenceId,
        metadata: {
          ...metadata,
          userId,
          assetTypeId,
          operation: 'topup',
        },
      })

      // Calculate new balance
      const newBalance = await calculateBalance(tx as any, userWallet.id)

      return {
        success: true,
        transactionId: result.transactionId,
        newBalance,
        message: `Successfully topped up ${amount} credits`,
      }
    })
    })
  })
}

/**
 * Bonus: System issues free credits to user (System → User)
 * Similar to top-up but marked as BONUS type
 * Implements Invariant 2, 4, 8
 */
export async function bonus(
  prisma: PrismaClient,
  params: {
    userId: string
    assetTypeId: string
    amount: number
    referenceId: string
    metadata?: Record<string, any>
  }
): Promise<OperationResult> {
  const { userId, assetTypeId, amount, referenceId, metadata } = params

  // Validate amount
  validateAmount(amount)

  return withMetrics('bonus', amount, async () => {
    return withRetry(async () => {
      return await prisma.$transaction(async (tx) => {
      // Check for duplicate transaction
      const existing = await tx.transaction.findUnique({
        where: { referenceId },
      })

      if (existing) {
        throw new DuplicateTransactionError(referenceId)
      }

      // Find user wallet
      const userWallet = await tx.wallet.findUnique({
        where: {
          userId_assetTypeId: {
            userId,
            assetTypeId,
          },
        },
      })

      if (!userWallet) {
        throw new WalletNotFoundError(userId, assetTypeId)
      }

      // Find system wallet
      const systemWallet = await tx.systemWallet.findFirst({
        where: { assetTypeId },
      })

      if (!systemWallet) {
        throw new SystemWalletNotFoundError(assetTypeId)
      }

      // Lock the user wallet
      await getWalletWithLock(tx as any, userWallet.id)

      // Create double-entry transaction
      const result = await createTransaction(tx as any, {
        type: TransactionType.BONUS,
        amount,
        fromSystemWalletId: systemWallet.id,
        toWalletId: userWallet.id,
        referenceId,
        metadata: {
          ...metadata,
          userId,
          assetTypeId,
          operation: 'bonus',
        },
      })

      // Calculate new balance
      const newBalance = await calculateBalance(tx as any, userWallet.id)

      return {
        success: true,
        transactionId: result.transactionId,
        newBalance,
        message: `Successfully added ${amount} bonus credits`,
      }
    })
    })
  })
}

/**
 * Spend: User spends credits (User → System)
 * Money flows from User Wallet to System Wallet
 * Implements Invariant 2 (prevents negative balance), 4, 8
 */
export async function spend(
  prisma: PrismaClient,
  params: {
    userId: string
    assetTypeId: string
    amount: number
    referenceId: string
    metadata?: Record<string, any>
  }
): Promise<OperationResult> {
  const { userId, assetTypeId, amount, referenceId, metadata } = params

  // Validate amount
  validateAmount(amount)

  // Check transaction limits
  await checkTransactionLimits(prisma, {
    userId,
    assetTypeId,
    amount,
    operation: 'spend'
  })

  return withMetrics('spend', amount, async () => {
    return withRetry(async () => {
      return await prisma.$transaction(async (tx) => {
      // Check for duplicate transaction
      const existing = await tx.transaction.findUnique({
        where: { referenceId },
      })

      if (existing) {
        throw new DuplicateTransactionError(referenceId)
      }

      // Find user wallet
      const userWallet = await tx.wallet.findUnique({
        where: {
          userId_assetTypeId: {
            userId,
            assetTypeId,
          },
        },
      })

      if (!userWallet) {
        throw new WalletNotFoundError(userId, assetTypeId)
      }

      // Find system wallet
      const systemWallet = await tx.systemWallet.findFirst({
        where: { assetTypeId },
      })

      if (!systemWallet) {
        throw new SystemWalletNotFoundError(assetTypeId)
      }

      // Lock the user wallet
      await getWalletWithLock(tx as any, userWallet.id)

      // Check balance BEFORE spending (Invariant 2: No negative balances)
      const currentBalance = await calculateBalance(tx as any, userWallet.id)

      if (currentBalance < amount) {
        throw new InsufficientBalanceError(userWallet.id, amount, currentBalance)
      }

      // Create double-entry transaction
      const result = await createTransaction(tx as any, {
        type: TransactionType.SPEND,
        amount,
        fromWalletId: userWallet.id,
        toSystemWalletId: systemWallet.id,
        referenceId,
        metadata: {
          ...metadata,
          userId,
          assetTypeId,
          operation: 'spend',
        },
      })

      // Calculate new balance
      const newBalance = await calculateBalance(tx as any, userWallet.id)

      return {
        success: true,
        transactionId: result.transactionId,
        newBalance,
        message: `Successfully spent ${amount} credits`,
      }
    })
    })
  })
}
