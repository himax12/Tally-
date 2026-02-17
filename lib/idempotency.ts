import { PrismaClient } from '@prisma/client'

/**
 * Idempotency Key Management
 * Prevents duplicate transaction processing
 * Implements Invariant 5: Idempotency
 */

export interface IdempotencyResponse {
  exists: boolean
  response?: any
}

/**
 * Check if an idempotency key has been used before
 * Returns the previous response if key exists
 */
export async function checkIdempotencyKey(
  prisma: PrismaClient,
  key: string
): Promise<IdempotencyResponse> {
  const existing = await prisma.idempotencyKey.findUnique({
    where: { key },
  })

  if (!existing) {
    return { exists: false }
  }

  // Check if key has expired
  if (existing.expiresAt < new Date()) {
    // Delete expired key
    await prisma.idempotencyKey.delete({
      where: { key },
    })
    return { exists: false }
  }

  return {
    exists: true,
    response: existing.response,
  }
}

/**
 * Store idempotency key with response
 * Keys expire after 24 hours
 */
export async function storeIdempotencyKey(
  prisma: PrismaClient,
  key: string,
  response: any
): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour expiration

  await prisma.idempotencyKey.create({
    data: {
      key,
      response,
      expiresAt,
    },
  })
}

/**
 * Clean up expired idempotency keys
 * Should be run periodically (e.g., daily cron job)
 */
export async function cleanupExpiredKeys(
  prisma: PrismaClient
): Promise<number> {
  const result = await prisma.idempotencyKey.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })

  return result.count
}
