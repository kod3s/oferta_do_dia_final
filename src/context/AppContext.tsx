import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { supabase } from '../services/supabase'

interface AppState {
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AppContext = createContext<AppState>({} as AppState)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const ready = useRef(false)

  function done() {
    if (ready.current) return
    ready.current = true
    setLoading(false)
  }

  async function checkAdmin(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
    setIsAdmin(data?.role === 'admin')
  }

  useEffect(() => {
    const timeout = setTimeout(done, 3000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          if (session?.user) await checkAdmin(session.user.id)
          else setIsAdmin(false)
          clearTimeout(timeout)
          done()
          return
        }
        if (event === 'SIGNED_IN' && session?.user) {
          await checkAdmin(session.user.id)
          done()
        }
        if (event === 'SIGNED_OUT') {
          setIsAdmin(false)
          ready.current = false
          done()
        }
      }
    )

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  const signOut = async () => {
    setIsAdmin(false)
    ready.current = false
    await supabase.auth.signOut()
  }

  return (
    <AppContext.Provider value={{ isAdmin, loading, signIn, signOut }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
