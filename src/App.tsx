import { useEffect, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useApp } from './context/AppContext'
import { Navbar } from './components/shared/Navbar'
import { AuthPage } from './components/shared/AuthPage'
import { OffersPage } from './components/consumer/OffersPage'
import { AdminPanel } from './components/admin/AdminPanel'

type Route = 'offers' | 'login' | 'admin'

function LoadingScreen() {
  return (
    <div className="splash-screen" aria-label="Carregando Oferta do Dia">
      <div className="splash-content">
        <div className="cart-animation">
          <div className="cart-bounce"><ShoppingCart size={58} strokeWidth={2.2} /></div>
          <span className="cart-wheel wheel-one" />
          <span className="cart-wheel wheel-two" />
        </div>
        <div className="brand-letters" aria-label="Oferta do Dia">
          {'OFERTA DO DIA'.split('').map((letter, index) => (
            <span key={index} style={{ animationDelay: `${index * 55}ms` }}>{letter === ' ' ? '\u00a0' : letter}</span>
          ))}
        </div>
        <div className="loading-line"><span /></div>
        <p>Encontrando as melhores ofertas...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { isAdmin, loading } = useApp()
  const [route, setRoute] = useState<Route>('offers')
  const [visible, setVisible] = useState(true)
  const [splash, setSplash] = useState(true)

  function navigate(to: Route) {
    setVisible(false)
    setTimeout(() => { setRoute(to); setVisible(true) }, 120)
  }

  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 1700)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (loading) return
    if (isAdmin && (route === 'login' || route === 'offers')) navigate('admin')
    if (!isAdmin && route === 'admin') navigate('offers')
  }, [isAdmin, loading])

  if (splash || loading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar route={route} onNavigate={navigate} />
      <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 120ms ease' }}>
        {route === 'offers' && <OffersPage />}
        {route === 'login' && <AuthPage onSuccess={() => navigate('admin')} />}
        {route === 'admin' && isAdmin && <AdminPanel />}
        {route === 'admin' && !isAdmin && <AuthPage onSuccess={() => navigate('admin')} />}
      </div>
    </div>
  )
}
