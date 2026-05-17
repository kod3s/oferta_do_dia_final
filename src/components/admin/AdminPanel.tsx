import { useEffect, useState } from 'react'
import { profiles as profilesService, markets as marketsService, offers as offersService } from '../../services/supabase'
import type { Profile, Market } from '../../types'

type Section = 'overview' | 'users' | 'markets' | 'offers'

export function AdminPanel() {
  const [section, setSection] = useState<Section>('overview')
  const [users, setUsers] = useState<Profile[]>([])
  const [allMarkets, setAllMarkets] = useState<Market[]>([])
  const [allOffers, setAllOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function loadAll() {
    setLoading(true)
    const [u, m, o] = await Promise.all([
      profilesService.list(),
      marketsService.list(),
      offersService.listAll(),
    ])
    setUsers(u)
    setAllMarkets(m)
    setAllOffers(o)
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  function flash(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  async function setRole(userId: string, role: 'admin' | 'market' | 'customer') {
    await profilesService.setRole(userId, role)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    flash(`Papel atualizado para ${role}`)
  }

  async function setPlan(userId: string, plan: 'free' | 'pro') {
    await profilesService.setMarketPlan(userId, plan)
    setAllMarkets(prev => prev.map(m => m.user_id === userId ? { ...m, plan } : m))
    flash(`Plano atualizado para ${plan}`)
  }

  async function toggleMarket(marketId: string, active: boolean) {
    await marketsService.setActive(marketId, active)
    setAllMarkets(prev => prev.map(m => m.id === marketId ? { ...m, active } : m))
    flash(active ? 'Mercado ativado' : 'Mercado desativado')
  }

  const proMarkets = allMarkets.filter(m => m.plan === 'pro').length
  const activeMarkets = allMarkets.filter(m => m.active).length
  const totalOffers = allOffers.length
  const activeOffers = allOffers.filter((o: any) => o.active && (!o.valid_until || o.valid_until >= new Date().toISOString().split('T')[0])).length

  const nav = (s: Section, label: string, icon: string) => (
    <button onClick={() => setSection(s)} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg w-full text-left transition-colors ${section === s ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
      <span>{icon}</span>{label}
    </button>
  )

  return (
    <div className="flex min-h-[calc(100vh-48px)]">
      <div className="w-52 flex-shrink-0 bg-white border-r border-gray-100 p-3 flex flex-col gap-1">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs font-medium text-red-500 uppercase tracking-wide">⚙ Admin do sistema</p>
        </div>
        {nav('overview', 'Visão geral', '📊')}
        {nav('users', 'Usuários', '👤')}
        {nav('markets', 'Mercados', '🏪')}
        {nav('offers', 'Todas as ofertas', '🏷️')}
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {msg && (
          <div className="fixed top-16 right-4 bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
            {msg}
          </div>
        )}

        {loading && <p className="text-sm text-gray-400">Carregando...</p>}

        {/* OVERVIEW */}
        {section === 'overview' && !loading && (
          <div>
            <h1 className="text-lg font-medium mb-6">Visão geral da plataforma</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total de usuários', val: users.length, sub: `${users.filter(u => u.role === 'market').length} mercados` },
                { label: 'Mercados ativos', val: activeMarkets, sub: `${proMarkets} plano Pro` },
                { label: 'Ofertas ativas', val: activeOffers, sub: `${totalOffers} total` },
                { label: 'Receita estimada', val: `R$ ${(proMarkets * 49).toLocaleString('pt-BR')}`, sub: 'por mês' },
              ].map(m => (
                <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-400 mb-1">{m.label}</p>
                  <p className="text-2xl font-semibold">{m.val}</p>
                  <p className="text-xs text-gray-400 mt-1">{m.sub}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-medium mb-4">Mercados Pro (pagantes)</h2>
              {allMarkets.filter(m => m.plan === 'pro').length === 0 ? (
                <p className="text-sm text-gray-400">Nenhum mercado Pro ainda.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {allMarkets.filter(m => m.plan === 'pro').map(m => (
                    <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-xs font-bold text-emerald-700">
                        {m.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.city} · desde {new Date(m.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">R$ 49/mês</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* USERS */}
        {section === 'users' && !loading && (
          <div>
            <h1 className="text-lg font-medium mb-6">Usuários ({users.length})</h1>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-50">
                    {['E-mail', 'Papel', 'Cadastrado em', 'Ações'].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.role === 'admin' ? 'bg-red-100 text-red-600' :
                          u.role === 'market' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={u.role}
                          onChange={e => setRole(u.id, e.target.value as any)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                        >
                          <option value="customer">customer</option>
                          <option value="market">market</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MARKETS */}
        {section === 'markets' && !loading && (
          <div>
            <h1 className="text-lg font-medium mb-6">Mercados ({allMarkets.length})</h1>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-50">
                    {['Mercado', 'Cidade', 'Plano', 'Status', 'Ações'].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allMarkets.map(m => (
                    <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-medium">{m.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{m.city ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.plan === 'pro' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {m.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-500'}`}>
                          {m.active ? 'ativo' : 'inativo'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-3 items-center">
                          {/* Alternar plano manualmente */}
                          <select
                            value={m.plan}
                            onChange={e => setPlan(m.user_id, e.target.value as 'free' | 'pro')}
                            className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                          >
                            <option value="free">Grátis</option>
                            <option value="pro">Pro</option>
                          </select>
                          <button
                            onClick={() => toggleMarket(m.id, !m.active)}
                            className={`text-xs px-2 py-1 rounded border transition-colors ${m.active ? 'border-red-200 text-red-400 hover:bg-red-50' : 'border-emerald-200 text-emerald-500 hover:bg-emerald-50'}`}
                          >
                            {m.active ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allMarkets.length === 0 && <p className="text-sm text-gray-400 text-center py-10">Nenhum mercado cadastrado ainda.</p>}
            </div>
          </div>
        )}

        {/* ALL OFFERS */}
        {section === 'offers' && !loading && (
          <div>
            <h1 className="text-lg font-medium mb-6">Todas as ofertas ({allOffers.length})</h1>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-50">
                    {['Produto', 'Mercado', 'Preço', 'Validade', 'Views', 'Salvos', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allOffers.map((o: any) => {
                    const expired = o.valid_until && o.valid_until < new Date().toISOString().split('T')[0]
                    return (
                      <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{o.emoji} {o.name}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{o.markets?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-emerald-700">R$ {o.price.toFixed(2).replace('.', ',')}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{o.valid_until ?? '—'}</td>
                        <td className="px-4 py-3 text-sm">{o.views}</td>
                        <td className="px-4 py-3 text-sm">{o.saves}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${expired ? 'bg-gray-100 text-gray-400' : 'bg-emerald-100 text-emerald-700'}`}>
                            {expired ? 'expirada' : 'ativa'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {allOffers.length === 0 && <p className="text-sm text-gray-400 text-center py-10">Nenhuma oferta encontrada.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
