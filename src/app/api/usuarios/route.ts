// src/app/api/usuarios/route.ts — listar e criar usuários (admin)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, isAdmin } from '@/lib/apiAuth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isAdmin(auth.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where:   { tenantId: auth.user.tenantId },
    select:  { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isAdmin(auth.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { email, name, password, role } = await req.json()
  if (!email || !name || !password || !role) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const VALID_ROLES = ['ADMINISTRADOR', 'SUPERVISOR', 'USUARIO']
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Perfil inválido' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      email, name, passwordHash, role,
      tenantId: auth.user.tenantId,
    },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  })

  await prisma.log.create({
    data: {
      action:   'USER_CREATED',
      detail:   `Usuário criado: ${email} (${role})`,
      tenantId: auth.user.tenantId,
      userId:   auth.user.id,
    },
  })

  return NextResponse.json(user, { status: 201 })
}
