// src/app/api/alarmes/route.ts — GET (listar) e POST (criar) alarmes do tenant
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const alarms = await prisma.alarmEvent.findMany({
    where:   { tenantId: auth.user.tenantId },
    orderBy: { triggeredAt: 'desc' },
    take:    200,
  })

  return NextResponse.json(alarms)
}

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const { cardId, variableName, message } = await req.json()
  if (!cardId || !message) {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  // Verifica se já existe alarme ATIVO para esse card (evita duplicatas)
  const existing = await prisma.alarmEvent.findFirst({
    where: { tenantId: auth.user.tenantId, cardId, status: 'ATIVO' },
  })
  if (existing) return NextResponse.json({ ok: true, duplicate: true })

  const alarm = await prisma.alarmEvent.create({
    data: {
      cardId,
      variableName: variableName ?? '',
      message,
      status:   'ATIVO',
      tenantId: auth.user.tenantId,
    },
  })

  return NextResponse.json(alarm, { status: 201 })
}
