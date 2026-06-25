// src/lib/apiAuth.ts — helper de autenticação para rotas de API
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'

export type SessionUser = {
  id:         string
  email:      string
  name:       string
  role:       string
  tenantId:   string   // vazio para SUPER_ADMIN
  tenantName: string
}

export async function requireSession(): Promise<{ user: SessionUser } | NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  return { user: session.user as SessionUser }
}

export function isSuperAdmin(role: string)  { return role === 'SUPER_ADMIN'   }
export function isAdmin(role: string)        { return role === 'ADMINISTRADOR' }
export function isSupervisor(role: string)   { return role === 'SUPERVISOR' || role === 'ADMINISTRADOR' }

// Garante que o usuário tem um tenant (não é super admin)
export function requireTenant(user: SessionUser): NextResponse | null {
  if (!user.tenantId) return NextResponse.json({ error: 'Rota exclusiva para usuários de grupo' }, { status: 403 })
  return null
}
