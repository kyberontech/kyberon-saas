'use client'
// src/app/perfil/page.tsx — troca de senha do próprio usuário
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Sidebar from '@/components/Sidebar'
import { User, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

const inputCls = `w-full bg-ky-bg border border-ky-border rounded-lg px-3 py-2.5 text-sm text-ky-text outline-none focus:border-ky-primary/50 transition-colors`

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  SUPERVISOR:    'Supervisor',
  USUARIO:       'Usuário',
}

export default function PerfilPage() {
  const { data: session } = useSession()

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd,     setNewPwd]     = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurr,   setShowCurr]   = useState(false)
  const [showNew,    setShowNew]    = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(false)

    if (newPwd.length < 6) { setError('A nova senha deve ter ao menos 6 caracteres.'); return }
    if (newPwd !== confirmPwd) { setError('As senhas não coincidem.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/perfil/senha', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao alterar senha.'); return }
      setSuccess(true)
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch { setError('Erro de conexão.') }
    finally { setLoading(false) }
  }

  const user = session?.user

  return (
    <div className="flex h-screen overflow-hidden bg-ky-bg">
      <Sidebar/>
      <main className="flex-1 overflow-y-auto pt-[52px] md:pt-0">
        <header className="sticky top-0 z-10 bg-ky-panel/90 backdrop-blur border-b border-ky-border px-4 md:px-6 py-3 flex items-center gap-2">
          <User size={15} className="text-ky-primary"/>
          <h1 className="font-head font-bold text-base tracking-[2px] text-ky-primary uppercase">Meu Perfil</h1>
        </header>

        <div className="p-4 md:p-6 max-w-md">

          {/* ── Info do usuário ── */}
          <div className="bg-ky-panel border border-ky-border rounded-xl p-5 mb-5">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-ky-bg flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#0057FF,#00C8FF)' }}
              >
                {user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-ky-text">{user?.name}</p>
                <p className="text-xs text-ky-muted">{user?.email}</p>
                <span className="mt-1 inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border border-ky-primary/40 text-ky-primary bg-ky-primary/10">
                  {ROLE_LABEL[user?.role ?? ''] ?? user?.role}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-ky-border/50">
              <p className="text-[10px] text-ky-muted uppercase tracking-widest mb-1">Cliente</p>
              <p className="text-sm text-ky-text">{user?.tenantName}</p>
            </div>
          </div>

          {/* ── Troca de senha ── */}
          <div className="bg-ky-panel border border-ky-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={14} className="text-ky-primary"/>
              <h2 className="font-head font-bold text-sm tracking-wide text-ky-text">Alterar Senha</h2>
            </div>

            {error && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-ky-red/10 border border-ky-red/30 rounded-lg text-ky-red text-xs">
                <AlertCircle size={13}/> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-ky-green/10 border border-ky-green/30 rounded-lg text-ky-green text-xs">
                <CheckCircle size={13}/> Senha alterada com sucesso!
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ky-muted uppercase tracking-widest">Senha Atual</label>
                <div className="relative">
                  <input className={inputCls} type={showCurr ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required placeholder="Senha atual"/>
                  <button type="button" onClick={() => setShowCurr(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ky-muted hover:text-ky-text">
                    {showCurr ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ky-muted uppercase tracking-widest">Nova Senha</label>
                <div className="relative">
                  <input className={inputCls} type={showNew ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} required placeholder="Mínimo 6 caracteres" minLength={6}/>
                  <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ky-muted hover:text-ky-text">
                    {showNew ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ky-muted uppercase tracking-widest">Confirmar Nova Senha</label>
                <input className={inputCls} type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required placeholder="Repita a nova senha"/>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 py-2.5 rounded-lg font-head font-bold text-sm tracking-[2px] text-ky-bg disabled:opacity-60 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#0057FF,#00C8FF)' }}
              >
                {loading ? 'SALVANDO...' : 'ALTERAR SENHA'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
