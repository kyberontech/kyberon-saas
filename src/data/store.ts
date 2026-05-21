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

// ── Cards padrão (criados na tela de Configurações) ───────────────────────────

export const DEFAULT_CARDS: Card[] = [
  {
    id: 'card-1',
    variableName: 'PH-1',
    unit: ' ',
    icon: 'activity',
    value: 78.4,
    alarmMax: 75,
    alarmMin: null,
    row: 1, col: 1,
  },
  {
    id: 'card-2',
    variableName: 'Condutividade-1',
    unit: 'S/m',
    icon: 'activity',
    value: 3.8,
    alarmMax: 6,
    alarmMin: 1.5,
    row: 1, col: 2,
  },
  {
    id: 'card-3',
    variableName: 'TDS-1',
    unit: 'mg/L',
    icon: 'droplets',
    value: 62.1,
    alarmMax: 90,
    alarmMin: 10,
    row: 1, col: 3,
  },
  {
    id: 'card-4',
    variableName: 'Temperatura-1',
    unit: '°C',
    icon: 'thermometer',
    value: 14.7,
    alarmMax: 20,
    alarmMin: null,
    row: 1, col: 4,
  },
  {
    id: 'card-5',
    variableName: 'Tensão Rede',
    unit: 'V',
    icon: 'activity',
    value: 219.8,
    alarmMax: 240,
    alarmMin: 210,
    row: 2, col: 1,
  },
  {
    id: 'card-6',
    variableName: 'Potência Ativa',
    unit: 'kW',
    icon: 'cpu',
    value: 45.6,
    alarmMax: 100,
    alarmMin: null,
    row: 2, col: 2,
  },
]


// ── Alarmes simulados ─────────────────────────────────────────────────────────
export const DEFAULT_ALARMS: AlarmEvent[] = [
  {
    id: 'alm-1',
    cardId: 'card-1',
    variableName: 'PH-1',
    message: 'PH acima do limite máximo (78.4°C > 75°C)',
    triggeredAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    acknowledgedAt: null,
    acknowledgedBy: null,
    status: 'ATIVO',
  },
  {
    id: 'alm-2',
    cardId: 'card-2',
    variableName: 'Condutividade-1',
    message: 'Condutividade abaixo do limite mínimo (1.2 S/m < 1.5 S/m)',
    triggeredAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    acknowledgedBy: 'Admin Kyberon',
    status: 'RECONHECIDO',
  },
]

// ── Helpers: lê/salva no localStorage ────────────────────────────────────────
// Futuramente: substituir por chamadas fetch() para sua API

export function getCards(): Card[] {
  if (typeof window === 'undefined') return DEFAULT_CARDS
  try {
    const stored = localStorage.getItem('ky_cards')
    return stored ? JSON.parse(stored) : DEFAULT_CARDS
  } catch {
    return DEFAULT_CARDS
  }
}

export function saveCards(cards: Card[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('ky_cards', JSON.stringify(cards))
}

export function getAlarms(): AlarmEvent[] {
  if (typeof window === 'undefined') return DEFAULT_ALARMS
  try {
    const stored = localStorage.getItem('ky_alarms')
    return stored ? JSON.parse(stored) : DEFAULT_ALARMS
  } catch {
    return DEFAULT_ALARMS
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
