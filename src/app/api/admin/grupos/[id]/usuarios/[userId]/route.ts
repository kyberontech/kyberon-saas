// src/app/api/admin/grupos/[id]/usuarios/[userId]/route.ts — editar e desativar usuário de um grupo (super admin)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, isSuperAdmin } from '@/lib/apiAuth'
import bcrypt from 'bcryptjs'

const VALID_ROLES = ['ADMINISTRADOR', 'SUPERVISOR', 'USUARIO']

export async function PUT(req: NextRequest, { params }: { params: { id: string; userId: string } }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isSuperAdmin(auth.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const target = await prisma.user.findFirst({
    where: { id: params.userId, tenantId: params.id },
  })
  if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const { name, role, active, newPassword } = await req.json()
  if (role && !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Perfil inválido' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (name !== undefined)     data.name   = name
  if (role !== undefined)     data.role   = role
  if (active !== undefined)   data.active = active
  if (newPassword)            data.passwordHash = await bcrypt.hash(newPassword, 12)

  const updated = await prisma.user.update({
    where:  { id: params.userId },
    data,
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  })

  await prisma.log.create({
    data: {
      action:   'USER_UPDATED',
      detail:   `[Master] Usuário ${target.email} atualizado`,
      userId:   auth.user.id,
      tenantId: params.id,
    },
  })

  return NextResponse.json(updated)
}

// Exclui definitivamente o usuário (e seu histórico de logs) do banco
export async function DELETE(_req: NextRequest, { params }: { params: { id: string; userId: string } }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isSuperAdmin(auth.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const target = await prisma.user.findFirst({
    where: { id: params.userId, tenantId: params.id },
  })
  if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  await prisma.$transaction([
    prisma.log.deleteMany({ where: { userId: params.userId } }),
    prisma.user.delete({ where: { id: params.userId } }),
  ])

  await prisma.log.create({
    data: {
      action:   'USER_DELETED',
      detail:   `[Master] Usuário ${target.email} excluído`,
      userId:   auth.user.id,
      tenantId: params.id,
    },
  })

  return NextResponse.json({ ok: true })
}
