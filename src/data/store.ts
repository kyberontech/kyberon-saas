// src/data/store.ts — tipos compartilhados e utilitários puros (sem localStorage)
// A persistência agora é feita via API (/api/cards, /api/alarmes, etc.)

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type CardType = 'leitura' | 'comando' | 'leitura_estado' | 'escrita_valor'

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
  writeValue?:   number
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

// ── Interpretação de estado booleano (cards Leitura Estado ON/OFF) ────────────
// Aceita não só "1"/"0" mas variações comuns que um CLP pode publicar
// (true/false, on/off, ligado/desligado) para não depender do payload exato.
export function parseBooleanState(raw: string): 0 | 1 {
  const s = raw.trim().toLowerCase()
  if (s === '1' || s === 'true' || s === 'on' || s === 'ligado')  return 1
  if (s === '0' || s === 'false' || s === 'off' || s === 'desligado') return 0
  const n = parseFloat(raw)
  return !isNaN(n) && n !== 0 ? 1 : 0
}

// ── Utilitários de alarme (usados no Dashboard em tempo real) ─────────────────

export function isInAlarm(card: Card): boolean {
  if (card.type === 'comando' || card.type === 'leitura_estado' || card.type === 'escrita_valor') return false
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
