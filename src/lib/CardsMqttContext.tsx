'use client'
// src/lib/CardsMqttContext.tsx — mantém os cards e a conexão MQTT vivos no
// nível do layout raiz, para não desconectar/reconectar (e perder os
// valores lidos) toda vez que o usuário navega para fora e volta ao
// /dashboard.
//
// Importante: este provider é SEMPRE montado com a mesma árvore/hooks,
// independente do status da sessão — nunca troca de tipo de componente
// (ex: renderizar <ConnectedCardsProvider> só quando autenticado), porque
// isso desmonta e remonta `children` (o app inteiro) toda vez que o status
// da sessão muda, o que já causou "Rendered more hooks than during the
// previous render" (React #310) quando o useSession() oscilava durante o
// carregamento. Em vez disso, o componente decide internamente (com base
// em `authenticated`) se busca os cards e assina tópicos de verdade.
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
const CardsMqttContext = createContext<CardsMqttContextValue>({
  cards: [], mqttStatus: 'disconnected',
  publishCommand: noop, publishValue: noop, handleToggle: noop, handleWriteValue: noop, refetchCards: noop,
})

export function useCardsMqtt(): CardsMqttContextValue {
  return useContext(CardsMqttContext)
}

export function CardsMqttProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const authenticated = status === 'authenticated'

  const [cards, setCards] = useState<Card[]>([])
  const cardsRef = useRef<Card[]>([])
  useEffect(() => { cardsRef.current = cards }, [cards])

  const fetchCards = useCallback(() => {
    fetch('/api/cards')
      .then(r => r.ok ? r.json() : [])
      .then(data => setCards(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (authenticated) fetchCards()
    else setCards([])
  }, [authenticated, fetchCards])

  const handleMqttMessage = useCallback((cardId: string, rawValue: string) => {
    const card = cardsRef.current.find(c => c.id === cardId)
    if (!card) return

    const isEstado = card.type === 'leitura_estado'
    const parsed   = parseFloat(rawValue)
    const value    = isEstado ? parseBooleanState(rawValue) : (isNaN(parsed) ? 0 : parsed)

    setCards(prev => prev.map(c => c.id === cardId ? { ...c, value } : c))
  }, [])

  // Passa cards vazio quando não autenticado: o hook continua montado (nenhuma
  // troca de árvore), mas não há tópico nenhum para assinar de verdade.
  const { status: mqttStatus, publishCommand, publishValue } = useMqtt(
    authenticated ? cards : [],
    handleMqttMessage
  )

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
      value={{ cards: authenticated ? cards : [], mqttStatus, publishCommand, publishValue, handleToggle, handleWriteValue, refetchCards: fetchCards }}
    >
      {children}
    </CardsMqttContext.Provider>
  )
}
