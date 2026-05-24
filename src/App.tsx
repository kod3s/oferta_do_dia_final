import { useEffect, useState } from 'react'
import { useApp } from './context/AppContext'
import { Navbar } from './components/shared/Navbar'
import { AuthPage } from './components/shared/AuthPage'
import { OffersPage } from './components/consumer/OffersPage'
import { MarketDashboard } from './components/market/MarketDashboard'
import { AdminPanel } from './components/admin/AdminPanel'

type Route = 'home' | 'login' | 'dashboard' | 'admin'

function getInitialRoute(): Route {
  const hash = window.location.hash.replace('#', '') as Route
  if (['home', 'login', 'dashboard', 'admin'].includes(hash)) return hash
  return 'home'
}

export default function App() {
  const { profile, loading } = useApp()
  const [route, setRoute] = useState<Route>(getInitialRoute)
  const [visible, setVisible] = useState(true)

  function navigate(to: Route) {
    setVisible(false)
    setTimeout(() => {
      setRoute(to)
      window.location.hash = to
      setVisible(true)
    }, 120)
  }

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace('#', '') as Route
      if (['home', 'login', 'dashboard', 'admin'].includes(hash)) {
        setRoute(hash)
      }
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  // Redireciona baseado no perfil carregado
  useEffect(() => {
    if (loading) return
    if (!profile) {
      if (route === 'dashboard' || route === 'admin') navigate('login')
      return
    }
    if (profile.role === 'admin') {
      if (route === 'login' || route === 'home') navigate('admin')
    } else if (profile.role === 'market') {
      if (route === 'login' || route === 'home') navigate('dashboard')
    } else {
      if (route === 'login') navigate('home')
    }
  }, [profile, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <img
          src="/ofertalogo.png"
          alt="Oferta do Dia"
          className="h-14 object-contain"
          onError={e => (e.currentTarget.style.display = 'none')}
        />
        <div className="w-8 h-8 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Carregando...</p>
      </div>
    )
  }

  function renderPage() {
    // Páginas protegidas
    if (route === 'dashboard') {
      if (!profile) return <AuthPage onSuccess={() => {}} />
      return <MarketDashboard />
    }
    if (route === 'admin') {
      if (profile?.role !== 'admin') return <AuthPage onSuccess={() => {}} />
      return <AdminPanel />
    }
    if (route === 'login') {
      return <AuthPage onSuccess={() => {}} />
    }
    return <OffersPage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar route={route} onNavigate={navigate} />
      <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 120ms ease' }}>
        {renderPage()}
      </div>
    </div>
  )
}
