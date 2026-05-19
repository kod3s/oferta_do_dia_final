import { useApp } from '../../context/AppContext'

interface NavbarProps {
  page: string
  setPage: (p: any) => void
}

export function Navbar({ page, setPage }: NavbarProps) {
  const { profile, market, signOut } = useApp()

  async function handleSignOut() {
    await signOut()
    setPage('home')
  }

  return (
    <nav className="bg-white border-b border-gray-100 px-4 h-12 flex items-center justify-between sticky top-0 z-10">
      <button onClick={() => setPage('home')} className="flex items-center gap-2">
        <img src="/ofertalogo.png" alt="Oferta do Dia" className="h-7 w-7 rounded-lg object-cover" />
        <span className="font-medium text-sm hidden sm:block">Oferta do Dia</span>
      </button>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage('offers')}
          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${page === 'offers' ? 'bg-gray-100 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Ofertas
        </button>

        {profile?.role === 'market' && (
          <button
            onClick={() => setPage('dashboard')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${page === 'dashboard' ? 'bg-gray-100 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Meu painel
          </button>
        )}

        {profile?.role === 'admin' && (
          <button
            onClick={() => setPage('admin')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${page === 'admin' ? 'bg-red-50 font-medium text-red-600' : 'text-red-400 hover:bg-red-50'}`}
          >
            Admin
          </button>
        )}

        {profile ? (
          <div className="flex items-center gap-2 ml-2">
            <div className="flex flex-col items-end">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-medium text-emerald-700">
                {profile.email[0].toUpperCase()}
              </div>
              {market?.plan === 'pro' && (
                <span className="text-[9px] text-emerald-600 font-medium leading-none">PRO</span>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sair
            </button>
          </div>
        ) : (
          <button
            onClick={() => setPage('auth')}
            className="ml-2 px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Entrar
          </button>
        )}
      </div>
    </nav>
  )
}
