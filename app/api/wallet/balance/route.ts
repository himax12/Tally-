import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateBalance } from '@/lib/ledger'
import { isValidUUID } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const assetTypeId = searchParams.get('assetTypeId')

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

    // Find wallet
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId_assetTypeId: {
          userId,
          assetTypeId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        assetType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    // Calculate balance
    const balance = await calculateBalance(prisma, wallet.id)

    return NextResponse.json({
      success: true,
      data: {
        walletId: wallet.id,
        userId: wallet.user.id,
        userEmail: wallet.user.email,
        userName: wallet.user.name,
        assetType: wallet.assetType.name,
        assetTypeDescription: wallet.assetType.description,
        balance,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('Balance check error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
