'use client'
// src/app/dashboard/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
//
// Exibe os cards configurados na tela de Configurações.
// Cada card mostra: ícone, valor atual, unidade, nome da variável.
// Cards com alarme piscam vermelho.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import {
  Thermometer, Gauge, Droplets, Zap, Activity,
  Cpu, Power, Wind, Sun, Waves,
} from 'lucide-react'
import { getCards, isInAlarm, alarmMessage, type Card } from '@/data/store'

// Mapa de ícones disponíveis
// Para adicionar novos ícones, basta incluir aqui
const ICON_MAP: Record<string, React.ElementType> = {
  thermometer: Thermometer,
  gauge:       Gauge,
  droplets:    Droplets,
  zap:         Zap,
  activity:    Activity,
  cpu:         Cpu,
  power:       Power,
  wind:        Wind,
  sun:         Sun,
  waves:       Waves,
}

// ── Card individual ───────────────────────────────────────────────────────────
function VariableCard({ card }: { card: Card }) {
  const alarm   = isInAlarm(card)
  const message = alarmMessage(card)
  const Icon    = ICON_MAP[card.icon] ?? Activity

  return (
    <div
      className={`
        relative bg-ky-panel border rounded-xl p-4 overflow-hidden
        transition-all duration-200
        ${alarm ? 'border-ky-red animate-alarm-blink' : 'border-ky-border hover:border-ky-primary/30'}
      `}
    >
      {/* Linha decorativa no topo */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: alarm ? '#FF3B3B' : 'linear-gradient(90deg,#0057FF,#00C8FF)' }}
      />

      {/* Ícone */}
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center mb-3
        ${alarm ? 'bg-ky-red/15 text-ky-red' : 'bg-ky-primary/10 text-ky-primary'}
      `}>
        <Icon size={16}/>
      </div>

      {/* Valor + Unidade */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="font-head font-bold text-2xl text-ky-text">
          {card.value}
        </span>
        <span className="text-xs text-ky-muted">{card.unit}</span>
      </div>

      {/* Nome da variável */}
      <p className="text-[10px] text-ky-muted uppercase tracking-wider">
        {card.variableName}
      </p>

      {/* Mensagem de alarme */}
      {alarm && (
        <div className="mt-2 text-[9px] font-bold text-ky-red tracking-wider uppercase
                        bg-ky-red/10 border border-ky-red/30 rounded px-2 py-1">
          ⚠ {message}
        </div>
      )}
    </div>
  )
}

// ── Página Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [cards, setCards] = useState<Card[]>([])

  // Carrega os cards do localStorage
  useEffect(() => {
    setCards(getCards())

    // Atualiza a cada 5 segundos (simulação de dados em tempo real)
    // TODO: substituir por WebSocket ou Server-Sent Events quando tiver backend
    const interval = setInterval(() => {
      setCards(getCards())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const alarmsCount = cards.filter(isInAlarm).length

  return (
    <div className="flex h-screen overflow-hidden bg-ky-bg">
      <Sidebar/>

      <main className="flex-1 overflow-y-auto">

        {/* Cabeçalho da página */}
        <header className="sticky top-0 z-10 bg-ky-panel/90 backdrop-blur border-b border-ky-border px-6 py-3 flex items-center gap-3">
          <h1 className="font-head font-bold text-base tracking-[2px] text-ky-primary uppercase">
            Dashboard
          </h1>
          <div className="flex-1"/>
          {/* Status online */}
          <div className="flex items-center gap-1.5 px-3 py-1 border border-ky-green/30 rounded-full text-[10px] text-ky-green font-semibold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-ky-green animate-dot-pulse"/>
            ONLINE
          </div>
          {/* Contador de alarmes */}
          {alarmsCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-ky-red/15 border border-ky-red/40 rounded-full text-[10px] text-ky-red font-bold">
              ⚠ {alarmsCount} ALARME{alarmsCount > 1 ? 'S' : ''} ATIVO{alarmsCount > 1 ? 'S' : ''}
            </div>
          )}
        </header>

        {/* Grid de cards */}
        <div className="p-6">
          {cards.length === 0 ? (
            // Nenhum card ainda
            <div className="flex flex-col items-center justify-center h-64 text-ky-muted">
              <Activity size={40} className="mb-3 opacity-30"/>
              <p className="text-sm">Nenhum card configurado.</p>
              <p className="text-xs mt-1">
                Acesse <strong className="text-ky-primary">Configurações</strong> para adicionar variáveis.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {cards.map(card => (
                <VariableCard key={card.id} card={card}/>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
