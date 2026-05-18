import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react'

import type { Profile, Market } from '../types'
import { auth, profiles, markets } from '../services/supabase'

interface AppState {
  profile: Profile | null
  market: Market | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshMarket: () => Promise<void>
}

const AppContext = createContext<AppState>({} as AppState)

export function AppProvider({
  children
}: {
  children: ReactNode
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [market, setMarket] = useState<Market | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadUser(userId: string) {
    try {
      const p = await profiles.get(userId)

      if (!p) {
        setProfile(null)
        setMarket(null)
        return
      }

      setProfile(p)

      if (p.role === 'market') {
        const m = await markets.getMine(userId)
        setMarket(m)
      } else {
        setMarket(null)
      }

    } catch (err) {
      console.error('Erro loadUser:', err)

      setProfile(null)
      setMarket(null)
    }
  }

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const { data } = await auth.getSession()

        if (!mounted) return

        if (data.session?.user) {
          await loadUser(data.session.user.id)
        }

      } catch (err) {
        console.error('Erro sessão:', err)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    init()

    const {
      data: { subscription }
    } = auth.onAuthStateChange(async (_event, session) => {

      try {
        if (session?.user) {
          await loadUser(session.user.id)
        } else {
          setProfile(null)
          setMarket(null)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (
    email: string,
    password: string
  ) => {
    const response = await auth.signIn(email, password)

    if (response.error) {
      throw response.error
    }
  }

  const signUp = async (
    email: string,
    password: string
  ) => {
    const response = await auth.signUp(email, password)

    if (response.error) {
      throw response.error
    }
  }

  const signOut = async () => {
    await auth.signOut()

    setProfile(null)
    setMarket(null)
  }

  const refreshMarket = async () => {
    if (!profile?.id) return

    try {
      const m = await markets.getMine(profile.id)
      setMarket(m)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <AppContext.Provider
      value={{
        profile,
        market,
        loading,
        signIn,
        signUp,
        signOut,
        refreshMarket
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
