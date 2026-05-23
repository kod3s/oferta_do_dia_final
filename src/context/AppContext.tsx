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

const SUPABASE_STORAGE_KEYS = [
  'sb-jnsxlbmlsumxmwckarxm-auth-token',
  'supabase.auth.token',
]

function clearAuthStorage() {
  SUPABASE_STORAGE_KEYS.forEach(key => localStorage.removeItem(key))
  // Clear any key starting with sb-
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-')) localStorage.removeItem(key)
  })
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [market, setMarket] = useState<Market | null>(null)
  const [loading, setLoading] = useState(true)
  const resolvedRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function resolve() {
    if (resolvedRef.current) return
    resolvedRef.current = true
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setLoading(false)
  }

  async function loadProfile(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error || !data) {
        setProfile(null)
        setMarket(null)
        return
      }

      setProfile(data as Profile)

      if (data.role === 'market') {
        const { data: mkt } = await supabase
          .from('markets')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
        setMarket(mkt as Market | null)
      } else {
        setMarket(null)
      }
    } catch {
      setProfile(null)
      setMarket(null)
    }
  }

  useEffect(() => {
    resolvedRef.current = false

    // Safety timeout — never stay loading forever
    timeoutRef.current = setTimeout(() => {
      resolve()
    }, 6000)

    // Try to get session once
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        // Invalid token — clear and proceed as logged out
        clearAuthStorage()
        await supabase.auth.signOut()
        resolve()
        return
      }

      if (data.session?.user) {
        await loadProfile(data.session.user.id)
      }
      resolve()
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setMarket(null)
        resolve()
        return
      }
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        await loadProfile(session.user.id)
        return
      }
      if (event === 'SIGNED_IN' && session?.user) {
        await loadProfile(session.user.id)
        resolve()
      }
    })

    return () => {
      subscription.unsubscribe()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
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
      await new Promise(r => setTimeout(r, 600))
      await supabase.from('profiles').upsert(
        { id: data.user.id, email, role },
        { onConflict: 'id' }
      )
    }
  }

  const signOut = async () => {
    clearAuthStorage()
    await supabase.auth.signOut()
    setProfile(null)
    setMarket(null)
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
