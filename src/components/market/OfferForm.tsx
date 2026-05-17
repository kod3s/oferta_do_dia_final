import { useState } from 'react'
import type { Offer } from '../../types'
import { CATEGORIES, UNITS } from '../../types'

interface OfferFormProps {
  initial?: Partial<Offer>
  onSave: (data: Partial<Offer>) => Promise<void>
  onCancel: () => void
}

export function OfferForm({ initial, onSave, onCancel }: OfferFormProps) {
  const [form, setForm] = useState<Partial<Offer>>({
    name: '', emoji: '🏷️', category: CATEGORIES[0],
    price: 0, unit: UNITS[0], valid_until: '', note: '', stock: undefined,
    ...initial,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof Offer, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price || Number(form.price) <= 0) {
      setError('Preencha nome e preço válido.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onSave(form)
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="text-xs font-medium text-gray-500 block mb-1">Nome do produto *</label>
        <input className={inputClass} placeholder="Ex: Maçã Fuji, Leite Integral..." value={form.name} onChange={e => set('name', e.target.value)} required />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Emoji</label>
        <input className={inputClass} placeholder="🍎" value={form.emoji} onChange={e => set('emoji', e.target.value)} maxLength={2} />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Categoria *</label>
        <select className={inputClass} value={form.category} onChange={e => set('category', e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Preço (R$) *</label>
        <input className={inputClass} type="number" step="0.01" min="0" placeholder="0,00" value={form.price || ''} onChange={e => set('price', parseFloat(e.target.value))} required />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Unidade *</label>
        <select className={inputClass} value={form.unit} onChange={e => set('unit', e.target.value)}>
          {UNITS.map(u => <option key={u}>{u}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Válida até</label>
        <input className={inputClass} type="date" value={form.valid_until ?? ''} onChange={e => set('valid_until', e.target.value)} />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Estoque (opcional)</label>
        <input className={inputClass} type="number" min="0" placeholder="Deixe vazio se ilimitado" value={form.stock ?? ''} onChange={e => set('stock', e.target.value ? parseInt(e.target.value) : undefined)} />
      </div>

      <div className="col-span-2">
        <label className="text-xs font-medium text-gray-500 block mb-1">Observação (opcional)</label>
        <textarea className={inputClass} rows={2} placeholder="Ex: Válido enquanto durar o estoque..." value={form.note ?? ''} onChange={e => set('note', e.target.value)} />
      </div>

      {error && <p className="col-span-2 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="col-span-2 flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors font-medium">
          {loading ? 'Salvando...' : initial?.id ? 'Salvar alterações' : 'Publicar oferta'}
        </button>
      </div>
    </form>
  )
}
