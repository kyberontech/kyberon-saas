// src/app/api/cards/[id]/command/route.ts — atualiza commandState de um card
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, isSupervisor } from '@/lib/apiAuth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isSupervisor(auth.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { commandState } = await req.json()
  if (typeof commandState !== 'boolean') {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  await prisma.card.updateMany({
    where: { id: params.id, tenantId: auth.user.tenantId },
    data:  { commandState },
  })

  await prisma.log.create({
    data: {
      action:   'COMMAND',
      detail:   `Card ${params.id} → ${commandState ? 'ON' : 'OFF'}`,
      tenantId: auth.user.tenantId,
      userId:   auth.user.id,
    },
  })

  return NextResponse.json({ ok: true })
}
