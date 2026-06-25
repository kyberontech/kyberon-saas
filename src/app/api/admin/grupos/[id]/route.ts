// src/app/api/admin/grupos/[id]/route.ts — detalhes, editar e ativar/desativar grupo
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, isSuperAdmin } from '@/lib/apiAuth'

// GET — detalhes do tenant (usuários + cards count)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isSuperAdmin(auth.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const tenant = await prisma.tenant.findUnique({
    where:   { id: params.id },
    include: {
      _count: { select: { users: true, cards: true, alarmEvents: true } },
      users: {
        select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
        orderBy: { role: 'asc' },
      },
    },
  })

  if (!tenant) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
  return NextResponse.json(tenant)
}

// PUT — ativar/desativar grupo (e todos seus usuários)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isSuperAdmin(auth.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { active, name } = await req.json()

  const tenant = await prisma.tenant.findUnique({ where: { id: params.id } })
  if (!tenant) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (typeof active === 'boolean') data.active = active
  if (name) data.name = name

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({ where: { id: params.id }, data })
    // Ao desativar o grupo, desativa todos os usuários também
    if (typeof active === 'boolean') {
      await tx.user.updateMany({ where: { tenantId: params.id }, data: { active } })
    }
  })

  await prisma.log.create({
    data: {
      action:  active ? 'GROUP_ACTIVATED' : 'GROUP_DEACTIVATED',
      detail:  `Grupo "${tenant.name}" ${active ? 'ativado' : 'desativado'}`,
      userId:  auth.user.id,
      tenantId: null,
    },
  })

  return NextResponse.json({ ok: true })
}
