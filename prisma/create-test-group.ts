// prisma/create-test-group.ts — cria grupo de teste com todos os perfis
// Execute: npx tsx prisma/create-test-group.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const tenant = await prisma.tenant.upsert({
    where:  { slug: 'alpha' },
    update: {},
    create: { name: 'Planta Industrial Alpha', slug: 'alpha' },
  })

  const creds = [
    { email: 'admin@alpha.com',      name: 'Admin Alpha',      role: 'ADMINISTRADOR', senha: 'Admin@Alpha2025'  },
    { email: 'supervisor@alpha.com', name: 'Supervisor Alpha', role: 'SUPERVISOR',    senha: 'Sup@Alpha2025'   },
    { email: 'operador@alpha.com',   name: 'Operador Alpha',   role: 'USUARIO',       senha: 'Op@Alpha2025'    },
  ]

  for (const c of creds) {
    await prisma.user.upsert({
      where:  { email: c.email },
      update: {},
      create: {
        email:        c.email,
        name:         c.name,
        passwordHash: await bcrypt.hash(c.senha, 12),
        role:         c.role,
        tenantId:     tenant.id,
      },
    })
  }

  console.log('\n══════════════════════════════════════════════════════')
  console.log('  GRUPO DE TESTE CRIADO: Planta Industrial Alpha')
  console.log('══════════════════════════════════════════════════════')
  console.log('\n  SUPER ADMIN (plataforma):')
  console.log('  Email : master@kyberon.io   |  Senha: Kyberon@Master2025')
  console.log('\n  ADMINISTRADOR:')
  console.log('  Email : admin@alpha.com     |  Senha: Admin@Alpha2025')
  console.log('\n  SUPERVISOR:')
  console.log('  Email : supervisor@alpha.com|  Senha: Sup@Alpha2025')
  console.log('\n  USUÁRIO:')
  console.log('  Email : operador@alpha.com  |  Senha: Op@Alpha2025')
  console.log('══════════════════════════════════════════════════════\n')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
