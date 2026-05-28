import { MarketOnboarding } from './MarketOnboarding'
import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../services/supabase'
import { OfferForm } from './OfferForm'
import type { Offer } from '../../types'
import {
  Tag, Eye, Heart, TrendingUp, Crown, AlertCircle,
  ImageIcon, Plus, Pencil, Trash2, X, Check
} from 'lucide-react'

interface OfferWithStats extends Offer {
  views: number
  saves: number
}

const FREE_LIMIT = 5

function ProductImage({ src, name }: { src?: string | null; name: string }) {
  const [err, setErr] = useState(false)
  if (src && !err)
    return <img src={src} alt={name} className="w-12 h-12 rounded-lg object-cover border border-gray-100" onError={() => setErr(true)} />
  return (
    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
      <ImageIcon size={20} />
    </div>
  )
}

export function MarketDashboard() {
  const { market, refreshMarket } = useApp()
  const [offers, setOffers] = useState<OfferWithStats[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editOffer, setEditOffer] = useState<Offer | null>(null)
  const [loadingOffers, setLoadingOffers] = useState(true)
  const [editingLogo, setEditingLogo] = useState(false)
  const [logoInput, setLogoInput] = useState('')
  const [logoErr, setLogoErr] = useState(false)
  const [savingLogo, setSavingLogo] = useState(false)

  const activeOffers = offers.filter(o => o.active)
  const isPro = market?.plan === 'pro'
  const atLimit = !isPro && activeOffers.length >= FREE_LIMIT

  async function loadOffers() {
    if (!market?.id) return
    setLoadingOffers(true)
    try {
      const { data } = await supabase
        .from('offers')
        .select('*')
        .eq('market_id', market.id)
        .order('created_at', { ascending: false })
      setOffers((data || []) as OfferWithStats[])
    } finally {
      setLoadingOffers(false)
    }
  }

  useEffect(() => {
    if (market?.id) loadOffers()
  }, [market?.id])

  async function handleSave(data: Partial<Offer>) {
    if (!market) return
    if (!editOffer) {
      const currentActive = offers.filter(o => o.active).length
      if (!isPro && currentActive >= FREE_LIMIT) return
    }
    if (editOffer) {
      await supabase.from('offers').update(data).eq('id', editOffer.id)
    } else {
      await supabase.from('offers').insert({ ...data, market_id: market.id, active: true })
    }
    setShowForm(false)
    setEditOffer(null)
    await loadOffers()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta oferta?')) return
    await supabase.from('offers').delete().eq('id', id)
    await loadOffers()
  }

  async function handleToggle(offer: OfferWithStats) {
    if (!offer.active && atLimit) return
    await supabase.from('offers').update({ active: !offer.active }).eq('id', offer.id)
    await loadOffers()
  }

  async function saveLogo() {
    if (!market?.id) return
    setSavingLogo(true)
    const { error } = await supabase
      .from('markets')
      .update({ logo_url: logoInput.trim() || null })
      .eq('id', market.id)
    setSavingLogo(false)
    if (!error) {
      setEditingLogo(false)
      await refreshMarket()
    }
  }

  const totalViews = offers.reduce((a, o) => a + ((o as any).views || 0), 0)
  const totalSaves = offers.reduce((a, o) => a + ((o as any).saves || 0), 0)

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
            initial={editOffer || undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditOffer(null) }}
          />
        </div>
      </div>
    )
  }

if (!market) {
    return <MarketOnboarding onCreated={refreshMarket} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header com logo editável */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              {market.logo_url ? (
                <img
                  src={market.logo_url}
                  alt={market.name}
                  className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Tag className="text-emerald-600" size={26} />
                </div>
              )}
              <button
                onClick={() => { setEditingLogo(true); setLogoInput(market.logo_url || ''); setLogoErr(false) }}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-700 hover:bg-gray-900 text-white rounded-full flex items-center justify-center shadow"
                title="Editar logo"
              >
                <Pencil size={11} />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900">{market.name}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                {isPro ? (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Crown size={10} /> Pro
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

          {editingLogo && (
            <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
              <label className="text-xs font-medium text-gray-600">URL da logo do mercado</label>
              <input
                value={logoInput}
                onChange={e => { setLogoInput(e.target.value); setLogoErr(false) }}
                placeholder="https://exemplo.com/logo.png"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              {logoInput && !logoErr && (
                <img
                  src={logoInput}
                  alt="Preview"
                  className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                  onError={() => setLogoErr(true)}
                />
              )}
              {logoErr && <p className="text-xs text-red-500">URL inválida ou imagem não carregou.</p>}
              <p className="text-xs text-gray-400">Hospede em imgur.com, imgbb.com ou similar.</p>
              <div className="flex gap-2">
                <button
                  onClick={saveLogo}
                  disabled={savingLogo}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold disabled:opacity-60"
                >
                  <Check size={13} /> {savingLogo ? 'Salvando...' : 'Salvar logo'}
                </button>
                <button
                  onClick={() => setEditingLogo(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium"
                >
                  <X size={13} /> Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Aviso de limite */}
        {!isPro && (
          <div className={`rounded-xl p-4 flex items-start gap-3 ${atLimit ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-100'}`}>
            <AlertCircle size={17} className={`mt-0.5 flex-shrink-0 ${atLimit ? 'text-red-500' : 'text-amber-500'}`} />
            <div>
              {atLimit ? (
                <>
                  <p className="text-sm font-semibold text-red-700">Limite atingido ({FREE_LIMIT}/{FREE_LIMIT})</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Plano gratuito permite até {FREE_LIMIT} ofertas ativas. Faça upgrade para publicar sem limites.
                  </p>
                  <a
                    href="https://www.instagram.com/oferta_do_dia2026/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Crown size={11} /> Contratar Pro — R$&nbsp;69,90/mês
                  </a>
                </>
              ) : (
                <p className="text-sm text-amber-700">
                  {FREE_LIMIT - activeOffers.length} oferta{FREE_LIMIT - activeOffers.length !== 1 ? 's' : ''} restante{FREE_LIMIT - activeOffers.length !== 1 ? 's' : ''} no plano gratuito.{' '}
                  <a href="https://www.instagram.com/oferta_do_dia2026/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                    Upgrade Pro por R$&nbsp;69,90/mês
                  </a>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Ativas', value: activeOffers.length, icon: <Tag size={15} className="text-emerald-500" /> },
            { label: 'Views', value: totalViews, icon: <Eye size={15} className="text-blue-500" /> },
            { label: 'Salvos', value: totalSaves, icon: <Heart size={15} className="text-pink-500" /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-3 shadow-sm text-center">
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Botão Nova oferta */}
        {!atLimit ? (
          <button
            onClick={() => { setEditOffer(null); setShowForm(true) }}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors"
          >
            <Plus size={17} /> Nova oferta
          </button>
        ) : (
          <a
            href="https://www.instagram.com/oferta_do_dia2026/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors"
          >
            <Crown size={17} /> Fazer upgrade para publicar mais
          </a>
        )}

        {/* Lista de ofertas */}
        {loadingOffers ? (
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
                  {offer.valid_until && (
                    <p className="text-xs text-gray-400">Até {new Date(offer.valid_until + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(offer)}
                    disabled={!offer.active && atLimit}
                    className={`text-xs px-2 py-1 rounded-full font-medium transition-colors disabled:opacity-40 ${
                      offer.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
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
                      <Trash2 size={12} />
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
