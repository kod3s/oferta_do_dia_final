import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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
  const init = async () => {
    try {
      const { data } = await auth.getSession()

      if (data.session?.user) {
        await loadUser(data.session.user.id)
      }
    } catch (err) {
      console.error('Erro ao carregar sessão:', err)

      // limpa sessão quebrada
      await auth.signOut()

      setProfile(null)
      setMarket(null)

      localStorage.clear()
    } finally {
      setLoading(false)
    }
  }

  init()

  const { data: listener } = auth.onAuthStateChange(
    async (_event, session) => {
      try {
        if (session?.user) {
          await loadUser(session.user.id)
        } else {
          setProfile(null)
          setMarket(null)
        }
      } catch (err) {
        console.error('Erro auth state:', err)

        await auth.signOut()

        setProfile(null)
        setMarket(null)

        localStorage.clear()
      } finally {
        setLoading(false)
      }
    }
  )

  return () => listener.subscription.unsubscribe()
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
