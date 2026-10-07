import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import type { Offer } from '../../types'
import { Search, Heart, Tag, ImageIcon, ShoppingCart, Instagram, Plus, Minus, X, MapPin } from 'lucide-react'

interface MarketInfo {
  id: string
  name: string
  logo_url?: string | null
  city?: string | null
}

interface OfferCard extends Omit<Offer, 'markets'> {
  markets?: MarketInfo | null
}

interface CartItem {
  offer: OfferCard
  qty: number
}

const CATEGORIES = ['Todos', 'Hortifrúti', 'Carnes', 'Laticínios', 'Bebidas', 'Mercearia', 'Limpeza', 'Higiene', 'Outros']

function nowBrasilia(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
}

function timeLeft(publishedAt: string): string {
  const pub = new Date(publishedAt)
  const expires = new Date(pub.getTime() + 24 * 60 * 60 * 1000)
  const diff = expires.getTime() - nowBrasilia().getTime()
  if (diff <= 0) return 'expirada'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m`
  return `${m} min`
}

function ProductImage({ src, name }: { src?: string | null; name: string }) {
  const [error, setError] = useState(false)
  if (src && !error)
    return <img src={src} alt={name} className="w-full h-36 object-contain" onError={() => setError(true)} />
  return (
    <div className="w-full h-36 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-gray-300">
      <ImageIcon size={28} />
    </div>
  )
}

function MarketLogo({ src, name }: { src?: string | null; name?: string }) {
  const [error, setError] = useState(false)
  if (src && !error)
    return <img src={src} alt={name || ''} className="w-6 h-6 rounded-full object-cover border border-gray-200 flex-shrink-0" onError={() => setError(true)} />
  return <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
    <Tag size={10} className="text-emerald-500" />
  </div>
}

export function OffersPage() {
  const [offers, setOffers] = useState<OfferCard[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [city, setCity] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showList, setShowList] = useState(false)

  async function loadOffers() {
    setLoading(true)
    try {
      const current = nowBrasilia()
      const nowIso = current.toISOString()
      const since = new Date(current.getTime() - 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          markets (
            id,
            name,
            logo_url,
            city
          )
        `)
        .eq('active', true)
        .lte('published_at', nowIso)
        .gte('published_at', since)
        .order('published_at', { ascending: false })

      if (error) console.error('Erro ao carregar ofertas:', error)

      const list = (data || []) as OfferCard[]
      setOffers(list)

      // Debug — remove depois
      console.log('Ofertas carregadas:', list.length)
      console.log('Cidades encontradas:', list.map(o => o.markets?.city))

      const uniqueCities = Array.from(
        new Set(
          list
            .map(o => o.markets?.city)
            .filter((c): c is string => typeof c === 'string' && c.trim() !== '')
        )
      ).sort()

      console.log('Cidades únicas:', uniqueCities)
      setCities(uniqueCities)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOffers() }, [])

  const getMarketName = (o: OfferCard) => o.markets?.name || 'Mercado'
  const getMarketLogo = (o: OfferCard) => o.markets?.logo_url || null
  const getMarketCity = (o: OfferCard) => o.markets?.city || null
  const getMarketId   = (o: OfferCard) => o.markets?.id || o.market_id || null

  function toggleCart(offer: OfferCard) {
    setCart(prev => {
      if (prev.find(i => i.offer.id === offer.id))
        return prev.filter(i => i.offer.id !== offer.id)
      return [...prev, { offer, qty: 1 }]
    })
  }

  function setQty(offerId: string, qty: number) {
    if (qty < 1) { setCart(prev => prev.filter(i => i.offer.id !== offerId)); return }
    setCart(prev => prev.map(i => i.offer.id === offerId ? { ...i, qty } : i))
  }

  const isInCart = (id: string) => cart.some(i => i.offer.id === id)

  async function recordView(offerId: string) {
    await supabase.from('offer_views').insert({ offer_id: offerId })
  }

async function shareWhatsApp() {
  const lines = cart.map(({ offer, qty }) =>
    `• ${offer.name} (${getMarketName(offer)}) — ${qty}x R$ ${Number(offer.price).toFixed(2)} = R$ ${(Number(offer.price) * qty).toFixed(2)}`
  )
  const total = cart.reduce((a, { offer, qty }) => a + Number(offer.price) * qty, 0)
  const msg = `🛒 Minha lista — Oferta do Dia\n\n${lines.join('\n')}\n\n💰 Total: R$ ${total.toFixed(2)}`
  window.open('https://wa.me/?text=' + encodeURIComponent(msg))

  for (const { offer, qty } of cart) {
    console.log('tentando inserir:', {
      market_id: offer.market_id,
      offer_id: offer.id,
      quantity: qty,
      unit_price: Number(offer.price)
    })
    const { error } = await supabase.from('whatsapp_shares').insert({
      market_id: offer.market_id,
      offer_id: offer.id,
      quantity: qty,
      unit_price: Number(offer.price)
    })
    console.log('resultado:', error ? error.message : 'ok')
  }
}

  // ── Tela principal ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto ou mercado..."
            className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        {/* Filtro de cidade */}
        {cities.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <MapPin size={13} className="text-gray-400 flex-shrink-0" />
            {['Todas', ...cities].map(c => (
              <button key={c} onClick={() => setCity(c)}
                className={'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ' +
                  (city === c ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200')}>
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Categorias */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ' +
                (category === cat ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200')}>
              {cat}
            </button>
          ))}
        </div>

        {cart.length > 0 && (
          <button onClick={() => setShowList(true)}
            className="fixed bottom-6 right-4 bg-emerald-500 text-white rounded-full px-4 py-3 shadow-lg flex items-center gap-2 text-sm font-semibold z-50">
            <ShoppingCart size={16} />
            {cart.length} {cart.length === 1 ? 'item' : 'itens'} · R$ {totalList.toFixed(2)}
          </button>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Carregando ofertas...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <Tag size={32} className="mx-auto mb-2 opacity-30" />
            Nenhuma oferta ativa no momento.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(offer => (
              <div key={offer.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => recordView(offer.id)}>
                <div className="relative">
                  <ProductImage src={offer.image_url} name={offer.name} />
                  <button
                    onClick={e => { e.stopPropagation(); toggleCart(offer) }}
                    className={'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow ' +
                      (isInCart(offer.id) ? 'bg-pink-500 text-white' : 'bg-white/80 text-gray-400')}>
                    <Heart size={14} fill={isInCart(offer.id) ? 'currentColor' : 'none'} />
                  </button>
                  {offer.published_at && (
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                      ⏱ {timeLeft(offer.published_at)}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2 mb-1">{offer.name}</p>
                  <p className="text-emerald-600 font-bold text-lg">
                    R$ {Number(offer.price).toFixed(2)}
                    {offer.unit && <span className="text-xs text-gray-400 font-normal ml-1">/{offer.unit}</span>}
                  </p>
                  {/* Nome do mercado — tamanho aumentado */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <MarketLogo src={getMarketLogo(offer)} name={getMarketName(offer)} />
                    <span className="text-sm font-semibold text-gray-700 truncate leading-tight">
                      {getMarketName(offer)}
                    </span>
                  </div>
                  {getMarketCity(offer) && (
                    <div className="flex items-center gap-1 mt-0.5 ml-7">
                      <span className="text-xs text-gray-400">{getMarketCity(offer)}</span>
                    </div>
                  )}
                  {offer.note && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{offer.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center pt-4 pb-8">
          <a href="https://www.instagram.com/oferta_do_dia2026/" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-pink-500 transition-colors">
            <Instagram size={14} /> @oferta_do_dia2026
          </a>
        </div>
      </div>
    </div>
  )
}
