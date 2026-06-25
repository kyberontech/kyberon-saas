'use client'
// src/app/usuarios/page.tsx — cadastro e gestão de usuários (admin)
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { Users, Plus, Edit2, ToggleLeft, ToggleRight, X, Eye, EyeOff, Key } from 'lucide-react'

type UserRow = {
  id:        string
  email:     string
  name:      string
  role:      string
  active:    boolean
  createdAt: string
}

const ROLES = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'SUPERVISOR',    label: 'Supervisor'    },
  { value: 'USUARIO',       label: 'Usuário'       },
]

const inputCls = `w-full bg-ky-bg border border-ky-border rounded-lg px-3 py-2.5 text-sm text-ky-text outline-none focus:border-ky-primary/50 transition-colors`

// ── Modal de criação / edição ──────────────────────────────────────────────────
function UserModal({
  user, onClose, onSaved,
}: {
  user:    UserRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!user
  const [name,        setName]        = useState(user?.name  ?? '')
  const [email,       setEmail]       = useState(user?.email ?? '')
  const [role,        setRole]        = useState(user?.role  ?? 'USUARIO')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let res: Response
      if (isEdit) {
        const body: Record<string, unknown> = { name, role }
        if (password) body.newPassword = password
        res = await fetch(`/api/usuarios/${user!.id}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        })
      } else {
        if (!password) { setError('Informe uma senha inicial.'); setLoading(false); return }
        res = await fetch('/api/usuarios', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, name, role, password }),
        })
      }
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao salvar.')
        return
      }
      onSaved()
      onClose()
    } catch { setError('Erro de conexão.') }
    finally  { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-ky-panel border border-ky-border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-head font-bold text-base text-ky-primary tracking-wide">
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button onClick={onClose} className="text-ky-muted hover:text-ky-red transition-colors p-1"><X size={16}/></button>
        </div>

        {error && <div className="mb-4 p-3 bg-ky-red/10 border border-ky-red/30 rounded-lg text-ky-red text-xs">{error}</div>}

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-ky-muted uppercase tracking-widest">Nome</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} required placeholder="Nome completo"/>
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-ky-muted uppercase tracking-widest">Email</label>
              <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="usuario@empresa.com"/>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-ky-muted uppercase tracking-widest">Perfil de Acesso</label>
            <select className={inputCls} value={role} onChange={e => setRole(e.target.value)}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-ky-muted uppercase tracking-widest">
              {isEdit ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha Inicial'}
            </label>
            <div className="relative">
              <input
                className={inputCls}
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Mínimo 6 caracteres'}
                minLength={password ? 6 : undefined}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ky-muted hover:text-ky-text">
                {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-xs font-head border border-ky-border text-ky-muted rounded-lg hover:bg-white/5 transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 text-xs font-head font-bold text-ky-bg rounded-lg disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#0057FF,#00C8FF)' }}>
              {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const [users,   setUsers]   = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState<'new' | UserRow | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res  = await fetch('/api/usuarios')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch { setUsers([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function toggleActive(user: UserRow) {
    const msg = user.active ? 'Desativar este usuário?' : 'Reativar este usuário?'
    if (!confirm(msg)) return
    await fetch(`/api/usuarios/${user.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ active: !user.active }),
    })
    load()
  }

  const ROLE_COLOR: Record<string, string> = {
    ADMINISTRADOR: 'text-ky-primary border-ky-primary/40 bg-ky-primary/10',
    SUPERVISOR:    'text-ky-green  border-ky-green/40  bg-ky-green/10',
    USUARIO:       'text-ky-muted  border-ky-border     bg-transparent',
  }
  const ROLE_LABEL: Record<string, string> = {
    ADMINISTRADOR: 'Admin',
    SUPERVISOR:    'Supervisor',
    USUARIO:       'Usuário',
  }

  return (
    <div className="flex h-screen overflow-hidden bg-ky-bg">
      <Sidebar/>
      <main className="flex-1 overflow-y-auto pt-[52px] md:pt-0">
        <header className="sticky top-0 z-10 bg-ky-panel/90 backdrop-blur border-b border-ky-border px-4 md:px-6 py-3 flex items-center gap-3">
          <Users size={15} className="text-ky-primary"/>
          <h1 className="font-head font-bold text-base tracking-[2px] text-ky-primary uppercase">Usuários</h1>
          <div className="flex-1"/>
          <button
            onClick={() => setModal('new')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-head font-bold text-ky-bg rounded-lg"
            style={{ background: 'linear-gradient(135deg,#0057FF,#00C8FF)' }}
          >
            <Plus size={12}/> Novo Usuário
          </button>
        </header>

        <div className="p-4 md:p-6">

          {/* ── Mobile: cards ── */}
          <div className="flex flex-col gap-3 md:hidden">
            {loading && <p className="text-center text-ky-muted text-sm py-8">Carregando...</p>}
            {!loading && users.length === 0 && <p className="text-center text-ky-muted text-sm py-8">Nenhum usuário cadastrado.</p>}
            {users.map(user => (
              <div key={user.id} className={`bg-ky-panel border border-ky-border rounded-xl p-4 ${!user.active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ky-text truncate">{user.name}</p>
                    <p className="text-xs text-ky-muted truncate">{user.email}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${ROLE_COLOR[user.role] ?? ''}`}>
                    {ROLE_LABEL[user.role] ?? user.role}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setModal(user)} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-head border border-ky-border text-ky-muted rounded-md hover:border-ky-primary/50 transition-colors flex-1 justify-center">
                    <Edit2 size={11}/> Editar
                  </button>
                  <button onClick={() => toggleActive(user)} className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-head border rounded-md transition-colors flex-1 justify-center ${user.active ? 'border-ky-red/40 text-ky-red hover:bg-ky-red/10' : 'border-ky-green/40 text-ky-green hover:bg-ky-green/10'}`}>
                    {user.active ? <><ToggleRight size={11}/> Desativar</> : <><ToggleLeft size={11}/> Reativar</>}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop: tabela ── */}
          <div className="hidden md:block bg-ky-panel border border-ky-border rounded-xl overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-ky-bg/50">
                  {['Nome','Email','Perfil','Situação','Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-ky-primary font-head tracking-widest text-[10px] uppercase border-b border-ky-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-ky-muted">Carregando...</td></tr>
                )}
                {!loading && users.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-ky-muted">Nenhum usuário cadastrado.</td></tr>
                )}
                {users.map(user => (
                  <tr key={user.id} className={`border-b border-ky-border/30 hover:bg-white/[0.02] transition-colors ${!user.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-ky-text font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-ky-muted font-mono">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLOR[user.role] ?? ''}`}>
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${user.active ? 'text-ky-green border-ky-green/40 bg-ky-green/10' : 'text-ky-muted border-ky-border'}`}>
                        {user.active ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setModal(user)} className="flex items-center gap-1 px-2 py-1 text-[10px] font-head border border-ky-border text-ky-muted rounded hover:border-ky-primary/50 transition-colors">
                          <Edit2 size={10}/> Editar
                        </button>
                        <button onClick={() => toggleActive(user)} className={`flex items-center gap-1 px-2 py-1 text-[10px] font-head border rounded transition-colors ${user.active ? 'border-ky-red/40 text-ky-red hover:bg-ky-red/10' : 'border-ky-green/40 text-ky-green hover:bg-ky-green/10'}`}>
                          {user.active ? <><ToggleRight size={10}/> Desativar</> : <><ToggleLeft size={10}/> Reativar</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>          
        </div>
      </main>

      {modal && (
        <UserModal
          user={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
