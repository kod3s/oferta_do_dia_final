import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react'
import { supabase } from '../services/supabase'
import type { Profile, Market } from '../types'

interface AppState {
  profile: Profile | null
  market: Market | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, role: 'customer' | 'market') => Promise<void>
  signOut: () => Promise<void>
  refreshMarket: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AppContext = createContext<AppState>({} as AppState)

function clearAuthStorage() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-')) localStorage.removeItem(key)
  })
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [market, setMarket] = useState<Market | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  async function loadProfile(userId: string) {
    try {
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!p) { setProfile(null); setMarket(null); return }
      setProfile(p as Profile)

      if (p.role === 'market') {
        const { data: m } = await supabase
          .from('markets')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
        setMarket(m as Market | null)
      } else {
        setMarket(null)
      }
    } catch {
      setProfile(null)
      setMarket(null)
    }
  }

  useEffect(() => {
    // Safety net: never stay loading more than 8s
    const timeout = setTimeout(() => setLoading(false), 8000)

    // Single source of truth: onAuthStateChange
    // INITIAL_SESSION fires immediately on mount with current session or null
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (initialized.current && event === 'INITIAL_SESSION') return

        if (event === 'INITIAL_SESSION') {
          initialized.current = true
          if (session?.user) {
            await loadProfile(session.user.id)
          }
          clearTimeout(timeout)
          setLoading(false)
          return
        }

        if (event === 'SIGNED_IN' && session?.user) {
          await loadProfile(session.user.id)
          return
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null)
          setMarket(null)
          return
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Silently refresh profile if needed
          await loadProfile(session.user.id)
          return
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  const signUp = async (email: string, password: string, role: 'customer' | 'market') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    })
    if (error) throw new Error(error.message)
    if (data.user) {
      await new Promise(r => setTimeout(r, 800))
      await supabase.from('profiles').upsert(
        { id: data.user.id, email, role },
        { onConflict: 'id' }
      )
    }
  }

  const signOut = async () => {
    setProfile(null)
    setMarket(null)
    clearAuthStorage()
    await supabase.auth.signOut()
  }

  const refreshMarket = async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('markets')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle()
    setMarket(data as Market | null)
  }

  const refreshProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await loadProfile(user.id)
  }

  return (
    <AppContext.Provider value={{
      profile, market, loading,
      signIn, signUp, signOut,
      refreshMarket, refreshProfile,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
