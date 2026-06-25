'use client'
// src/app/admin/grupos/page.tsx — gestão de grupos/tenants (super admin)
import { useEffect, useState } from 'react'
import { Users2, Plus, ToggleLeft, ToggleRight, X, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react'

type UserRow = {
  id:        string
  name:      string
  email:     string
  role:      string
  active:    boolean
  createdAt: string
}

type TenantRow = {
  id:        string
  name:      string
  slug:      string
  active:    boolean
  createdAt: string
  _count:    { users: number; cards: number; alarmEvents: number }
  users?:    UserRow[]
}

const inputCls = `w-full bg-ky-bg border border-ky-border rounded-lg px-3 py-2.5 text-sm text-ky-text outline-none focus:border-ky-primary/50 transition-colors`

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRADOR: 'Admin', SUPERVISOR: 'Supervisor', USUARIO: 'Usuário',
}
const ROLE_COLOR: Record<string, string> = {
  ADMINISTRADOR: 'text-ky-primary border-ky-primary/40 bg-ky-primary/10',
  SUPERVISOR:    'text-ky-green  border-ky-green/40  bg-ky-green/10',
  USUARIO:       'text-ky-muted  border-ky-border     bg-transparent',
}

// ── Modal: criar novo grupo ───────────────────────────────────────────────────
function NovoGrupoModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [groupName,      setGroupName]      = useState('')
  const [adminName,      setAdminName]      = useState('')
  const [adminEmail,     setAdminEmail]     = useState('')
  const [adminPassword,  setAdminPassword]  = useState('')
  const [showPass,       setShowPass]       = useState(false)
  const [error,          setError]          = useState('')
  const [loading,        setLoading]        = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res  = await fetch('/api/admin/grupos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ groupName, adminName, adminEmail, adminPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao criar grupo.'); return }
      onCreated(); onClose()
    } catch { setError('Erro de conexão.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-ky-panel border border-ky-border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-head font-bold text-base text-ky-primary tracking-wide">Novo Grupo (Cliente)</h2>
          <button onClick={onClose} className="text-ky-muted hover:text-ky-red transition-colors p-1"><X size={16}/></button>
        </div>

        {error && <div className="mb-4 p-3 bg-ky-red/10 border border-ky-red/30 rounded-lg text-ky-red text-xs">{error}</div>}

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="bg-ky-primary/5 border border-ky-primary/20 rounded-lg px-3 py-2 text-[10px] text-ky-muted">
            <strong className="text-ky-primary">Grupo:</strong> nome do cliente
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-ky-muted uppercase tracking-widest">Nome do Grupo / Cliente</label>
            <input className={inputCls} value={groupName} onChange={e => setGroupName(e.target.value)} required placeholder="Ex: Empresa ABC Ltda"/>
          </div>

          <div className="h-px bg-ky-border/50 my-1"/>
          <p className="text-[10px] text-ky-muted uppercase tracking-widest">Administrador do Grupo</p>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-ky-muted uppercase tracking-widest">Nome</label>
            <input className={inputCls} value={adminName} onChange={e => setAdminName(e.target.value)} required placeholder="Nome completo"/>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-ky-muted uppercase tracking-widest">Email</label>
            <input className={inputCls} type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required placeholder="admin@empresa.com"/>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-ky-muted uppercase tracking-widest">Senha Inicial</label>
            <div className="relative">
              <input
                className={inputCls}
                type={showPass ? 'text' : 'password'}
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ky-muted hover:text-ky-text">
                {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-xs font-head border border-ky-border text-ky-muted rounded-lg hover:bg-white/5 transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 text-xs font-head font-bold text-ky-bg rounded-lg disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#0057FF,#00C8FF)' }}>
              {loading ? 'Criando...' : 'Criar Grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Linha expansível do tenant ────────────────────────────────────────────────
function TenantRow({ tenant, onToggle }: { tenant: TenantRow; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [detail,   setDetail]   = useState<TenantRow | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function loadDetail() {
    if (detail) { setExpanded(e => !e); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/grupos/${tenant.id}`)
      const data = await res.json()
      setDetail(data)
      setExpanded(true)
    } catch { /* ignora */ }
    finally { setLoading(false) }
  }

  const users = detail?.users ?? []

  return (
    <>
      <tr className={`border-b border-ky-border/30 transition-colors ${!tenant.active ? 'opacity-50' : 'hover:bg-white/[0.02]'}`}>
        <td className="px-4 py-3">
          <button onClick={loadDetail} className="flex items-center gap-1.5 text-left group">
            {loading ? <div className="w-3 h-3 border border-ky-primary/50 border-t-ky-primary rounded-full animate-spin"/> : expanded ? <ChevronDown size={13} className="text-ky-primary"/> : <ChevronRight size={13} className="text-ky-muted group-hover:text-ky-primary"/>}
            <span className="text-ky-text font-medium group-hover:text-ky-primary transition-colors">{tenant.name}</span>
          </button>
          <p className="text-[9px] text-ky-muted font-mono mt-0.5 ml-5">/{tenant.slug}</p>
        </td>
        <td className="px-4 py-3 text-ky-muted text-center">{tenant._count.users}</td>
        <td className="px-4 py-3 text-ky-muted text-center">{tenant._count.cards}</td>
        <td className="px-4 py-3">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${tenant.active ? 'text-ky-green border-ky-green/40 bg-ky-green/10' : 'text-ky-muted border-ky-border'}`}>
            {tenant.active ? 'ATIVO' : 'INATIVO'}
          </span>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={onToggle}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-head border rounded transition-colors ${tenant.active ? 'border-ky-red/40 text-ky-red hover:bg-ky-red/10' : 'border-ky-green/40 text-ky-green hover:bg-ky-green/10'}`}
          >
            {tenant.active ? <><ToggleRight size={10}/> Desativar</> : <><ToggleLeft size={10}/> Reativar</>}
          </button>
        </td>
      </tr>

      {/* ── Linha expandida: usuários do grupo ── */}
      {expanded && (
        <tr className="bg-ky-bg/30">
          <td colSpan={5} className="px-6 py-3">
            <p className="text-[9px] text-ky-muted uppercase tracking-widest mb-2">Usuários do grupo</p>
            {users.length === 0 ? (
              <p className="text-xs text-ky-muted">Nenhum usuário cadastrado.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {users.map(u => (
                  <div key={u.id} className={`flex items-center gap-2 bg-ky-panel border border-ky-border rounded-lg px-3 py-1.5 ${!u.active ? 'opacity-50' : ''}`}>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${ROLE_COLOR[u.role] ?? ''}`}>{ROLE_LABEL[u.role] ?? u.role}</span>
                    <div>
                      <p className="text-[11px] text-ky-text font-medium leading-none">{u.name}</p>
                      <p className="text-[9px] text-ky-muted font-mono">{u.email}</p>
                    </div>
                    {!u.active && <span className="text-[8px] text-ky-red">inativo</span>}
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

// ── Versão mobile do tenant ───────────────────────────────────────────────────
function TenantCard({ tenant, onToggle }: { tenant: TenantRow; onToggle: () => void }) {
  return (
    <div className={`bg-ky-panel border border-ky-border rounded-xl p-4 ${!tenant.active ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="font-semibold text-ky-text">{tenant.name}</p>
          <p className="text-[9px] text-ky-muted font-mono">/{tenant.slug}</p>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${tenant.active ? 'text-ky-green border-ky-green/40 bg-ky-green/10' : 'text-ky-muted border-ky-border'}`}>
          {tenant.active ? 'ATIVO' : 'INATIVO'}
        </span>
      </div>
      <div className="flex gap-4 text-xs text-ky-muted mb-3">
        <span>{tenant._count.users} usuário{tenant._count.users !== 1 ? 's' : ''}</span>
        <span>{tenant._count.cards} card{tenant._count.cards !== 1 ? 's' : ''}</span>
      </div>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-head border rounded-md transition-colors ${tenant.active ? 'border-ky-red/40 text-ky-red hover:bg-ky-red/10' : 'border-ky-green/40 text-ky-green hover:bg-ky-green/10'}`}
      >
        {tenant.active ? <><ToggleRight size={11}/> Desativar Grupo</> : <><ToggleLeft size={11}/> Reativar Grupo</>}
      </button>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function GruposPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/grupos')
      const data = await res.json()
      setTenants(Array.isArray(data) ? data : [])
    } catch { setTenants([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function toggleTenant(tenant: TenantRow) {
    const msg = tenant.active
      ? `Desativar o grupo "${tenant.name}"? Todos os usuários serão desativados.`
      : `Reativar o grupo "${tenant.name}"? Todos os usuários serão reativados.`
    if (!confirm(msg)) return
    await fetch(`/api/admin/grupos/${tenant.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ active: !tenant.active }),
    })
    load()
  }

  return (
    <main className="flex-1 overflow-y-auto pt-[52px] md:pt-0">
      <header className="sticky top-0 z-10 bg-ky-panel/90 backdrop-blur border-b border-ky-border px-4 md:px-6 py-3 flex items-center gap-3">
        <Users2 size={15} className="text-ky-primary"/>
        <h1 className="font-head font-bold text-base tracking-[2px] text-ky-primary uppercase">Grupos / Clientes</h1>
        <div className="flex-1"/>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-head font-bold text-ky-bg rounded-lg"
          style={{ background: 'linear-gradient(135deg,#0057FF,#00C8FF)' }}
        >
          <Plus size={12}/> Novo Grupo
        </button>
      </header>

      <div className="p-4 md:p-6">

        {/* ── Mobile ── */}
        <div className="flex flex-col gap-3 md:hidden">
          {loading && <p className="text-center text-ky-muted text-sm py-8">Carregando...</p>}
          {!loading && tenants.length === 0 && (
            <div className="text-center py-10">
              <p className="text-ky-muted text-sm">Nenhum grupo cadastrado.</p>
              <button onClick={() => setShowModal(true)} className="text-ky-primary text-xs mt-2 underline">Criar primeiro grupo</button>
            </div>
          )}
          {tenants.map(t => <TenantCard key={t.id} tenant={t} onToggle={() => toggleTenant(t)}/>)}
        </div>

        {/* ── Desktop ── */}
        <div className="hidden md:block bg-ky-panel border border-ky-border rounded-xl overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-ky-bg/50">
                {['Grupo','Usuários','Cards','Situação','Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-ky-primary font-head tracking-widest text-[10px] uppercase border-b border-ky-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-ky-muted">Carregando...</td></tr>}
              {!loading && tenants.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-ky-muted">
                  Nenhum grupo cadastrado.{' '}
                  <button onClick={() => setShowModal(true)} className="text-ky-primary underline">Criar primeiro grupo.</button>
                </td></tr>
              )}
              {tenants.map(t => <TenantRow key={t.id} tenant={t} onToggle={() => toggleTenant(t)}/>)}
            </tbody>
          </table>
        </div>

       
      </div>

      {showModal && <NovoGrupoModal onClose={() => setShowModal(false)} onCreated={load}/>}
    </main>
  )
}
