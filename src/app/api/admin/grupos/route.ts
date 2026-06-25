// src/app/api/admin/grupos/route.ts — listar e criar grupos (super admin)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, isSuperAdmin } from '@/lib/apiAuth'
import bcrypt from 'bcryptjs'

// GET /api/admin/grupos — lista todos os tenants com contagem de usuários
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isSuperAdmin(auth.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { users: true, cards: true } },
    },
  })

  return NextResponse.json(tenants)
}

// POST /api/admin/grupos — cria novo tenant + administrador inicial
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isSuperAdmin(auth.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { groupName, adminName, adminEmail, adminPassword } = await req.json()

  if (!groupName || !adminName || !adminEmail || !adminPassword) {
    return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
  }
  if (adminPassword.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter ao menos 6 caracteres' }, { status: 400 })
  }

  // Gera slug a partir do nome (ex: "Empresa ABC" → "empresa-abc")
  const slug = groupName
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const existingTenant = await prisma.tenant.findFirst({ where: { OR: [{ name: groupName }, { slug }] } })
  if (existingTenant) return NextResponse.json({ error: 'Já existe um grupo com este nome' }, { status: 409 })

  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (existingUser) return NextResponse.json({ error: 'Email já está em uso' }, { status: 409 })

  const passwordHash = await bcrypt.hash(adminPassword, 12)

  // Cria tenant e administrador em uma transação
  const [tenant, admin] = await prisma.$transaction(async (tx) => {
    const t = await tx.tenant.create({ data: { name: groupName, slug } })
    const u = await tx.user.create({
      data: { email: adminEmail, name: adminName, passwordHash, role: 'ADMINISTRADOR', tenantId: t.id },
      select: { id: true, email: true, name: true, role: true },
    })
    return [t, u]
  })

  // Log da ação do super admin
  await prisma.log.create({
    data: {
      action:  'GROUP_CREATED',
      detail:  `Grupo "${groupName}" criado com admin ${adminEmail}`,
      userId:  auth.user.id,
      tenantId: null,
    },
  })

  return NextResponse.json({ tenant, admin }, { status: 201 })
}
