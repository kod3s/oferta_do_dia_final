import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import type { Market, Offer } from '../../types'
import { CATEGORIES, UNITS } from '../../types'
import {
  Store, Tag, RefreshCw, Plus, Trash2, Edit2,
  X, Check, ImageIcon, ChevronDown, ChevronUp,
  Clock, Eye, Heart, Share2, TrendingUp, BarChart2
} from 'lucide-react'

type Tab = 'offers' | 'markets' | 'metrics'

function nowBrasilia(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
}

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function brasiliaToISO(local: string): string {
  const [datePart, timePart] = local.split('T')
  const [y, mo, d] = datePart.split('-').map(Number)
  const [h, mi] = timePart.split(':').map(Number)
  return new Date(Date.UTC(y, mo-1, d, h+3, mi)).toISOString()
}

function statusLabel(publishedAt: string): { label: string; color: string } {
  const pub = new Date(publishedAt)
  const now = nowBrasilia()
  const expires = new Date(pub.getTime() + 24 * 60 * 60 * 1000)
  if (now < pub) return { label: 'Agendada', color: 'bg-blue-100 text-blue-700' }
  if (now > expires) return { label: 'Expirada', color: 'bg-gray-100 text-gray-500' }
  const diff = expires.getTime() - now.getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return { label: `${h}h ${m}m restantes`, color: 'bg-emerald-100 text-emerald-700' }
}

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

// ── Métricas por mercado ──────────────────────────────────────

interface MarketMetrics {
  market: Market
  totalViews: number
  totalShares: number
  totalOffers: number
  offers: {
    id: string
    name: string
    image_url?: string | null
    price: number
    unit: string
    views: number
    shares: number
    published_at: string
  }[]
}

function MetricsPanel({ markets }: { markets: Market[] }) {
  const [data, setData] = useState<MarketMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [period, setPeriod] = useState<7 | 14 | 30>(7)

  async function load() {
    setLoading(true)
    const since = new Date(nowBrasilia().getTime() - period * 24 * 60 * 60 * 1000).toISOString()

    // Busca todas as ofertas do período com views e shares
    const { data: offersData } = await supabase
      .from('offers')
      .select('id, name, image_url, price, unit, market_id, published_at')
      .gte('published_at', since)
      .order('published_at', { ascending: false })

    const { data: viewsData } = await supabase
      .from('offer_views')
      .select('offer_id')
      .gte('viewed_at', since)

    const { data: sharesData } = await supabase
      .from('whatsapp_shares')
      .select('offer_id, quantity')
      .gte('shared_at', since)

    const offersList = offersData || []
    const viewsList = viewsData || []
    const sharesList = sharesData || []

    // Conta views e shares por oferta
    const viewsCount: Record<string, number> = {}
    viewsList.forEach((v: any) => {
      viewsCount[v.offer_id] = (viewsCount[v.offer_id] || 0) + 1
    })

    const sharesCount: Record<string, number> = {}
    sharesList.forEach((s: any) => {
      sharesCount[s.offer_id] = (sharesCount[s.offer_id] || 0) + (s.quantity || 1)
    })

    // Agrupa por mercado
    const metricsMap: Record<string, MarketMetrics> = {}

    markets.forEach(m => {
      metricsMap[m.id] = {
        market: m,
        totalViews: 0,
        totalShares: 0,
        totalOffers: 0,
        offers: [],
      }
    })

    offersList.forEach((o: any) => {
      if (!metricsMap[o.market_id]) return
      const views = viewsCount[o.id] || 0
      const shares = sharesCount[o.id] || 0
      metricsMap[o.market_id].totalViews += views
      metricsMap[o.market_id].totalShares += shares
      metricsMap[o.market_id].totalOffers += 1
      metricsMap[o.market_id].offers.push({
        id: o.id,
        name: o.name,
        image_url: o.image_url,
        price: o.price,
        unit: o.unit,
        views,
        shares,
        published_at: o.published_at,
      })
    })

    setData(Object.values(metricsMap).filter(m => m.totalOffers > 0))
    setLoading(false)
  }

  useEffect(() => { load() }, [period, markets])

  const totalViews = data.reduce((a, m) => a + m.totalViews, 0)
  const totalShares = data.reduce((a, m) => a + m.totalShares, 0)

  return (
    <div className="space-y-4">
      {/* Cabeçalho com período */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Métricas de desempenho</h2>
          <p className="text-xs text-gray-400 mt-0.5">Dados para apresentar aos mercados</p>
        </div>
        <div className="flex gap-1">
          {([7, 14, 30] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${period === p ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Totais gerais */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <Eye size={18} className="text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-gray-400">visualizações</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <Share2 size={18} className="text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{totalShares.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-gray-400">compartilhamentos</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <Store size={18} className="text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{data.length}</p>
          <p className="text-xs text-gray-400">mercados ativos</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Carregando métricas...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Nenhum dado no período selecionado.</div>
      ) : (
        <div className="space-y-3">
          {data
            .sort((a, b) => b.totalViews - a.totalViews)
            .map(m => {
              const isExpanded = expanded === m.market.id
              return (
                <div key={m.market.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Header do mercado */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : m.market.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <ImgPreview src={m.market.logo_url} name={m.market.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{m.market.name}</p>
                      {m.market.city && <p className="text-xs text-gray-400">{m.market.city}</p>}
                    </div>
                    {/* Métricas resumidas */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-900">{m.totalViews}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-0.5"><Eye size={9} /> views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-900">{m.totalShares}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-0.5"><Share2 size={9} /> lista</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-900">{m.totalOffers}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-0.5"><Tag size={9} /> ofertas</p>
                      </div>
                      {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                  </button>

                  {/* Detalhes expandidos */}
                  {isExpanded && (
                    <div className="border-t border-gray-50 px-4 pb-4">
                      {/* Card de relatório — para mostrar ao mercado */}
                      <div className="bg-emerald-50 rounded-xl p-3 my-3">
                        <p className="text-xs font-semibold text-emerald-800 mb-1">📊 Relatório para o mercado</p>
                        <p className="text-xs text-emerald-700 leading-relaxed">
                          Nos últimos <strong>{period} dias</strong>, as ofertas de <strong>{m.market.name}</strong> foram visualizadas <strong>{m.totalViews} vezes</strong> e adicionadas à lista de compras por <strong>{m.totalShares} pessoas</strong>.
                        </p>
                      </div>

                      {/* Lista de ofertas com métricas */}
                      <div className="space-y-2">
                        {m.offers
                          .sort((a, b) => b.views - a.views)
                          .map(o => (
                            <div key={o.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                              <ImgPreview src={o.image_url} name={o.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{o.name}</p>
                                <p className="text-xs text-gray-400">
                                  R$ {Number(o.price).toFixed(2)}/{o.unit} ·{' '}
                                  {new Date(o.published_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' })}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Eye size={11} className="text-emerald-500" />
                                  <span className="font-semibold">{o.views}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Share2 size={11} className="text-green-500" />
                                  <span className="font-semibold">{o.shares}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

// ── Formulário de Mercado ─────────────────────────────────────

function MarketForm({ initial, onSave, onCancel }: {
  initial?: Partial<Market>
  onSave: (data: Partial<Market>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<Partial<Market>>({ name: '', city: '', phone: '', description: '', logo_url: '', active: true, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const f = (k: keyof Market, v: any) => setForm(p => ({ ...p, [k]: v }))
  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name?.trim()) { setError('Nome obrigatório.'); return }
    setLoading(true); setError('')
    try { await onSave(form) } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

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
          <label className="text-xs font-medium text-gray-500 block mb-1">Logo (URL)</label>
          <input className={inp} type="url" placeholder="https://..." value={form.logo_url ?? ''} onChange={e => f('logo_url', e.target.value)} />
          {form.logo_url && <img src={form.logo_url} alt="preview" className="w-12 h-12 rounded-xl mt-2 object-cover border border-gray-100" onError={e => (e.currentTarget.style.display='none')} />}
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

function OfferForm({ initial, markets, onSave, onCancel }: {
  initial?: Partial<Offer>
  markets: Market[]
  onSave: (data: Partial<Offer>) => Promise<void>
  onCancel: () => void
}) {
  const defaultDate = () => {
    const d = nowBrasilia()
    d.setDate(d.getDate() + 1)
    d.setHours(6, 0, 0, 0)
    return toDatetimeLocal(d)
  }

  const [form, setForm] = useState<Partial<Offer>>({
    name: '', image_url: '', category: CATEGORIES[0],
    price: 0, unit: UNITS[0], note: '',
    market_id: markets[0]?.id ?? '', active: true,
    ...initial,
  })
  const [publishedLocal, setPublishedLocal] = useState<string>(
    initial?.published_at
      ? toDatetimeLocal(new Date(new Date(initial.published_at).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })))
      : defaultDate()
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const f = (k: keyof Offer, v: any) => setForm(p => ({ ...p, [k]: v }))
  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name?.trim()) { setError('Nome obrigatório.'); return }
    if (!form.price || Number(form.price) <= 0) { setError('Preço inválido.'); return }
    if (!form.market_id) { setError('Selecione o mercado.'); return }
    if (!publishedLocal) { setError('Defina a data/hora de publicação.'); return }
    setLoading(true); setError('')
    try {
      await onSave({ ...form, published_at: brasiliaToISO(publishedLocal) })
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">Mercado *</label>
          <select className={inp} value={form.market_id ?? ''} onChange={e => f('market_id', e.target.value)} required>
            <option value="">Selecione...</option>
            {markets.filter(m => m.active).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">Nome do produto *</label>
          <input className={inp} placeholder="Ex: Maçã Fuji, Leite Integral..." value={form.name ?? ''} onChange={e => f('name', e.target.value)} required />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-500 block mb-1">Imagem (URL)</label>
          <input className={inp} type="url" placeholder="https://..." value={form.image_url ?? ''} onChange={e => f('image_url', e.target.value)} />
          {form.image_url && <img src={form.image_url} alt="preview" className="w-20 h-20 rounded-xl mt-2 object-cover border border-gray-100" onError={e => (e.currentTarget.style.display='none')} />}
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
          <label className="text-xs font-medium text-gray-500 block mb-1 flex items-center gap-1">
            <Clock size={11} /> Publicar em (Brasília) *
          </label>
          <input className={inp} type="datetime-local" value={publishedLocal} onChange={e => setPublishedLocal(e.target.value)} required />
          <p className="text-xs text-gray-400 mt-1">Expira automaticamente em 24h</p>
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
          {loading ? 'Salvando...' : initial?.id ? 'Salvar' : 'Agendar oferta'}
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
    const since = new Date(nowBrasilia().getTime() - 48 * 60 * 60 * 1000).toISOString()
    const [{ data: m }, { data: o }] = await Promise.all([
      supabase.from('markets').select('*').order('name'),
      supabase.from('offers').select('*, markets(id, name, logo_url)')
        .gte('published_at', since)
        .order('published_at', { ascending: false }),
    ])
    setMarkets((m || []) as Market[])
    setOffers((o || []) as any[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function saveMarket(data: Partial<Market>) {
    if (editingMarket) {
      const { error } = await supabase.from('markets').update(data).eq('id', editingMarket.id)
      if (error) throw error
      setMarkets(m => m.map(mk => mk.id === editingMarket.id ? { ...mk, ...data } : mk))
      flash('Mercado atualizado!')
    } else {
      const { data: created, error } = await supabase.from('markets').insert({ ...data, active: true }).select().single()
      if (error) throw error
      setMarkets(m => [...m, created as Market])
      flash('Mercado criado!')
    }
    setShowMarketForm(false); setEditingMarket(null)
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

  async function saveOffer(data: Partial<Offer>) {
    if (editingOffer) {
      const { markets: _m, ...cleanData } = data as any
      const { error } = await supabase.from('offers').update(cleanData).eq('id', editingOffer.id)
      if (error) throw error
      await load(); flash('Oferta atualizada!')
    } else {
     const { markets: _, ...cleanData } = data as any
     const { error } = await supabase.from('offers').update(cleanData).eq('id', editingOffer.id)
    }
    setShowOfferForm(false); setEditingOffer(null)
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

  const now = nowBrasilia()
  const scheduled = offers.filter(o => o.published_at && new Date(o.published_at) > now)
  const active = offers.filter(o => {
    if (!o.published_at) return false
    const pub = new Date(o.published_at)
    const exp = new Date(pub.getTime() + 24 * 60 * 60 * 1000)
    return pub <= now && now < exp
  })
  const expired = offers.filter(o => {
    if (!o.published_at) return false
    const exp = new Date(new Date(o.published_at).getTime() + 24 * 60 * 60 * 1000)
    return now >= exp
  })

  function renderOffer(offer: Offer & { markets?: any }) {
    const mkt = offer.markets as any
    const status = offer.published_at ? statusLabel(offer.published_at) : { label: 'Sem data', color: 'bg-gray-100 text-gray-400' }
    return (
      <div key={offer.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden ${!offer.active ? 'opacity-60' : ''}`}>
        <div className="flex gap-3 p-4">
          <ImgPreview src={offer.image_url} name={offer.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{offer.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ImgPreview src={mkt?.logo_url} name={mkt?.name || ''} className="w-4 h-4 rounded-full object-cover" />
                  <p className="text-xs text-gray-500 truncate">{mkt?.name || '—'}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-emerald-600 text-sm">
                  R$ {Number(offer.price).toFixed(2)}<span className="text-xs text-gray-400 font-normal">/{offer.unit}</span>
                </p>
              </div>
            </div>
            {offer.published_at && (
              <div className="flex items-center gap-1 mt-1">
                <Clock size={10} className="text-gray-400" />
                <span className="text-xs text-gray-400">
                  {new Date(offer.published_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => toggleOfferActive(offer)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                  <Check size={13} />
                </button>
                <button onClick={() => { setEditingOffer(offer); setShowOfferForm(true) }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => deleteOffer(offer.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {msg && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-500 text-white text-sm px-4 py-2 rounded-xl shadow-lg">{msg}</div>
      )}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Painel Admin</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {active.length} ativas · {scheduled.length} agendadas · {markets.filter(m => m.active).length} mercados
            </p>
          </div>
          <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {([
            { key: 'offers', label: 'Ofertas', icon: <Tag size={14} />, count: active.length + scheduled.length },
            { key: 'markets', label: 'Mercados', icon: <Store size={14} />, count: markets.length },
            { key: 'metrics', label: 'Métricas', icon: <BarChart2 size={14} />, count: null },
          ] as { key: Tab; label: string; icon: React.ReactNode; count: number | null }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}>
              {t.icon} {t.label}
              {t.count !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20' : 'bg-gray-100'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Carregando...</div>
        ) : (
          <>
            {/* OFERTAS */}
            {tab === 'offers' && (
              <div className="space-y-4">
                {showOfferForm ? (
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-900">{editingOffer ? 'Editar oferta' : 'Agendar oferta'}</h2>
                      <button onClick={() => { setShowOfferForm(false); setEditingOffer(null) }}><X size={16} className="text-gray-400" /></button>
                    </div>
                    <OfferForm initial={editingOffer ?? undefined} markets={markets}
                      onSave={saveOffer} onCancel={() => { setShowOfferForm(false); setEditingOffer(null) }} />
                  </div>
                ) : (
                  <button onClick={() => { setEditingOffer(null); setShowOfferForm(true) }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2">
                    <Plus size={16} /> Agendar nova oferta
                  </button>
                )}

                {scheduled.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2 px-1">⏰ Agendadas ({scheduled.length})</p>
                    <div className="space-y-2">{scheduled.map(renderOffer)}</div>
                  </div>
                )}
                {active.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 px-1">🟢 Ativas agora ({active.length})</p>
                    <div className="space-y-2">{active.map(renderOffer)}</div>
                  </div>
                )}
                {expired.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Expiradas recentes</p>
                    <div className="space-y-2 opacity-60">{expired.map(renderOffer)}</div>
                  </div>
                )}
                {offers.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Nenhuma oferta. Agende a primeira!</p>}
              </div>
            )}

            {/* MERCADOS */}
            {tab === 'markets' && (
              <div className="space-y-3">
                {showMarketForm ? (
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-900">{editingMarket ? 'Editar mercado' : 'Novo mercado'}</h2>
                      <button onClick={() => { setShowMarketForm(false); setEditingMarket(null) }}><X size={16} className="text-gray-400" /></button>
                    </div>
                    <MarketForm initial={editingMarket ?? undefined} onSave={saveMarket}
                      onCancel={() => { setShowMarketForm(false); setEditingMarket(null) }} />
                  </div>
                ) : (
                  <button onClick={() => { setEditingMarket(null); setShowMarketForm(true) }}
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2 border border-gray-200">
                    <Plus size={16} /> Cadastrar novo mercado
                  </button>
                )}

                {markets.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">Nenhum mercado cadastrado.</p>
                ) : markets.map(market => {
                  const marketOffers = active.filter(o => o.market_id === market.id)
                  const isExpanded = expandedMarket === market.id
                  return (
                    <div key={market.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 p-4">
                        <ImgPreview src={market.logo_url} name={market.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 text-sm">{market.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${market.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                              {market.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          {market.city && <p className="text-xs text-gray-400 mt-0.5">{market.city}</p>}
                          <p className="text-xs text-gray-400 mt-0.5">{marketOffers.length} oferta{marketOffers.length !== 1 ? 's' : ''} ativa{marketOffers.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => toggleMarketActive(market)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Check size={13} /></button>
                          <button onClick={() => { setEditingMarket(market); setShowMarketForm(true) }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={13} /></button>
                          <button onClick={() => deleteMarket(market.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                          <button onClick={() => setExpandedMarket(isExpanded ? null : market.id)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>
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
                                  <span className="text-xs font-semibold text-emerald-600">R$ {Number(o.price).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* MÉTRICAS */}
            {tab === 'metrics' && <MetricsPanel markets={markets} />}
          </>
        )}
      </div>
    </div>
  )
}
