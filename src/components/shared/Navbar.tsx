import { useApp } from '../../context/AppContext'
import { Tag, LogIn, LogOut, LayoutDashboard, ShieldCheck, Instagram } from 'lucide-react'

type Route = 'home' | 'login' | 'dashboard' | 'admin'

interface NavbarProps {
  route: Route
  onNavigate: (to: Route) => void
}

export function Navbar({ route, onNavigate }: NavbarProps) {
  const { profile, signOut } = useApp()

  async function handleSignOut() {
    await signOut()
    onNavigate('home')
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2">
          <img
            src="/ofertalogo.png"
            alt="Oferta do Dia"
            className="h-8 object-contain"
            onError={e => {
              const t = e.currentTarget
              t.style.display = 'none'
              const fallback = t.nextElementSibling as HTMLElement | null
              if (fallback) fallback.style.display = 'flex'
            }}
          />
          {/* Fallback text logo */}
          <span
            className="hidden items-center gap-1.5 font-bold text-emerald-600 text-lg"
            style={{ display: 'none' }}
          >
            <Tag size={18} />
            Oferta do Dia
          </span>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Instagram link */}
          <a
            href="https://www.instagram.com/oferta_do_dia2026/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-pink-500 transition-colors rounded-lg"
            title="Contato"
          >
            <Instagram size={18} />
          </a>

          {profile?.role === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                route === 'admin'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ShieldCheck size={15} />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {profile?.role === 'market' && (
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                route === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard size={15} />
              <span className="hidden sm:inline">Painel</span>
            </button>
          )}

          {profile ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              title="Sair"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <LogIn size={15} />
              Entrar
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
