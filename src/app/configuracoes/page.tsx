'use client'
// src/app/configuracoes/page.tsx — gestão de cards do tenant (admin/supervisor)
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Sidebar from '@/components/Sidebar'
import { Settings, Plus, Trash2, Save } from 'lucide-react'
import { type Card, type CardType } from '@/data/store'

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
    mqttTopic: '',
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

const inputCls = `bg-ky-bg border border-ky-border rounded-md px-2 py-1.5 text-xs text-ky-text outline-none focus:border-ky-primary/50 w-full`

function TypeBadge({ type }: { type: CardType }) {
  return type === 'comando' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-head font-bold tracking-widest bg-ky-green/10 text-ky-green border border-ky-green/30">⚡ COMANDO</span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-head font-bold tracking-widest bg-ky-primary/10 text-ky-primary border border-ky-primary/30">📊 LEITURA</span>
  )
}

function CardMobile({ card, onChange, onDelete }: { card: Card; onChange: (c: Card) => void; onDelete: () => void }) {
  function set<K extends keyof Card>(field: K, value: Card[K]) { onChange({ ...card, [field]: value }) }
  const isComando = card.type === 'comando'
  return (
    <div className="bg-ky-panel border border-ky-border rounded-xl p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <TypeBadge type={card.type}/>
        <button onClick={onDelete} className="text-ky-muted hover:text-ky-red transition-colors p-1"><Trash2 size={13}/></button>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-ky-muted uppercase tracking-widest">Tipo</label>
        <select className={inputCls} value={card.type} onChange={e => set('type', e.target.value as CardType)}>
          <option value="leitura">📊 Leitura</option>
          <option value="comando">⚡ Comando (ON/OFF)</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-ky-muted uppercase tracking-widest">Nome da Variável</label>
        <input className={inputCls} placeholder={isComando ? 'Ex: Bomba Principal' : 'Ex: Temperatura'} value={card.variableName} onChange={e => set('variableName', e.target.value)}/>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-ky-muted uppercase tracking-widest flex items-center gap-1"><span className="text-ky-primary">⬡</span> Tópico MQTT</label>
        <input className={inputCls} placeholder="Ex: planta/sensor1/temperatura" value={card.mqttTopic} onChange={e => set('mqttTopic', e.target.value)}/>
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
      {!isComando && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-ky-muted uppercase tracking-widest">Alarme Máx</label>
            <input type="number" className={inputCls} placeholder="—" value={card.alarmMax ?? ''} onChange={e => set('alarmMax', e.target.value === '' ? null : +e.target.value)}/>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-ky-muted uppercase tracking-widest">Alarme Mín</label>
            <input type="number" className={inputCls} placeholder="—" value={card.alarmMin ?? ''} onChange={e => set('alarmMin', e.target.value === '' ? null : +e.target.value)}/>
          </div>
        </div>
      )}
      {isComando && <div className="bg-ky-green/5 border border-ky-green/20 rounded-lg px-2.5 py-1.5 text-[9px] text-ky-muted leading-relaxed">Será exibido como botão <strong className="text-ky-green">ON/OFF</strong> no Dashboard.</div>}
    </div>
  )
}

function CardRow({ card, onChange, onDelete }: { card: Card; onChange: (c: Card) => void; onDelete: () => void }) {
  function set<K extends keyof Card>(field: K, value: Card[K]) { onChange({ ...card, [field]: value }) }
  const isComando = card.type === 'comando'
  return (
    <tr className="border-b border-ky-border/30 hover:bg-white/[0.02] transition-colors">
      <td className="px-3 py-2.5 w-52">
        <select className={inputCls} value={card.type} onChange={e => set('type', e.target.value as CardType)}>
          <option value="leitura">📊 Leitura</option>
          <option value="comando">⚡ Comando (ON/OFF)</option>
        </select>
      </td>
      <td className="px-3 py-2.5">
        <input className={inputCls} placeholder={isComando ? 'Ex: Bomba Principal' : 'Ex: Temperatura Entrada'} value={card.variableName} onChange={e => set('variableName', e.target.value)}/>
      </td>
      <td className="px-3 py-2.5">
        <input className={inputCls} placeholder="Ex: planta/sensor1/temp" value={card.mqttTopic} onChange={e => set('mqttTopic', e.target.value)}/>
      </td>
      <td className="px-3 py-2.5 w-24">
        <input className={`${inputCls} ${isComando ? 'opacity-30 cursor-not-allowed' : ''}`} placeholder="°C" value={isComando ? '—' : card.unit} disabled={isComando} onChange={e => set('unit', e.target.value)}/>
      </td>
      <td className="px-3 py-2.5 w-44">
        <select className={inputCls} value={card.icon} onChange={e => set('icon', e.target.value)}>
          {ICONES_DISPONIVEIS.map(ic => <option key={ic.value} value={ic.value}>{ic.label}</option>)}
        </select>
      </td>
      <td className="px-3 py-2.5 w-28">
        <input type="number" className={`${inputCls} ${isComando ? 'opacity-30 cursor-not-allowed' : ''}`} placeholder="—" value={isComando ? '' : (card.alarmMax ?? '')} disabled={isComando} onChange={e => set('alarmMax', e.target.value === '' ? null : +e.target.value)}/>
      </td>
      <td className="px-3 py-2.5 w-28">
        <input type="number" className={`${inputCls} ${isComando ? 'opacity-30 cursor-not-allowed' : ''}`} placeholder="—" value={isComando ? '' : (card.alarmMin ?? '')} disabled={isComando} onChange={e => set('alarmMin', e.target.value === '' ? null : +e.target.value)}/>
      </td>
      <td className="px-3 py-2.5 w-12 text-center">
        <button onClick={onDelete} className="text-ky-muted hover:text-ky-red transition-colors p-1 rounded"><Trash2 size={13}/></button>
      </td>
    </tr>
  )
}

export default function ConfiguracoesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [cards, setCards] = useState<Card[]>([])
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const role = session?.user?.role ?? ''
  const canEdit = role === 'ADMINISTRADOR' || role === 'SUPERVISOR'

  useEffect(() => {
    if (!canEdit && session) { router.push('/dashboard'); return }
    fetch('/api/cards')
      .then(r => r.ok ? r.json() : [])
      .then(data => setCards(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [session, canEdit, router])

  function updateCard(updated: Card) { setCards(prev => prev.map(c => c.id === updated.id ? updated : c)); setSaved(false) }
  function deleteCard(id: string) { if (!confirm('Excluir este card?')) return; setCards(prev => prev.filter(c => c.id !== id)); setSaved(false) }
  function addCard() { setCards(prev => [...prev, newCard()]); setSaved(false) }

  async function handleSave() {
    if (cards.find(c => !c.variableName.trim())) { alert('Preencha o nome de todas as variáveis antes de salvar.'); return }
    if (cards.find(c => !c.mqttTopic.trim())) { alert('Preencha o Tópico MQTT de todos os cards antes de salvar.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/cards', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(cards),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('Erro ao salvar cards. Tente novamente.')
    } finally {
      setSaving(false)
    }
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
          <div className="bg-ky-primary/5 border border-ky-primary/20 rounded-xl px-3 py-2.5 text-[10px] md:text-xs text-ky-muted leading-relaxed">
            <strong className="text-ky-primary">Como usar:</strong> Adicione cards do tipo <strong className="text-ky-primary">Leitura</strong> para monitorar variáveis ou <strong className="text-ky-green">Comando (ON/OFF)</strong> para acionar equipamentos. Informe o <strong className="text-ky-primary">Tópico MQTT</strong> publicado pelo CLP. Clique em <strong className="text-ky-primary">Salvar</strong> para aplicar a todos os usuários do cliente.
          </div>
          <div className="flex gap-2">
            <button onClick={addCard} className="flex items-center justify-center gap-1 px-3 py-2 text-[10px] md:text-xs font-head border border-ky-primary/40 text-ky-primary rounded-lg hover:bg-ky-primary/10 transition-colors flex-1 sm:flex-none">
              <Plus size={12}/> Adicionar Card
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center justify-center gap-1 px-3 py-2 text-[10px] md:text-xs font-head font-bold text-ky-bg rounded-lg transition-all flex-1 sm:flex-none disabled:opacity-60" style={{ background: saved ? '#00FFB3' : 'linear-gradient(135deg,#0057FF,#00C8FF)' }}>
              <Save size={12}/> {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
            </button>
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {cards.length === 0 && <div className="text-center text-ky-muted text-sm py-10">Nenhum card cadastrado. <button onClick={addCard} className="text-ky-primary underline">Adicionar o primeiro card.</button></div>}
            {cards.map(card => <CardMobile key={card.id} card={card} onChange={updateCard} onDelete={() => deleteCard(card.id)}/>)}
          </div>
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
                  {cards.map(card => <CardRow key={card.id} card={card} onChange={updateCard} onDelete={() => deleteCard(card.id)}/>)}
                  {cards.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-ky-muted">Nenhum card cadastrado. <button onClick={addCard} className="text-ky-primary underline">Adicionar o primeiro card.</button></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
