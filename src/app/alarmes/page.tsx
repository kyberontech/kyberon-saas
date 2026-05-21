'use client'
// src/app/alarmes/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// TELA DE ALARMES
//
// Exibe todos os alarmes em formato de tabela.
// Permite reconhecer alarmes ativos.
// ─────────────────────────────────────────────────────────────────────────────

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

export default function AlarmesPage() {
  const [alarms, setAlarms] = useState<AlarmEvent[]>([])
  const [userName, setUserName] = useState(MOCK_USER.name)

  useEffect(() => {
    setAlarms(getAlarms())
    // Lê nome do usuário logado
    try {
      const stored = sessionStorage.getItem('ky_user')
      if (stored) setUserName(JSON.parse(stored).name)
    } catch { /* ignora */ }
  }, [])

  // ── Reconhece um alarme ───────────────────────────────────────────────────
  function acknowledge(id: string) {
    const updated = alarms.map(a =>
      a.id === id
        ? {
            ...a,
            status: 'RECONHECIDO' as const,
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy: userName,
          }
        : a
    )
    setAlarms(updated)
    saveAlarms(updated)
  }

  const ativos      = alarms.filter(a => a.status === 'ATIVO')
  const reconhecidos = alarms.filter(a => a.status === 'RECONHECIDO')

  return (
    <div className="flex h-screen overflow-hidden bg-ky-bg">
      <Sidebar/>

      <main className="flex-1 overflow-y-auto">

        {/* Cabeçalho */}
        <header className="sticky top-0 z-10 bg-ky-panel/90 backdrop-blur border-b border-ky-border px-6 py-3 flex items-center gap-3">
          <Bell size={15} className="text-ky-primary"/>
          <h1 className="font-head font-bold text-base tracking-[2px] text-ky-primary uppercase">
            Alarmes
          </h1>
          <span className="ml-2 bg-ky-red/15 border border-ky-red/40 text-ky-red text-[10px] font-bold px-2 py-0.5 rounded-full">
            {ativos.length} ATIVO{ativos.length !== 1 ? 'S' : ''}
          </span>
        </header>

        <div className="p-6">

          {/* ── Tabela de Alarmes ── */}
          <div className="bg-ky-panel border border-ky-border rounded-xl overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-ky-bg/50">
                  {[
                    'Situação',
                    'Mensagem',
                    'Entrada do Alarme',
                    'Reconhecimento',
                    'Reconhecido por',
                    'Ação',
                  ].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-ky-primary font-head tracking-widest text-[10px] uppercase border-b border-ky-border"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Ativos primeiro */}
                {[...ativos, ...reconhecidos].map(alarm => (
                  <tr
                    key={alarm.id}
                    className={`
                      border-b border-ky-border/30 transition-colors
                      ${alarm.status === 'ATIVO'
                        ? 'bg-ky-red/[0.04] hover:bg-ky-red/[0.07]'
                        : 'opacity-60 hover:opacity-80 hover:bg-white/[0.02]'
                      }
                    `}
                  >
                    {/* Situação */}
                    <td className="px-4 py-3">
                      <span className={`
                        text-[10px] font-bold px-2 py-1 rounded-full border
                        ${alarm.status === 'ATIVO'
                          ? 'text-ky-red border-ky-red/40 bg-ky-red/10'
                          : 'text-ky-muted border-ky-border bg-transparent'
                        }
                      `}>
                        {alarm.status}
                      </span>
                    </td>

                    {/* Mensagem */}
                    <td className="px-4 py-3 text-ky-text max-w-[280px]">
                      {alarm.message}
                    </td>

                    {/* Data entrada */}
                    <td className="px-4 py-3 text-ky-muted font-mono whitespace-nowrap">
                      {formatDate(alarm.triggeredAt)}
                    </td>

                    {/* Data reconhecimento */}
                    <td className="px-4 py-3 text-ky-muted font-mono whitespace-nowrap">
                      {formatDate(alarm.acknowledgedAt)}
                    </td>

                    {/* Quem reconheceu */}
                    <td className="px-4 py-3 text-ky-muted">
                      {alarm.acknowledgedBy ?? '—'}
                    </td>

                    {/* Botão reconhecer */}
                    <td className="px-4 py-3">
                      {alarm.status === 'ATIVO' ? (
                        <button
                          onClick={() => acknowledge(alarm.id)}
                          className="
                            flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold
                            border border-ky-red/40 text-ky-red rounded-md
                            hover:bg-ky-red/15 transition-colors
                          "
                        >
                          <CheckCircle size={11}/>
                          RECONHECER
                        </button>
                      ) : (
                        <span className="text-ky-muted text-[10px] flex items-center gap-1">
                          <CheckCircle size={11}/>
                          Reconhecido
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {alarms.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-ky-muted">
                      Nenhum alarme registrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  )
}
