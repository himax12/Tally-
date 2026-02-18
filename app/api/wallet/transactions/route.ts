import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWalletTransactions } from '@/lib/ledger'
import { isValidUUID } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const assetTypeId = searchParams.get('assetTypeId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate required parameters
    if (!userId || !assetTypeId) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, assetTypeId' },
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

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be non-negative' },
        { status: 400 }
      )
    }

    // Find wallet
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId_assetTypeId: {
          userId,
          assetTypeId,
        },
      },
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    // Get transactions
    const transactions = await getWalletTransactions(prisma, wallet.id, {
      limit,
      offset,
    })

    // Format response
    const formattedTransactions = transactions.map((entry) => ({
      transactionId: entry.transaction.id,
      type: entry.transaction.type,
      amount: Number(entry.transaction.amount),
      entryType: entry.entryType,
      status: entry.transaction.status,
      createdAt: entry.transaction.createdAt,
      metadata: entry.transaction.metadata,
    }))

    return NextResponse.json({
      success: true,
      data: {
        walletId: wallet.id,
        transactions: formattedTransactions,
        pagination: {
          limit,
          offset,
          count: formattedTransactions.length,
        },
      },
    })
  } catch (error: any) {
    console.error('Transactions fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
