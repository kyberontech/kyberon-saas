// src/data/store.ts
// ─────────────────────────────────────────────────────────────────────────────
// DADOS SIMULADOS — versão com suporte a cards de Comando (ON/OFF)
// ─────────────────────────────────────────────────────────────────────────────

// ── Tipos ─────────────────────────────────────────────────────────────────────

// Tipo do card: 'leitura' (padrão anterior) ou 'comando' (novo ON/OFF)
export type CardType = 'leitura' | 'comando'

export type Card = {
  id: string
  type: CardType        // ← distingue leitura vs comando
  variableName: string
  mqttTopic: string     // ← tópico MQTT do CLP (broker)
  unit: string
  icon: string
  value: number
  alarmMax: number | null
  alarmMin: number | null
  row: number
  col: number
  // Campos exclusivos de cards do tipo 'comando':
  commandState?: boolean   // true = ON, false = OFF
}

export type AlarmEvent = {
  id: string
  cardId: string
  variableName: string
  message: string
  triggeredAt: string
  acknowledgedAt: string | null
  acknowledgedBy: string | null
  status: 'ATIVO' | 'RECONHECIDO'
}

export type User = {
  name: string
  email: string
}

// ── Usuário logado (simulado) ─────────────────────────────────────────────────
export const MOCK_USER: User = {
  name:  'Admin Kyberon',
  email: 'admin@kyberon.io',
}

export function getCards(): Card[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('ky_cards')
    if (!stored) return []
    const cards: Card[] = JSON.parse(stored)
    // Garante retrocompatibilidade: cards antigos sem 'type' viram 'leitura'; sem 'mqttTopic' ficam vazio
    return cards.map(c => ({ ...c, type: c.type ?? 'leitura', mqttTopic: c.mqttTopic ?? '' }))
  } catch {
    return []
  }
}

export function saveCards(cards: Card[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('ky_cards', JSON.stringify(cards))
}

// Atualiza o estado ON/OFF de um card de comando e persiste
export function toggleCommandState(cardId: string): Card[] {
  const cards = getCards()
  const updated = cards.map(c =>
    c.id === cardId && c.type === 'comando'
      ? { ...c, commandState: !c.commandState }
      : c
  )
  saveCards(updated)
  return updated
}

export function getAlarms(): AlarmEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('ky_alarms')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveAlarms(alarms: AlarmEvent[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('ky_alarms', JSON.stringify(alarms))
}

// ── Verifica se um card está em alarme ───────────────────────────────────────
export function isInAlarm(card: Card): boolean {
  if (card.type === 'comando') return false  // comandos não disparam alarme
  if (card.alarmMax !== null && card.value > card.alarmMax) return true
  if (card.alarmMin !== null && card.value < card.alarmMin) return true
  return false
}

export function alarmMessage(card: Card): string {
  if (card.alarmMax !== null && card.value > card.alarmMax)
    return `${card.variableName}: ${card.value}${card.unit} > máx ${card.alarmMax}${card.unit}`
  if (card.alarmMin !== null && card.value < card.alarmMin)
    return `${card.variableName}: ${card.value}${card.unit} < mín ${card.alarmMin}${card.unit}`
  return ''
}


//-Função para gerar alarmes
export function syncAlarmsFromCards(cards: Card[]): AlarmEvent[] {
  const existing = getAlarms()
  const now = new Date().toISOString()

  const newAlarms: AlarmEvent[] = []

  cards.forEach(card => {
    if (!isInAlarm(card)) return

    const alreadyActive = existing.find(
      a => a.cardId === card.id && a.status === 'ATIVO'
    )
    if (alreadyActive) return

    newAlarms.push({
      id: crypto.randomUUID(),
      cardId: card.id,
      variableName: card.variableName,
      message: alarmMessage(card),
      triggeredAt: now,
      acknowledgedAt: null,
      acknowledgedBy: null,
      status: 'ATIVO',
    })
  })

  const updated = [...existing, ...newAlarms]
  saveAlarms(updated)
  return updated
}
