'use client'
// src/lib/CardsMqttContext.tsx — mantém os cards e a conexão MQTT vivos no
// nível do layout raiz, para não desconectar/reconectar (e perder os
// valores lidos) toda vez que o usuário navega para fora e volta ao
// /dashboard. Monta a conexão apenas com sessão autenticada.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { parseBooleanState, type Card } from '@/data/store'
import { useMqtt, type MqttStatus } from './mqttClient'

interface CardsMqttContextValue {
  cards:            Card[]
  mqttStatus:       MqttStatus
  publishCommand:   (card: Card, nextState: boolean) => void
  publishValue:     (card: Card, value: number) => void
  handleToggle:     (cardId: string) => void
  handleWriteValue: (cardId: string, value: number) => void
  /** Recarrega os cards do tenant via API (ex: após salvar em Configurações) */
  refetchCards:     () => void
}

const noop = () => {}
const DISCONNECTED_VALUE: CardsMqttContextValue = {
  cards: [], mqttStatus: 'disconnected',
  publishCommand: noop, publishValue: noop, handleToggle: noop, handleWriteValue: noop, refetchCards: noop,
}

const CardsMqttContext = createContext<CardsMqttContextValue>(DISCONNECTED_VALUE)

export function useCardsMqtt(): CardsMqttContextValue {
  return useContext(CardsMqttContext)
}

function ConnectedCardsProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards] = useState<Card[]>([])
  const cardsRef = useRef<Card[]>([])
  useEffect(() => { cardsRef.current = cards }, [cards])

  const fetchCards = useCallback(() => {
    fetch('/api/cards')
      .then(r => r.ok ? r.json() : [])
      .then(data => setCards(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [])

  useEffect(() => { fetchCards() }, [fetchCards])

  const handleMqttMessage = useCallback((cardId: string, rawValue: string) => {
    const card = cardsRef.current.find(c => c.id === cardId)
    if (!card) return

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

  return (
    <CardsMqttContext.Provider
      value={{ cards, mqttStatus, publishCommand, publishValue, handleToggle, handleWriteValue, refetchCards: fetchCards }}
    >
      {children}
    </CardsMqttContext.Provider>
  )
}

export function CardsMqttProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()

  // Sem sessão autenticada: não conecta ao broker, apenas expõe valores neutros
  if (status !== 'authenticated') {
    return <CardsMqttContext.Provider value={DISCONNECTED_VALUE}>{children}</CardsMqttContext.Provider>
  }

  return <ConnectedCardsProvider>{children}</ConnectedCardsProvider>
}
