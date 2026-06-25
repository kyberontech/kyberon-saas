// src/app/api/perfil/senha/route.ts — troca de senha do próprio usuário
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Nova senha deve ter ao menos 6 caracteres' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: auth.user.id } })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: auth.user.id }, data: { passwordHash } })

  await prisma.log.create({
    data: {
      action:   'PASSWORD_CHANGED',
      detail:   'Senha alterada pelo próprio usuário',
      tenantId: auth.user.tenantId,
      userId:   auth.user.id,
    },
  })

  return NextResponse.json({ ok: true })
}
