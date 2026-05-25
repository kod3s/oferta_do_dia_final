import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../services/supabase'
import type { Offer, Market } from '../../types'
import { Search, MapPin, Heart, Eye, Tag, ImageIcon, ShoppingCart, Instagram } from 'lucide-react'

interface OfferCard extends Offer {
  views: number
  saves: number
  market_name?: string
  market_logo?: string | null
  markets?: Pick<Market, 'name'>
}

const CATEGORIES = ['Todos', 'Hortifruti', 'Carnes', 'Laticínios', 'Bebidas', 'Mercearia', 'Limpeza', 'Higiene']

function ProductImage({ src, name }: { src?: string | null; name: string }) {
  const [error, setError] = useState(false)
  if (src && !error) {
    return (
      <img
        src={src}
        alt={name}
        className="w-full h-36 object-cover"
        onError={() => setError(true)}
      />
    )
  }
  return (
    <div className="w-full h-36 bg-gradient-to-br from-gray-100 to-gray-50 flex flex-col items-center justify-center text-gray-300">
      <ImageIcon size={28} />
      <span className="text-xs mt-1 text-gray-300">sem imagem</span>
    </div>
  )
}

function MarketLogo({ src, name }: { src?: string | null; name?: string }) {
  const [error, setError] = useState(false)
  if (src && !error) {
    return (
      <img
        src={src}
        alt={name || ''}
        className="w-5 h-5 rounded-full object-cover border border-gray-200"
        onError={() => setError(true)}
      />
    )
  }
  return <Tag size={12} className="text-gray-400" />
}

export function OffersPage() {
  const { profile } = useApp()
  const [offers, setOffers] = useState<OfferCard[]>([])
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [shoppingList, setShoppingList] = useState<OfferCard[]>([])
  const [showList, setShowList] = useState(false)

  async function loadOffers() {
    setLoading(true)
    try {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('offers')
      .select('*, markets(name, logo_url)')
      .eq('active', true)
      .or(`valid_until.is.null,valid_until.gte.${today}`)
      .order('created_at', { ascending: false })
      setOffers((data || []) as OfferCard[])
    } finally {
      setLoading(false)
    }
  }

  async function loadSaved() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('saved_offers')
      .select('offer_id')
      .eq('user_id', profile.id)
    if (data) setSaved(new Set(data.map(d => d.offer_id)))
  }

  useEffect(() => {
    loadOffers()
    loadSaved()
  }, [profile?.id])

  async function toggleSave(offerId: string) {
    if (!profile?.id) return
    if (saved.has(offerId)) {
      await supabase.from('saved_offers').delete()
        .eq('offer_id', offerId).eq('user_id', profile.id)
      setSaved(s => { const n = new Set(s); n.delete(offerId); return n })
    } else {
      await supabase.from('saved_offers').insert({ offer_id: offerId, user_id: profile.id })
      setSaved(s => new Set([...s, offerId]))
    }
  }

  async function recordView(offerId: string) {
    await supabase.from('offer_views').insert({ offer_id: offerId })
  }

  function toggleCart(offer: OfferCard) {
    setShoppingList(list => {
      const exists = list.find(o => o.id === offer.id)
      if (exists) return list.filter(o => o.id !== offer.id)
      return [...list, offer]
    })
  }

  const filtered = offers.filter(o => {
    const matchSearch = !search ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.market_name || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'Todos' || (o.category || '') === category
    return matchSearch && matchCat
  })

  const totalList = shoppingList.reduce((a, o) => a + Number(o.price), 0)

  if (showList) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-6">
          <button onClick={() => setShowList(false)} className="text-sm text-gray-500 mb-4 flex items-center gap-1">
            ← Voltar
          </button>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Minha lista de compras</h2>
          {shoppingList.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">Nenhum item na lista.</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {shoppingList.map(o => (
                  <div key={o.id} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{o.name}</p>
                      <p className="text-xs text-gray-500">{o.market_name}</p>
                    </div>
                    <p className="font-bold text-emerald-600 text-sm">R$ {Number(o.price).toFixed(2)}</p>
                    <button onClick={() => toggleCart(o)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                ))}
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600">Total estimado</p>
                <p className="text-2xl font-bold text-emerald-600">R$ {totalList.toFixed(2)}</p>
              </div>
              <button
                onClick={() => {
                  const text = shoppingList.map(o => `• ${o.name} — R$ ${Number(o.price).toFixed(2)} (${o.market_name})`).join('\n')
                  window.open(`https://wa.me/?text=${encodeURIComponent(`Minha lista de compras:\n${text}\n\nTotal: R$ ${totalList.toFixed(2)}\n\nOfertas via ofertasdodia.vercel.app`)}`)
                }}
                className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Compartilhar no WhatsApp
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto ou mercado..."
            className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Shopping list FAB */}
        {shoppingList.length > 0 && (
          <button
            onClick={() => setShowList(true)}
            className="fixed bottom-6 right-4 bg-emerald-500 text-white rounded-full px-4 py-3 shadow-lg flex items-center gap-2 text-sm font-semibold z-50"
          >
            <ShoppingCart size={16} />
            {shoppingList.length} {shoppingList.length === 1 ? 'item' : 'itens'}
          </button>
        )}

        {/* Offers grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Carregando ofertas...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <Tag size={32} className="mx-auto mb-2 opacity-30" />
            Nenhuma oferta encontrada.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(offer => (
              <div
                key={offer.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                onClick={() => recordView(offer.id)}
              >
                <div className="relative">
                  <ProductImage src={offer.image_url} name={offer.name} />
                  <button
                    onClick={e => { e.stopPropagation(); toggleSave(offer.id) }}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow ${
                      saved.has(offer.id)
                        ? 'bg-pink-500 text-white'
                        : 'bg-white/80 text-gray-400'
                    }`}
                  >
                    <Heart size={14} fill={saved.has(offer.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">{offer.name}</p>
                  <p className="text-emerald-600 font-bold text-base mt-1">
                    R$ {Number(offer.price).toFixed(2)}
                    {offer.unit && <span className="text-xs text-gray-400 font-normal ml-1">/{offer.unit}</span>}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <MarketLogo src={(offer.markets as any)?.logo_url} name={(offer.markets as any)?.name} />
                    <span className="text-xs text-gray-500 truncate">{(offer.markets as any)?.name}</span>
                  </div>
                  {offer.valid_until && (
                    <p className="text-xs text-gray-400 mt-1">
                      Até {new Date(offer.valid_until + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Eye size={11} /> {offer.views || 0}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); toggleCart(offer) }}
                      className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                        shoppingList.find(o => o.id === offer.id)
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {shoppingList.find(o => o.id === offer.id) ? '✓ Na lista' : '+ Lista'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <a
            href="https://www.instagram.com/oferta_do_dia2026/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-pink-500 transition-colors"
          >
            <Instagram size={14} />
            @oferta_do_dia2026
          </a>
        </div>
      </div>
    </div>
  )
}
