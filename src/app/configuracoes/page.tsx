'use client'
// src/app/configuracoes/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// TELA DE CONFIGURAÇÕES
//
// Aqui você cria, edita e exclui os cards do Dashboard.
// Cada card representa uma variável monitorada.
// Tudo é salvo no localStorage (sem banco de dados por enquanto).
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { Settings, Plus, Trash2, Save } from 'lucide-react'
import {
  getCards, saveCards, isInAlarm,
  type Card,
} from '@/data/store'


// Ícones disponíveis para os cards
// Adicione mais nomes de ícones do Lucide conforme precisar
const ICONES_DISPONIVEIS = [
  { value: 'thermometer', label: '🌡  Temperatura' },
  { value: 'gauge',       label: '⏱  Pressão / Gauge' },
  { value: 'droplets',    label: '💧 Nível / Líquido'  },
  { value: 'zap',         label: '⚡ Corrente / Energia' },
  { value: 'activity',    label: '📈 Sinal / Atividade' },
  { value: 'cpu',         label: '🖥  Processamento'    },
  { value: 'power',       label: '🔌 Liga / Desliga'    },
  { value: 'wind',        label: '🌬  Vento / Fluxo'    },
  { value: 'sun',         label: '☀  Irradiação'        },
  { value: 'waves',       label: '🌊 Ondas / Vibração'  },
]

// Card "vazio" para criar um novo
function newCard(): Card {
  return {
    id:           `card-${Date.now()}`,
    variableName: '',
    unit:         '',
    icon:         'activity',
    value:        0,
    alarmMax:     null,
    alarmMin:     null,
    row:          1,
    col:          1,
  }
}

// ── Linha de um card na tabela de configuração ────────────────────────────────
function CardRow({
  card,
  onChange,
  onDelete,
}: {
  card: Card
  onChange: (updated: Card) => void
  onDelete: () => void
}) {
  function set<K extends keyof Card>(field: K, value: Card[K]) {
    onChange({ ...card, [field]: value })
  }

  const inputCls = `
    bg-ky-bg border border-ky-border rounded-md px-2.5 py-1.5
    text-xs text-ky-text outline-none focus:border-ky-primary/50 w-full
  `

  return (
    <tr className="border-b border-ky-border/30 hover:bg-white/[0.02] transition-colors">

      {/* Nome da Variável */}
      <td className="px-3 py-2.5">
        <input
          className={inputCls}
          placeholder="Ex: Temperatura Entrada"
          value={card.variableName}
          onChange={e => set('variableName', e.target.value)}
        />
      </td>

      {/* Unidade */}
      <td className="px-3 py-2.5 w-24">
        <input
          className={inputCls}
          placeholder="°C"
          value={card.unit}
          onChange={e => set('unit', e.target.value)}
        />
      </td>

      {/* Ícone */}
      <td className="px-3 py-2.5 w-44">
        <select
          className={inputCls}
          value={card.icon}
          onChange={e => set('icon', e.target.value)}
        >
          {ICONES_DISPONIVEIS.map(ic => (
            <option key={ic.value} value={ic.value}>{ic.label}</option>
          ))}
        </select>
      </td>

      {/* Alarme Maior que */}
      <td className="px-3 py-2.5 w-28">
        <input
          type="number"
          className={inputCls}
          placeholder="—"
          value={card.alarmMax ?? ''}
          onChange={e => set('alarmMax', e.target.value === '' ? null : +e.target.value)}
        />
      </td>

      {/* Alarme Menor que */}
      <td className="px-3 py-2.5 w-28">
        <input
          type="number"
          className={inputCls}
          placeholder="—"
          value={card.alarmMin ?? ''}
          onChange={e => set('alarmMin', e.target.value === '' ? null : +e.target.value)}
        />
      </td>


      {/* Excluir */}
      <td className="px-3 py-2.5 w-12 text-center">
        <button
          onClick={onDelete}
          title="Excluir card"
          className="text-ky-muted hover:text-ky-red transition-colors p-1 rounded"
        >
          <Trash2 size={13}/>
        </button>
      </td>
    </tr>
  )
}

// ── Página de Configurações ───────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  const [cards, setCards]   = useState<Card[]>([])
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    setCards(getCards())
  }, [])

  // Atualiza um card pelo id
  function updateCard(updated: Card) {
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSaved(false)
  }

  // Remove um card
  function deleteCard(id: string) {
    if (!confirm('Excluir este card?')) return
    setCards(prev => prev.filter(c => c.id !== id))
    setSaved(false)
  }


  // Adiciona card vazio
  function addCard() {
    setCards(prev => [...prev, newCard()])
    setSaved(false)
  }

  // Salva tudo no localStorage
  function handleSave() {
    // Validação básica
    const invalid = cards.find(c => !c.variableName.trim())
    if (invalid) {
      alert('Preencha o nome de todas as variáveis antes de salvar.')
      return
    }
    saveCards(cards)
    setSaved(true)
    // Reseta o tick de salvo após 2s
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-ky-bg">
      <Sidebar/>

      <main className="flex-1 overflow-y-auto">

        {/* Cabeçalho */}
        <header className="sticky top-0 z-10 bg-ky-panel/90 backdrop-blur border-b border-ky-border px-6 py-3 flex items-center gap-2">
          <Settings size={15} className="text-ky-primary"/>
          <h1 className="font-head font-bold text-base tracking-[2px] text-ky-primary uppercase">
            Configurações
          </h1>
          <div className="flex-1"/>
          {/* Botões de ação */}
          <button
            onClick={addCard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-head border border-ky-primary/40 text-ky-primary rounded-lg hover:bg-ky-primary/10 transition-colors"
          >
            <Plus size={12}/> Adicionar Card
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-head font-bold text-ky-bg rounded-lg transition-all"
            style={{ background: saved ? '#00FFB3' : 'linear-gradient(135deg,#0057FF,#00C8FF)' }}
          >
            <Save size={12}/>
            {saved ? 'Salvo!' : 'Salvar'}
          </button>
        </header>

        <div className="p-6">

          {/* ── Instrução ── */}
          <div className="bg-ky-primary/5 border border-ky-primary/20 rounded-xl px-5 py-4 mb-5 text-xs text-ky-muted leading-relaxed">
            <strong className="text-ky-primary">Como usar:</strong>{' '}
            Adicione cada variável que deseja monitorar no Dashboard. Preencha o nome, a unidade, escolha um ícone e defina os limites de alarme. Use <strong className="text-ky-text">Linha</strong> e <strong className="text-ky-text">Coluna</strong> para organizar a posição no grid. Clique em <strong className="text-ky-primary">Salvar</strong> para aplicar.
          </div>

          {/* ── Tabela de cards ── */}
          <div className="bg-ky-panel border border-ky-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-ky-bg/50">
                    {[
                      'Nome da Variável',
                      'Unidade',
                      'Ícone',
                      'Alarme > (Máx)',
                      'Alarme < (Mín)',                      
                      '',
                    ].map(h => (
                      <th
                        key={h}
                        className="px-3 py-3 text-left text-ky-primary font-head tracking-widest text-[10px] uppercase border-b border-ky-border"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cards.map(card => (
                    <CardRow
                      key={card.id}
                      card={card}
                      onChange={updateCard}
                      onDelete={() => deleteCard(card.id)}
                    />
                  ))}
                  {cards.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-ky-muted">
                        Nenhum card cadastrado.{' '}
                        <button onClick={addCard} className="text-ky-primary underline">
                          Adicionar o primeiro card.
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
