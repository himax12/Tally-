import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { spend } from '@/lib/operations'
import { checkIdempotencyKey, storeIdempotencyKey } from '@/lib/idempotency'
import { validateAmount, validateIdempotencyKey, isValidUUID } from '@/lib/validation'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, assetTypeId, amount, idempotencyKey } = body

    // Validate required fields
    if (!userId || !assetTypeId || amount === undefined || !idempotencyKey) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, assetTypeId, amount, idempotencyKey' },
        { status: 400 }
      )
    }

    // Validate UUIDs
    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: 'Invalid userId format' }, { status: 400 })
    }

    if (!isValidUUID(assetTypeId)) {
      return NextResponse.json({ error: 'Invalid assetTypeId format' }, { status: 400 })
    }

    // Validate amount
    try {
      validateAmount(amount)
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Validate idempotency key
    try {
      validateIdempotencyKey(idempotencyKey)
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Check idempotency
    const idempotencyCheck = await checkIdempotencyKey(prisma, idempotencyKey)
    if (idempotencyCheck.exists) {
      return NextResponse.json(idempotencyCheck.response, { status: 200 })
    }

    // Generate unique reference ID
    const referenceId = uuidv4()

    // Execute spend operation
    const result = await spend(prisma, {
      userId,
      assetTypeId,
      amount,
      referenceId,
      metadata: {
        source: 'api',
        timestamp: new Date().toISOString(),
      },
    })

    const response = {
      success: true,
      data: result,
    }

    // Store idempotency key
    await storeIdempotencyKey(prisma, idempotencyKey, response)

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error('Spend error:', error)

    // Handle specific error types
    if (error.name === 'InsufficientBalanceError') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error.name === 'WalletNotFoundError') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (error.name === 'SystemWalletNotFoundError') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (error.name === 'DuplicateTransactionError') {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    if (error.name === 'InvalidAmountError') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
