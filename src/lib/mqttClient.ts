// ═══════════════════════════════════════════════════════════════════
//  src/lib/mqttClient.ts
//  ─────────────────────────────────────────────────────────────────
//  Hook React  →  useMqtt()
//
//  Responsabilidades:
//   1. Conectar ao broker com as credenciais de mqttConfig.ts
//   2. Assinar (subscribe) cada tópico cadastrado nos cards
//   3. Ao receber mensagem, atualizar o valor do card correspondente
//   4. Para cards de Comando, publicar (publish) ON/OFF quando acionado
//   5. Expor o status da conexão para exibição no Dashboard
// ═══════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useRef, useCallback, useState, type MutableRefObject } from 'react'
import mqtt, { type MqttClient, type IClientOptions } from 'mqtt'
import { Buffer } from 'buffer'

import {
  MQTT_BROKER_URL,
  MQTT_USERNAME,
  MQTT_PASSWORD,
  MQTT_CLIENT_ID,
  MQTT_RECONNECT_PERIOD,
  MQTT_CONNECT_TIMEOUT,
  MQTT_KEEPALIVE,
  MQTT_DEFAULT_QOS,
  MQTT_PUBLISH_QOS,
  MQTT_COMMAND_PAYLOAD_ON,
  MQTT_COMMAND_PAYLOAD_OFF,
  MQTT_COMMAND_PAYLOAD_FORMAT,
} from './mqttConfig'

import { type Card } from '@/data/store'
import { normalizeMqttPayload } from './mqttPayload'

// ── Tipos exportados ──────────────────────────────────────────────

/** Status da conexão MQTT — usado no componente de status visual */
export type MqttStatus =
  | 'disconnected'   // nunca conectou ou foi desconectado
  | 'connecting'     // tentativa em andamento
  | 'connected'      // conectado e pronto
  | 'reconnecting'   // perdeu conexão, tentando reconectar
  | 'error'          // erro de conexão

/** Retorno do hook useMqtt */
export interface UseMqttReturn {
  status: MqttStatus
  /** Publica o estado ON/OFF de um card de Comando no seu tópico */
  publishCommand: (card: Card, nextState: boolean) => void
  /** Publica um valor numérico de um card de Escrita Valor no seu tópico */
  publishValue: (card: Card, value: number) => void
}

// ── Hook principal ────────────────────────────────────────────────

/**
 * useMqtt(cards, onValueReceived)
 *
 * @param cards            - lista de cards cadastrados (com mqttTopic)
 * @param onValueReceived  - callback chamado quando um valor chega:
 *                           (cardId, rawValue) → o Dashboard atualiza o card
 */
export function useMqtt(
  cards: Card[],
  onValueReceived: (cardId: string, rawValue: string) => void
): UseMqttReturn {

  const clientRef  = useRef<MqttClient | null>(null)
  const [status, setStatus] = useState<MqttStatus>('disconnected')

  // Tópicos atualmente assinados — usado para reassinar só o que mudou
  // (evita reenviar SUBSCRIBE de tudo a cada mensagem MQTT recebida, o que
  // fazia o broker reenviar mensagens retidas e "piscar" cards de leitura)
  const subscribedTopicsRef = useRef<Set<string>>(new Set())

  // Mantemos a referência do callback atualizada sem recriar o efeito
  const callbackRef = useRef(onValueReceived)
  useEffect(() => { callbackRef.current = onValueReceived }, [onValueReceived])

  // Mantemos a lista de cards atualizada para o handler de mensagem
  const cardsRef = useRef(cards)
  useEffect(() => { cardsRef.current = cards }, [cards])

  // ── Conectar ao broker ─────────────────────────────────────────
  useEffect(() => {
    // Só roda no browser (Next.js SSR guard)
    if (typeof window === 'undefined') return

    const options: IClientOptions = {
      clientId:        MQTT_CLIENT_ID,
      username:        MQTT_USERNAME,
      password:        MQTT_PASSWORD,
      reconnectPeriod: MQTT_RECONNECT_PERIOD,
      connectTimeout:  MQTT_CONNECT_TIMEOUT,
      keepalive:       MQTT_KEEPALIVE,
      clean:           true,
    }

    setStatus('connecting')
    const client = mqtt.connect(MQTT_BROKER_URL, options)
    clientRef.current = client

    // ── Eventos do cliente ─────────────────────────────────────

    client.on('connect', () => {
      console.log('[MQTT] Conectado ao broker:', MQTT_BROKER_URL)
      setStatus('connected')

      // Assina os tópicos com mqttTopic preenchido
      syncSubscriptions(client, cardsRef.current, subscribedTopicsRef)
    })

    client.on('reconnect', () => {
      console.log('[MQTT] Reconectando...')
      setStatus('reconnecting')
    })

    client.on('disconnect', () => {
      console.log('[MQTT] Desconectado')
      setStatus('disconnected')
    })

    client.on('offline', () => {
      console.log('[MQTT] Offline')
      setStatus('disconnected')
    })

    client.on('error', (err) => {
      console.error('[MQTT] Erro:', err.message)
      setStatus('error')
    })

    // ── Recebimento de mensagens ───────────────────────────────
    client.on('message', (topic: string, payload: Buffer) => {
      const rawValue = normalizeMqttPayload(payload)

      // Encontra o card cujo tópico bate com o tópico recebido
      const card = cardsRef.current.find(c => c.mqttTopic === topic)
      if (!card) return

      console.log(`[MQTT] ${topic} → "${rawValue}" (card: ${card.variableName})`)
      callbackRef.current(card.id, rawValue)
    })

    // ── Cleanup: desconecta ao desmontar ──────────────────────
    return () => {
      console.log('[MQTT] Encerrando conexão')
      client.end(true)
      clientRef.current = null
      subscribedTopicsRef.current = new Set()
      setStatus('disconnected')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Conecta uma única vez; os cards são lidos via ref

  // ── Re-assina quando a lista de cards muda ─────────────────────
  // Só assina tópicos novos e cancela os removidos (diff), em vez de
  // reassinar tudo — reassinar um tópico já ativo faz o broker reenviar
  // sua última mensagem retida, o que zerava cards de Leitura Estado
  // logo após um comando bem-sucedido.
  useEffect(() => {
    const client = clientRef.current
    if (!client || status !== 'connected') return

    syncSubscriptions(client, cards, subscribedTopicsRef)
  }, [cards, status])

  // ── Publicar comando ON/OFF ────────────────────────────────────
  const publishCommand = useCallback((card: Card, nextState: boolean) => {
    const client = clientRef.current
    if (!client || !client.connected) {
      console.warn('[MQTT] Não conectado — publish ignorado')
      return
    }
    if (!card.mqttTopic) {
      console.warn('[MQTT] Card sem tópico MQTT configurado:', card.variableName)
      return
    }

    // 'binary' → 1 byte cru (0x01/0x00), formato esperado por blocos MQTT nativos
    // de CLP (ex: MQTT_SUBS_BOOL). 'text' → string ASCII configurável em mqttConfig.ts.
    const payload = MQTT_COMMAND_PAYLOAD_FORMAT === 'binary'
      ? Buffer.from([nextState ? 1 : 0])
      : (nextState ? MQTT_COMMAND_PAYLOAD_ON : MQTT_COMMAND_PAYLOAD_OFF)
    client.publish(card.mqttTopic, payload, { qos: MQTT_PUBLISH_QOS }, (err) => {
      if (err) {
        console.error('[MQTT] Erro ao publicar:', err.message)
      } else {
        console.log(`[MQTT] Publicado → ${card.mqttTopic}: "${nextState ? 1 : 0}" (${MQTT_COMMAND_PAYLOAD_FORMAT})`)
      }
    })
  }, [])

  // ── Publicar valor numérico (Escrita Valor) ─────────────────────
  const publishValue = useCallback((card: Card, value: number) => {
    const client = clientRef.current
    if (!client || !client.connected) {
      console.warn('[MQTT] Não conectado — publish ignorado')
      return
    }
    if (!card.mqttTopic) {
      console.warn('[MQTT] Card sem tópico MQTT configurado:', card.variableName)
      return
    }

    const payload = String(value)
    client.publish(card.mqttTopic, payload, { qos: MQTT_PUBLISH_QOS }, (err) => {
      if (err) {
        console.error('[MQTT] Erro ao publicar:', err.message)
      } else {
        console.log(`[MQTT] Publicado → ${card.mqttTopic}: "${payload}"`)
      }
    })
  }, [])

  return { status, publishCommand, publishValue }
}

// ── Utilitário interno ────────────────────────────────────────────

/** Assina tópicos novos e cancela os que saíram da lista de cards (diff) */
function syncSubscriptions(
  client: MqttClient,
  cards: Card[],
  subscribedTopicsRef: MutableRefObject<Set<string>>
) {
  const nextTopics = new Set(
    cards.map(c => c.mqttTopic?.trim()).filter((t): t is string => !!t)
  )
  const prevTopics = subscribedTopicsRef.current

  nextTopics.forEach(topic => {
    if (prevTopics.has(topic)) return
    client.subscribe(topic, { qos: MQTT_DEFAULT_QOS }, (err) => {
      if (err) {
        console.error(`[MQTT] Erro ao assinar tópico "${topic}":`, err.message)
      } else {
        console.log(`[MQTT] Assinado: ${topic}`)
      }
    })
  })

  prevTopics.forEach(topic => {
    if (nextTopics.has(topic)) return
    client.unsubscribe(topic)
    console.log(`[MQTT] Cancelado: ${topic}`)
  })

  subscribedTopicsRef.current = nextTopics
}
