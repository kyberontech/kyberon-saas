'use client'
// ═══════════════════════════════════════════════════════════════════
//  src/app/dashboard/page.tsx
//  ─────────────────────────────────────────────────────────────────
//  Dashboard principal com integração MQTT via WebSocket.
//
//  Fluxo de dados:
//   1. Carrega cards do localStorage (configurações salvas)
//   2. useMqtt() conecta ao broker e assina os tópicos de cada card
//   3. Ao chegar mensagem num tópico → atualiza o valor do card na tela
//   4. Cards de Comando publicam ON/OFF no tópico ao serem acionados
//   5. Alarmes são disparados em tempo real com base nos limites do card
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import {
  Thermometer, Gauge, Droplets, Zap, Activity,
  Cpu, Power, Wind, Sun, Waves, Wifi, WifiOff, RefreshCw, AlertTriangle,
} from 'lucide-react'
import {
  getCards, saveCards, isInAlarm, syncAlarmsFromCards,
  alarmMessage, type Card,
} from '@/data/store'
import { useMqtt, type MqttStatus } from '@/lib/mqttClient'

// ── Mapa de ícones disponíveis ────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════
//  BADGE DE STATUS MQTT
//  Exibe o estado atual da conexão com o broker no header
// ═══════════════════════════════════════════════════════════════════
function MqttStatusBadge({ status }: { status: MqttStatus }) {
  const MAP: Record<MqttStatus, { label: string; dotColor: string; spinning: boolean }> = {
    connected:    { label: 'MQTT OK',      dotColor: '#00FFB3', spinning: false },
    connecting:   { label: 'CONECTANDO',   dotColor: '#0057FF', spinning: true  },
    reconnecting: { label: 'RECONECTANDO', dotColor: '#FACC15', spinning: true  },
    disconnected: { label: 'DESCONECTADO', dotColor: '#6B7280', spinning: false },
    error:        { label: 'ERRO MQTT',    dotColor: '#FF3B3B', spinning: false },
  }
  const { label, dotColor, spinning } = MAP[status]

  const borderColor = {
    connected:    'border-ky-green/40 text-ky-green bg-ky-green/10',
    connecting:   'border-ky-primary/40 text-ky-primary bg-ky-primary/10',
    reconnecting: 'border-yellow-400/40 text-yellow-400 bg-yellow-400/10',
    disconnected: 'border-ky-muted/30 text-ky-muted bg-transparent',
    error:        'border-ky-red/40 text-ky-red bg-ky-red/10',
  }[status]

  const Icon = status === 'disconnected' ? WifiOff
             : status === 'error'        ? AlertTriangle
             : status === 'connected'    ? Wifi
             :                            RefreshCw

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold tracking-wider ${borderColor}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'animate-dot-pulse' : status !== 'disconnected' ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: dotColor }}
      />
      <Icon size={10} className={spinning ? 'animate-spin' : ''}/>
      {label}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
//  CARD DE LEITURA
//  Exibe o valor recebido via MQTT + estado de alarme
//  Pisca a borda verde brevemente ao receber novo valor
// ═══════════════════════════════════════════════════════════════════
function VariableCard({ card, mqttConnected }: { card: Card; mqttConnected: boolean }) {
  const alarm   = isInAlarm(card)
  const message = alarmMessage(card)
  const Icon    = ICON_MAP[card.icon] ?? Activity

  // Flash verde ao receber novo valor
  const [fresh, setFresh] = useState(false)
  const prevValueRef = useRef<number>(card.value)
  useEffect(() => {
    if (card.value !== prevValueRef.current) {
      prevValueRef.current = card.value
      setFresh(true)
      const t = setTimeout(() => setFresh(false), 800)
      return () => clearTimeout(t)
    }
  }, [card.value])

  const borderClass = alarm
    ? 'border-ky-red animate-alarm-blink'
    : fresh
      ? 'border-ky-green/70'
      : 'border-ky-border hover:border-ky-primary/30'

  const barStyle = {
    background: alarm ? '#FF3B3B' : fresh ? '#00FFB3' : 'linear-gradient(90deg,#0057FF,#00C8FF)',
    transition: 'background 0.4s',
  }

  return (
    <div className={`relative bg-ky-panel border rounded-xl p-3 md:p-4 overflow-hidden transition-all duration-200 ${borderClass}`}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={barStyle}/>

      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center mb-2 md:mb-3
        ${alarm ? 'bg-ky-red/15 text-ky-red' : 'bg-ky-primary/10 text-ky-primary'}`}>
        <Icon size={14}/>
      </div>

      <div className="flex items-baseline gap-1 mb-0.5">
        <span className="font-head font-bold text-xl md:text-2xl text-ky-text">{card.value}</span>
        <span className="text-[10px] md:text-xs text-ky-muted">{card.unit}</span>
      </div>

      <p className="text-[9px] md:text-[10px] text-ky-muted uppercase tracking-wider leading-tight">
        {card.variableName}
      </p>

      {/* Tópico MQTT vinculado (exibição discreta) */}
      {card.mqttTopic && (
        <p className="text-[8px] text-ky-muted/40 font-mono mt-0.5 truncate" title={card.mqttTopic}>
          ⬡ {card.mqttTopic}
        </p>
      )}

      {/* Aviso se card não tem tópico configurado */}
      {mqttConnected && !card.mqttTopic && (
        <p className="text-[8px] text-yellow-500/70 mt-0.5">⚠ sem tópico MQTT</p>
      )}

      {alarm && (
        <div className="mt-1.5 text-[8px] md:text-[9px] font-bold text-ky-red tracking-wider uppercase
                        bg-ky-red/10 border border-ky-red/30 rounded px-1.5 py-0.5">
          ⚠ {message}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
//  MODAL DE CONFIRMAÇÃO DE COMANDO
// ═══════════════════════════════════════════════════════════════════
function ConfirmModal({
  cardName, nextState, onConfirm, onCancel,
}: {
  cardName: string; nextState: boolean; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onCancel}>
      <div className="bg-ky-panel border border-ky-border rounded-2xl p-4 md:p-6 max-w-xs w-full shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-ky-primary/10 border border-ky-primary/30
                        flex items-center justify-center mx-auto mb-3 md:mb-4">
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
          <span className={`text-xs md:text-sm font-head font-bold tracking-widest
            ${nextState ? 'text-ky-green' : 'text-ky-red'}`}>
            {nextState ? '● LIGAR (ON)' : '● DESLIGAR (OFF)'}
          </span>
        </div>

        <div className="flex gap-2 md:gap-3">
          <button onClick={onCancel}
            className="flex-1 px-3 py-2 text-[10px] md:text-xs font-head border border-ky-border
                       text-ky-muted rounded-lg hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className={`flex-1 px-3 py-2 text-[10px] md:text-xs font-head font-bold text-ky-bg rounded-lg transition-all
              ${nextState ? 'bg-ky-green hover:brightness-110' : 'bg-ky-red hover:brightness-110'}`}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
//  CARD DE COMANDO ON/OFF
//  Ao confirmar → publishCommand() publica no tópico MQTT
// ═══════════════════════════════════════════════════════════════════
function CommandCard({ card, onToggle }: { card: Card; onToggle: (id: string) => void }) {
  const [showModal, setShowModal] = useState(false)
  const isOn      = card.commandState === true
  const Icon      = ICON_MAP[card.icon] ?? Power
  const nextState = !isOn

  return (
    <>
      <div
        className={`relative bg-ky-panel border rounded-xl p-3 md:p-4 overflow-hidden
          transition-all duration-200 cursor-pointer select-none
          ${isOn ? 'border-ky-green/60 hover:border-ky-green' : 'border-ky-red/50 hover:border-ky-red'}`}
        onClick={() => setShowModal(true)}
        role="button"
        aria-label={`Comando ${card.variableName}: ${isOn ? 'ON' : 'OFF'}`}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-300"
          style={{ background: isOn ? '#00FFB3' : '#FF3B3B' }}/>

        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center mb-2 md:mb-3
            transition-colors duration-300
            ${isOn ? 'bg-ky-green/15 text-ky-green' : 'bg-ky-red/15 text-ky-red'}`}>
          <Icon size={14}/>
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] md:text-[10px]
              font-head font-bold tracking-widest border transition-all duration-300
              ${isOn ? 'bg-ky-green/15 text-ky-green border-ky-green/40'
                     : 'bg-ky-red/15 text-ky-red border-ky-red/40'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOn ? 'bg-ky-green animate-dot-pulse' : 'bg-ky-red'}`}/>
            {isOn ? 'ON' : 'OFF'}
          </span>
        </div>

        <p className="text-[9px] md:text-[10px] text-ky-muted uppercase tracking-wider leading-tight">
          {card.variableName}
        </p>

        {card.mqttTopic && (
          <p className="text-[8px] text-ky-muted/40 font-mono mt-0.5 truncate" title={card.mqttTopic}>
            ⬡ {card.mqttTopic}
          </p>
        )}

        <p className="text-[8px] md:text-[9px] text-ky-muted/50 mt-1">Clique para alterar</p>
      </div>

      {showModal && (
        <ConfirmModal
          cardName={card.variableName}
          nextState={nextState}
          onConfirm={() => { setShowModal(false); onToggle(card.id) }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
//  PÁGINA DO DASHBOARD
// ═══════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const [cards, setCards] = useState<Card[]>([])

  // ── Carrega cards salvos na inicialização ──────────────────────
  useEffect(() => {
    const loaded = getCards()
    setCards(loaded)
    syncAlarmsFromCards(loaded)
  }, [])

  // ── Callback chamado pelo hook MQTT ao receber valor em um tópico
  //    Faz o vínculo:  tópico MQTT  →  card  →  valor na tela
  const handleMqttMessage = useCallback((cardId: string, rawValue: string) => {
    setCards(prev => {
      const parsed = parseFloat(rawValue)
      const value  = isNaN(parsed) ? 0 : parsed   // ignora payloads não-numéricos

      const updated = prev.map(c => c.id === cardId ? { ...c, value } : c)

      // Persiste e verifica alarmes a cada atualização de valor
      saveCards(updated)
      syncAlarmsFromCards(updated)

      return updated
    })
  }, [])

  // ── Hook MQTT ──────────────────────────────────────────────────
  //    Gerencia conexão, subscribe e publish em um único lugar
  const { status: mqttStatus, publishCommand } = useMqtt(cards, handleMqttMessage)

  // ── Acionamento de cards de Comando ───────────────────────────
  //    Publica no broker E atualiza o estado local
  const handleToggle = useCallback((cardId: string) => {
    setCards(prev => {
      const card = prev.find(c => c.id === cardId)
      if (!card) return prev

      const nextState = !card.commandState

      // 1. Publica no broker MQTT
      publishCommand(card, nextState)

      // 2. Atualiza estado local + localStorage
      const updated = prev.map(c =>
        c.id === cardId ? { ...c, commandState: nextState } : c
      )
      saveCards(updated)
      return updated
    })
  }, [publishCommand])

  const alarmsCount   = cards.filter(isInAlarm).length
  const mqttConnected = mqttStatus === 'connected'

  return (
    <div className="flex h-screen overflow-hidden bg-ky-bg">
      <Sidebar/>

      <main className="flex-1 overflow-y-auto pt-[52px] md:pt-0">

        {/* ── Header com status MQTT e alarmes ──────────────── */}
        <header className="sticky top-0 z-10 bg-ky-panel/90 backdrop-blur border-b border-ky-border
                           px-4 md:px-6 py-3 flex items-center gap-2 md:gap-3 flex-wrap">
          <h1 className="font-head font-bold text-base tracking-[2px] text-ky-primary uppercase">
            Dashboard
          </h1>

          <div className="flex-1"/>

          {/* Status da conexão MQTT */}
          <MqttStatusBadge status={mqttStatus}/>

          {/* Badge de alarmes ativos */}
          {alarmsCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-ky-red/15 border border-ky-red/40
                            rounded-full text-[10px] text-ky-red font-bold">
              ⚠ {alarmsCount} ALARME{alarmsCount > 1 ? 'S' : ''} ATIVO{alarmsCount > 1 ? 'S' : ''}
            </div>
          )}
        </header>

        {/* ── Grid de cards ─────────────────────────────────── */}
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
                  : <VariableCard key={card.id} card={card} mqttConnected={mqttConnected}/>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
