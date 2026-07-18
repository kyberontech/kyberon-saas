// src/app/api/leituras/route.ts — histórico de leituras por variável/card
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'
import { format } from 'date-fns'

const BUCKET_MS: Record<string, number> = {
  '1min':  60_000,
  '5min':  300_000,
  '15min': 900_000,
  '1h':    3_600_000,
  '1d':    86_400_000,
}

function labelFor(ts: Date, agregacao: string): string {
  return agregacao === '1d'
    ? format(ts, 'dd/MM')
    : format(ts, 'dd/MM HH:mm')
}

// GET /api/leituras?cardId=&start=&end=&agregacao=
export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const p         = req.nextUrl.searchParams
  const cardId    = p.get('cardId')    ?? ''
  const start     = p.get('start')     ?? ''
  const end       = p.get('end')       ?? ''
  const agregacao = p.get('agregacao') ?? 'none'

  if (!cardId || !start || !end) {
    return NextResponse.json({ error: 'cardId, start e end são obrigatórios' }, { status: 400 })
  }

  const readings = await prisma.reading.findMany({
    where: {
      tenantId:  auth.user.tenantId,
      cardId,
      timestamp: { gte: new Date(start), lte: new Date(end) },
    },
    orderBy: { timestamp: 'asc' },
  })

  if (readings.length === 0) return NextResponse.json([])

  // Sem agregação — retorna todos os pontos
  if (agregacao === 'none') {
    return NextResponse.json(readings.map(r => ({
      timestamp: r.timestamp.toISOString(),
      label:     format(r.timestamp, 'dd/MM HH:mm'),
      valor:     r.value,
      unit:      r.unit,
    })))
  }

  // Com agregação — média por bucket de tempo
  const bucketMs = BUCKET_MS[agregacao] ?? 60_000
  const buckets  = new Map<number, number[]>()
  const unitRef  = readings[0].unit

  for (const r of readings) {
    const bucket = Math.floor(r.timestamp.getTime() / bucketMs) * bucketMs
    const arr    = buckets.get(bucket) ?? []
    arr.push(r.value)
    buckets.set(bucket, arr)
  }

  const result = Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([t, vals]) => {
      const ts  = new Date(t)
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      return {
        timestamp: ts.toISOString(),
        label:     labelFor(ts, agregacao),
        valor:     +avg.toFixed(2),
        unit:      unitRef,
      }
    })

  return NextResponse.json(result)
}
