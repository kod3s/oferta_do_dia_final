import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../services/supabase'
import { OfferForm } from './OfferForm'
import { MarketOnboarding } from './MarketOnboarding'
import type { Offer, Market } from '../../types'
import { Plus, Tag, Eye, Heart, TrendingUp, Crown, AlertCircle, ImageIcon } from 'lucide-react'

interface OfferWithStats extends Offer {
  views: number
  saves: number
}

const FREE_LIMIT = 5

function ProductImage({ src, name }: { src?: string | null; name: string }) {
  const [error, setError] = useState(false)
  if (src && !error) {
    return (
      <img
        src={src}
        alt={name}
        className="w-12 h-12 rounded-lg object-cover border border-gray-100"
        onError={() => setError(true)}
      />
    )
  }
  return (
    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
      <ImageIcon size={20} />
    </div>
  )
}

export function MarketDashboard() {
  const { market, profile, refreshMarket } = useApp()
  const [offers, setOffers] = useState<OfferWithStats[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editOffer, setEditOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(true)
  const [limitError, setLimitError] = useState(false)

  const isPro = market?.plan === 'pro'
  const activeOffers = offers.filter(o => o.active)
  const atLimit = !isPro && activeOffers.length >= FREE_LIMIT

  async function loadOffers() {
    if (!market?.id) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('offer_stats')
        .select('*')
        .eq('market_id', market.id)
        .order('created_at', { ascending: false })
      setOffers((data || []) as OfferWithStats[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (market?.id) loadOffers()
  }, [market?.id])

  if (!market) {
    return <MarketOnboarding onCreated={refreshMarket} />
  }

  async function handleSave(data: Partial<Offer>) {
    if (!market) return

    // Enforce limit for free plan
    if (!editOffer && atLimit) {
      setLimitError(true)
      return
    }

    if (editOffer) {
      await supabase.from('offers').update(data).eq('id', editOffer.id)
    } else {
      await supabase.from('offers').insert({ ...data, market_id: market.id, active: true })
    }
    setShowForm(false)
    setEditOffer(null)
    setLimitError(false)
    loadOffers()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta oferta?')) return
    await supabase.from('offers').delete().eq('id', id)
    loadOffers()
  }

  async function handleToggle(offer: OfferWithStats) {
    // Can't activate if at limit and free plan
    if (!offer.active && atLimit && !isPro) {
      setLimitError(true)
      return
    }
    await supabase.from('offers').update({ active: !offer.active }).eq('id', offer.id)
    loadOffers()
  }

  function handleNewOffer() {
    if (atLimit && !isPro) {
      setLimitError(true)
      return
    }
    setLimitError(false)
    setEditOffer(null)
    setShowForm(true)
  }

  const totalViews = offers.reduce((a, o) => a + (o.views || 0), 0)
  const totalSaves = offers.reduce((a, o) => a + (o.saves || 0), 0)

  if (showForm || editOffer) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => { setShowForm(false); setEditOffer(null) }}
            className="mb-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            ← Voltar
          </button>
          <OfferForm
            offer={editOffer || undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditOffer(null) }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          {market.logo_url ? (
            <img src={market.logo_url} alt={market.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Tag className="text-emerald-600" size={22} />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{market.name}</h1>
            <div className="flex items-center gap-2">
              {isPro ? (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Crown size={11} /> Pro
                </span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  Grátis — {activeOffers.length}/{FREE_LIMIT} ofertas
                </span>
              )}
              <span className="text-xs text-gray-400">{market.city}</span>
            </div>
          </div>
        </div>

        {/* Limit warning */}
        {!isPro && (
          <div className={`rounded-xl p-4 flex items-start gap-3 ${atLimit ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
            <AlertCircle size={18} className={atLimit ? 'text-red-500 mt-0.5 flex-shrink-0' : 'text-amber-500 mt-0.5 flex-shrink-0'} />
            <div>
              {atLimit ? (
                <>
                  <p className="text-sm font-semibold text-red-700">Limite atingido</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    O plano gratuito permite até {FREE_LIMIT} ofertas ativas. Faça upgrade para o plano Pro por R$&nbsp;69,90/mês e publique ofertas ilimitadas.
                  </p>
                  <a
                    href="https://www.instagram.com/oferta_do_dia2026/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Crown size={12} /> Contratar Pro — R$&nbsp;69,90/mês
                  </a>
                </>
              ) : (
                <p className="text-sm text-amber-700">
                  Você tem <strong>{FREE_LIMIT - activeOffers.length}</strong> oferta{FREE_LIMIT - activeOffers.length !== 1 ? 's' : ''} restante{FREE_LIMIT - activeOffers.length !== 1 ? 's' : ''} no plano gratuito.{' '}
                  <a href="https://www.instagram.com/oferta_do_dia2026/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">Faça upgrade para Pro</a>
                  {' '}por R$&nbsp;69,90/mês e publique sem limites.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Limit error (when tries to add beyond limit) */}
        {limitError && !atLimit && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            Limite do plano gratuito atingido. <a href="https://www.instagram.com/oferta_do_dia2026/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">Contrate o Pro</a> para publicar mais ofertas.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Ofertas ativas', value: activeOffers.length, icon: <Tag size={16} className="text-emerald-500" /> },
            { label: 'Visualizações', value: totalViews, icon: <Eye size={16} className="text-blue-500" /> },
            { label: 'Salvamentos', value: totalSaves, icon: <Heart size={16} className="text-pink-500" /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-3 shadow-sm text-center">
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={handleNewOffer}
          className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
            atLimit && !isPro
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
          }`}
        >
          <Plus size={18} />
          {atLimit && !isPro ? `Limite atingido — Upgrade para Pro` : 'Nova oferta'}
        </button>

        {/* Offers list */}
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Carregando...</div>
        ) : offers.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
            Nenhuma oferta ainda. Crie sua primeira!
          </div>
        ) : (
          <div className="space-y-2">
            {offers.map(offer => (
              <div key={offer.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
                <ProductImage src={offer.image_url} name={offer.name} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{offer.name}</p>
                  <p className="text-emerald-600 font-bold text-sm">
                    R$ {Number(offer.price).toFixed(2)}
                    {offer.unit && <span className="text-xs text-gray-400 font-normal ml-1">/ {offer.unit}</span>}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Eye size={11} /> {offer.views || 0}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Heart size={11} /> {offer.saves || 0}</span>
                    {offer.expires_at && (
                      <span className="text-xs text-gray-400">até {new Date(offer.expires_at).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => handleToggle(offer)}
                    className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                      offer.active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {offer.active ? 'Ativa' : 'Inativa'}
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditOffer(offer); setShowForm(false) }}
                      className="text-xs text-blue-500 hover:text-blue-700 px-1"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(offer.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-1"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
