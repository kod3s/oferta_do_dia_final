import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { offers as offersService, markets as marketsService } from '../../services/supabase'
import { OfferForm } from './OfferForm'
import type { OfferStats, Market } from '../../types'

type Section = 'dashboard' | 'offers' | 'new' | 'profile'

export function MarketDashboard() {
  const { profile, market, refreshMarket } = useApp()
  const [section, setSection] = useState<Section>('dashboard')
  const [offerList, setOfferList] = useState<OfferStats[]>([])
  const [editing, setEditing] = useState<OfferStats | null>(null)
  const [profileForm, setProfileForm] = useState<Partial<Market>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const FREE_LIMIT = 5
  const activeOffers = offerList.filter(o => o.active && (!o.valid_until || o.valid_until >= new Date().toISOString().split('T')[0]))
  const isPro = market?.plan === 'pro'
  const canAdd = isPro || activeOffers.length < FREE_LIMIT

  useEffect(() => {
    if (market?.id) {
      offersService.listByMarket(market.id).then(setOfferList)
    }
  }, [market?.id])

  useEffect(() => {
    if (market) setProfileForm({ name: market.name, cnpj: market.cnpj, address: market.address, city: market.city, phone: market.phone, description: market.description })
  }, [market])

  async function handleCreateOffer(data: any) {
    await offersService.create(market!.id, data)
    const updated = await offersService.listByMarket(market!.id)
    setOfferList(updated)
    setSection('offers')
  }

  async function handleEditOffer(data: any) {
    await offersService.update(editing!.id, data)
    const updated = await offersService.listByMarket(market!.id)
    setOfferList(updated)
    setEditing(null)
    setSection('offers')
  }

  async function handleDelete(offerId: string) {
    if (!confirm('Remover esta oferta?')) return
    await offersService.remove(offerId)
    setOfferList(prev => prev.filter(o => o.id !== offerId))
  }

  async function handleSaveProfile() {
    setSaving(true)
    try {
      await marketsService.update(market!.id, profileForm)
      await refreshMarket()
      setMsg('Perfil atualizado!')
      setTimeout(() => setMsg(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const totalViews = offerList.reduce((s, o) => s + (o.views ?? 0), 0)
  const totalSaves = offerList.reduce((s, o) => s + (o.saves ?? 0), 0)

  const nav = (s: Section, label: string, icon: string) => (
    <button onClick={() => { setSection(s); setEditing(null) }} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg w-full text-left transition-colors ${section === s ? 'bg-gray-100 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
      <span>{icon}</span>{label}
    </button>
  )

  return (
    <div className="flex min-h-[calc(100vh-48px)]">
      {/* Sidebar */}
      <div className="w-52 flex-shrink-0 bg-white border-r border-gray-100 p-3 flex flex-col gap-1">
        <p className="text-xs text-gray-400 px-3 py-1 mt-1 uppercase tracking-wide">Principal</p>
        {nav('dashboard', 'Dashboard', '📊')}
        {nav('offers', 'Minhas ofertas', '🏷️')}
        {nav('new', 'Nova oferta', '➕')}
        <p className="text-xs text-gray-400 px-3 py-1 mt-3 uppercase tracking-wide">Conta</p>
        {nav('profile', 'Perfil do mercado', '🏪')}

        <div className="mt-auto p-3 bg-emerald-50 rounded-xl text-xs">
          <p className="font-medium text-emerald-800">{isPro ? '⭐ Plano Pro' : 'Plano Grátis'}</p>
          {!isPro && <p className="text-emerald-700 mt-0.5">{activeOffers.length}/{FREE_LIMIT} ofertas</p>}
          {!isPro && (
            <p className="text-emerald-600 mt-2 leading-tight">
              Para liberar ofertas ilimitadas, entre em contato com o suporte.
            </p>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 p-6 overflow-auto">

        {/* DASHBOARD */}
        {section === 'dashboard' && (
          <div>
            <h1 className="text-lg font-medium mb-1">{market?.name ?? 'Meu mercado'}</h1>
            <p className="text-sm text-gray-400 mb-6">Visão geral do desempenho</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Ofertas ativas', val: activeOffers.length },
                { label: 'Visualizações totais', val: totalViews },
                { label: 'Salvos nas listas', val: totalSaves },
              ].map(m => (
                <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-400 mb-1">{m.label}</p>
                  <p className="text-2xl font-semibold">{m.val}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <span className="text-sm font-medium">Ofertas ativas</span>
                <button onClick={() => setSection('new')} className="text-xs text-emerald-600 hover:underline">+ Nova oferta</button>
              </div>
              {activeOffers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">Nenhuma oferta ativa. <button onClick={() => setSection('new')} className="text-emerald-600 hover:underline">Criar primeira oferta</button></p>
              ) : (
                <table className="w-full">
                  <thead><tr className="text-xs text-gray-400 border-b border-gray-50">{['Produto','Preço','Validade','Views','Salvos'].map(h => <th key={h} className="text-left px-5 py-3 font-normal">{h}</th>)}</tr></thead>
                  <tbody>
                    {activeOffers.slice(0, 5).map(o => (
                      <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm">{o.emoji} {o.name}</td>
                        <td className="px-5 py-3 text-sm font-medium text-emerald-700">R$ {o.price.toFixed(2).replace('.', ',')}</td>
                        <td className="px-5 py-3 text-xs text-gray-400">{o.valid_until ?? '—'}</td>
                        <td className="px-5 py-3 text-sm">{o.views}</td>
                        <td className="px-5 py-3 text-sm">{o.saves}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* OFFERS LIST */}
        {section === 'offers' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-lg font-medium">Minhas ofertas</h1>
                {!isPro && <p className="text-xs text-gray-400">{activeOffers.length} de {FREE_LIMIT} ativas (plano grátis)</p>}
              </div>
              <button
                onClick={() => canAdd ? setSection('new') : null}
                disabled={!canAdd}
                className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-40 transition-colors"
              >
                + Nova oferta
              </button>
            </div>

            {!canAdd && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800">
                Você atingiu o limite de {FREE_LIMIT} ofertas do plano grátis. Entre em contato para ativar o plano Pro.
              </div>
            )}

            {editing && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
                <h2 className="text-sm font-medium mb-4">Editando: {editing.name}</h2>
                <OfferForm initial={editing} onSave={handleEditOffer} onCancel={() => setEditing(null)} />
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead><tr className="text-xs text-gray-400 border-b border-gray-50">{['Produto','Preço','Validade','Views','Salvos','Status',''].map(h => <th key={h} className="text-left px-4 py-3 font-normal">{h}</th>)}</tr></thead>
                <tbody>
                  {offerList.map(o => {
                    const expired = o.valid_until && o.valid_until < new Date().toISOString().split('T')[0]
                    return (
                      <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{o.emoji} {o.name}</td>
                        <td className="px-4 py-3 text-sm font-medium text-emerald-700">R$ {o.price.toFixed(2).replace('.', ',')}/{o.unit}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{o.valid_until ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{o.views}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{o.saves}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${expired ? 'bg-gray-100 text-gray-400' : 'bg-emerald-100 text-emerald-700'}`}>
                            {expired ? 'expirada' : 'ativa'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditing(o); setSection('offers') }} className="text-xs text-gray-400 hover:text-gray-700">Editar</button>
                            <button onClick={() => handleDelete(o.id)} className="text-xs text-red-300 hover:text-red-500">Excluir</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {offerList.length === 0 && <p className="text-sm text-gray-400 text-center py-10">Nenhuma oferta cadastrada ainda.</p>}
            </div>
          </div>
        )}

        {/* NEW OFFER */}
        {section === 'new' && (
          <div>
            <h1 className="text-lg font-medium mb-6">Nova oferta</h1>
            <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl">
              <OfferForm onSave={handleCreateOffer} onCancel={() => setSection('offers')} />
            </div>
          </div>
        )}

        {/* PROFILE */}
        {section === 'profile' && (
          <div>
            <h1 className="text-lg font-medium mb-6">Perfil do mercado</h1>
            <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl">
              {msg && <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg mb-4">{msg}</p>}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Nome do estabelecimento', field: 'name', full: true },
                  { label: 'CNPJ', field: 'cnpj' },
                  { label: 'Telefone', field: 'phone' },
                  { label: 'Endereço', field: 'address', full: true },
                  { label: 'Cidade', field: 'city' },
                  { label: 'Estado (UF)', field: 'state' },
                ].map(({ label, field, full }) => (
                  <div key={field} className={full ? 'col-span-2' : ''}>
                    <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                      value={(profileForm as any)[field] ?? ''}
                      onChange={e => setProfileForm(prev => ({ ...prev, [field]: e.target.value }))}
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Descrição</label>
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                    rows={3}
                    value={profileForm.description ?? ''}
                    onChange={e => setProfileForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <button onClick={handleSaveProfile} disabled={saving} className="px-5 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 font-medium transition-colors">
                    {saving ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
