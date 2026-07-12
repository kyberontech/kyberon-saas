'use client'
// src/app/admin/grupos/page.tsx — gestão de grupos/tenants (super admin)
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Users2, Plus, ToggleLeft, ToggleRight, X, Eye, EyeOff,
  ChevronDown, ChevronRight, Pencil, UserX, UserCheck, Trash2,
} from 'lucide-react'

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

const inputCls  = `w-full bg-ky-bg border border-ky-border rounded-lg px-3 py-2.5 text-sm text-ky-text outline-none focus:border-ky-primary/50 transition-colors`

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRADOR: 'Admin', SUPERVISOR: 'Supervisor', USUARIO: 'Usuário',
}
const ROLE_COLOR: Record<string, string> = {
  ADMINISTRADOR: 'text-ky-primary border-ky-primary/40 bg-ky-primary/10',
  SUPERVISOR:    'text-ky-green  border-ky-green/40  bg-ky-green/10',
  USUARIO:       'text-ky-muted  border-ky-border     bg-transparent',
}
const ROLES = ['ADMINISTRADOR', 'SUPERVISOR', 'USUARIO'] as const

// ── Modal: criar novo grupo ───────────────────────────────────────────────────
function NovoGrupoModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [groupName,     setGroupName]     = useState('')
  const [adminName,     setAdminName]     = useState('')
  const [adminEmail,    setAdminEmail]    = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showPass,      setShowPass]      = useState(false)
  const [error,         setError]         = useState('')
  const [loading,       setLoading]       = useState(false)

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

// ── Modal: adicionar usuário a um grupo ──────────────────────────────────────
function AdicionarUsuarioModal({ tenantId, tenantName, onClose, onCreated }: {
  tenantId: string; tenantName: string; onClose: () => void; onCreated: () => void
}) {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [role,     setRole]     = useState('USUARIO')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res  = await fetch(`/api/admin/grupos/${tenantId}/usuarios`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password, role }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao criar usuário.'); return }
      onCreated(); onClose()
    } catch { setError('Erro de conexão.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-ky-panel border border-ky-border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-head font-bold text-base text-ky-primary tracking-wide">Adicionar Usuário</h2>
            <p className="text-[10px] text-ky-muted truncate max-w-[200px]">{tenantName}</p>
          </div>
          <button onClick={onClose} className="text-ky-muted hover:text-ky-red transition-colors p-1 flex-shrink-0"><X size={16}/></button>
        </div>

        {error && <div className="mb-4 p-3 bg-ky-red/10 border border-ky-red/30 rounded-lg text-ky-red text-xs">{error}</div>}

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-ky-muted uppercase tracking-widest">Nome</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} required placeholder="Nome completo"/>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-ky-muted uppercase tracking-widest">Email</label>
            <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="usuario@empresa.com"/>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-ky-muted uppercase tracking-widest">Perfil</label>
            <select className={inputCls} value={role} onChange={e => setRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-ky-muted uppercase tracking-widest">Senha Inicial</label>
            <div className="relative">
              <input
                className={inputCls}
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
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
              {loading ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal: editar usuário ─────────────────────────────────────────────────────
function EditarUsuarioModal({ tenantId, user, onClose, onSaved }: {
  tenantId: string; user: UserRow; onClose: () => void; onSaved: () => void
}) {
  const [name,        setName]        = useState(user.name)
  const [role,        setRole]        = useState(user.role)
  const [active,      setActive]      = useState(user.active)
  const [newPassword, setNewPassword] = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const body: Record<string, unknown> = { name, role, active }
      if (newPassword) body.newPassword = newPassword
      const res  = await fetch(`/api/admin/grupos/${tenantId}/usuarios/${user.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao salvar.'); return }
      onSaved(); onClose()
    } catch { setError('Erro de conexão.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-ky-panel border border-ky-border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-head font-bold text-base text-ky-primary tracking-wide">Editar Usuário</h2>
            <p className="text-[10px] text-ky-muted font-mono truncate max-w-[200px]">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-ky-muted hover:text-ky-red transition-colors p-1 flex-shrink-0"><X size={16}/></button>
        </div>

        {error && <div className="mb-4 p-3 bg-ky-red/10 border border-ky-red/30 rounded-lg text-ky-red text-xs">{error}</div>}

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-ky-muted uppercase tracking-widest">Nome</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} required/>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-ky-muted uppercase tracking-widest">Perfil</label>
            <select className={inputCls} value={role} onChange={e => setRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between bg-ky-bg/50 border border-ky-border rounded-lg px-3 py-2.5">
            <span className="text-sm text-ky-text">Status do usuário</span>
            <button
              type="button"
              onClick={() => setActive(a => !a)}
              className={`flex items-center gap-1.5 text-[10px] font-head font-bold px-2 py-1 rounded border transition-colors ${active ? 'text-ky-green border-ky-green/40 bg-ky-green/10' : 'text-ky-red border-ky-red/40 bg-ky-red/10'}`}
            >
              {active ? <><UserCheck size={11}/> Ativo</> : <><UserX size={11}/> Inativo</>}
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-ky-muted uppercase tracking-widest">
              Nova Senha <span className="normal-case opacity-60">(deixe em branco para manter)</span>
            </label>
            <div className="relative">
              <input
                className={inputCls}
                type={showPass ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
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
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Linha expansível do tenant (desktop) ─────────────────────────────────────
function TenantRowDesktop({ tenant, onToggle, onDelete }: { tenant: TenantRow; onToggle: () => void; onDelete: () => void }) {
  const [expanded,    setExpanded]    = useState(false)
  const [users,       setUsers]       = useState<UserRow[]>([])
  const [usersLoaded, setUsersLoaded] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)

  async function loadUsers() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/grupos/${tenant.id}`)
      const data = await res.json()
      setUsers(data.users ?? [])
      setUsersLoaded(true)
      setExpanded(true)
    } catch { /* ignora */ }
    finally { setLoading(false) }
  }

  async function refreshUsers() {
    try {
      const res  = await fetch(`/api/admin/grupos/${tenant.id}`)
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch { /* ignora */ }
  }

  function handleExpand() {
    if (usersLoaded) { setExpanded(e => !e) } else { loadUsers() }
  }

  async function toggleUserActive(u: UserRow) {
    const action = u.active ? 'Desativar' : 'Reativar'
    if (!confirm(`${action} o usuário "${u.name}"?`)) return
    await fetch(`/api/admin/grupos/${tenant.id}/usuarios/${u.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ active: !u.active }),
    })
    refreshUsers()
  }

  async function deleteUser(u: UserRow) {
    if (!confirm(`Excluir definitivamente o usuário "${u.name}"? Esta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/admin/grupos/${tenant.id}/usuarios/${u.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Erro ao excluir usuário.')
      return
    }
    refreshUsers()
  }

  return (
    <>
      <tr className={`border-b border-ky-border/30 transition-colors ${!tenant.active ? 'opacity-50' : 'hover:bg-white/[0.02]'}`}>
        <td className="px-4 py-3">
          <button onClick={handleExpand} className="flex items-center gap-1.5 text-left group">
            {loading
              ? <div className="w-3 h-3 border border-ky-primary/50 border-t-ky-primary rounded-full animate-spin"/>
              : expanded
                ? <ChevronDown size={13} className="text-ky-primary"/>
                : <ChevronRight size={13} className="text-ky-muted group-hover:text-ky-primary"/>
            }
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
          <div className="flex items-center gap-2">
            <button
              onClick={onToggle}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] font-head border rounded transition-colors ${tenant.active ? 'border-ky-red/40 text-ky-red hover:bg-ky-red/10' : 'border-ky-green/40 text-ky-green hover:bg-ky-green/10'}`}
            >
              {tenant.active ? <><ToggleRight size={10}/> Desativar</> : <><ToggleLeft size={10}/> Reativar</>}
            </button>
            <button
              onClick={onDelete}
              title="Excluir grupo"
              className="flex items-center justify-center px-2 py-1 text-[10px] font-head border border-ky-red/40 text-ky-red rounded hover:bg-ky-red/10 transition-colors"
            >
              <Trash2 size={10}/>
            </button>
          </div>
        </td>
      </tr>

      {/* ── Linha expandida: usuários do grupo ── */}
      {expanded && (
        <tr className="bg-ky-bg/30">
          <td colSpan={5} className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] text-ky-muted uppercase tracking-widest">Usuários do grupo</p>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-head border border-ky-primary/40 text-ky-primary hover:bg-ky-primary/10 rounded transition-colors"
              >
                <Plus size={10}/> Adicionar Usuário
              </button>
            </div>
            {users.length === 0 ? (
              <p className="text-xs text-ky-muted">Nenhum usuário cadastrado.</p>
            ) : (
              <div className="flex flex-col gap-1.5 max-w-2xl">
                {users.map(u => (
                  <div key={u.id} className={`flex items-center gap-2 bg-ky-panel border border-ky-border rounded-lg px-3 py-2 ${!u.active ? 'opacity-50' : ''}`}>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${ROLE_COLOR[u.role] ?? ''}`}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-ky-text font-medium leading-none">{u.name}</p>
                      <p className="text-[9px] text-ky-muted font-mono">{u.email}</p>
                    </div>
                    {!u.active && <span className="text-[8px] text-ky-red font-bold">inativo</span>}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => setEditingUser(u)}
                        title="Editar usuário"
                        className="p-1.5 text-ky-muted hover:text-ky-primary hover:bg-ky-primary/10 rounded transition-colors"
                      >
                        <Pencil size={11}/>
                      </button>
                      <button
                        onClick={() => toggleUserActive(u)}
                        title={u.active ? 'Desativar usuário' : 'Reativar usuário'}
                        className={`p-1.5 rounded transition-colors ${u.active ? 'text-ky-muted hover:text-ky-red hover:bg-ky-red/10' : 'text-ky-muted hover:text-ky-green hover:bg-ky-green/10'}`}
                      >
                        {u.active ? <UserX size={11}/> : <UserCheck size={11}/>}
                      </button>
                      <button
                        onClick={() => deleteUser(u)}
                        title="Excluir usuário"
                        className="p-1.5 text-ky-muted hover:text-ky-red hover:bg-ky-red/10 rounded transition-colors"
                      >
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}

      {showAddUser && createPortal(
        <AdicionarUsuarioModal
          tenantId={tenant.id}
          tenantName={tenant.name}
          onClose={() => setShowAddUser(false)}
          onCreated={refreshUsers}
        />,
        document.body
      )}
      {editingUser && createPortal(
        <EditarUsuarioModal
          tenantId={tenant.id}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={refreshUsers}
        />,
        document.body
      )}
    </>
  )
}

// ── Card do tenant (mobile) ───────────────────────────────────────────────────
function TenantCard({ tenant, onToggle, onDelete }: { tenant: TenantRow; onToggle: () => void; onDelete: () => void }) {
  const [showUsers,   setShowUsers]   = useState(false)
  const [users,       setUsers]       = useState<UserRow[]>([])
  const [usersLoaded, setUsersLoaded] = useState(false)
  const [loadingU,    setLoadingU]    = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)

  async function loadUsers() {
    if (usersLoaded) { setShowUsers(s => !s); return }
    setLoadingU(true)
    try {
      const res  = await fetch(`/api/admin/grupos/${tenant.id}`)
      const data = await res.json()
      setUsers(data.users ?? [])
      setUsersLoaded(true)
      setShowUsers(true)
    } catch { /* ignora */ }
    finally { setLoadingU(false) }
  }

  async function refreshUsers() {
    try {
      const res  = await fetch(`/api/admin/grupos/${tenant.id}`)
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch { /* ignora */ }
  }

  async function toggleUserActive(u: UserRow) {
    const action = u.active ? 'Desativar' : 'Reativar'
    if (!confirm(`${action} "${u.name}"?`)) return
    await fetch(`/api/admin/grupos/${tenant.id}/usuarios/${u.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ active: !u.active }),
    })
    refreshUsers()
  }

  async function deleteUser(u: UserRow) {
    if (!confirm(`Excluir definitivamente o usuário "${u.name}"? Esta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/admin/grupos/${tenant.id}/usuarios/${u.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Erro ao excluir usuário.')
      return
    }
    refreshUsers()
  }

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
      <div className="flex gap-2">
        <button
          onClick={loadUsers}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-head border border-ky-primary/40 text-ky-primary hover:bg-ky-primary/10 rounded-md transition-colors"
        >
          {loadingU
            ? <div className="w-3 h-3 border border-ky-primary/50 border-t-ky-primary rounded-full animate-spin"/>
            : showUsers ? <ChevronDown size={11}/> : <ChevronRight size={11}/>
          }
          Usuários
        </button>
        <button
          onClick={onToggle}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-head border rounded-md transition-colors ${tenant.active ? 'border-ky-red/40 text-ky-red hover:bg-ky-red/10' : 'border-ky-green/40 text-ky-green hover:bg-ky-green/10'}`}
        >
          {tenant.active ? <><ToggleRight size={11}/> Desativar</> : <><ToggleLeft size={11}/> Reativar</>}
        </button>
        <button
          onClick={onDelete}
          title="Excluir grupo"
          className="flex items-center justify-center px-2.5 py-1.5 text-[10px] font-head border border-ky-red/40 text-ky-red rounded-md hover:bg-ky-red/10 transition-colors"
        >
          <Trash2 size={11}/>
        </button>
      </div>

      {showUsers && (
        <div className="mt-3 border-t border-ky-border/50 pt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] text-ky-muted uppercase tracking-widest">Usuários</p>
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-head border border-ky-primary/40 text-ky-primary hover:bg-ky-primary/10 rounded transition-colors"
            >
              <Plus size={9}/> Adicionar
            </button>
          </div>
          {users.length === 0 ? (
            <p className="text-xs text-ky-muted">Nenhum usuário.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {users.map(u => (
                <div key={u.id} className={`flex items-center gap-2 bg-ky-bg border border-ky-border rounded-lg px-2.5 py-1.5 ${!u.active ? 'opacity-50' : ''}`}>
                  <span className={`text-[7px] font-bold px-1 py-0.5 rounded border flex-shrink-0 ${ROLE_COLOR[u.role] ?? ''}`}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-ky-text font-medium leading-none truncate">{u.name}</p>
                    <p className="text-[8px] text-ky-muted font-mono truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button onClick={() => setEditingUser(u)} title="Editar" className="p-1 text-ky-muted hover:text-ky-primary rounded transition-colors">
                      <Pencil size={10}/>
                    </button>
                    <button
                      onClick={() => toggleUserActive(u)}
                      title={u.active ? 'Desativar' : 'Reativar'}
                      className={`p-1 rounded transition-colors ${u.active ? 'text-ky-muted hover:text-ky-red' : 'text-ky-muted hover:text-ky-green'}`}
                    >
                      {u.active ? <UserX size={10}/> : <UserCheck size={10}/>}
                    </button>
                    <button
                      onClick={() => deleteUser(u)}
                      title="Excluir"
                      className="p-1 text-ky-muted hover:text-ky-red rounded transition-colors"
                    >
                      <Trash2 size={10}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAddUser && createPortal(
        <AdicionarUsuarioModal
          tenantId={tenant.id}
          tenantName={tenant.name}
          onClose={() => setShowAddUser(false)}
          onCreated={refreshUsers}
        />,
        document.body
      )}
      {editingUser && createPortal(
        <EditarUsuarioModal
          tenantId={tenant.id}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={refreshUsers}
        />,
        document.body
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function GruposPage() {
  const [tenants,   setTenants]   = useState<TenantRow[]>([])
  const [loading,   setLoading]   = useState(true)
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

  async function deleteTenant(tenant: TenantRow) {
    if (!confirm(`Excluir definitivamente o grupo "${tenant.name}"? Todos os usuários, cards, alarmes e leituras serão apagados. Esta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/admin/grupos/${tenant.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Erro ao excluir grupo.')
      return
    }
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
          {tenants.map(t => <TenantCard key={t.id} tenant={t} onToggle={() => toggleTenant(t)} onDelete={() => deleteTenant(t)}/>)}
        </div>

        {/* ── Desktop ── */}
        <div className="hidden md:block bg-ky-panel border border-ky-border rounded-xl overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-ky-bg/50">
                {['Grupo', 'Usuários', 'Cards', 'Situação', 'Ações'].map(h => (
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
              {tenants.map(t => <TenantRowDesktop key={t.id} tenant={t} onToggle={() => toggleTenant(t)} onDelete={() => deleteTenant(t)}/>)}
            </tbody>
          </table>
        </div>

      </div>

      {showModal && <NovoGrupoModal onClose={() => setShowModal(false)} onCreated={load}/>}
    </main>
  )
}
