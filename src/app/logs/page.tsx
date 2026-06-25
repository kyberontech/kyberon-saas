'use client'
// src/app/logs/page.tsx — histórico de ações do sistema (admin)
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { FileText, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type LogRow = {
  id:        string
  action:    string
  detail:    string | null
  createdAt: string
  user:      { name: string; email: string }
}

const ACTION_LABEL: Record<string, { label: string; color: string }> = {
  CARDS_SAVED:      { label: 'Cards Salvos',   color: 'text-ky-primary border-ky-primary/40 bg-ky-primary/10' },
  COMMAND:          { label: 'Comando',         color: 'text-ky-green  border-ky-green/40  bg-ky-green/10'  },
  ALARM_ACK:        { label: 'Alarme Ack',      color: 'text-ky-yellow border-ky-yellow/40 bg-ky-yellow/10' },
  USER_CREATED:     { label: 'Usuário Criado',  color: 'text-ky-primary border-ky-primary/40 bg-ky-primary/10' },
  USER_UPDATED:     { label: 'Usuário Editado', color: 'text-ky-muted  border-ky-border' },
  USER_DEACTIVATED: { label: 'Usuário Inativo', color: 'text-ky-red    border-ky-red/40    bg-ky-red/10'    },
  PASSWORD_CHANGED: { label: 'Senha Alterada',  color: 'text-ky-muted  border-ky-border' },
}

export default function LogsPage() {
  const [logs,    setLogs]    = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res  = await fetch('/api/logs')
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch { setLogs([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-ky-bg">
      <Sidebar/>
      <main className="flex-1 overflow-y-auto pt-[52px] md:pt-0">
        <header className="sticky top-0 z-10 bg-ky-panel/90 backdrop-blur border-b border-ky-border px-4 md:px-6 py-3 flex items-center gap-3">
          <FileText size={15} className="text-ky-primary"/>
          <h1 className="font-head font-bold text-base tracking-[2px] text-ky-primary uppercase">Logs do Sistema</h1>
          <div className="flex-1"/>
          <button onClick={load} disabled={loading} className="text-ky-muted hover:text-ky-primary transition-colors p-1" title="Atualizar">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>
          </button>
        </header>
        <div className="p-4 md:p-6">

          {/* ── Mobile ── */}
          <div className="flex flex-col gap-3 md:hidden">
            {loading && <p className="text-center text-ky-muted text-sm py-8">Carregando...</p>}
            {!loading && logs.length === 0 && <p className="text-center text-ky-muted text-sm py-8">Nenhum log registrado.</p>}
            {logs.map(log => {
              const meta = ACTION_LABEL[log.action]
              return (
                <div key={log.id} className="bg-ky-panel border border-ky-border rounded-xl p-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${meta?.color ?? 'text-ky-muted border-ky-border'}`}>{meta?.label ?? log.action}</span>
                    <span className="text-[9px] text-ky-muted font-mono">{format(new Date(log.createdAt), 'dd/MM HH:mm:ss', { locale: ptBR })}</span>
                  </div>
                  {log.detail && <p className="text-xs text-ky-text">{log.detail}</p>}
                  <p className="text-[10px] text-ky-muted">{log.user.name} — {log.user.email}</p>
                </div>
              )
            })}
          </div>

          {/* ── Desktop ── */}
          <div className="hidden md:block bg-ky-panel border border-ky-border rounded-xl overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-ky-bg/50">
                  {['Data/Hora','Ação','Detalhe','Usuário'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-ky-primary font-head tracking-widest text-[10px] uppercase border-b border-ky-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={4} className="px-4 py-10 text-center text-ky-muted">Carregando...</td></tr>}
                {!loading && logs.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-ky-muted">Nenhum log registrado.</td></tr>}
                {logs.map(log => {
                  const meta = ACTION_LABEL[log.action]
                  return (
                    <tr key={log.id} className="border-b border-ky-border/30 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-ky-muted font-mono whitespace-nowrap">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${meta?.color ?? 'text-ky-muted border-ky-border'}`}>{meta?.label ?? log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-ky-text">{log.detail ?? '—'}</td>
                      <td className="px-4 py-3 text-ky-muted">
                        <span className="block">{log.user.name}</span>
                        <span className="text-[10px] font-mono opacity-60">{log.user.email}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
