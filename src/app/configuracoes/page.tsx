'use client'
// src/app/configuracoes/page.tsx

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { Settings, Plus, Trash2, Save } from 'lucide-react'
import { getCards, saveCards, type Card, type CardType } from '@/data/store'

const ICONES_DISPONIVEIS = [
  { value: 'thermometer', label: '🌡  Temperatura'        },
  { value: 'gauge',       label: '⏱  Pressão / Gauge'    },
  { value: 'droplets',    label: '💧 Nível / Líquido'     },
  { value: 'zap',         label: '⚡ Corrente / Energia'  },
  { value: 'activity',    label: '📈 Sinal / Atividade'   },
  { value: 'cpu',         label: '🖥  Processamento'       },
  { value: 'power',       label: '🔌 Liga / Desliga'       },
  { value: 'wind',        label: '🌬  Vento / Fluxo'       },
  { value: 'sun',         label: '☀  Irradiação'           },
  { value: 'waves',       label: '🌊 Ondas / Vibração'     },
]

function newCard(): Card {
  return {
    id: `card-${Date.now()}`,
    type: 'leitura',
    variableName: '',
    mqttTopic: '',        // ex: planta/sensor1/temperatura
    unit: '',
    icon: 'activity',
    value: 0,
    alarmMax: null,
    alarmMin: null,
    row: 1,
    col: 1,
    commandState: false,
  }
}

const inputCls = `
  bg-ky-bg border border-ky-border rounded-md px-2 py-1.5
  text-xs text-ky-text outline-none focus:border-ky-primary/50 w-full
`

// Badge visual do tipo de card
function TypeBadge({ type }: { type: CardType }) {
  return type === 'comando' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-head font-bold
                     tracking-widest bg-ky-green/10 text-ky-green border border-ky-green/30">
      ⚡ COMANDO
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-head font-bold
                     tracking-widest bg-ky-primary/10 text-ky-primary border border-ky-primary/30">
      📊 LEITURA
    </span>
  )
}

// ── Card de configuração mobile ──────────────────────────────────────────────
function CardMobile({ card, onChange, onDelete }: { card: Card; onChange: (c: Card) => void; onDelete: () => void }) {
  function set<K extends keyof Card>(field: K, value: Card[K]) { onChange({ ...card, [field]: value }) }

  const isComando = card.type === 'comando'

  return (
    <div className="bg-ky-panel border border-ky-border rounded-xl p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TypeBadge type={card.type}/>
        </div>
        <button onClick={onDelete} className="text-ky-muted hover:text-ky-red transition-colors p-1">
          <Trash2 size={13}/>
        </button>
      </div>

      {/* ── Seletor de tipo ── */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-ky-muted uppercase tracking-widest">Tipo</label>
        <select
          className={inputCls}
          value={card.type}
          onChange={e => set('type', e.target.value as CardType)}
        >
          <option value="leitura">📊 Leitura</option>
          <option value="comando">⚡ Comando (ON/OFF)</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-ky-muted uppercase tracking-widest">Nome da Variável</label>
        <input
          className={inputCls}
          placeholder={isComando ? 'Ex: Bomba Principal' : 'Ex: Temperatura'}
          value={card.variableName}
          onChange={e => set('variableName', e.target.value)}
        />
      </div>

      {/* ── Tópico MQTT ── */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-ky-muted uppercase tracking-widest flex items-center gap-1">
          <span className="text-ky-primary">⬡</span> Tópico MQTT
        </label>
        <input
          className={inputCls}
          placeholder="Ex: planta/sensor1/temperatura"
          value={card.mqttTopic}
          onChange={e => set('mqttTopic', e.target.value)}
        />
        <span className="text-[8px] text-ky-muted/60 leading-relaxed">
          Tópico publicado pelo CLP no broker. O valor recebido será exibido no card.
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {!isComando && (
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-ky-muted uppercase tracking-widest">Unidade</label>
            <input className={inputCls} placeholder="°C" value={card.unit} onChange={e => set('unit', e.target.value)}/>
          </div>
        )}
        <div className={`flex flex-col gap-1 ${isComando ? 'col-span-2' : ''}`}>
          <label className="text-[9px] text-ky-muted uppercase tracking-widest">Ícone</label>
          <select className={inputCls} value={card.icon} onChange={e => set('icon', e.target.value)}>
            {ICONES_DISPONIVEIS.map(ic => <option key={ic.value} value={ic.value}>{ic.label}</option>)}
          </select>
        </div>
      </div>

      {/* Alarmes: só para cards de leitura */}
      {!isComando && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-ky-muted uppercase tracking-widest">Alarme Máx</label>
            <input type="number" className={inputCls} placeholder="—" value={card.alarmMax ?? ''}
              onChange={e => set('alarmMax', e.target.value === '' ? null : +e.target.value)}/>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-ky-muted uppercase tracking-widest">Alarme Mín</label>
            <input type="number" className={inputCls} placeholder="—" value={card.alarmMin ?? ''}
              onChange={e => set('alarmMin', e.target.value === '' ? null : +e.target.value)}/>
          </div>
        </div>
      )}

      {/* Info visual para comando */}
      {isComando && (
        <div className="bg-ky-green/5 border border-ky-green/20 rounded-lg px-2.5 py-1.5 text-[9px] text-ky-muted leading-relaxed">
          Será exibido como botão <strong className="text-ky-green">ON/OFF</strong> no Dashboard.
        </div>
      )}
    </div>
  )
}

// ── Linha na tabela desktop ──────────────────────────────────────────────────
function CardRow({ card, onChange, onDelete }: { card: Card; onChange: (c: Card) => void; onDelete: () => void }) {
  function set<K extends keyof Card>(field: K, value: Card[K]) { onChange({ ...card, [field]: value }) }

  const isComando = card.type === 'comando'

  return (
    <tr className="border-b border-ky-border/30 hover:bg-white/[0.02] transition-colors">

      {/* Tipo */}
      <td className="px-3 py-2.5 w-52">
        <select
          className={inputCls}
          value={card.type}
          onChange={e => set('type', e.target.value as CardType)}
        >
          <option value="leitura">📊 Leitura</option>
          <option value="comando">⚡ Comando (ON/OFF)</option>
        </select>
      </td>

      {/* Nome */}
      <td className="px-3 py-2.5">
        <input
          className={inputCls}
          placeholder={isComando ? 'Ex: Bomba Principal' : 'Ex: Temperatura Entrada'}
          value={card.variableName}
          onChange={e => set('variableName', e.target.value)}
        />
      </td>

      {/* Tópico MQTT */}
      <td className="px-3 py-2.5">
        <input
          className={inputCls}
          placeholder="Ex: planta/sensor1/temp"
          value={card.mqttTopic}
          onChange={e => set('mqttTopic', e.target.value)}
        />
      </td>

      {/* Unidade: vazia e desabilitada para comandos */}
      <td className="px-3 py-2.5 w-24">
        <input
          className={`${inputCls} ${isComando ? 'opacity-30 cursor-not-allowed' : ''}`}
          placeholder="°C"
          value={isComando ? '—' : card.unit}
          disabled={isComando}
          onChange={e => set('unit', e.target.value)}
        />
      </td>

      {/* Ícone */}
      <td className="px-3 py-2.5 w-44">
        <select className={inputCls} value={card.icon} onChange={e => set('icon', e.target.value)}>
          {ICONES_DISPONIVEIS.map(ic => <option key={ic.value} value={ic.value}>{ic.label}</option>)}
        </select>
      </td>

      {/* Alarme Máx */}
      <td className="px-3 py-2.5 w-28">
        <input
          type="number"
          className={`${inputCls} ${isComando ? 'opacity-30 cursor-not-allowed' : ''}`}
          placeholder="—"
          value={isComando ? '' : (card.alarmMax ?? '')}
          disabled={isComando}
          onChange={e => set('alarmMax', e.target.value === '' ? null : +e.target.value)}
        />
      </td>

      {/* Alarme Mín */}
      <td className="px-3 py-2.5 w-28">
        <input
          type="number"
          className={`${inputCls} ${isComando ? 'opacity-30 cursor-not-allowed' : ''}`}
          placeholder="—"
          value={isComando ? '' : (card.alarmMin ?? '')}
          disabled={isComando}
          onChange={e => set('alarmMin', e.target.value === '' ? null : +e.target.value)}
        />
      </td>

      {/* Excluir */}
      <td className="px-3 py-2.5 w-12 text-center">
        <button onClick={onDelete} className="text-ky-muted hover:text-ky-red transition-colors p-1 rounded">
          <Trash2 size={13}/>
        </button>
      </td>
    </tr>
  )
}

// ── Página de Configurações ───────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => { setCards(getCards()) }, [])

  function updateCard(updated: Card) { setCards(prev => prev.map(c => c.id === updated.id ? updated : c)); setSaved(false) }
  function deleteCard(id: string) { if (!confirm('Excluir este card?')) return; setCards(prev => prev.filter(c => c.id !== id)); setSaved(false) }
  function addCard() { setCards(prev => [...prev, newCard()]); setSaved(false) }
  function handleSave() {
    if (cards.find(c => !c.variableName.trim())) { alert('Preencha o nome de todas as variáveis antes de salvar.'); return }
    if (cards.find(c => !c.mqttTopic.trim())) { alert('Preencha o Tópico MQTT de todos os cards antes de salvar.'); return }
    saveCards(cards); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-ky-bg">
      <Sidebar/>

      <main className="flex-1 overflow-y-auto pt-[52px] md:pt-0">

        <header className="sticky top-0 z-10 bg-ky-panel/90 backdrop-blur border-b border-ky-border px-4 md:px-6 py-3 flex items-center gap-2">
          <Settings size={15} className="text-ky-primary"/>
          <h1 className="font-head font-bold text-base tracking-[2px] text-ky-primary uppercase">Configurações</h1>
        </header>

        <div className="p-4 md:p-6 flex flex-col gap-4">

          {/* ── Box "Como usar" ── */}
          <div className="bg-ky-primary/5 border border-ky-primary/20 rounded-xl px-3 py-2.5 text-[10px] md:text-xs text-ky-muted leading-relaxed">
            <strong className="text-ky-primary">Como usar:</strong>{' '}
            Adicione cards do tipo <strong className="text-ky-primary">Leitura</strong> para monitorar variáveis,
            ou <strong className="text-ky-green">Comando (ON/OFF)</strong> para acionar equipamentos.
            Informe o <strong className="text-ky-primary">Tópico MQTT</strong> publicado pelo CLP no broker — o valor recebido nesse tópico será vinculado ao card automaticamente.
            Clique em <strong className="text-ky-primary">Salvar</strong> para aplicar.
          </div>

          {/* ── Botões de ação ── */}
          <div className="flex gap-2">
            <button
              onClick={addCard}
              className="flex items-center justify-center gap-1 px-3 py-2 text-[10px] md:text-xs font-head border border-ky-primary/40 text-ky-primary rounded-lg hover:bg-ky-primary/10 transition-colors flex-1 sm:flex-none"
            >
              <Plus size={12}/> Adicionar Card
            </button>
            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-1 px-3 py-2 text-[10px] md:text-xs font-head font-bold text-ky-bg rounded-lg transition-all flex-1 sm:flex-none"
              style={{ background: saved ? '#00FFB3' : 'linear-gradient(135deg,#0057FF,#00C8FF)' }}
            >
              <Save size={12}/> {saved ? 'Salvo!' : 'Salvar'}
            </button>
          </div>

          {/* ── Mobile: cards empilhados ── */}
          <div className="flex flex-col gap-3 md:hidden">
            {cards.length === 0 && (
              <div className="text-center text-ky-muted text-sm py-10">
                Nenhum card cadastrado.{' '}
                <button onClick={addCard} className="text-ky-primary underline">Adicionar o primeiro card.</button>
              </div>
            )}
            {cards.map(card => (
              <CardMobile key={card.id} card={card} onChange={updateCard} onDelete={() => deleteCard(card.id)}/>
            ))}
          </div>

          {/* ── Desktop: tabela ── */}
          <div className="hidden md:block bg-ky-panel border border-ky-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-ky-bg/50">
                    {['Tipo','Nome da Variável','Tópico MQTT','Unidade','Ícone','Alarme > (Máx)','Alarme < (Mín)',''].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-ky-primary font-head tracking-widest text-[10px] uppercase border-b border-ky-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cards.map(card => (
                    <CardRow key={card.id} card={card} onChange={updateCard} onDelete={() => deleteCard(card.id)}/>
                  ))}
                  {cards.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-ky-muted">
                      Nenhum card cadastrado.{' '}
                      <button onClick={addCard} className="text-ky-primary underline">Adicionar o primeiro card.</button>
                    </td></tr>
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
