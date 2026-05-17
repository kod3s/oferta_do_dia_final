import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { offers as offersService, savedOffers as savedService } from '../../services/supabase'
import type { Offer, SavedOffer } from '../../types'
import { CATEGORIES } from '../../types'

export function OffersPage({ setPage }: { setPage: (p: string) => void }) {
  const { profile } = useApp()
  const [offerList, setOfferList] = useState<Offer[]>([])
  const [saved, setSaved] = useState<SavedOffer[]>([])
  const [category, setCategory] = useState('Todos')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'offers' | 'list'>('offers')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    offersService.list().then(data => { setOfferList(data); setLoading(false) })
  }, [])

  useEffect(() => {
    if (profile) savedService.list(profile.id).then(setSaved)
  }, [profile])

  const savedIds = new Set(saved.map(s => s.offer_id))

  const filtered = offerList.filter(o => {
    const matchCat = category === 'Todos' || o.category === category
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.markets?.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  async function toggleSave(offerId: string) {
    if (!profile) { setPage('auth'); return }
    await savedService.toggle(offerId, profile.id)
    const updated = await savedService.list(profile.id)
    setSaved(updated)
    offersService.trackView(offerId)
  }

  async function toggleCheck(savedId: string, checked: boolean) {
    await savedService.setChecked(savedId, checked)
    setSaved(prev => prev.map(s => s.id === savedId ? { ...s, checked } : s))
  }

  async function clearList() {
    if (!profile) return
    await savedService.clear(profile.id)
    setSaved([])
  }

  const total = saved.reduce((sum, s) => sum + (s.offers?.price ?? 0), 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Tab switch */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('offers')}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${tab === 'offers' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
        >
          Ofertas do dia
        </button>
        <button
          onClick={() => setTab('list')}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors flex items-center gap-2 ${tab === 'list' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
        >
          Minha lista
          {saved.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tab === 'list' ? 'bg-white text-gray-900' : 'bg-emerald-500 text-white'}`}>
              {saved.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'offers' && (
        <>
          {/* Search */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Buscar produto ou mercado..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Category chips */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {['Todos', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${category === cat ? 'bg-emerald-100 border-emerald-400 text-emerald-800 font-medium' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg mb-3" />
                  <div className="h-3 bg-gray-100 rounded mb-2 w-3/4" />
                  <div className="h-3 bg-gray-100 rounded mb-3 w-1/2" />
                  <div className="h-5 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              <div className="text-4xl mb-3">🔍</div>
              Nenhuma oferta encontrada para essa busca.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map(offer => {
                const isSaved = savedIds.has(offer.id)
                return (
                  <div
                    key={offer.id}
                    className={`relative bg-white rounded-xl border p-4 transition-all cursor-pointer group ${isSaved ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}
                    onClick={() => toggleSave(offer.id)}
                  >
                    <button
                      className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${isSaved ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100'}`}
                      aria-label={isSaved ? 'Remover da lista' : 'Adicionar à lista'}
                    >
                      {isSaved ? '✓' : '+'}
                    </button>
                    <div className="text-3xl mb-3">{offer.emoji}</div>
                    <div className="text-xs font-medium text-gray-800 mb-1 leading-tight">{offer.name}</div>
                    <div className="text-xs text-gray-400 mb-3">{offer.markets?.name}</div>
                    <div className="text-base font-semibold text-emerald-700">
                      R$ {offer.price.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-xs text-gray-400">por {offer.unit}</div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'list' && (
        <div className="max-w-lg">
          {saved.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              <div className="text-4xl mb-3">🛒</div>
              Sua lista está vazia.<br />
              <button onClick={() => setTab('offers')} className="text-emerald-600 hover:underline mt-2 block mx-auto">
                Ver ofertas do dia
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 mb-6">
                {saved.map(s => (
                  <div key={s.id} className={`flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 ${s.checked ? 'opacity-50' : ''}`}>
                    <button
                      onClick={() => toggleCheck(s.id, !s.checked)}
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${s.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}
                    >
                      {s.checked && <span className="text-xs">✓</span>}
                    </button>
                    <span className="text-xl flex-shrink-0">{s.offers?.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{s.offers?.name}</div>
                      <div className="text-xs text-gray-400">{s.offers?.markets?.name}</div>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700 flex-shrink-0">
                      R$ {s.offers?.price.toFixed(2).replace('.', ',')}
                    </span>
                    <button onClick={() => toggleSave(s.offer_id)} className="text-gray-300 hover:text-gray-500 text-lg flex-shrink-0">×</button>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-gray-100 rounded-xl px-4 py-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">Total estimado</span>
                  <span className="text-xl font-semibold">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <button
                  onClick={() => {
                    const text = saved.map(s => `${s.offers?.emoji} ${s.offers?.name} — R$ ${s.offers?.price.toFixed(2).replace('.', ',')} (${s.offers?.markets?.name})`).join('\n')
                    window.open(`https://wa.me/?text=${encodeURIComponent('🛒 Minha lista de compras — Oferta do Dia\n\n' + text + `\n\nTotal: R$ ${total.toFixed(2).replace('.', ',')}`)}`,'_blank')
                  }}
                  className="w-full bg-emerald-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-600 transition-colors mb-2"
                >
                  📲 Compartilhar no WhatsApp
                </button>
                <button onClick={clearList} className="w-full border border-gray-200 text-gray-500 rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors">
                  Esvaziar lista
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
