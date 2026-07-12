// src/app/api/usuarios/[id]/route.ts — editar e desativar usuário (admin)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, isAdmin } from '@/lib/apiAuth'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isAdmin(auth.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { name, role, active, newPassword } = await req.json()
  const VALID_ROLES = ['ADMINISTRADOR', 'SUPERVISOR', 'USUARIO']
  if (role && !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Perfil inválido' }, { status: 400 })
  }

  // Verifica que o usuário pertence ao mesmo tenant
  const target = await prisma.user.findFirst({
    where: { id: params.id, tenantId: auth.user.tenantId },
  })
  if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  // Admin não pode revogar seu próprio acesso
  if (params.id === auth.user.id && active === false) {
    return NextResponse.json({ error: 'Não é possível desativar a própria conta' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (name !== undefined)        data.name   = name
  if (role !== undefined)        data.role   = role
  if (active !== undefined)      data.active = active
  if (newPassword) {
    data.passwordHash = await bcrypt.hash(newPassword, 12)
  }

  const updated = await prisma.user.update({
    where:  { id: params.id },
    data,
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  })

  await prisma.log.create({
    data: {
      action:   'USER_UPDATED',
      detail:   `Usuário ${target.email} atualizado`,
      tenantId: auth.user.tenantId,
      userId:   auth.user.id,
    },
  })

  return NextResponse.json(updated)
}

// Exclui definitivamente o usuário (e seu histórico de logs) do banco
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isAdmin(auth.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  if (params.id === auth.user.id) {
    return NextResponse.json({ error: 'Não é possível excluir a própria conta' }, { status: 400 })
  }

  const target = await prisma.user.findFirst({
    where: { id: params.id, tenantId: auth.user.tenantId },
  })
  if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  await prisma.$transaction([
    prisma.log.deleteMany({ where: { userId: params.id } }),
    prisma.user.delete({ where: { id: params.id } }),
  ])

  await prisma.log.create({
    data: {
      action:   'USER_DELETED',
      detail:   `Usuário ${target.email} excluído`,
      tenantId: auth.user.tenantId,
      userId:   auth.user.id,
    },
  })

  return NextResponse.json({ ok: true })
}
