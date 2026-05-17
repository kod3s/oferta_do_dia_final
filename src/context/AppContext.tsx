import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import type { Profile, Market } from '../types'
import { auth, profiles, markets } from '../services/supabase'

interface AppState {
  profile: Profile | null
  market: Market | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, role?: 'customer' | 'market') => Promise<void>
  signOut: () => Promise<void>
  refreshMarket: () => Promise<void>
}

const AppContext = createContext<AppState>({} as AppState)

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [market, setMarket] = useState<Market | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  async function loadUser(userId: string) {
    try {
      const p = await profiles.get(userId)
      setProfile(p)
      if (p?.role === 'market') {
        const m = await markets.getMine(userId)
        setMarket(m)
      } else {
        setMarket(null)
      }
    } catch (err) {
      console.error('Erro ao carregar usuário:', err)
      setProfile(null)
      setMarket(null)
    }
  }

  useEffect(() => {
    // Só o onAuthStateChange controla o loading
    // O INITIAL_SESSION é disparado automaticamente na inicialização
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') {
        // Primeira chamada: inicializa o estado
        if (session?.user) {
          await loadUser(session.user.id)
        }
        setLoading(false)
        initialized.current = true
        return
      }

      if (event === 'SIGNED_IN' && session?.user) {
        await loadUser(session.user.id)
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setMarket(null)
      }

      if (event === 'TOKEN_REFRESHED' && session?.user && !initialized.current) {
        await loadUser(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await auth.signIn(email, password)
    if (error) throw new Error(error.message)
  }

  const signUp = async (
    email: string,
    password: string,
    role: 'customer' | 'market' = 'customer'
  ) => {
    const { error } = await auth.signUp(email, password, role)
    if (error) throw new Error(error.message)
  }

  const signOut = async () => {
    await auth.signOut()
    setProfile(null)
    setMarket(null)
  }

  const refreshMarket = async () => {
    if (!profile?.id) return
    const m = await markets.getMine(profile.id)
    setMarket(m)
  }

  return (
    <AppContext.Provider
      value={{ profile, market, loading, signIn, signUp, signOut, refreshMarket }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
