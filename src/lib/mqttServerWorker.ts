// src/lib/mqttServerWorker.ts — subscriber MQTT que roda no processo do servidor
// (iniciado via src/instrumentation.ts), independente de qualquer navegador aberto.
// Grava o histórico de leitura/leitura_estado direto no banco via Prisma.

import mqtt, { type MqttClient } from 'mqtt'
import { prisma } from './prisma'
import {
  MQTT_BROKER_URL,
  MQTT_USERNAME,
  MQTT_PASSWORD,
  MQTT_RECONNECT_PERIOD,
  MQTT_CONNECT_TIMEOUT,
  MQTT_KEEPALIVE,
  MQTT_DEFAULT_QOS,
} from './mqttConfig'
import { normalizeMqttPayload } from './mqttPayload'
import { parseBooleanState } from '@/data/store'

const REFRESH_MS = 30_000

type TrackedCard = { id: string; type: string; mqttTopic: string; unit: string; tenantId: string }

let client: MqttClient | null = null
let cardsByTopic = new Map<string, TrackedCard[]>()

async function loadCards(): Promise<TrackedCard[]> {
  return prisma.card.findMany({
    where: { mqttTopic: { not: '' }, type: { in: ['leitura', 'leitura_estado'] } },
    select: { id: true, type: true, mqttTopic: true, unit: true, tenantId: true },
  })
}

async function refreshSubscriptions() {
  if (!client || !client.connected) return

  const cards = await loadCards()
  const nextByTopic = new Map<string, TrackedCard[]>()
  for (const card of cards) {
    const topic = card.mqttTopic.trim()
    if (!topic) continue
    const list = nextByTopic.get(topic) ?? []
    list.push(card)
    nextByTopic.set(topic, list)
  }

  const prevTopics = new Set(cardsByTopic.keys())
  const nextTopics = new Set(nextByTopic.keys())

  for (const topic of Array.from(nextTopics)) {
    if (!prevTopics.has(topic)) {
      client.subscribe(topic, { qos: MQTT_DEFAULT_QOS }, (err) => {
        if (err) console.error(`[MQTT Worker] Erro ao assinar "${topic}":`, err.message)
        else console.log(`[MQTT Worker] Assinado: ${topic}`)
      })
    }
  }
  for (const topic of Array.from(prevTopics)) {
    if (!nextTopics.has(topic)) {
      client.unsubscribe(topic)
      console.log(`[MQTT Worker] Cancelado: ${topic}`)
    }
  }

  cardsByTopic = nextByTopic
}

async function handleMessage(topic: string, payload: Buffer) {
  const cards = cardsByTopic.get(topic)
  if (!cards || cards.length === 0) return

  const rawValue = normalizeMqttPayload(payload)

  for (const card of cards) {
    const isEstado = card.type === 'leitura_estado'
    const value    = isEstado ? parseBooleanState(rawValue) : parseFloat(rawValue)
    if (isNaN(value)) continue

    try {
      await prisma.reading.create({
        data: { cardId: card.id, value, unit: card.unit, tenantId: card.tenantId },
      })
    } catch (err) {
      console.error('[MQTT Worker] Erro ao gravar leitura:', err)
    }
  }
}

export function startMqttHistoryWorker() {
  const globalForWorker = globalThis as unknown as { mqttHistoryWorkerStarted?: boolean }
  if (globalForWorker.mqttHistoryWorkerStarted) return
  globalForWorker.mqttHistoryWorkerStarted = true

  console.log('[MQTT Worker] Iniciando subscriber de histórico (server-side)...')

  client = mqtt.connect(MQTT_BROKER_URL, {
    clientId:        `kyberon-history-${Math.random().toString(16).slice(2, 8)}`,
    username:        MQTT_USERNAME,
    password:        MQTT_PASSWORD,
    reconnectPeriod: MQTT_RECONNECT_PERIOD,
    connectTimeout:  MQTT_CONNECT_TIMEOUT,
    keepalive:       MQTT_KEEPALIVE,
    clean:           true,
  })

  client.on('connect', () => {
    console.log('[MQTT Worker] Conectado ao broker:', MQTT_BROKER_URL)
    refreshSubscriptions().catch(err => console.error('[MQTT Worker] Erro ao assinar tópicos:', err))
  })

  client.on('reconnect', () => console.log('[MQTT Worker] Reconectando...'))
  client.on('error', (err) => console.error('[MQTT Worker] Erro:', err.message))

  client.on('message', (topic, payload) => {
    handleMessage(topic, payload).catch(err => console.error('[MQTT Worker] Erro ao processar mensagem:', err))
  })

  setInterval(() => {
    refreshSubscriptions().catch(err => console.error('[MQTT Worker] Erro ao atualizar assinaturas:', err))
  }, REFRESH_MS)
}
