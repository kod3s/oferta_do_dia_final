import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import type { Market, Offer } from '../../types'
import { CATEGORIES, UNITS } from '../../types'
import {
  Store, Tag, RefreshCw, Plus, Trash2, Edit2,
  X, Check, ImageIcon, ChevronDown, ChevronUp
} from 'lucide-react'

type Tab = 'offers' | 'markets'

// ── Mini componentes ──────────────────────────────────────────

function ImgPreview({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  const [err, setErr] = useState(false)
  if (src && !err)
    return <img src={src} alt={name} className={className} onError={() => setErr(true)} />
  return (
    <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
      <ImageIcon size={16} className="text-gray-300" />
    </div>
  )
}

// ── Formulário de Mercado ─────────────────────────────────────

function MarketForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Market>
  onSave: (data: Partial<Market>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<Partial<Market>>({
    name: '', city: '', phone: '', description: '', logo_url: '', active: true,
    ...initial,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const f = (k: keyof Market, v: any) => setForm(p => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name?.trim()) { setError('Nome obrigatório.'); return }
    setLoading(true)
    setError('')
    try { await onSave(form) } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400'

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">Nome *</label>
          <input className={inp} value={form.name ?? ''} onChange={e => f('name', e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Cidade</label>
          <input className={inp} value={form.city ?? ''} onChange={e => f('city', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Telefone</label>
          <input className={inp} value={form.phone ?? ''} onChange={e => f('phone', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">Logo (URL da imagem)</label>
          <input className={inp} type="url" placeholder="https://..." value={form.logo_url ?? ''} onChange={e => f('logo_url', e.target.value)} />
          {form.logo_url && (
            <img src={form.logo_url} alt="preview" className="w-12 h-12 rounded-xl mt-2 object-cover border border-gray-100"
              onError={e => (e.currentTarget.style.display = 'none')} />
          )}
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">Descrição</label>
          <textarea className={inp} rows={2} value={form.description ?? ''} onChange={e => f('description', e.target.value)} />
        </div>
      </div>
      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50">
          {loading ? 'Salvando...' : initial?.id ? 'Salvar' : 'Criar mercado'}
        </button>
      </div>
    </form>
  )
}

// ── Formulário de Oferta ──────────────────────────────────────

function OfferForm({
  initial,
  markets,
  onSave,
  onCancel,
}: {
  initial?: Partial<Offer>
  markets: Market[]
  onSave: (data: Partial<Offer>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<Partial<Offer>>({
    name: '', image_url: '', category: CATEGORIES[0],
    price: 0, unit: UNITS[0], note: '', valid_until: '',
    market_id: markets[0]?.id ?? '', active: true,
    ...initial,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const f = (k: keyof Offer, v: any) => setForm(p => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name?.trim()) { setError('Nome obrigatório.'); return }
    if (!form.price || Number(form.price) <= 0) { setError('Preço inválido.'); return }
    if (!form.market_id) { setError('Selecione o mercado.'); return }
    setLoading(true)
    setError('')
    try { await onSave(form) } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400'

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">Mercado *</label>
          <select className={inp} value={form.market_id ?? ''} onChange={e => f('market_id', e.target.value)} required>
            <option value="">Selecione...</option>
            {markets.filter(m => m.active).map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">Nome do produto *</label>
          <input className={inp} placeholder="Ex: Maçã Fuji, Leite Integral..." value={form.name ?? ''} onChange={e => f('name', e.target.value)} required />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">Imagem (URL)</label>
          <input className={inp} type="url" placeholder="https://..." value={form.image_url ?? ''} onChange={e => f('image_url', e.target.value)} />
          {form.image_url && (
            <img src={form.image_url} alt="preview" className="w-20 h-20 rounded-xl mt-2 object-cover border border-gray-100"
              onError={e => (e.currentTarget.style.display = 'none')} />
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Categoria *</label>
          <select className={inp} value={form.category ?? ''} onChange={e => f('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Unidade *</label>
          <select className={inp} value={form.unit ?? ''} onChange={e => f('unit', e.target.value)}>
            {UNITS.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Preço (R$) *</label>
          <input className={inp} type="number" step="0.01" min="0.01" placeholder="0,00"
            value={form.price || ''} onChange={e => f('price', parseFloat(e.target.value))} required />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Válida até</label>
          <input className={inp} type="date" value={form.valid_until ?? ''} onChange={e => f('valid_until', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">Observação</label>
          <textarea className={inp} rows={2} placeholder="Ex: Válido enquanto durar o estoque..."
            value={form.note ?? ''} onChange={e => f('note', e.target.value)} />
        </div>
      </div>
      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50">
          {loading ? 'Salvando...' : initial?.id ? 'Salvar' : 'Publicar oferta'}
        </button>
      </div>
    </form>
  )
}

// ── AdminPanel principal ──────────────────────────────────────

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>('offers')
  const [markets, setMarkets] = useState<Market[]>([])
  const [offers, setOffers] = useState<(Offer & { markets?: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [showMarketForm, setShowMarketForm] = useState(false)
  const [editingMarket, setEditingMarket] = useState<Market | null>(null)
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const [{ data: m }, { data: o }] = await Promise.all([
      supabase.from('markets').select('*').order('name'),
      supabase.from('offers').select('*, markets(id, name, logo_url)')
        .or('valid_until.is.null,valid_until.gte.' + today)
        .order('created_at', { ascending: false }),
    ])
    setMarkets((m || []) as Market[])
    setOffers((o || []) as any[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ── Mercados CRUD ──

  async function saveMarket(data: Partial<Market>) {
    if (editingMarket) {
      const { error } = await supabase.from('markets').update(data).eq('id', editingMarket.id)
      if (error) throw error
      setMarkets(m => m.map(mk => mk.id === editingMarket.id ? { ...mk, ...data } : mk))
      flash('Mercado atualizado!')
    } else {
      const { data: created, error } = await supabase.from('markets')
        .insert({ ...data, active: true }).select().single()
      if (error) throw error
      setMarkets(m => [...m, created as Market])
      flash('Mercado criado!')
    }
    setShowMarketForm(false)
    setEditingMarket(null)
  }

  async function deleteMarket(id: string) {
    if (!confirm('Excluir este mercado e todas as ofertas?')) return
    await supabase.from('markets').delete().eq('id', id)
    setMarkets(m => m.filter(mk => mk.id !== id))
    setOffers(o => o.filter(of => of.market_id !== id))
    flash('Mercado excluído.')
  }

  async function toggleMarketActive(market: Market) {
    await supabase.from('markets').update({ active: !market.active }).eq('id', market.id)
    setMarkets(m => m.map(mk => mk.id === market.id ? { ...mk, active: !mk.active } : mk))
  }

  // ── Ofertas CRUD ──

  async function saveOffer(data: Partial<Offer>) {
    if (editingOffer) {
      const { error } = await supabase.from('offers').update(data).eq('id', editingOffer.id)
      if (error) throw error
      // Recarrega para pegar dados do mercado atualizados
      await load()
      flash('Oferta atualizada!')
    } else {
      const { error } = await supabase.from('offers').insert({ ...data, active: true })
      if (error) throw error
      await load()
      flash('Oferta publicada!')
    }
    setShowOfferForm(false)
    setEditingOffer(null)
  }

  async function deleteOffer(id: string) {
    if (!confirm('Excluir esta oferta?')) return
    await supabase.from('offers').delete().eq('id', id)
    setOffers(o => o.filter(of => of.id !== id))
    flash('Oferta excluída.')
  }

  async function toggleOfferActive(offer: Offer) {
    await supabase.from('offers').update({ active: !offer.active }).eq('id', offer.id)
    setOffers(o => o.map(of => of.id === offer.id ? { ...of, active: !of.active } : of))
  }

  // ── Render ──

  const activeOffers = offers.filter(o => o.active)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {msg && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-500 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          {msg}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Painel Admin</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeOffers.length} ofertas ativas · {markets.filter(m => m.active).length} mercados ativos
            </p>
          </div>
          <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {([
            { key: 'offers', label: 'Ofertas', icon: <Tag size={14} />, count: activeOffers.length },
            { key: 'markets', label: 'Mercados', icon: <Store size={14} />, count: markets.length },
          ] as { key: Tab; label: string; icon: React.ReactNode; count: number }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {t.icon} {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Carregando...</div>
        ) : (
          <>
            {/* ── OFERTAS ── */}
            {tab === 'offers' && (
              <div className="space-y-3">
                {/* Form nova oferta */}
                {showOfferForm ? (
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-900">{editingOffer ? 'Editar oferta' : 'Nova oferta'}</h2>
                      <button onClick={() => { setShowOfferForm(false); setEditingOffer(null) }}><X size={16} className="text-gray-400" /></button>
                    </div>
                    <OfferForm
                      initial={editingOffer ?? undefined}
                      markets={markets}
                      onSave={saveOffer}
                      onCancel={() => { setShowOfferForm(false); setEditingOffer(null) }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingOffer(null); setShowOfferForm(true) }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Publicar nova oferta
                  </button>
                )}

                {/* Lista de ofertas */}
                {offers.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">Nenhuma oferta publicada.</p>
                ) : (
                  offers.map(offer => {
                    const expired = offer.valid_until && offer.valid_until < today
                    const mkt = offer.markets as any
                    return (
                      <div key={offer.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden ${!offer.active ? 'opacity-60' : ''}`}>
                        <div className="flex gap-3 p-4">
                          {/* Imagem */}
                          <ImgPreview src={offer.image_url} name={offer.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">{offer.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <ImgPreview src={mkt?.logo_url} name={mkt?.name || ''} className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                                  <p className="text-xs text-gray-500 truncate">{mkt?.name || '—'}</p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-emerald-600 text-sm">
                                  R$ {Number(offer.price).toFixed(2)}<span className="text-xs text-gray-400 font-normal">/{offer.unit}</span>
                                </p>
                                {expired ? (
                                  <span className="text-xs text-red-400">Expirada</span>
                                ) : offer.valid_until ? (
                                  <span className="text-xs text-gray-400">até {new Date(offer.valid_until + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                ) : null}
                              </div>
                            </div>

                            {offer.note && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{offer.note}</p>}

                            {/* Ações */}
                            <div className="flex items-center gap-2 mt-2.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${offer.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                {offer.active ? 'Ativa' : 'Inativa'}
                              </span>
                              <span className="text-xs text-gray-300">·</span>
                              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{offer.category}</span>

                              <div className="ml-auto flex items-center gap-1">
                                <button
                                  onClick={() => toggleOfferActive(offer)}
                                  className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title={offer.active ? 'Desativar' : 'Ativar'}
                                >
                                  <Check size={13} />
                                </button>
                                <button
                                  onClick={() => { setEditingOffer(offer); setShowOfferForm(true) }}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => deleteOffer(offer.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* ── MERCADOS ── */}
            {tab === 'markets' && (
              <div className="space-y-3">
                {/* Form novo mercado */}
                {showMarketForm ? (
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-900">{editingMarket ? 'Editar mercado' : 'Novo mercado'}</h2>
                      <button onClick={() => { setShowMarketForm(false); setEditingMarket(null) }}><X size={16} className="text-gray-400" /></button>
                    </div>
                    <MarketForm
                      initial={editingMarket ?? undefined}
                      onSave={saveMarket}
                      onCancel={() => { setShowMarketForm(false); setEditingMarket(null) }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingMarket(null); setShowMarketForm(true) }}
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2 border border-gray-200"
                  >
                    <Plus size={16} /> Cadastrar novo mercado
                  </button>
                )}

                {/* Lista de mercados */}
                {markets.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">Nenhum mercado cadastrado.</p>
                ) : (
                  markets.map(market => {
                    const marketOffers = offers.filter(o => o.market_id === market.id)
                    const isExpanded = expandedMarket === market.id
                    return (
                      <div key={market.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 p-4">
                          <ImgPreview src={market.logo_url} name={market.name}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-900 text-sm">{market.name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${market.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                {market.active ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            {market.city && <p className="text-xs text-gray-400 mt-0.5">{market.city}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">{marketOffers.length} oferta{marketOffers.length !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => toggleMarketActive(market)}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title={market.active ? 'Desativar' : 'Ativar'}>
                              <Check size={13} />
                            </button>
                            <button onClick={() => { setEditingMarket(market); setShowMarketForm(true) }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => deleteMarket(market.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={13} />
                            </button>
                            <button onClick={() => setExpandedMarket(isExpanded ? null : market.id)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Ofertas do mercado expandidas */}
                        {isExpanded && (
                          <div className="border-t border-gray-50 px-4 pb-3">
                            {marketOffers.length === 0 ? (
                              <p className="text-xs text-gray-400 py-3 text-center">Nenhuma oferta ativa.</p>
                            ) : (
                              <div className="space-y-2 mt-3">
                                {marketOffers.map(o => (
                                  <div key={o.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                                    <ImgPreview src={o.image_url} name={o.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                                    <span className="text-xs text-gray-700 flex-1 truncate">{o.name}</span>
                                    <span className="text-xs font-semibold text-emerald-600 flex-shrink-0">R$ {Number(o.price).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
