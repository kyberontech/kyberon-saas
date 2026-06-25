'use client'
// src/app/admin/page.tsx — visão geral da plataforma (super admin)
import { useEffect, useState } from 'react'
import { LayoutGrid, Users2, Layers, TrendingUp } from 'lucide-react'
import Link from 'next/link'

type TenantRow = {
  id:        string
  name:      string
  slug:      string
  active:    boolean
  createdAt: string
  _count:    { users: number; cards: number }
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/grupos')
      .then(r => r.ok ? r.json() : [])
      .then(data => setTenants(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalUsers  = tenants.reduce((s, t) => s + t._count.users, 0)
  const totalActive = tenants.filter(t => t.active).length

  const stats = [
    { label: 'Grupos Cadastrados', value: tenants.length, icon: Layers,    color: 'text-ky-primary' },
    { label: 'Grupos Ativos',      value: totalActive,    icon: TrendingUp, color: 'text-ky-green'   },
    { label: 'Usuários no Total',  value: totalUsers,     icon: Users2,     color: 'text-ky-primary' },
  ]

  return (
    <main className="flex-1 overflow-y-auto pt-[52px] md:pt-0">
      <header className="sticky top-0 z-10 bg-ky-panel/90 backdrop-blur border-b border-ky-border px-4 md:px-6 py-3 flex items-center gap-2">
        <LayoutGrid size={15} className="text-ky-primary"/>
        <h1 className="font-head font-bold text-base tracking-[2px] text-ky-primary uppercase">Visão Geral</h1>
      </header>

      <div className="p-4 md:p-6 flex flex-col gap-5">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-ky-panel border border-ky-border rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-ky-primary/10 ${s.color}`}>
                <s.icon size={16}/>
              </div>
              <p className="font-head font-bold text-2xl text-ky-text">{loading ? '—' : s.value}</p>
              <p className="text-[10px] text-ky-muted uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Grupos recentes ── */}
        <div className="bg-ky-panel border border-ky-border rounded-xl overflow-hidden">
          <div className="px-4 md:px-5 py-3 border-b border-ky-border flex items-center justify-between">
            <p className="font-head text-[10px] tracking-[3px] text-ky-muted uppercase">Grupos Cadastrados</p>
            <Link href="/admin/grupos" className="text-[10px] text-ky-primary hover:underline font-head">Ver todos →</Link>
          </div>

          {loading ? (
            <p className="text-center text-ky-muted text-sm py-8">Carregando...</p>
          ) : tenants.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-ky-muted text-sm">Nenhum grupo cadastrado.</p>
              <Link href="/admin/grupos" className="text-ky-primary text-xs mt-1 underline">Criar primeiro grupo</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-ky-bg/50">
                    {['Grupo','Usuários','Cards','Situação'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-ky-primary font-head tracking-widest text-[10px] uppercase border-b border-ky-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.slice(0, 8).map(t => (
                    <tr key={t.id} className="border-b border-ky-border/30 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <Link href="/admin/grupos" className="text-ky-text font-medium hover:text-ky-primary transition-colors">{t.name}</Link>
                      </td>
                      <td className="px-4 py-3 text-ky-muted">{t._count.users}</td>
                      <td className="px-4 py-3 text-ky-muted">{t._count.cards}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${t.active ? 'text-ky-green border-ky-green/40 bg-ky-green/10' : 'text-ky-muted border-ky-border'}`}>
                          {t.active ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-ky-primary/5 border border-ky-primary/20 rounded-xl px-4 py-3 text-[10px] text-ky-muted leading-relaxed">
          <strong className="text-ky-primary">Super Admin:</strong> Você gerencia os grupos (clientes) da plataforma. Cada grupo tem seu próprio dashboard, usuários e configurações isolados. Acesse <Link href="/admin/grupos" className="text-ky-primary underline">Grupos</Link> para criar ou gerenciar clientes.
        </div>
      </div>
    </main>
  )
}
