'use client'
// src/app/relatorios/page.tsx — relatórios históricos por variável
import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import { BarChart2, Search, Download, Loader2 } from 'lucide-react'
import { type Card } from '@/data/store'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { format, subHours } from 'date-fns'

const AGREGACOES = [
  { value: 'none',  label: 'Sem Agregação' },
  { value: '1min',  label: '1 minuto'      },
  { value: '5min',  label: '5 minutos'     },
  { value: '15min', label: '15 minutos'    },
  { value: '1h',    label: '1 hora'        },
  { value: '1d',    label: '1 dia'         },
]

type DataPoint = { timestamp: string; label: string; valor: number; unit: string }

const inputCls = `bg-ky-bg border border-ky-border rounded-lg px-3 py-2.5 text-sm text-ky-text outline-none focus:border-ky-primary/50 w-full`
const labelCls = 'text-[10px] text-ky-muted uppercase tracking-widest'

export default function RelatoriosPage() {
  const [cards, setCards]           = useState<Card[]>([])
  const [selectedCard, setSelected] = useState('')
  const [startDate, setStartDate]   = useState(() => format(subHours(new Date(), 24), "yyyy-MM-dd'T'HH:mm"))
  const [endDate, setEndDate]       = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [agregacao, setAgregacao]   = useState('none')
  const [chartData, setChartData]   = useState<DataPoint[]>([])
  const [isLoading, setIsLoading]   = useState(false)
  const [searched, setSearched]     = useState(false)

  useEffect(() => {
    fetch('/api/cards')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const leituras = (Array.isArray(data) ? data : []).filter((c: Card) => c.type === 'leitura' || c.type === 'leitura_estado')
        setCards(leituras)
        if (leituras.length > 0) setSelected(leituras[0].id)
      })
      .catch(console.error)
  }, [])

  const fetchData = useCallback(async () => {
    if (!selectedCard) return
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ cardId: selectedCard, start: startDate, end: endDate, agregacao })
      const res    = await fetch(`/api/leituras?${params}`)
      const data   = res.ok ? await res.json() : []
      setChartData(Array.isArray(data) ? data : [])
      setSearched(true)
    } catch {
      setChartData([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedCard, startDate, endDate, agregacao])

  // Auto-refresh quando variável ou período muda
  useEffect(() => {
    if (selectedCard) fetchData()
  }, [fetchData])

  const card = cards.find(c => c.id === selectedCard)

  function exportCSV() {
    if (!chartData.length || !card) return
    const rows = [
      'Data/Hora,Valor,Unidade',
      ...chartData.map(r =>
        `"${format(new Date(r.timestamp), 'dd/MM/yyyy HH:mm:ss')}",${r.valor},${r.unit || card.unit}`
      ),
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `kyberon_${card.variableName.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-ky-bg">
      <Sidebar/>
      <main className="flex-1 overflow-y-auto pt-[52px] md:pt-0">
        <header className="sticky top-0 z-10 bg-ky-panel/90 backdrop-blur border-b border-ky-border px-4 md:px-6 py-3 flex items-center gap-2">
          <BarChart2 size={15} className="text-ky-primary"/>
          <h1 className="font-head font-bold text-base tracking-[2px] text-ky-primary uppercase">Relatórios</h1>
        </header>

        <div className="p-4 md:p-6 flex flex-col gap-4">
          {/* Filtros */}
          <div className="bg-ky-panel border border-ky-border rounded-xl p-4 md:p-5">
            <p className="font-head text-[10px] tracking-[3px] text-ky-muted uppercase mb-4">Filtros</p>
            <div className="flex flex-col gap-3 md:grid md:grid-cols-2 xl:grid-cols-4 md:gap-4 md:items-end">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Variável</label>
                <select value={selectedCard} onChange={e => setSelected(e.target.value)} className={inputCls}>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.variableName}</option>)}
                  {cards.length === 0 && <option value="">Nenhuma variável configurada</option>}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Data Início</label>
                <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls}/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Data Final</label>
                <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls}/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Agregação</label>
                <select value={agregacao} onChange={e => setAgregacao(e.target.value)} className={inputCls}>
                  {AGREGACOES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={fetchData}
                disabled={!selectedCard || isLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-head font-bold text-ky-bg disabled:opacity-50 flex-1 md:flex-none justify-center"
                style={{ background: 'linear-gradient(135deg,#0057FF,#00C8FF)' }}
              >
                {isLoading
                  ? <Loader2 size={13} className="animate-spin"/>
                  : <Search size={13}/>
                }
                Buscar
              </button>
              <button
                onClick={exportCSV}
                disabled={!searched || chartData.length === 0 || isLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-head border border-ky-border text-ky-text hover:border-ky-primary/50 transition-colors disabled:opacity-40 flex-1 md:flex-none justify-center"
              >
                <Download size={13}/> Exportar CSV
              </button>
            </div>
          </div>

          {/* Gráfico */}
          <div className="bg-ky-panel border border-ky-border rounded-xl p-4 md:p-5">
            <p className="font-head text-[10px] tracking-[3px] text-ky-muted uppercase mb-4">
              Gráfico — {card?.variableName ?? '—'}
            </p>
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px] text-ky-muted gap-2">
                <Loader2 size={16} className="animate-spin text-ky-primary"/>
                <span className="text-sm">Buscando dados...</span>
              </div>
            ) : searched && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,255,0.06)"/>
                  <XAxis dataKey="label" tick={{ fill: '#4A7090', fontSize: 10 }} tickLine={false} axisLine={false}/>
                  <YAxis tick={{ fill: '#4A7090', fontSize: 10 }} tickLine={false} axisLine={false}/>
                  <Tooltip
                    contentStyle={{ background: '#0A1628', border: '1px solid #0F2A4A', borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: '#4A7090' }}
                    formatter={(v: any) => [`${v} ${card?.unit ?? ''}`, card?.variableName ?? '']}
                  />
                  <Line type="monotone" dataKey="valor" stroke="#00C8FF" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }}/>
                </LineChart>
              </ResponsiveContainer>
            ) : searched ? (
              <div className="flex items-center justify-center h-[200px] text-ky-muted text-sm">
                Nenhum dado encontrado para o período selecionado.
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-ky-muted text-sm text-center px-4">
                Selecione os filtros e clique em <strong className="text-ky-primary mx-1">Buscar</strong>
              </div>
            )}
          </div>

          {/* Tabela */}
          {searched && chartData.length > 0 && (
            <div className="bg-ky-panel border border-ky-border rounded-xl overflow-hidden">
              <div className="px-4 md:px-5 py-3 border-b border-ky-border">
                <p className="font-head text-[10px] tracking-[3px] text-ky-muted uppercase">
                  Dados Tabelados — {chartData.length} registro{chartData.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-ky-bg/80">
                    <tr>
                      {['Data/Hora', 'Valor', 'Unidade'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-ky-primary font-head tracking-widest text-[10px] border-b border-ky-border">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((row, i) => (
                      <tr key={i} className="border-b border-ky-border/20 hover:bg-white/[0.02]">
                        <td className="px-4 py-2 text-ky-muted font-mono">
                          {format(new Date(row.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                        </td>
                        <td className="px-4 py-2 text-ky-text font-semibold">{row.valor}</td>
                        <td className="px-4 py-2 text-ky-muted">{row.unit || card?.unit}</td>
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
