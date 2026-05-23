// src/data/store.ts
// ─────────────────────────────────────────────────────────────────────────────
// DADOS SIMULADOS — versão inicial (sem banco de dados)
//
// Por enquanto, tudo fica em memória e no localStorage do navegador.
// Quando você estiver pronto para evoluir, substitua estas funções por
// chamadas à sua API (ex: fetch('/api/cards')) e banco de dados real.
// ─────────────────────────────────────────────────────────────────────────────

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type Card = {
  id: string
  variableName: string   // Nome da variável  (ex: "Temperatura Entrada")
  unit: string           // Unidade           (ex: "°C")
  icon: string           // Nome do ícone Lucide (ex: "thermometer")
  value: number          // Valor atual
  alarmMax: number | null  // Alarma se MAIOR que este valor (null = desabilitado)
  alarmMin: number | null  // Alarma se MENOR que este valor (null = desabilitado)
  row: number            // Linha no grid (usado em Configurações)
  col: number            // Coluna no grid
}

export type AlarmEvent = {
  id: string
  cardId: string
  variableName: string
  message: string
  triggeredAt: string       // ISO date string
  acknowledgedAt: string | null
  acknowledgedBy: string | null
  status: 'ATIVO' | 'RECONHECIDO'
}

export type User = {
  name: string
  email: string
}

// ── Usuário logado (simulado) ─────────────────────────────────────────────────
// Futuramente: substituir por NextAuth session
export const MOCK_USER: User = {
  name:  'Admin Kyberon',
  email: 'admin@kyberon.io',
}

export function getCards(): Card[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('ky_cards')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  } 
}


export function saveCards(cards: Card[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('ky_cards', JSON.stringify(cards))
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
