'use client'
// src/app/login/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// TELA DE LOGIN
//
// Versão inicial: login simulado (qualquer senha funciona).
// Para usar autenticação real, instale NextAuth e substitua handleLogin()
// por: signIn('credentials', { email, password, redirect: true, callbackUrl: '/dashboard' })
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, X, AlertCircle } from 'lucide-react'
import { KtgLogo } from '@/components/ui/ktgLogo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // ── Login simulado ──────────────────────────────────────────────────────────
  // TODO: substituir por NextAuth quando adicionar banco de dados
  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      if (!email || !password) {
        setError('Preencha email e senha.')
        setLoading(false)
        return
      }
      // Guarda usuário simulado no sessionStorage
      sessionStorage.setItem('ky_user', JSON.stringify({ name: 'Admin', email }))
      router.push('/dashboard')
    }, 800)
  }

  // ── Google OAuth simulado ───────────────────────────────────────────────────
  // TODO: substituir por: signIn('google', { callbackUrl: '/dashboard' })
  function handleGoogle() {
    sessionStorage.setItem('ky_user', JSON.stringify({ name: 'Google User', email: 'user@gmail.com' }))
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-ky-bg grid-bg flex items-center justify-center relative overflow-hidden">

      {/* Brilhos de fundo */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-ky-blue/10 blur-3xl pointer-events-none"/>
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-ky-primary/8 blur-3xl pointer-events-none"/>

      {/* Card de login */}
      <div className="relative w-full max-w-sm mx-4">

        {/* Botão fechar (volta para "/" ou fecha aba) */}
        <button
          onClick={() => window.close()}
          className="absolute -top-10 right-0 text-ky-muted hover:text-ky-red transition-colors flex items-center gap-1 text-xs"
        >
          <X size={14}/> Fechar
        </button>

        <div
          className="bg-ky-panel border border-ky-border rounded-2xl p-8"
          style={{ boxShadow: '0 0 60px rgba(0,87,255,0.12)' }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <KtgLogo size={80} />
            <h1 className="font-head font-bold text-2xl tracking-[3px] text-ky-primary mt-3">
              KYBERON
            </h1>
            <p className="text-xs tracking-[4px] text-ky-muted uppercase mt-1">
              True Guardian
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-ky-red/10 border border-ky-red/30 rounded-lg text-ky-red text-xs">
              <AlertCircle size={13}/>
              {error}
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="flex flex-col gap-3">

            {/* Email */}
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ky-muted"/>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="
                  w-full bg-ky-bg border border-ky-border rounded-lg
                  pl-9 pr-3 py-2.5 text-sm text-ky-text placeholder:text-ky-muted
                  outline-none focus:border-ky-primary/50 transition-colors
                "
              />
            </div>

            {/* Senha */}
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ky-muted"/>
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="
                  w-full bg-ky-bg border border-ky-border rounded-lg
                  pl-9 pr-3 py-2.5 text-sm text-ky-text placeholder:text-ky-muted
                  outline-none focus:border-ky-primary/50 transition-colors
                "
              />
            </div>

            {/* Botão Acessar */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full mt-1 py-2.5 rounded-lg font-head font-bold text-sm
                tracking-[2px] text-ky-bg transition-opacity disabled:opacity-60
              "
              style={{ background: 'linear-gradient(135deg, #0057FF, #00C8FF)' }}
            >
              {loading ? 'VERIFICANDO...' : 'ACESSAR'}
            </button>
          </form>

          {/* Divisor */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-ky-border"/>
            <span className="text-ky-muted text-[10px]">ou</span>
            <div className="flex-1 h-px bg-ky-border"/>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="
              w-full flex items-center justify-center gap-2 py-2.5
              bg-white/5 border border-white/10 rounded-lg
              text-ky-text text-sm hover:border-white/25 transition-colors
            "
          >
            {/* Ícone Google SVG */}
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57C21.36 18.1 22.56 15.4 22.56 12.25z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>

          {/* Esqueci minha senha */}
          <div className="text-center mt-4">
            <button
              onClick={() => alert('TODO: implemente a recuperação de senha')}
              className="text-ky-muted text-xs hover:text-ky-primary transition-colors"
            >
              Esqueci minha senha
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
