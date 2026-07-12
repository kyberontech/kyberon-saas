// src/middleware.ts — proteção de rotas por autenticação e nível de acesso
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_ONLY    = ['/usuarios', '/logs']
const SUPERVISOR_UP = ['/configuracoes']

export async function middleware(request: NextRequest) {
  const token      = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl
  const role       = token?.role as string | undefined

  // ── /login ─────────────────────────────────────────────────────────────────
  if (pathname === '/login') {
    if (!token) return NextResponse.next()
    // Redireciona para a área correta conforme o role
    if (role === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/admin', request.url))
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ── Não autenticado → login ────────────────────────────────────────────────
  if (!token) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // ── Área /admin — exclusiva para SUPER_ADMIN ───────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (role !== 'SUPER_ADMIN') return NextResponse.redirect(new URL('/dashboard', request.url))
    return NextResponse.next()
  }

  // ── SUPER_ADMIN tentando acessar área de tenant → redireciona para /admin ──
  if (role === 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // ── Rotas apenas para ADMINISTRADOR do tenant ──────────────────────────────
  if (ADMIN_ONLY.some(r => pathname.startsWith(r)) && role !== 'ADMINISTRADOR') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ── Rotas exclusivas para ADMINISTRADOR e SUPERVISOR ────────────────────────
  if (SUPERVISOR_UP.some(r => pathname.startsWith(r)) && role === 'USUARIO') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/alarmes/:path*',
    '/configuracoes/:path*',
    '/relatorios/:path*',
    '/usuarios/:path*',
    '/logs/:path*',
    '/perfil/:path*',
    '/login',
  ],
}
