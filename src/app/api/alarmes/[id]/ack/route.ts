// src/app/api/alarmes/[id]/ack/route.ts — reconhecer um alarme
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, isSupervisor } from '@/lib/apiAuth'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isSupervisor(auth.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const updated = await prisma.alarmEvent.updateMany({
    where: { id: params.id, tenantId: auth.user.tenantId, status: 'ATIVO' },
    data: {
      status:         'RECONHECIDO',
      acknowledgedAt: new Date(),
      acknowledgedBy: auth.user.name,
    },
  })

  if (updated.count === 0) {
    return NextResponse.json({ error: 'Alarme não encontrado ou já reconhecido' }, { status: 404 })
  }

  await prisma.log.create({
    data: {
      action:   'ALARM_ACK',
      detail:   `Alarme ${params.id} reconhecido`,
      tenantId: auth.user.tenantId,
      userId:   auth.user.id,
    },
  })

  return NextResponse.json({ ok: true })
}
