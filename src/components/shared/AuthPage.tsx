import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Tag } from 'lucide-react'

interface AuthPageProps {
  onSuccess: () => void
}

export function AuthPage({ onSuccess }: AuthPageProps) {
  const { signIn, signUp } = useApp()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'customer' | 'market'>('customer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email || !password) { setError('Preencha todos os campos.'); return }
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, role)
      }
      onSuccess()
    } catch (e: any) {
      setError(e.message || 'Erro ao autenticar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm">
        <div className="text-center mb-6">
        <img
            src="/ofertalogo.png"
            alt="Oferta do Dia"
            className="h-16 object-contain mx-auto mb-3"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <h1 className="text-xl font-bold text-gray-900">Oferta do Dia</h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        <div className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Tipo de conta</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setRole('customer')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    role === 'customer'
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  Consumidor
                </button>
                <button
                  onClick={() => setRole('market')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    role === 'market'
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  Mercado
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>

          <button
            onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}
            className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
          >
            {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
          </button>
        </div>
      </div>
    </div>
  )
}
