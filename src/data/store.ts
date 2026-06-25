// src/data/store.ts — tipos compartilhados e utilitários puros (sem localStorage)
// A persistência agora é feita via API (/api/cards, /api/alarmes, etc.)

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type CardType = 'leitura' | 'comando'

export type Card = {
  id:           string
  type:         CardType
  variableName: string
  mqttTopic:    string
  unit:         string
  icon:         string
  value:        number      // campo runtime — populado pelo MQTT, não persiste no DB
  alarmMax:     number | null
  alarmMin:     number | null
  row:          number
  col:          number
  commandState?: boolean
}

export type AlarmEvent = {
  id:             string
  cardId:         string
  variableName:   string
  message:        string
  triggeredAt:    string
  acknowledgedAt: string | null
  acknowledgedBy: string | null
  status:         'ATIVO' | 'RECONHECIDO'
}

export type User = {
  id:         string
  name:       string
  email:      string
  role:       string
  tenantId:   string
  tenantName: string
}

// ── Utilitários de alarme (usados no Dashboard em tempo real) ─────────────────

export function isInAlarm(card: Card): boolean {
  if (card.type === 'comando') return false
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
