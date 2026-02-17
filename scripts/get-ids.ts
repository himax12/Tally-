/**
 * Helper script to get User IDs and Asset Type IDs from the database
 * Run with: npx ts-node scripts/get-ids.ts
 */

import { prisma } from '../lib/prisma'

async function getIds() {
  console.log('📋 Fetching IDs from database...\n')

  // Get users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
    },
  })

  console.log('👥 Users:')
  users.forEach((user) => {
    console.log(`  - ${user.name} (${user.email})`)
    console.log(`    ID: ${user.id}\n`)
  })

  // Get asset types
  const assetTypes = await prisma.assetType.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
  })

  console.log('💰 Asset Types:')
  assetTypes.forEach((asset) => {
    console.log(`  - ${asset.name}`)
    console.log(`    ID: ${asset.id}`)
    console.log(`    Description: ${asset.description}\n`)
  })

  // Generate example curl commands
  if (users.length > 0 && assetTypes.length > 0) {
    const alice = users.find((u) => u.email.includes('alice'))
    const goldCoins = assetTypes.find((a) => a.name.includes('Gold'))

    if (alice && goldCoins) {
      console.log('🚀 Example curl command:')
      console.log(`
curl -X POST http://localhost:3000/api/wallet/topup \\
  -H "Content-Type: application/json" \\
  -d '{
    "userId": "${alice.id}",
    "assetTypeId": "${goldCoins.id}",
    "amount": 100,
    "idempotencyKey": "test-topup-001"
  }'
      `)
    }
  }

  await prisma.$disconnect()
}

getIds()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
