// src/app/api/cards/route.ts — GET (listar) e POST (salvar) cards do tenant
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, isSupervisor } from '@/lib/apiAuth'

// GET /api/cards — retorna todos os cards do tenant do usuário logado
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const cards = await prisma.card.findMany({
    where:   { tenantId: auth.user.tenantId },
    orderBy: { sortOrder: 'asc' },
  })

  // Adiciona campo `value: 0` (valor runtime populado pelo MQTT no cliente)
  return NextResponse.json(cards.map(c => ({ ...c, value: 0 })))
}

// POST /api/cards — substitui todos os cards do tenant (admin/supervisor)
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isSupervisor(auth.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  // Substitui todos os cards do tenant em uma transação
  await prisma.$transaction([
    prisma.card.deleteMany({ where: { tenantId: auth.user.tenantId } }),
    prisma.card.createMany({
      data: body.map((c: any, i: number) => ({
        id:           c.id,
        type:         c.type         ?? 'leitura',
        variableName: c.variableName ?? '',
        mqttTopic:    c.mqttTopic    ?? '',
        unit:         c.unit         ?? '',
        icon:         c.icon         ?? 'activity',
        alarmMax:     c.alarmMax     ?? null,
        alarmMin:     c.alarmMin     ?? null,
        row:          c.row          ?? 1,
        col:          c.col          ?? 1,
        commandState: c.commandState ?? false,
        sortOrder:    i,
        tenantId:     auth.user.tenantId,
      })),
    }),
  ])

  // Registra log
  await prisma.log.create({
    data: {
      action:   'CARDS_SAVED',
      detail:   `${body.length} card(s) salvos`,
      tenantId: auth.user.tenantId,
      userId:   auth.user.id,
    },
  })

  return NextResponse.json({ ok: true })
}
