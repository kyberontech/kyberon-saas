'use client'
// src/app/alarmes/page.tsx — com responsividade mobile

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { Bell, CheckCircle } from 'lucide-react'
import { getAlarms, saveAlarms, MOCK_USER, type AlarmEvent } from '@/data/store'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })
}

// ── Card de alarme para mobile ──────────────────────────────────────────────
function AlarmCard({ alarm, onAck }: { alarm: AlarmEvent; onAck: (id: string) => void }) {
  const ativo = alarm.status === 'ATIVO'
  return (
    <div className={`
      rounded-xl border p-4 flex flex-col gap-2 transition-colors
      ${ativo ? 'bg-ky-red/[0.04] border-ky-red/30' : 'bg-ky-panel border-ky-border opacity-60'}
    `}>
      <div className="flex items-center justify-between gap-2">
        <span className={`
          text-[10px] font-bold px-2 py-1 rounded-full border
          ${ativo ? 'text-ky-red border-ky-red/40 bg-ky-red/10' : 'text-ky-muted border-ky-border'}
        `}>
          {alarm.status}
        </span>
        {ativo && (
          <button
            onClick={() => onAck(alarm.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold
                       border border-ky-red/40 text-ky-red rounded-md hover:bg-ky-red/15 transition-colors"
          >
            <CheckCircle size={11}/>
            RECONHECER
          </button>
        )}
        {!ativo && (
          <span className="text-ky-muted text-[10px] flex items-center gap-1">
            <CheckCircle size={11}/> Reconhecido
          </span>
        )}
      </div>
      <p className="text-xs text-ky-text">{alarm.message}</p>
      <div className="text-[10px] text-ky-muted font-mono flex flex-col gap-0.5">
        <span>Entrada: {formatDate(alarm.triggeredAt)}</span>
        {alarm.acknowledgedAt && <span>Reconhecido: {formatDate(alarm.acknowledgedAt)}</span>}
        {alarm.acknowledgedBy && <span>Por: {alarm.acknowledgedBy}</span>}
      </div>
    </div>
  )
}

export default function AlarmesPage() {
  const [alarms, setAlarms] = useState<AlarmEvent[]>([])
  const [userName, setUserName] = useState(MOCK_USER.name)

  useEffect(() => {
    setAlarms(getAlarms())
    try {
      const stored = sessionStorage.getItem('ky_user')
      if (stored) setUserName(JSON.parse(stored).name)
    } catch { /* ignora */ }
  }, [])

  function acknowledge(id: string) {
    const updated = alarms.map(a =>
      a.id === id
        ? { ...a, status: 'RECONHECIDO' as const, acknowledgedAt: new Date().toISOString(), acknowledgedBy: userName }
        : a
    )
    setAlarms(updated)
    saveAlarms(updated)
  }

  const ativos       = alarms.filter(a => a.status === 'ATIVO')
  const reconhecidos = alarms.filter(a => a.status === 'RECONHECIDO')
  const ordenados    = [...ativos, ...reconhecidos]

  return (
    <div className="flex h-screen overflow-hidden bg-ky-bg">
      <Sidebar/>

      <main className="flex-1 overflow-y-auto pt-[52px] md:pt-0">

        <header className="sticky top-0 z-10 bg-ky-panel/90 backdrop-blur border-b border-ky-border px-4 md:px-6 py-3 flex items-center gap-3">
          <Bell size={15} className="text-ky-primary"/>
          <h1 className="font-head font-bold text-base tracking-[2px] text-ky-primary uppercase">Alarmes</h1>
          <span className="ml-2 bg-ky-red/15 border border-ky-red/40 text-ky-red text-[10px] font-bold px-2 py-0.5 rounded-full">
            {ativos.length} ATIVO{ativos.length !== 1 ? 'S' : ''}
          </span>
        </header>

        <div className="p-4 md:p-6">

          {/* ── Mobile: cards empilhados ── */}
          <div className="flex flex-col gap-3 md:hidden">
            {ordenados.length === 0 && (
              <p className="text-center text-ky-muted text-sm py-12">Nenhum alarme registrado.</p>
            )}
            {ordenados.map(alarm => (
              <AlarmCard key={alarm.id} alarm={alarm} onAck={acknowledge}/>
            ))}
          </div>

          {/* ── Desktop: tabela ── */}
          <div className="hidden md:block bg-ky-panel border border-ky-border rounded-xl overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-ky-bg/50">
                  {['Situação','Mensagem','Entrada do Alarme','Reconhecimento','Reconhecido por','Ação'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-ky-primary font-head tracking-widest text-[10px] uppercase border-b border-ky-border">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenados.map(alarm => (
                  <tr key={alarm.id} className={`
                    border-b border-ky-border/30 transition-colors
                    ${alarm.status === 'ATIVO' ? 'bg-ky-red/[0.04] hover:bg-ky-red/[0.07]' : 'opacity-60 hover:opacity-80 hover:bg-white/[0.02]'}
                  `}>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border
                        ${alarm.status === 'ATIVO' ? 'text-ky-red border-ky-red/40 bg-ky-red/10' : 'text-ky-muted border-ky-border bg-transparent'}`}>
                        {alarm.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ky-text max-w-[280px]">{alarm.message}</td>
                    <td className="px-4 py-3 text-ky-muted font-mono whitespace-nowrap">{formatDate(alarm.triggeredAt)}</td>
                    <td className="px-4 py-3 text-ky-muted font-mono whitespace-nowrap">{formatDate(alarm.acknowledgedAt)}</td>
                    <td className="px-4 py-3 text-ky-muted">{alarm.acknowledgedBy ?? '—'}</td>
                    <td className="px-4 py-3">
                      {alarm.status === 'ATIVO' ? (
                        <button onClick={() => acknowledge(alarm.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold border border-ky-red/40 text-ky-red rounded-md hover:bg-ky-red/15 transition-colors">
                          <CheckCircle size={11}/> RECONHECER
                        </button>
                      ) : (
                        <span className="text-ky-muted text-[10px] flex items-center gap-1">
                          <CheckCircle size={11}/> Reconhecido
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {alarms.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-ky-muted">Nenhum alarme registrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  )
}
