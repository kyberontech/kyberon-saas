'use client'
// src/app/login/page.tsx — autenticação real via NextAuth (credenciais)
import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, X, AlertCircle } from 'lucide-react'
import { KtgLogo } from '@/components/ui/ktgLogo'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl  = searchParams.get('callbackUrl') ?? '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email ou senha inválidos.')
      setLoading(false)
      return
    }

    // Busca a sessão para saber o role e redirecionar para a área correta
    const sessionRes  = await fetch('/api/auth/session')
    const sessionData = await sessionRes.json()
    const role        = sessionData?.user?.role

    if (role === 'SUPER_ADMIN') {
      router.push('/admin')
    } else {
      router.push(callbackUrl === '/dashboard' || !callbackUrl ? '/dashboard' : callbackUrl)
    }
  }

  return (
    <main className="min-h-screen bg-ky-bg grid-bg flex items-center justify-center relative overflow-hidden">

      <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-ky-blue/10 blur-3xl pointer-events-none"/>
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-ky-primary/8 blur-3xl pointer-events-none"/>

      <div className="relative w-full max-w-sm mx-4">

        <button
          onClick={() => window.history.length > 1 ? router.back() : window.close()}
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
            <KtgLogo size={80}/>
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

            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ky-muted"/>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-ky-bg border border-ky-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-ky-text placeholder:text-ky-muted outline-none focus:border-ky-primary/50 transition-colors"
              />
            </div>

            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ky-muted"/>
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-ky-bg border border-ky-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-ky-text placeholder:text-ky-muted outline-none focus:border-ky-primary/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-2.5 rounded-lg font-head font-bold text-sm tracking-[2px] text-ky-bg transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #0057FF, #00C8FF)' }}
            >
              {loading ? 'VERIFICANDO...' : 'ACESSAR'}
            </button>
          </form>

          {/* Esqueci minha senha */}
          <div className="text-center mt-5">
            <p className="text-ky-muted text-xs">
              Esqueceu a senha?{' '}
              <span className="text-ky-primary">
                Entre em contato com o administrador do sistema.
              </span>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm/>
    </Suspense>
  )
}
