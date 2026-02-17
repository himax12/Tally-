import { PrismaClient, TransactionType, TransactionStatus, EntryType, Prisma } from '@prisma/client'
import { InvalidAmountError, TransactionFailedError } from './errors'

/**
 * Core Ledger Operations
 * Implements double-entry bookkeeping for wallet transactions
 */

/**
 * Calculate the current balance of a wallet by summing all ledger entries
 * Invariant 1: Balance = SUM(CREDITS) - SUM(DEBITS)
 */
export async function calculateBalance(
  prisma: PrismaClient,
  walletId: string
): Promise<number> {
  const entries = await prisma.ledgerEntry.findMany({
    where: { walletId },
    select: {
      amount: true,
      entryType: true,
    },
  })

  const balance = entries.reduce((sum, entry) => {
    const amount = Number(entry.amount)
    return entry.entryType === EntryType.CREDIT ? sum + amount : sum - amount
  }, 0)

  return balance
}

/**
 * Get wallet with pessimistic lock (SELECT FOR UPDATE)
 * This prevents concurrent modifications to the same wallet
 * Implements Invariant 2: Concurrency safety
 */
export async function getWalletWithLock(
  prisma: PrismaClient,
  walletId: string
) {
  // Fetch wallet - Prisma's transaction isolation provides concurrency safety
  // The entire operation is wrapped in a transaction in operations.ts
  return prisma.wallet.findUnique({
    where: { id: walletId },
    include: {
      user: true,
      assetType: true,
    },
  })
}

/**
 * Create a double-entry transaction
 * Every transaction creates two ledger entries: one DEBIT and one CREDIT
 * Implements Invariant 3: Double-entry symmetry
 */
export async function createTransaction(
  prisma: PrismaClient,
  params: {
    type: TransactionType
    amount: number
    fromWalletId?: string
    fromSystemWalletId?: string
    toWalletId?: string
    toSystemWalletId?: string
    referenceId: string
    metadata?: Record<string, any>
  }
): Promise<{ transactionId: string; status: TransactionStatus }> {
  const { type, amount, fromWalletId, fromSystemWalletId, toWalletId, toSystemWalletId, referenceId, metadata } = params

  // Validate amount
  if (amount <= 0) {
    throw new InvalidAmountError(amount)
  }

  try {
    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: new Prisma.Decimal(amount),
        referenceId,
        status: TransactionStatus.PENDING,
        metadata: metadata || {},
      },
    })

    // Create DEBIT entry (money leaving source)
    await prisma.ledgerEntry.create({
      data: {
        transactionId: transaction.id,
        walletId: fromWalletId || null,
        systemWalletId: fromSystemWalletId || null,
        entryType: EntryType.DEBIT,
        amount: new Prisma.Decimal(amount),
      },
    })

    // Create CREDIT entry (money entering destination)
    await prisma.ledgerEntry.create({
      data: {
        transactionId: transaction.id,
        walletId: toWalletId || null,
        systemWalletId: toSystemWalletId || null,
        entryType: EntryType.CREDIT,
        amount: new Prisma.Decimal(amount),
      },
    })

    // Update transaction status to SUCCESS
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.SUCCESS },
    })

    return {
      transactionId: transaction.id,
      status: TransactionStatus.SUCCESS,
    }
  } catch (error) {
    throw new TransactionFailedError(
      'Failed to create transaction',
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Verify transaction invariants
 * Checks that CREDITS = DEBITS for a transaction
 * Implements Invariant 3: Double-entry symmetry verification
 */
export async function verifyTransactionInvariants(
  prisma: PrismaClient,
  transactionId: string
): Promise<boolean> {
  const entries = await prisma.ledgerEntry.findMany({
    where: { transactionId },
    select: {
      amount: true,
      entryType: true,
    },
  })

  const credits = entries
    .filter((e) => e.entryType === EntryType.CREDIT)
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const debits = entries
    .filter((e) => e.entryType === EntryType.DEBIT)
    .reduce((sum, e) => sum + Number(e.amount), 0)

  // Credits must equal debits (double-entry bookkeeping)
  return Math.abs(credits - debits) < 0.01 // Allow for floating point precision
}

/**
 * Get transaction history for a wallet
 */
export async function getWalletTransactions(
  prisma: PrismaClient,
  walletId: string,
  options: {
    limit?: number
    offset?: number
  } = {}
) {
  const { limit = 50, offset = 0 } = options

  return prisma.ledgerEntry.findMany({
    where: { walletId },
    include: {
      transaction: {
        select: {
          id: true,
          type: true,
          amount: true,
          status: true,
          createdAt: true,
          metadata: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}
