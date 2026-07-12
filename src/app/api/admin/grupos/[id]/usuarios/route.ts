// src/app/api/admin/grupos/[id]/usuarios/route.ts — listar e criar usuários em um grupo (super admin)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, isSuperAdmin } from '@/lib/apiAuth'
import bcrypt from 'bcryptjs'

const VALID_ROLES = ['ADMINISTRADOR', 'SUPERVISOR', 'USUARIO']

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isSuperAdmin(auth.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const tenant = await prisma.tenant.findUnique({ where: { id: params.id } })
  if (!tenant) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })

  const users = await prisma.user.findMany({
    where:   { tenantId: params.id },
    select:  { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isSuperAdmin(auth.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const tenant = await prisma.tenant.findUnique({ where: { id: params.id } })
  if (!tenant) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })

  const { name, email, password, role } = await req.json()
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Perfil inválido' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data:   { name, email, passwordHash, role, tenantId: params.id },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  })

  await prisma.log.create({
    data: {
      action:   'USER_CREATED',
      detail:   `[Master] Usuário criado: ${email} (${role}) no grupo "${tenant.name}"`,
      userId:   auth.user.id,
      tenantId: params.id,
    },
  })

  return NextResponse.json(user, { status: 201 })
}
