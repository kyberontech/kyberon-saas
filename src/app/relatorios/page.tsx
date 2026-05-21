'use client'
// src/app/relatorios/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// TELA DE RELATÓRIOS
//
// Estrutura base pronta para implementação.
// Quando tiver banco de dados, substitua os dados simulados
// por chamadas fetch() para sua API de leituras.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { BarChart2, Search, Download } from 'lucide-react'
import { getCards, type Card } from '@/data/store'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { format, subHours } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Opções de agregação
const AGREGACOES = [
  { value: 'none', label: 'Sem Agregação' },
  { value: '1min',  label: '1 minuto'     },
  { value: '5min',  label: '5 minutos'    },
  { value: '10min', label: '10 minutos'   },
  { value: '15min', label: '15 minutos'   },
  { value: '30min', label: '30 minutos'   },
  { value: '1h',    label: '1 hora'       },
  { value: '1d',    label: '1 dia'        },
]

// Gera dados simulados para o gráfico
// TODO: substituir por fetch('/api/readings?variableId=...&start=...&end=...')
function generateMockData(baseValue: number, count = 30) {
  return Array.from({ length: count }, (_, i) => ({
    time: format(subHours(new Date(), count - i), 'HH:mm', { locale: ptBR }),
    valor: +(baseValue + (Math.random() - 0.5) * baseValue * 0.15).toFixed(1),
  }))
}

export default function RelatoriosPage() {
  const [cards, setCards]             = useState<Card[]>([])
  const [selectedCard, setSelected]   = useState('')
  const [startDate, setStartDate]     = useState(() => format(subHours(new Date(), 24), "yyyy-MM-dd'T'HH:mm"))
  const [endDate, setEndDate]         = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [agregacao, setAgregacao]     = useState('none')
  const [chartData, setChartData]     = useState<any[]>([])
  const [searched, setSearched]       = useState(false)

  useEffect(() => {
    const c = getCards()
    setCards(c)
    if (c.length > 0) setSelected(c[0].id)
  }, [])

  const card = cards.find(c => c.id === selectedCard)

  // ── Busca (simulada) ──────────────────────────────────────────────────────
  function handleSearch() {
    if (!card) return
    // TODO: substituir por chamada real à API
    const data = generateMockData(card.value)
    setChartData(data)
    setSearched(true)
  }

  // ── Exporta CSV ───────────────────────────────────────────────────────────
  function exportCSV() {
    if (!chartData.length || !card) return
    const rows = ['Horário,Valor,Unidade', ...chartData.map(r => `${r.time},${r.valor},${card.unit}`)]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `kyberon_${card.variableName.replace(/\s/g,'_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-ky-bg">
      <Sidebar/>

      <main className="flex-1 overflow-y-auto">

        {/* Cabeçalho */}
        <header className="sticky top-0 z-10 bg-ky-panel/90 backdrop-blur border-b border-ky-border px-6 py-3 flex items-center gap-2">
          <BarChart2 size={15} className="text-ky-primary"/>
          <h1 className="font-head font-bold text-base tracking-[2px] text-ky-primary uppercase">
            Relatórios
          </h1>
        </header>

        <div className="p-6 flex flex-col gap-4">

          {/* ── Filtros ── */}
          <div className="bg-ky-panel border border-ky-border rounded-xl p-5">
            <p className="font-head text-[10px] tracking-[3px] text-ky-muted uppercase mb-4">
              Filtros
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">

              {/* Variável */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-ky-muted uppercase tracking-widest">
                  Variável
                </label>
                <select
                  value={selectedCard}
                  onChange={e => setSelected(e.target.value)}
                  className="bg-ky-bg border border-ky-border rounded-lg px-3 py-2 text-sm text-ky-text outline-none focus:border-ky-primary/50"
                >
                  {cards.map(c => (
                    <option key={c.id} value={c.id}>{c.variableName}</option>
                  ))}
                  {cards.length === 0 && <option value="">Nenhuma variável configurada</option>}
                </select>
              </div>

              {/* Data início */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-ky-muted uppercase tracking-widest">
                  Data Início
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-ky-bg border border-ky-border rounded-lg px-3 py-2 text-sm text-ky-text outline-none focus:border-ky-primary/50"
                />
              </div>

              {/* Data fim */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-ky-muted uppercase tracking-widest">
                  Data Final
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-ky-bg border border-ky-border rounded-lg px-3 py-2 text-sm text-ky-text outline-none focus:border-ky-primary/50"
                />
              </div>

              {/* Agregação */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-ky-muted uppercase tracking-widest">
                  Agregação
                </label>
                <select
                  value={agregacao}
                  onChange={e => setAgregacao(e.target.value)}
                  className="bg-ky-bg border border-ky-border rounded-lg px-3 py-2 text-sm text-ky-text outline-none focus:border-ky-primary/50"
                >
                  {AGREGACOES.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSearch}
                disabled={!selectedCard}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-head font-bold text-ky-bg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#0057FF,#00C8FF)' }}
              >
                <Search size={13}/>
                Buscar
              </button>
              <button
                onClick={exportCSV}
                disabled={!searched}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-head border border-ky-border text-ky-text hover:border-ky-primary/50 transition-colors disabled:opacity-40"
              >
                <Download size={13}/>
                Exportar CSV
              </button>
            </div>
          </div>

          {/* ── Gráfico ── */}
          <div className="bg-ky-panel border border-ky-border rounded-xl p-5">
            <p className="font-head text-[10px] tracking-[3px] text-ky-muted uppercase mb-4">
              Gráfico — {card?.variableName ?? '—'}
            </p>

            {searched && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,255,0.06)"/>
                  <XAxis dataKey="time" tick={{ fill: '#4A7090', fontSize: 10 }} tickLine={false} axisLine={false}/>
                  <YAxis tick={{ fill: '#4A7090', fontSize: 10 }} tickLine={false} axisLine={false}/>
                  <Tooltip
                    contentStyle={{ background: '#0A1628', border: '1px solid #0F2A4A', borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: '#4A7090' }}
                    formatter={(v: any) => [`${v} ${card?.unit ?? ''}`, card?.variableName ?? '']}
                  />
                  <Line type="monotone" dataKey="valor" stroke="#00C8FF" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }}/>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-ky-muted text-sm">
                Selecione os filtros e clique em <strong className="text-ky-primary mx-1">Buscar</strong>
              </div>
            )}
          </div>

          {/* ── Tabela de dados ── */}
          {searched && chartData.length > 0 && (
            <div className="bg-ky-panel border border-ky-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-ky-border">
                <p className="font-head text-[10px] tracking-[3px] text-ky-muted uppercase">
                  Dados Tabelados
                </p>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-ky-bg/80">
                    <tr>
                      {['Horário', 'Valor', 'Unidade'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-ky-primary font-head tracking-widest text-[10px] border-b border-ky-border">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((row, i) => (
                      <tr key={i} className="border-b border-ky-border/20 hover:bg-white/[0.02]">
                        <td className="px-4 py-2 text-ky-muted font-mono">{row.time}</td>
                        <td className="px-4 py-2 text-ky-text font-semibold">{row.valor}</td>
                        <td className="px-4 py-2 text-ky-muted">{card?.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
