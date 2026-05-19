import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import type { Profile, Market } from '../types'
import { supabase, profiles, markets } from '../services/supabase'

interface AppState {
  profile: Profile | null
  market: Market | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, role?: 'customer' | 'market') => Promise<void>
  signOut: () => Promise<void>
  refreshMarket: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AppContext = createContext<AppState>({} as AppState)

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [market, setMarket] = useState<Market | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async (userId: string) => {
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
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        await loadUser(data.session.user.id)
      }
      setLoading(false)
    }).catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUser(session.user.id)
      }
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setMarket(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadUser])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  const signUp = async (
    email: string,
    password: string,
    role: 'customer' | 'market' = 'customer'
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    })
    if (error) throw new Error(error.message)
    if (data.user) {
      await new Promise(r => setTimeout(r, 600))
      await supabase.from('profiles').update({ role }).eq('id', data.user.id)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setMarket(null)
  }

  const refreshMarket = async () => {
    if (!profile?.id) return
    const m = await markets.getMine(profile.id)
    setMarket(m)
  }

  // Recarrega o perfil do banco — usado após admin mudar o plano
  const refreshProfile = async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) await loadUser(data.session.user.id)
  }

  return (
    <AppContext.Provider
      value={{ profile, market, loading, signIn, signUp, signOut, refreshMarket, refreshProfile }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
