import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultPlatforms = [
  { name: 'Facebook', isActive: true },
  { name: 'YouTube', isActive: true },
  { name: 'Instagram', isActive: true },
  { name: 'Twitter/X', isActive: true },
  { name: 'LinkedIn', isActive: true },
  { name: 'TikTok', isActive: true },
  { name: 'Crisp Chat', isActive: true },
  { name: 'Intercom', isActive: true },
  { name: 'Zendesk', isActive: true },
  { name: 'Freshdesk', isActive: true },
  { name: 'Help Scout', isActive: true },
  { name: 'Discord', isActive: true },
  { name: 'Slack', isActive: true },
  { name: 'WhatsApp Business', isActive: true },
  { name: 'Telegram', isActive: true },
  { name: 'Email Support', isActive: true },
  { name: 'Phone Support', isActive: true },
  { name: 'Live Chat', isActive: true },
  { name: 'Other', isActive: true },
]

async function seedPlatforms() {
  console.log('🌱 Seeding support platforms...')

  try {
    // Check if platforms already exist
    const existingPlatforms = await prisma.supportPlatform.count()
    
    if (existingPlatforms > 0) {
      console.log(`ℹ️  Found ${existingPlatforms} existing platforms. Skipping seed.`)
      return
    }

    // Create platforms
    const createdPlatforms = await prisma.supportPlatform.createMany({
      data: defaultPlatforms,
      skipDuplicates: true,
    })

    console.log(`✅ Successfully created ${createdPlatforms.count} support platforms`)

    // List created platforms
    const platforms = await prisma.supportPlatform.findMany({
      orderBy: { name: 'asc' }
    })

    console.log('\n📋 Created platforms:')
    platforms.forEach((platform, index) => {
      console.log(`${index + 1}. ${platform.name} (${platform.isActive ? 'Active' : 'Inactive'})`)
    })

  } catch (error) {
    console.error('❌ Error seeding platforms:', error)
    throw error
  }
}

async function main() {
  try {
    await seedPlatforms()
  } catch (error) {
    console.error('❌ Seed script failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { seedPlatforms }
