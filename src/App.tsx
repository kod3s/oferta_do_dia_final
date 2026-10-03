import { useEffect, useState } from 'react'
import { useApp } from './context/AppContext'
import { Navbar } from './components/shared/Navbar'
import { AuthPage } from './components/shared/AuthPage'
import { OffersPage } from './components/consumer/OffersPage'
import { AdminPanel } from './components/admin/AdminPanel'

 type Route = 'offers' | 'login' | 'admin'

function LoadingScreen() {
  const letters = 'OFERTA DO DIA'.split('')

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className="loading-cart relative w-28 h-24 mb-5 text-emerald-500">
        <svg viewBox="0 0 120 100" className="w-full h-full" aria-hidden="true">
          <path d="M14 16h14l9 47h48l12-34H34" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M43 63h42" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
          <circle cx="45" cy="78" r="7" fill="white" stroke="currentColor" strokeWidth="5" className="loading-wheel" />
          <circle cx="82" cy="78" r="7" fill="white" stroke="currentColor" strokeWidth="5" className="loading-wheel" />
          <path d="M36 38h45" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity=".25" />
        </svg>
      </div>

      <div className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900" aria-label="Oferta do Dia">
        {letters.map((letter, index) => (
          <span
            key={index}
            className="loading-letter"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </div>

      <div className="w-48 h-1 bg-emerald-100 rounded-full overflow-hidden mt-4">
        <div className="loading-line h-full w-full bg-emerald-500 rounded-full" />
      </div>
      <p className="mt-4 text-sm text-gray-500">Encontrando as melhores ofertas...</p>
    </div>
  )
}

export default function App() {
  const { isAdmin, loading } = useApp()
  const [route, setRoute] = useState<Route>('offers')
  const [visible, setVisible] = useState(true)
  const [introVisible, setIntroVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroVisible(false), 1800)
    return () => window.clearTimeout(timer)
  }, [])

  function navigate(to: Route) {
    setVisible(false)
    setTimeout(() => { setRoute(to); setVisible(true) }, 120)
  }

  useEffect(() => {
    if (loading) return
    if (isAdmin && (route === 'login' || route === 'offers')) navigate('admin')
    if (!isAdmin && route === 'admin') navigate('offers')
  }, [isAdmin, loading])

  if (loading || introVisible) return <LoadingScreen />

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
