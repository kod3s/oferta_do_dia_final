import { useState, useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { Navbar } from './components/shared/Navbar'
import { AuthPage } from './components/shared/AuthPage'
import { HomePage } from './components/shared/HomePage'
import { OffersPage } from './components/consumer/OffersPage'
import { MarketDashboard } from './components/market/MarketDashboard'
import { AdminPanel } from './components/admin/AdminPanel'
import { markets as marketsService } from './services/supabase'

function OnboardingMarket({ onDone }: { onDone: () => void }) {
  const { profile, refreshMarket } = useApp()
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Informe o nome do mercado.'); return }
    setLoading(true)
    try {
      await marketsService.create(profile!.id, { name, city })
      await refreshMarket()
      onDone()
    } catch (err: any) {
      setError(err.message ?? 'Erro ao criar mercado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-sm border border-gray-100">
        <div className="text-3xl mb-4">🏪</div>
        <h1 className="text-lg font-medium mb-1">Configure seu mercado</h1>
        <p className="text-sm text-gray-400 mb-6">Essas informações aparecerão para os consumidores. Você pode editar depois.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Nome do estabelecimento *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" placeholder="Ex: Supermercado Central" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Cidade</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" placeholder="Ex: São Paulo" value={city} onChange={e => setCity(e.target.value)} />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-emerald-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors">
            {loading ? 'Criando...' : 'Começar a usar'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AppInner() {
  const { profile, market, loading } = useApp()
  const [page, setPage] = useState('home')
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Redirecionar após login
  useEffect(() => {
    if (!profile) return
    if (profile.role === 'admin') setPage('admin')
    else if (profile.role === 'market') {
      if (!market) setShowOnboarding(true)
      else setPage('dashboard')
    }
  }, [profile, market])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-400">Carregando...</div>
      </div>
    )
  }

  if (page === 'auth' && !profile) {
    return <AuthPage />
  }

  if (showOnboarding && profile?.role === 'market' && !market) {
    return <OnboardingMarket onDone={() => { setShowOnboarding(false); setPage('dashboard') }} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar page={page} setPage={setPage} />
      {page === 'home' && <HomePage setPage={setPage} />}
      {page === 'offers' && <OffersPage setPage={setPage} />}
      {page === 'dashboard' && profile?.role === 'market' && <MarketDashboard />}
      {page === 'admin' && profile?.role === 'admin' && <AdminPanel />}
      {page === 'auth' && profile && <HomePage setPage={setPage} />}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
