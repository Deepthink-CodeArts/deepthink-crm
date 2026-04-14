// prisma/seed.ts
// Seeds the database with initial Super Admin user and roles

import { PrismaClient, Module } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ALL_MODULES: Module[] = [
  'CONTACTS', 'COMPANIES', 'LEADS', 'DEALS',
  'PROJECTS', 'TASKS', 'INVOICES', 'USERS', 'SETTINGS'
]

async function main() {
  console.log('🌱 Seeding database...')

  // Create Super Admin Role
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Full system access',
      isSystem: true,
      permissions: {
        create: ALL_MODULES.map(module => ({
          module,
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
        }))
      }
    }
  })

  // Create Agent Role
  const agentRole = await prisma.role.upsert({
    where: { name: 'Agent' },
    update: {},
    create: {
      name: 'Agent',
      description: 'Standard team member access',
      isSystem: false,
      permissions: {
        create: ['CONTACTS', 'COMPANIES', 'LEADS', 'DEALS', 'PROJECTS', 'TASKS'].map(module => ({
          module: module as Module,
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: false,
        }))
      }
    }
  })

  // Create Super Admin User
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@deepthink.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@deepthink.com',
      password: hashedPassword,
      roleId: superAdminRole.id,
    }
  })

  // Sample Company
  const company = await prisma.company.upsert({
    where: { id: 'sample-company-1' },
    update: {},
    create: {
      id: 'sample-company-1',
      name: 'Acme Digital Agency',
      size: 'SMALL',
      industry: 'Digital Marketing',
      areaOfWork: 'Web Development, SEO',
      address: 'Dhaka, Bangladesh',
    }
  })

  // Sample Contact
  const contact = await prisma.contact.upsert({
    where: { id: 'sample-contact-1' },
    update: {},
    create: {
      id: 'sample-contact-1',
      name: 'Rafiq Ahmed',
      email: 'rafiq@acme.com',
      phone: '+8801700000000',
      whatsapp: '+8801700000000',
      source: 'Referral',
      companyId: company.id,
      roleInCompany: 'CEO',
      status: 'ACTIVE',
    }
  })

  console.log('✅ Seed complete!')
  console.log(`   👤 Admin: admin@deepthink.com / admin123`)
  console.log(`   🏢 Sample company: ${company.name}`)
  console.log(`   👤 Sample contact: ${contact.name}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
