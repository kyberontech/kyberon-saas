// prisma/seed.ts — cria super admin + tenant de demonstração + admin do tenant
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ── Super Admin da plataforma (sem tenant) ─────────────────────────────────
  const superHash = await bcrypt.hash('Kyberon@Master2025', 12)
  const superAdmin = await prisma.user.upsert({
    where:  { email: 'master@kyberon.io' },
    update: {},
    create: {
      email:        'master@kyberon.io',
      name:         'Super Admin Kyberon',
      passwordHash: superHash,
      role:         'SUPER_ADMIN',
      tenantId:     null,
    },
  })
  console.log(`Super Admin: ${superAdmin.email}`)

  // ── Tenant de demonstração ─────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where:  { slug: 'demo' },
    update: {},
    create: { name: 'Demo Cliente', slug: 'demo' },
  })
  console.log(`Tenant demo: ${tenant.name} (${tenant.id})`)

  // ── Administrador do tenant de demonstração ────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@Demo2025', 12)
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@demo.com' },
    update: {},
    create: {
      email:        'admin@demo.com',
      name:         'Admin Demo',
      passwordHash: adminHash,
      role:         'ADMINISTRADOR',
      tenantId:     tenant.id,
    },
  })
  console.log(`Admin demo: ${admin.email}`)

  console.log('')
  console.log('══════════════════════════════════════════════════')
  console.log('  CREDENCIAIS INICIAIS')
  console.log('──────────────────────────────────────────────────')
  console.log('  SUPER ADMIN (plataforma):')
  console.log('  Email : master@kyberon.io')
  console.log('  Senha : Kyberon@Master2025')
  console.log('')
  console.log('  ADMIN (grupo Demo Cliente):')
  console.log('  Email : admin@demo.com')
  console.log('  Senha : Admin@Demo2025')
  console.log('  TROQUE as senhas após o primeiro acesso!')
  console.log('══════════════════════════════════════════════════')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
