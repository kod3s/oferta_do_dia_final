import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import type { Profile, Market } from '../../types'
import { Users, Store, Crown, Trash2, RefreshCw, ImageIcon } from 'lucide-react'

type Tab = 'users' | 'markets'

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>('markets')
  const [users, setUsers] = useState<Profile[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    try {
      const [{ data: u }, { data: m }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('markets').select('*').order('created_at', { ascending: false }),
      ])
      setUsers((u || []) as Profile[])
      setMarkets((m || []) as Market[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function setRole(userId: string, role: 'admin' | 'market' | 'customer') {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setUsers(u => u.map(p => p.id === userId ? { ...p, role } : p))
  }

  async function deleteUser(userId: string) {
    if (!confirm('Excluir este usuário permanentemente?')) return
    await supabase.from('profiles').delete().eq('id', userId)
    setUsers(u => u.filter(p => p.id !== userId))
  }

  async function setPlan(marketId: string, plan: 'free' | 'pro') {
    const { error } = await supabase
      .from('markets')
      .update({ plan })
      .eq('id', marketId)
    if (error) {
      alert('Erro ao atualizar plano: ' + error.message)
      return
    }
    setMarkets(m => m.map(mk => mk.id === marketId ? { ...mk, plan } : mk))
  }

  async function toggleMarketActive(market: Market) {
    const { error } = await supabase
      .from('markets')
      .update({ active: !market.active })
      .eq('id', market.id)
    if (error) { alert('Erro: ' + error.message); return }
    setMarkets(m => m.map(mk => mk.id === market.id ? { ...mk, active: !mk.active } : mk))
  }

  async function deleteMarket(marketId: string) {
    if (!confirm('Excluir este mercado? Todas as ofertas serão removidas.')) return
    await supabase.from('markets').delete().eq('id', marketId)
    setMarkets(m => m.filter(mk => mk.id !== marketId))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Painel Administrativo</h1>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {([
            { key: 'markets', label: 'Mercados', icon: <Store size={14} /> },
            { key: 'users', label: 'Usuários', icon: <Users size={14} /> },
          ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
        ) : tab === 'markets' ? (
          <div className="space-y-3">
            {markets.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">Nenhum mercado cadastrado.</p>
            )}
            {markets.map(market => (
              <div key={market.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start gap-3">
                  {/* Logo */}
                  {market.logo_url ? (
                    <img
                      src={market.logo_url}
                      alt={market.name}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <ImageIcon size={18} className="text-gray-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{market.name}</p>
                      {market.plan === 'pro' && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Crown size={10} /> Pro
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        market.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {market.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{market.city}</p>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {/* Plan toggle */}
                      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                        <button
                          onClick={() => setPlan(market.id, 'free')}
                          className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                            market.plan !== 'pro'
                              ? 'bg-white shadow-sm text-gray-700'
                              : 'text-gray-400'
                          }`}
                        >
                          Grátis
                        </button>
                        <button
                          onClick={() => setPlan(market.id, 'pro')}
                          className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                            market.plan === 'pro'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-gray-400'
                          }`}
                        >
                          <Crown size={10} /> Pro
                        </button>
                      </div>

                      <button
                        onClick={() => toggleMarketActive(market)}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition-colors"
                      >
                        {market.active ? 'Desativar' : 'Ativar'}
                      </button>

                      <button
                        onClick={() => deleteMarket(market.id)}
                        className="text-xs px-2 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {users.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">Nenhum usuário.</p>
            )}
            {users.map(user => (
              <div key={user.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                  {user.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(user.created_at || '').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <select
                  value={user.role}
                  onChange={e => setRole(user.id, e.target.value as 'admin' | 'market' | 'customer')}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white"
                >
                  <option value="customer">Cliente</option>
                  <option value="market">Mercado</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={() => deleteUser(user.id)}
                  className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
