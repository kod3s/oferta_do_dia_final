import { useEffect, useState } from 'react'
import { useApp } from './context/AppContext'
import { Navbar } from './components/shared/Navbar'
import { AuthPage } from './components/shared/AuthPage'
import { OffersPage } from './components/consumer/OffersPage'
import { AdminPanel } from './components/admin/AdminPanel'

type Route = 'offers' | 'login' | 'admin'

const loadingStyles = `
  @keyframes oferta-track {
    0% { transform: translateX(-34vw); }
    12% { transform: translateX(-22vw); }
    88% { transform: translateX(22vw); }
    100% { transform: translateX(34vw); }
  }
  @keyframes oferta-wheel {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes oferta-letter {
    0%, 100% { opacity: .22; transform: translateY(7px); }
    18%, 72% { opacity: 1; transform: translateY(0); }
  }
  @keyframes oferta-line {
    0% { transform: scaleX(0); opacity: .25; }
    55% { transform: scaleX(1); opacity: 1; }
    100% { transform: scaleX(0); opacity: .25; }
  }
  @keyframes oferta-dot {
    0%, 80%, 100% { transform: translateY(0); opacity: .35; }
    40% { transform: translateY(-4px); opacity: 1; }
  }
  .oferta-loader-cart {
    animation: oferta-track 2.15s cubic-bezier(.45,0,.25,1) infinite;
  }
  .oferta-loader-wheel {
    transform-box: fill-box;
    transform-origin: center;
    animation: oferta-wheel .52s linear infinite;
  }
  .oferta-loader-letter {
    display: inline-block;
    animation: oferta-letter 1.7s ease-in-out infinite;
  }
  .oferta-loader-line {
    transform-origin: center;
    animation: oferta-line 1.8s ease-in-out infinite;
  }
  .oferta-loader-dot { display: inline-block; animation: oferta-dot 1.1s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .oferta-loader-cart, .oferta-loader-wheel, .oferta-loader-letter, .oferta-loader-line, .oferta-loader-dot { animation: none; }
  }
`

function LoadingScreen() {
  const letters = 'OFERTA DO DIA'.split('')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white relative">
      <style>{loadingStyles}</style>

      <div className="absolute inset-0 pointer-events-none opacity-70" style={{
        background: 'radial-gradient(circle at 50% 43%, rgba(8,156,34,.09), transparent 30%), linear-gradient(135deg, rgba(255,183,0,.035), rgba(238,0,112,.035), rgba(125,30,190,.035))'
      }} />

      <div className="relative w-full max-w-3xl h-36 flex items-center justify-center">
        <div className="oferta-loader-cart absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-24">
          <svg viewBox="0 0 180 120" className="w-full h-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="ofertaCartGradient" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#08A52A" />
                <stop offset="55%" stopColor="#08A52A" />
                <stop offset="100%" stopColor="#00C853" />
              </linearGradient>
            </defs>
            <path d="M23 22h17l13 53h82l14-42H49" fill="none" stroke="url(#ofertaCartGradient)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M61 33h71l-7 24H67z" fill="rgba(8,156,34,.13)" stroke="#08A52A" strokeWidth="4" strokeLinejoin="round" />
            <path d="M83 14l-10 20M108 14l10 20" fill="none" stroke="#08A52A" strokeWidth="7" strokeLinecap="round" />
            <path d="M64 75h73" stroke="#08A52A" strokeWidth="9" strokeLinecap="round" />
            <g className="oferta-loader-wheel">
              <circle cx="62" cy="94" r="12" fill="#101828" />
              <circle cx="62" cy="94" r="5" fill="#fff" />
              <path d="M62 82v24M50 94h24" stroke="#08A52A" strokeWidth="2.5" />
            </g>
            <g className="oferta-loader-wheel">
              <circle cx="130" cy="94" r="12" fill="#101828" />
              <circle cx="130" cy="94" r="5" fill="#fff" />
              <path d="M130 82v24M118 94h24" stroke="#08A52A" strokeWidth="2.5" />
            </g>
          </svg>
        </div>
      </div>

      <div className="relative text-center mt-1 select-none">
        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: '#101828' }} aria-label="Oferta do Dia">
          {letters.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="oferta-loader-letter"
              style={{
                animationDelay: `${index * 70}ms`,
                color: letter === ' ' ? '#101828' : (index >= 9 ? '#08A52A' : '#101828'),
                width: letter === ' ' ? '.3em' : undefined
              }}
            >{letter}</span>
          ))}
        </div>

        <div className="mx-auto mt-4 h-1 w-48 overflow-hidden rounded-full bg-gray-100">
          <div className="oferta-loader-line h-full w-full rounded-full" style={{ background: 'linear-gradient(90deg, #FFB300, #FF5A36, #EC087D, #7B20C8, #08A52A)' }} />
        </div>

        <p className="mt-4 text-sm font-medium text-gray-500">
          Encontrando as melhores ofertas<span className="oferta-loader-dot">.</span><span className="oferta-loader-dot" style={{ animationDelay: '140ms' }}>.</span><span className="oferta-loader-dot" style={{ animationDelay: '280ms' }}>.</span>
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const { isAdmin, loading } = useApp()
  const [route, setRoute] = useState<Route>('offers')
  const [visible, setVisible] = useState(true)
  const [bootDone, setBootDone] = useState(false)

  function navigate(to: Route) {
    setVisible(false)
    setTimeout(() => { setRoute(to); setVisible(true) }, 120)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setBootDone(true), 1800)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (loading) return
    if (isAdmin && (route === 'login' || route === 'offers')) navigate('admin')
    if (!isAdmin && route === 'admin') navigate('offers')
  }, [isAdmin, loading])

  if (loading || !bootDone) return <LoadingScreen />

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
