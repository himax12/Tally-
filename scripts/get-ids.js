const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

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
    console.log(`    ID: ${asset.id}\n`)
  })

  // Generate example curl command
  if (users.length > 0 && assetTypes.length > 0) {
    const alice = users.find((u) => u.email.includes('alice'))
    const goldCoins = assetTypes.find((a) => a.name.includes('Gold'))

    if (alice && goldCoins) {
      console.log('🚀 Copy these IDs to Postman:')
      console.log(`\naliceUserId: ${alice.id}`)
      console.log(`goldCoinsId: ${goldCoins.id}\n`)
    }
  }

  await prisma.$disconnect()
}

getIds()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
