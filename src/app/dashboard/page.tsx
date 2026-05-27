'use client'
// src/app/dashboard/page.tsx

import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import {
  Thermometer, Gauge, Droplets, Zap, Activity,
  Cpu, Power, Wind, Sun, Waves,
} from 'lucide-react'
import { getCards, saveCards, isInAlarm, syncAlarmsFromCards, alarmMessage, type Card } from '@/data/store'

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

// ── Card de leitura (comportamento original) ──────────────────────────────────
function VariableCard({ card }: { card: Card }) {
  const alarm   = isInAlarm(card)
  const message = alarmMessage(card)
  const Icon    = ICON_MAP[card.icon] ?? Activity

  return (
    <div
      className={`
        relative bg-ky-panel border rounded-xl p-3 md:p-4 overflow-hidden
        transition-all duration-200
        ${alarm ? 'border-ky-red animate-alarm-blink' : 'border-ky-border hover:border-ky-primary/30'}
      `}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: alarm ? '#FF3B3B' : 'linear-gradient(90deg,#0057FF,#00C8FF)' }}
      />
      <div className={`
        w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center mb-2 md:mb-3
        ${alarm ? 'bg-ky-red/15 text-ky-red' : 'bg-ky-primary/10 text-ky-primary'}
      `}>
        <Icon size={14}/>
      </div>
      <div className="flex items-baseline gap-1 mb-0.5">
        <span className="font-head font-bold text-xl md:text-2xl text-ky-text">{card.value}</span>
        <span className="text-[10px] md:text-xs text-ky-muted">{card.unit}</span>
      </div>
      <p className="text-[9px] md:text-[10px] text-ky-muted uppercase tracking-wider leading-tight">{card.variableName}</p>
      {alarm && (
        <div className="mt-1.5 text-[8px] md:text-[9px] font-bold text-ky-red tracking-wider uppercase
                        bg-ky-red/10 border border-ky-red/30 rounded px-1.5 py-0.5">
          ⚠ {message}
        </div>
      )}
    </div>
  )
}

// ── Modal de confirmação ──────────────────────────────────────────────────────
function ConfirmModal({
  cardName,
  nextState,
  onConfirm,
  onCancel,
}: {
  cardName: string
  nextState: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      {/* Painel */}
      <div
        className="bg-ky-panel border border-ky-border rounded-2xl p-4 md:p-6 max-w-xs w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Ícone de alerta */}
        <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-ky-primary/10 border border-ky-primary/30 flex items-center justify-center mx-auto mb-3 md:mb-4">
          <Power size={18} className="text-ky-primary"/>
        </div>

        <h2 className="font-head font-bold text-sm md:text-base text-ky-text text-center mb-1 tracking-wide">
          Confirmar Comando
        </h2>

        <p className="text-[10px] md:text-xs text-ky-muted text-center mb-2">
          Deseja executar este comando?
        </p>

        <div className="bg-ky-bg border border-ky-border rounded-lg px-2.5 py-1.5 text-center mb-3 md:mb-5">
          <span className="text-[9px] md:text-[10px] text-ky-muted uppercase tracking-widest block mb-0.5">
            {cardName}
          </span>
          <span
            className={`text-xs md:text-sm font-head font-bold tracking-widest ${
              nextState ? 'text-ky-green' : 'text-ky-red'
            }`}
          >
            {nextState ? '● LIGAR (ON)' : '● DESLIGAR (OFF)'}
          </span>
        </div>

        <div className="flex gap-2 md:gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 text-[10px] md:text-xs font-head border border-ky-border text-ky-muted
                       rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-3 py-2 text-[10px] md:text-xs font-head font-bold text-ky-bg rounded-lg
                        transition-all ${nextState
                          ? 'bg-ky-green hover:brightness-110'
                          : 'bg-ky-red   hover:brightness-110'
                        }`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card de Comando ON/OFF ────────────────────────────────────────────────────
function CommandCard({
  card,
  onToggle,
}: {
  card: Card
  onToggle: (id: string) => void
}) {
  const [showModal, setShowModal] = useState(false)
  const isOn   = card.commandState === true
  const Icon   = ICON_MAP[card.icon] ?? Power
  const nextState = !isOn

  function handleClick() { setShowModal(true) }
  function handleConfirm() { setShowModal(false); onToggle(card.id) }
  function handleCancel()  { setShowModal(false) }

  return (
    <>
      <div
        className={`
          relative bg-ky-panel border rounded-xl p-3 md:p-4 overflow-hidden
          transition-all duration-200 cursor-pointer select-none
          ${isOn
            ? 'border-ky-green/60 hover:border-ky-green'
            : 'border-ky-red/50  hover:border-ky-red'
          }
        `}
        onClick={handleClick}
        role="button"
        aria-label={`Comando ${card.variableName}: ${isOn ? 'ON' : 'OFF'}`}
      >
        {/* Barra de cor no topo */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-300"
          style={{ background: isOn ? '#00FFB3' : '#FF3B3B' }}
        />

        {/* Ícone */}
        <div className={`
          w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center mb-2 md:mb-3 transition-colors duration-300
          ${isOn ? 'bg-ky-green/15 text-ky-green' : 'bg-ky-red/15 text-ky-red'}
        `}>
          <Icon size={14}/>
        </div>

        {/* Badge de estado */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`
            inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-head font-bold
            tracking-widest border transition-all duration-300
            ${isOn
              ? 'bg-ky-green/15 text-ky-green border-ky-green/40'
              : 'bg-ky-red/15   text-ky-red   border-ky-red/40'
            }
          `}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOn ? 'bg-ky-green animate-dot-pulse' : 'bg-ky-red'}`}/>
            {isOn ? 'ON' : 'OFF'}
          </span>
        </div>

        {/* Nome */}
        <p className="text-[9px] md:text-[10px] text-ky-muted uppercase tracking-wider leading-tight">{card.variableName}</p>

        {/* Hint de interação */}
        <p className="text-[8px] md:text-[9px] text-ky-muted/50 mt-1">Clique para alterar</p>
      </div>

      {showModal && (
        <ConfirmModal
          cardName={card.variableName}
          nextState={nextState}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}

// ── Página principal do Dashboard ─────────────────────────────────────────────
export default function DashboardPage() {
  const [cards, setCards] = useState<Card[]>([])

  useEffect(() => {
    //setCards(getCards())
    //ajuste para gerar alarmes
     const cards = getCards()
     setCards(cards)
     syncAlarmsFromCards(cards)

    const interval = setInterval(() => setCards(getCards()), 5000)
    return () => clearInterval(interval)
  }, [])

  // Alterna estado ON/OFF do comando, persiste e atualiza o state
  const handleToggle = useCallback((cardId: string) => {
    setCards(prev => {
      const updated = prev.map(c =>
        c.id === cardId && c.type === 'comando'
          ? { ...c, commandState: !c.commandState }
          : c
      )
      saveCards(updated)
      return updated
    })
  }, [])

  const alarmsCount = cards.filter(isInAlarm).length

  return (
    <div className="flex h-screen overflow-hidden bg-ky-bg">
      <Sidebar/>

      <main className="flex-1 overflow-y-auto pt-[52px] md:pt-0">
        <header className="sticky top-0 z-10 bg-ky-panel/90 backdrop-blur border-b border-ky-border px-4 md:px-6 py-3 flex items-center gap-3">
          <h1 className="font-head font-bold text-base tracking-[2px] text-ky-primary uppercase">
            Dashboard
          </h1>
          <div className="flex-1"/>
          <div className="flex items-center gap-1.5 px-3 py-1 border border-ky-green/30 rounded-full text-[10px] text-ky-green font-semibold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-ky-green animate-dot-pulse"/>
            ONLINE
          </div>
          {alarmsCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-ky-red/15 border border-ky-red/40 rounded-full text-[10px] text-ky-red font-bold">
              ⚠ {alarmsCount} ALARME{alarmsCount > 1 ? 'S' : ''} ATIVO{alarmsCount > 1 ? 'S' : ''}
            </div>
          )}
        </header>

        <div className="p-4 md:p-6">
          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-ky-muted">
              <Activity size={40} className="mb-3 opacity-30"/>
              <p className="text-sm">Nenhum card configurado.</p>
              <p className="text-xs mt-1">
                Acesse <strong className="text-ky-primary">Configurações</strong> para adicionar variáveis.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
              {cards.map(card =>
                card.type === 'comando'
                  ? <CommandCard key={card.id} card={card} onToggle={handleToggle}/>
                  : <VariableCard key={card.id} card={card}/>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
