import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create Asset Types
  console.log('Creating asset types...')
  const goldCoins = await prisma.assetType.upsert({
    where: { name: 'Gold Coins' },
    update: {},
    create: {
      name: 'Gold Coins',
      description: 'Primary currency for in-game purchases',
    },
  })

  const silverCoins = await prisma.assetType.upsert({
    where: { name: 'Silver Coins' },
    update: {},
    create: {
      name: 'Silver Coins',
      description: 'Secondary currency for special items',
    },
  })

  console.log(`✅ Created asset types: ${goldCoins.name}, ${silverCoins.name}`)

  // Create System Wallets
  console.log('Creating system wallets...')
  const goldTreasury = await prisma.systemWallet.upsert({
    where: { name: 'Gold Treasury' },
    update: {},
    create: {
      name: 'Gold Treasury',
      assetTypeId: goldCoins.id,
    },
  })

  const silverTreasury = await prisma.systemWallet.upsert({
    where: { name: 'Silver Treasury' },
    update: {},
    create: {
      name: 'Silver Treasury',
      assetTypeId: silverCoins.id,
    },
  })

  console.log(`✅ Created system wallets: ${goldTreasury.name}, ${silverTreasury.name}`)

  // Create Test Users
  console.log('Creating test users...')
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Smith',
    },
  })

  console.log(`✅ Created users: ${user1.name}, ${user2.name}`)

  // Create Wallets for Users
  console.log('Creating user wallets...')
  
  // Alice's wallets
  const aliceGoldWallet = await prisma.wallet.upsert({
    where: {
      userId_assetTypeId: {
        userId: user1.id,
        assetTypeId: goldCoins.id,
      },
    },
    update: {},
    create: {
      userId: user1.id,
      assetTypeId: goldCoins.id,
    },
  })

  const aliceSilverWallet = await prisma.wallet.upsert({
    where: {
      userId_assetTypeId: {
        userId: user1.id,
        assetTypeId: silverCoins.id,
      },
    },
    update: {},
    create: {
      userId: user1.id,
      assetTypeId: silverCoins.id,
    },
  })

  // Bob's wallets
  const bobGoldWallet = await prisma.wallet.upsert({
    where: {
      userId_assetTypeId: {
        userId: user2.id,
        assetTypeId: goldCoins.id,
      },
    },
    update: {},
    create: {
      userId: user2.id,
      assetTypeId: goldCoins.id,
    },
  })

  const bobSilverWallet = await prisma.wallet.upsert({
    where: {
      userId_assetTypeId: {
        userId: user2.id,
        assetTypeId: silverCoins.id,
      },
    },
    update: {},
    create: {
      userId: user2.id,
      assetTypeId: silverCoins.id,
    },
  })

  console.log(`✅ Created wallets for Alice and Bob`)

  console.log('\n🎉 Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - Asset Types: 2 (Gold Coins, Silver Coins)`)
  console.log(`   - System Wallets: 2 (Gold Treasury, Silver Treasury)`)
  console.log(`   - Users: 2 (Alice, Bob)`)
  console.log(`   - User Wallets: 4 (2 per user)`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
