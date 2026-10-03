import { useApp } from '../../context/AppContext'
import { Instagram, ShieldCheck, LogOut, LogIn } from 'lucide-react'

type Route = 'offers' | 'login' | 'admin'

interface NavbarProps {
  route: Route
  onNavigate: (to: Route) => void
}

export function Navbar({ route, onNavigate }: NavbarProps) {
  const { isAdmin, signOut } = useApp()

  async function handleSignOut() {
    await signOut()
    onNavigate('offers')
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-[72px] flex items-center justify-between">
        <button onClick={() => onNavigate('offers')} className="flex items-center gap-2">
          <img
            src="/ofertalogo.png"
            alt="Oferta do Dia"
            className="h-12 sm:h-14 object-contain"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
        </button>

        <div className="flex items-center gap-1">
          <a
            href="https://www.instagram.com/oferta_do_dia2026/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 text-gray-400 hover:text-pink-500 transition-colors rounded-lg"
            title="Instagram"
          >
            <Instagram size={22} />
          </a>

          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                route === 'admin' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <ShieldCheck size={19} />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {isAdmin ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-base text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <LogOut size={19} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-base text-gray-400 hover:bg-gray-50 transition-colors"
              title="Acesso restrito"
            >
              <LogIn size={18} />
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
