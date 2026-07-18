'use client'
// src/app/dashboard/page.tsx — dashboard principal com MQTT e cards por tenant
import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Sidebar from '@/components/Sidebar'
import {
  Thermometer, Gauge, Droplets, Zap, Activity,
  Cpu, Power, PowerOff, Wind, Sun, Waves, Wifi, WifiOff, RefreshCw, AlertTriangle, PenLine,
} from 'lucide-react'
import { isInAlarm, alarmMessage, parseBooleanState, type Card } from '@/data/store'
import { useMqtt, type MqttStatus } from '@/lib/mqttClient'

const ICON_MAP: Record<string, React.ElementType> = {
  thermometer: Thermometer, gauge: Gauge, droplets: Droplets,
  zap: Zap, activity: Activity, cpu: Cpu, power: Power,
  wind: Wind, sun: Sun, waves: Waves, estado: Power, escrita: PenLine,
}

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
  const Icon = status === 'disconnected' ? WifiOff : status === 'error' ? AlertTriangle : status === 'connected' ? Wifi : RefreshCw
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold tracking-wider ${borderColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'animate-dot-pulse' : status !== 'disconnected' ? 'animate-pulse' : ''}`} style={{ backgroundColor: dotColor }}/>
      <Icon size={10} className={spinning ? 'animate-spin' : ''}/>
      {label}
    </div>
  )
}

function VariableCard({ card, mqttConnected }: { card: Card; mqttConnected: boolean }) {
  const alarm = isInAlarm(card)
  const msg   = alarmMessage(card)
  const Icon  = ICON_MAP[card.icon] ?? Activity
  const [fresh, setFresh] = useState(false)
  const prevRef = useRef<number>(card.value)
  useEffect(() => {
    if (card.value !== prevRef.current) {
      prevRef.current = card.value
      setFresh(true)
      const t = setTimeout(() => setFresh(false), 800)
      return () => clearTimeout(t)
    }
  }, [card.value])
  const borderClass = alarm ? 'border-ky-red animate-alarm-blink' : fresh ? 'border-ky-green/70' : 'border-ky-border hover:border-ky-primary/30'
  return (
    <div className={`relative bg-ky-panel border rounded-xl p-3 md:p-4 overflow-hidden transition-all duration-200 ${borderClass}`}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: alarm ? '#FF3B3B' : fresh ? '#00FFB3' : 'linear-gradient(90deg,#0057FF,#00C8FF)', transition: 'background 0.4s' }}/>
      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center mb-2 md:mb-3 ${alarm ? 'bg-ky-red/15 text-ky-red' : 'bg-ky-primary/10 text-ky-primary'}`}>
        <Icon size={14}/>
      </div>
      <div className="flex items-baseline gap-1 mb-0.5">
        <span className="font-head font-bold text-xl md:text-2xl text-ky-text">{card.value}</span>
        <span className="text-[10px] md:text-xs text-ky-muted">{card.unit}</span>
      </div>
      <p className="text-[9px] md:text-[10px] text-ky-muted uppercase tracking-wider leading-tight">{card.variableName}</p>
      {card.mqttTopic && <p className="text-[8px] text-ky-muted/40 font-mono mt-0.5 truncate">⬡ {card.mqttTopic}</p>}
      {mqttConnected && !card.mqttTopic && <p className="text-[8px] text-yellow-500/70 mt-0.5">⚠ sem tópico MQTT</p>}
      {alarm && <div className="mt-1.5 text-[8px] md:text-[9px] font-bold text-ky-red tracking-wider uppercase bg-ky-red/10 border border-ky-red/30 rounded px-1.5 py-0.5">⚠ {msg}</div>}
    </div>
  )
}

function EstadoCard({ card }: { card: Card }) {
  const isOn = card.value === 1
  const Icon = isOn ? Power : PowerOff
  return (
    <div
      className={`relative bg-ky-panel border rounded-xl p-3 md:p-4 overflow-hidden transition-all duration-200
        ${isOn ? 'border-ky-green/60' : 'border-ky-red/50'}`}
      aria-label={`Estado ${card.variableName}: ${isOn ? 'ON' : 'OFF'}`}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-300" style={{ background: isOn ? '#00FFB3' : '#FF3B3B' }}/>
      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center mb-2 md:mb-3 transition-colors duration-300 ${isOn ? 'bg-ky-green/15 text-ky-green' : 'bg-ky-red/15 text-ky-red'}`}>
        <Icon size={14}/>
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-head font-bold tracking-widest border transition-all duration-300 ${isOn ? 'bg-ky-green/15 text-ky-green border-ky-green/40' : 'bg-ky-red/15 text-ky-red border-ky-red/40'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOn ? 'bg-ky-green animate-dot-pulse' : 'bg-ky-red'}`}/>
          {isOn ? 'ON' : 'OFF'}
        </span>
      </div>
      <p className="text-[9px] md:text-[10px] text-ky-muted uppercase tracking-wider leading-tight">{card.variableName}</p>
      {card.mqttTopic && <p className="text-[8px] text-ky-muted/40 font-mono mt-0.5 truncate">⬡ {card.mqttTopic}</p>}
    </div>
  )
}

function ConfirmModal({ cardName, nextState, onConfirm, onCancel }: { cardName: string; nextState: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onCancel}>
      <div className="bg-ky-panel border border-ky-border rounded-2xl p-4 md:p-6 max-w-xs w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-ky-primary/10 border border-ky-primary/30 flex items-center justify-center mx-auto mb-3 md:mb-4">
          <Power size={18} className="text-ky-primary"/>
        </div>
        <h2 className="font-head font-bold text-sm md:text-base text-ky-text text-center mb-1 tracking-wide">Confirmar Comando</h2>
        <p className="text-[10px] md:text-xs text-ky-muted text-center mb-2">Deseja executar este comando?</p>
        <div className="bg-ky-bg border border-ky-border rounded-lg px-2.5 py-1.5 text-center mb-3 md:mb-5">
          <span className="text-[9px] md:text-[10px] text-ky-muted uppercase tracking-widest block mb-0.5">{cardName}</span>
          <span className={`text-xs md:text-sm font-head font-bold tracking-widest ${nextState ? 'text-ky-green' : 'text-ky-red'}`}>
            {nextState ? '● LIGAR (ON)' : '● DESLIGAR (OFF)'}
          </span>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button onClick={onCancel} className="flex-1 px-3 py-2 text-[10px] md:text-xs font-head border border-ky-border text-ky-muted rounded-lg hover:bg-white/5 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className={`flex-1 px-3 py-2 text-[10px] md:text-xs font-head font-bold text-ky-bg rounded-lg transition-all ${nextState ? 'bg-ky-green hover:brightness-110' : 'bg-ky-red hover:brightness-110'}`}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

function CommandCard({ card, onToggle, canCommand, mqttConnected }: { card: Card; onToggle: (id: string) => void; canCommand: boolean; mqttConnected: boolean }) {
  const [showModal, setShowModal] = useState(false)
  const isOn      = card.commandState === true
  const Icon      = ICON_MAP[card.icon] ?? Power
  const clickable = canCommand && mqttConnected
  return (
    <>
      <div
        className={`relative bg-ky-panel border rounded-xl p-3 md:p-4 overflow-hidden transition-all duration-200 select-none
          ${clickable ? 'cursor-pointer' : 'cursor-default opacity-80'}
          ${isOn ? 'border-ky-green/60 hover:border-ky-green' : 'border-ky-red/50 hover:border-ky-red'}`}
        onClick={() => clickable && setShowModal(true)}
        role={clickable ? 'button' : undefined}
        aria-label={`Comando ${card.variableName}: ${isOn ? 'ON' : 'OFF'}`}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-300" style={{ background: isOn ? '#00FFB3' : '#FF3B3B' }}/>
        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center mb-2 md:mb-3 transition-colors duration-300 ${isOn ? 'bg-ky-green/15 text-ky-green' : 'bg-ky-red/15 text-ky-red'}`}>
          <Icon size={14}/>
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-head font-bold tracking-widest border transition-all duration-300 ${isOn ? 'bg-ky-green/15 text-ky-green border-ky-green/40' : 'bg-ky-red/15 text-ky-red border-ky-red/40'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOn ? 'bg-ky-green animate-dot-pulse' : 'bg-ky-red'}`}/>
            {isOn ? 'ON' : 'OFF'}
          </span>
        </div>
        <p className="text-[9px] md:text-[10px] text-ky-muted uppercase tracking-wider leading-tight">{card.variableName}</p>
        {card.mqttTopic && <p className="text-[8px] text-ky-muted/40 font-mono mt-0.5 truncate">⬡ {card.mqttTopic}</p>}
        {canCommand && (
          <p className={`text-[8px] md:text-[9px] mt-1 ${mqttConnected ? 'text-ky-muted/50' : 'text-yellow-500/70'}`}>
            {mqttConnected ? 'Clique para alterar' : '⚠ MQTT desconectado'}
          </p>
        )}
      </div>
      {showModal && (
        <ConfirmModal
          cardName={card.variableName}
          nextState={!isOn}
          onConfirm={() => { setShowModal(false); onToggle(card.id) }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  )
}

function WriteValueModal({ cardName, unit, initialValue, onConfirm, onCancel }: { cardName: string; unit: string; initialValue: number; onConfirm: (value: number) => void; onCancel: () => void }) {
  const [text, setText] = useState(String(initialValue))
  const parsed = parseFloat(text.replace(',', '.'))
  const valid  = text.trim() !== '' && Number.isFinite(parsed)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onCancel}>
      <div className="bg-ky-panel border border-ky-border rounded-2xl p-4 md:p-6 max-w-xs w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-ky-green/10 border border-ky-green/30 flex items-center justify-center mx-auto mb-3 md:mb-4">
          <PenLine size={18} className="text-ky-green"/>
        </div>
        <h2 className="font-head font-bold text-sm md:text-base text-ky-text text-center mb-1 tracking-wide">Escrever Valor</h2>
        <p className="text-[10px] md:text-xs text-ky-muted text-center mb-2">{cardName}</p>
        <div className="flex items-center gap-2 mb-3 md:mb-5">
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            className="bg-ky-bg border border-ky-border rounded-lg px-2.5 py-2 text-sm text-ky-text outline-none focus:border-ky-green/50 w-full text-center font-head font-bold"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && valid) onConfirm(parsed) }}
          />
          {unit && <span className="text-xs text-ky-muted whitespace-nowrap">{unit}</span>}
        </div>
        <div className="flex gap-2 md:gap-3">
          <button onClick={onCancel} className="flex-1 px-3 py-2 text-[10px] md:text-xs font-head border border-ky-border text-ky-muted rounded-lg hover:bg-white/5 transition-colors">Cancelar</button>
          <button onClick={() => valid && onConfirm(parsed)} disabled={!valid} className="flex-1 px-3 py-2 text-[10px] md:text-xs font-head font-bold text-ky-bg rounded-lg transition-all bg-ky-green hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none">Confirmar</button>
        </div>
      </div>
    </div>
  )
}

function WriteValueCard({ card, onWrite, canCommand, mqttConnected }: { card: Card; onWrite: (id: string, value: number) => void; canCommand: boolean; mqttConnected: boolean }) {
  const [showModal, setShowModal] = useState(false)
  const Icon      = ICON_MAP[card.icon] ?? PenLine
  const clickable = canCommand && mqttConnected
  return (
    <>
      <div
        className={`relative bg-ky-panel border rounded-xl p-3 md:p-4 overflow-hidden transition-all duration-200 select-none border-ky-border
          ${clickable ? 'cursor-pointer hover:border-ky-green/40' : 'cursor-default opacity-80'}`}
        onClick={() => clickable && setShowModal(true)}
        role={clickable ? 'button' : undefined}
        aria-label={`Escrita ${card.variableName}: ${card.writeValue ?? 0}`}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#00FFB3,#00C8FF)' }}/>
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center mb-2 md:mb-3 bg-ky-green/15 text-ky-green">
          <Icon size={14}/>
        </div>
        <div className="flex items-baseline gap-1 mb-0.5">
          <span className="font-head font-bold text-xl md:text-2xl text-ky-text">{card.writeValue ?? 0}</span>
          <span className="text-[10px] md:text-xs text-ky-muted">{card.unit}</span>
        </div>
        <p className="text-[9px] md:text-[10px] text-ky-muted uppercase tracking-wider leading-tight">{card.variableName}</p>
        {card.mqttTopic && <p className="text-[8px] text-ky-muted/40 font-mono mt-0.5 truncate">⬡ {card.mqttTopic}</p>}
        {canCommand && (
          <p className={`text-[8px] md:text-[9px] mt-1 ${mqttConnected ? 'text-ky-muted/50' : 'text-yellow-500/70'}`}>
            {mqttConnected ? 'Clique para escrever' : '⚠ MQTT desconectado'}
          </p>
        )}
      </div>
      {showModal && (
        <WriteValueModal
          cardName={card.variableName}
          unit={card.unit}
          initialValue={card.writeValue ?? 0}
          onConfirm={(value) => { setShowModal(false); onWrite(card.id, value) }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [cards, setCards]   = useState<Card[]>([])
  const sentAlarms = useRef<Set<string>>(new Set())
  const cardsRef   = useRef<Card[]>([])
  useEffect(() => { cardsRef.current = cards }, [cards])

  const role       = session?.user?.role ?? 'USUARIO'
  const canCommand = role === 'ADMINISTRADOR' || role === 'SUPERVISOR'

  // Carrega cards do tenant via API
  useEffect(() => {
    fetch('/api/cards')
      .then(r => r.ok ? r.json() : [])
      .then(data => setCards(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [])

  // Sincroniza alarmes com a API (fire-and-forget ao detectar alarme ativo)
  useEffect(() => {
    cards.forEach(card => {
      if (isInAlarm(card) && !sentAlarms.current.has(card.id)) {
        sentAlarms.current.add(card.id)
        fetch('/api/alarmes', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            cardId:       card.id,
            variableName: card.variableName,
            message:      alarmMessage(card),
          }),
        }).catch(console.error)
      }
      if (!isInAlarm(card)) sentAlarms.current.delete(card.id)
    })
  }, [cards])

  const handleMqttMessage = useCallback((cardId: string, rawValue: string) => {
    const card = cardsRef.current.find(c => c.id === cardId)
    if (!card) return

    // Cards de Leitura Estado (ON/OFF) tratam o payload como booleano (1=Ligado/0=Desligado),
    // aceitando também "true/false" e "on/off" — os demais tipos leem o número cru.
    // O histórico (tabela Reading) é gravado pelo worker server-side (mqttServerWorker.ts),
    // não aqui — evita duplicar leituras quando há múltiplas abas/usuários com o dashboard aberto.
    const isEstado = card.type === 'leitura_estado'
    const parsed   = parseFloat(rawValue)
    const value    = isEstado ? parseBooleanState(rawValue) : (isNaN(parsed) ? 0 : parsed)

    setCards(prev => prev.map(c => c.id === cardId ? { ...c, value } : c))
  }, [])

  const { status: mqttStatus, publishCommand, publishValue } = useMqtt(cards, handleMqttMessage)

  const handleToggle = useCallback((cardId: string) => {
    setCards(prev => {
      const card = prev.find(c => c.id === cardId)
      if (!card) return prev
      const nextState = !card.commandState
      publishCommand(card, nextState)
      fetch(`/api/cards/${cardId}/command`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ commandState: nextState }),
      }).catch(console.error)
      return prev.map(c => c.id === cardId ? { ...c, commandState: nextState } : c)
    })
  }, [publishCommand])

  const handleWriteValue = useCallback((cardId: string, value: number) => {
    setCards(prev => {
      const card = prev.find(c => c.id === cardId)
      if (!card) return prev
      publishValue(card, value)
      fetch(`/api/cards/${cardId}/write`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ writeValue: value }),
      }).catch(console.error)
      return prev.map(c => c.id === cardId ? { ...c, writeValue: value } : c)
    })
  }, [publishValue])

  const alarmsCount   = cards.filter(isInAlarm).length
  const mqttConnected = mqttStatus === 'connected'

  return (
    <div className="flex h-screen overflow-hidden bg-ky-bg">
      <Sidebar/>
      <main className="flex-1 overflow-y-auto pt-[52px] md:pt-0">
        <header className="sticky top-0 z-10 bg-ky-panel/90 backdrop-blur border-b border-ky-border px-4 md:px-6 py-3 flex items-center gap-2 md:gap-3 flex-wrap">
          <h1 className="font-head font-bold text-base tracking-[2px] text-ky-primary uppercase">Dashboard</h1>
          <div className="flex-1"/>
          <MqttStatusBadge status={mqttStatus}/>
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
              {canCommand && <p className="text-xs mt-1">Acesse <strong className="text-ky-primary">Configurações</strong> para adicionar variáveis.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
              {cards.map(card =>
                card.type === 'comando'
                  ? <CommandCard key={card.id} card={card} onToggle={handleToggle} canCommand={canCommand} mqttConnected={mqttConnected}/>
                  : card.type === 'leitura_estado'
                  ? <EstadoCard key={card.id} card={card}/>
                  : card.type === 'escrita_valor'
                  ? <WriteValueCard key={card.id} card={card} onWrite={handleWriteValue} canCommand={canCommand} mqttConnected={mqttConnected}/>
                  : <VariableCard key={card.id} card={card} mqttConnected={mqttConnected}/>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
