import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../services/supabase'
import type { Offer } from '../../types'
import { Search, Heart, Eye, Tag, ImageIcon, ShoppingCart, Instagram, Plus, Minus, X } from 'lucide-react'

interface OfferCard extends Offer {
  views: number
  saves: number
  market_name?: string
  market_logo?: string | null
  markets?: { name: string; logo_url?: string | null; id?: string }
}

interface CartItem {
  offer: OfferCard
  qty: number
}

const CATEGORIES = ['Todos', 'Hortifruti', 'Carnes', 'Laticínios', 'Bebidas', 'Mercearia', 'Limpeza', 'Higiene']

function ProductImage({ src, name }: { src?: string | null; name: string }) {
  const [error, setError] = useState(false)
  if (src && !error)
    return <img src={src} alt={name} className="w-full h-36 object-cover" onError={() => setError(true)} />
  return (
    <div className="w-full h-36 bg-gradient-to-br from-gray-100 to-gray-50 flex flex-col items-center justify-center text-gray-300">
      <ImageIcon size={28} />
      <span className="text-xs mt-1">sem imagem</span>
    </div>
  )
}

function MarketLogo({ src, name }: { src?: string | null; name?: string }) {
  const [error, setError] = useState(false)
  if (src && !error)
    return <img src={src} alt={name || ''} className="w-5 h-5 rounded-full object-cover border border-gray-200" onError={() => setError(true)} />
  return <Tag size={12} className="text-gray-400" />
}

export function OffersPage() {
  const [offers, setOffers] = useState<OfferCard[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showList, setShowList] = useState(false)

  async function loadOffers() {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('offers')
        .select('*, markets(id, name, logo_url)')
        .eq('active', true)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order('created_at', { ascending: false })
      setOffers((data || []) as OfferCard[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOffers() }, [])

  function getMarketName(offer: OfferCard) {
    return (offer.markets as any)?.name || offer.market_name || 'Mercado'
  }

  function getMarketLogo(offer: OfferCard) {
    return (offer.markets as any)?.logo_url || offer.market_logo || null
  }

  function getMarketId(offer: OfferCard): string | null {
    return (offer.markets as any)?.id || offer.market_id || null
  }

  function toggleCart(offer: OfferCard) {
    setCart(prev => {
      const exists = prev.find(i => i.offer.id === offer.id)
      if (exists) return prev.filter(i => i.offer.id !== offer.id)
      return [...prev, { offer, qty: 1 }]
    })
  }

  function setQty(offerId: string, qty: number) {
    if (qty < 1) { setCart(prev => prev.filter(i => i.offer.id !== offerId)); return }
    setCart(prev => prev.map(i => i.offer.id === offerId ? { ...i, qty } : i))
  }

  function isInCart(offerId: string) {
    return cart.some(i => i.offer.id === offerId)
  }

  async function recordView(offerId: string) {
    await supabase.from('offer_views').insert({ offer_id: offerId })
  }

  async function shareWhatsApp() {
    // Registrar shares por mercado antes de abrir o WhatsApp
    const shareInserts = cart.map(({ offer, qty }) => ({
      market_id: getMarketId(offer),
      offer_id: offer.id,
      quantity: qty,
      unit_price: Number(offer.price),
    })).filter(s => s.market_id)

    if (shareInserts.length > 0) {
      await supabase.from('whatsapp_shares').insert(shareInserts)
    }

    const text = cart.map(({ offer, qty }) =>
      `• ${offer.name} (${getMarketName(offer)}) — ${qty}x R$ ${Number(offer.price).toFixed(2)} = R$ ${(Number(offer.price) * qty).toFixed(2)}`
    ).join('\n')

    const total = cart.reduce((a, { offer, qty }) => a + Number(offer.price) * qty, 0)
     const msg = '🛒 Minha lista de compras:\n\n' + text + '\n\n💰 Total: R$ ' + total.toFixed(2) + '\n\nOfertas via Oferta do Dia'
  window.open('https://wa.me/?text=' + encodeURIComponent(msg))
  }

  const filtered = offers.filter(o => {
    const matchSearch = !search ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      getMarketName(o).toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'Todos' || (o.category || '') === category
    return matchSearch && matchCat
  })

  const totalList = cart.reduce((a, { offer, qty }) => a + Number(offer.price) * qty, 0)

  if (showList) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-6">
          <button onClick={() => setShowList(false)} className="text-sm text-gray-500 mb-4 flex items-center gap-1">
            ← Voltar
          </button>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Minha lista de compras</h2>
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">Nenhum item na lista.</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {cart.map(({ offer, qty }) => (
                  <div key={offer.id} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{offer.name}</p>
                      <p className="text-xs text-gray-500">{getMarketName(offer)}</p>
                      <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                        R$ {(Number(offer.price) * qty).toFixed(2)}
                        <span className="text-gray-400 font-normal ml-1">({qty}x R$ {Number(offer.price).toFixed(2)})</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setQty(offer.id, qty - 1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">{qty}</span>
                      <button onClick={() => setQty(offer.id, qty + 1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => toggleCart(offer)} className="text-red-400 hover:text-red-600 p-1">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center mb-3">
                <p className="text-sm text-gray-600">Total estimado</p>
                <p className="text-2xl font-bold text-emerald-600">R$ {totalList.toFixed(2)}</p>
              </div>
              <button
                onClick={shareWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
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

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto ou mercado..."
            className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                category === cat ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {cart.length > 0 && (
          <button
            onClick={() => setShowList(true)}
            className="fixed bottom-6 right-4 bg-emerald-500 text-white rounded-full px-4 py-3 shadow-lg flex items-center gap-2 text-sm font-semibold z-50"
          >
            <ShoppingCart size={16} />
            {cart.length} {cart.length === 1 ? 'item' : 'itens'} · R$ {totalList.toFixed(2)}
          </button>
        )}

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
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => recordView(offer.id)}
              >
                <div className="relative">
                  <ProductImage src={offer.image_url} name={offer.name} />
                  <button
                    onClick={e => { e.stopPropagation(); toggleCart(offer) }}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow ${
                      isInCart(offer.id) ? 'bg-pink-500 text-white' : 'bg-white/80 text-gray-400'
                    }`}
                  >
                    <Heart size={14} fill={isInCart(offer.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">{offer.name}</p>
                  <p className="text-emerald-600 font-bold text-base mt-1">
                    R$ {Number(offer.price).toFixed(2)}
                    {offer.unit && <span className="text-xs text-gray-400 font-normal ml-1">/{offer.unit}</span>}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <MarketLogo src={getMarketLogo(offer)} name={getMarketName(offer)} />
                    <span className="text-xs text-gray-500 truncate">{getMarketName(offer)}</span>
                  </div>
                  {offer.valid_until && (
                    <p className="text-xs text-gray-400 mt-1">
                      Até {new Date(offer.valid_until + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
