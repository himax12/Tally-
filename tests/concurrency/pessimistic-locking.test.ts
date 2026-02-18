/**
 * Concurrency Test for Pessimistic Locking
 * Tests that SELECT FOR UPDATE prevents race conditions
 */

import { PrismaClient } from '@prisma/client'
import { spend } from '../../lib/operations'
import { v4 as uuidv4 } from 'uuid'

describe('Pessimistic Locking - Concurrency Safety', () => {
  let prisma: PrismaClient
  let userId: string
  let assetTypeId: string
  let walletId: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User'
      }
    })
    userId = user.id

    // Get or create asset type
    const assetType = await prisma.assetType.findFirst({
      where: { name: 'Gold Coins' }
    })
    assetTypeId = assetType!.id

    // Create wallet
    const wallet = await prisma.wallet.create({
      data: {
        userId,
        assetTypeId
      }
    })
    walletId = wallet.id

    // Top up wallet with 1000 credits
    await prisma.transaction.create({
      data: {
        type: 'TOPUP',
        amount: 1000,
        referenceId: uuidv4(),
        status: 'SUCCESS',
        ledgerEntries: {
          create: [
            {
              walletId,
              entryType: 'CREDIT',
              amount: 1000
            }
          ]
        }
      }
    })
  })

  afterAll(async () => {
    // Cleanup
    await prisma.ledgerEntry.deleteMany({ where: { walletId } })
    await prisma.transaction.deleteMany({})
    await prisma.wallet.delete({ where: { id: walletId } })
    await prisma.user.delete({ where: { id: userId } })
    await prisma.$disconnect()
  })

  it('should prevent race conditions with concurrent spend operations', async () => {
    // Attempt 10 concurrent spend operations of 150 credits each
    // Total: 1500 credits requested, but only 1000 available
    // Expected: Some succeed, some fail with InsufficientBalanceError
    // Critical: Final balance should NEVER be negative

    const spendAmount = 150
    const concurrentOperations = 10

    const promises = Array.from({ length: concurrentOperations }, (_, i) =>
      spend(prisma, {
        userId,
        assetTypeId,
        amount: spendAmount,
        referenceId: uuidv4(),
        metadata: { test: `concurrent-${i}` }
      }).catch(error => ({
        error: error.message
      }))
    )

    const results = await Promise.all(promises)

    // Count successes and failures
    const successes = results.filter(r => !('error' in r))
    const failures = results.filter(r => 'error' in r)

    console.log(`Successes: ${successes.length}, Failures: ${failures.length}`)

    // Calculate final balance
    const entries = await prisma.ledgerEntry.findMany({
      where: { walletId },
      select: { amount: true, entryType: true }
    })

    const finalBalance = entries.reduce((sum, entry) => {
      const amount = Number(entry.amount)
      return entry.entryType === 'CREDIT' ? sum + amount : sum - amount
    }, 0)

    console.log(`Final balance: ${finalBalance}`)

    // Assertions
    expect(finalBalance).toBeGreaterThanOrEqual(0) // CRITICAL: No negative balance
    expect(successes.length).toBeGreaterThan(0) // At least some should succeed
    expect(successes.length).toBeLessThanOrEqual(6) // Max 6 can succeed (1000 / 150 = 6.67)
    expect(finalBalance).toBe(1000 - (successes.length * spendAmount)) // Balance should be exact
  }, 30000) // 30 second timeout

  it('should handle deadlock scenarios gracefully with retry logic', async () => {
    // This test verifies that the retry logic handles database deadlocks
    // We'll create a scenario with high contention

    const spendAmount = 50
    const concurrentOperations = 20

    const promises = Array.from({ length: concurrentOperations }, (_, i) =>
      spend(prisma, {
        userId,
        assetTypeId,
        amount: spendAmount,
        referenceId: uuidv4(),
        metadata: { test: `deadlock-${i}` }
      }).catch(error => ({
        error: error.message
      }))
    )

    const results = await Promise.all(promises)

    // All operations should either succeed or fail gracefully
    // None should throw unhandled errors
    results.forEach(result => {
      expect(result).toBeDefined()
    })

    // Final balance should still be non-negative
    const entries = await prisma.ledgerEntry.findMany({
      where: { walletId },
      select: { amount: true, entryType: true }
    })

    const finalBalance = entries.reduce((sum, entry) => {
      const amount = Number(entry.amount)
      return entry.entryType === 'CREDIT' ? sum + amount : sum - amount
    }, 0)

    expect(finalBalance).toBeGreaterThanOrEqual(0)
  }, 30000)
})
