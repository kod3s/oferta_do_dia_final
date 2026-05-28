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

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [market, setMarket] = useState<Market | null>(null)
  const [loading, setLoading] = useState(true)
  const ready = useRef(false)

  function done() {
    if (ready.current) return
    ready.current = true
    setLoading(false)
  }

  async function loadProfile(userId: string) {
    try {
      const [{ data: p }, { data: m }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('markets').select('*').eq('user_id', userId).maybeSingle(),
      ])
      if (!p) { setProfile(null); setMarket(null); return }
      setProfile(p as Profile)
      setMarket(p.role === 'market' ? m as Market | null : null)
    } catch {
      setProfile(null)
      setMarket(null)
    }
  }

  useEffect(() => {
    // Libera em 2.5s no máximo — nunca trava
    const timeout = setTimeout(done, 2500)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            await loadProfile(session.user.id)
          }
          clearTimeout(timeout)
          done()
          return
        }
        if (event === 'SIGNED_IN' && session?.user) {
          await loadProfile(session.user.id)
          done()
          return
        }
        if (event === 'SIGNED_OUT') {
          setProfile(null)
          setMarket(null)
          done()
          return
        }
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          await loadProfile(session.user.id)
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
      await supabase.from('profiles').upsert(
        { id: data.user.id, email, role },
        { onConflict: 'id' }
      )
    }
  }

  const signOut = async () => {
    setProfile(null)
    setMarket(null)
    ready.current = false
    await supabase.auth.signOut()
  }

  const refreshMarket = async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('markets').select('*').eq('user_id', profile.id).maybeSingle()
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
