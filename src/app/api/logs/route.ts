// src/app/api/logs/route.ts — histórico de ações (admin)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession, isAdmin } from '@/lib/apiAuth'

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  if (!isAdmin(auth.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const logs = await prisma.log.findMany({
    where:   { tenantId: auth.user.tenantId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take:    500,
  })

  return NextResponse.json(logs)
}
