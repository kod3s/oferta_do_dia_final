import { createClient } from '@supabase/supabase-js'
import type { Market, Offer, SavedOffer, Profile } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── AUTH ──────────────────────────────────────────────────────

export const auth = {
  signUp: (email: string, password: string) =>
    supabase.auth.signUp({ email, password }),

  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
    supabase.auth.onAuthStateChange(cb),
}

// ── PROFILES ──────────────────────────────────────────────────

export const profiles = {
  get: async (userId: string): Promise<Profile | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data
  },

  // Admin: listar todos
  list: async (): Promise<Profile[]> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    return data ?? []
  },

  // Admin: promover/rebaixar plano de mercado
  setMarketPlan: async (userId: string, plan: 'free' | 'pro') => {
    const { error } = await supabase
      .from('markets')
      .update({ plan })
      .eq('user_id', userId)
    if (error) throw error
  },

  // Admin: alterar role do usuário
  setRole: async (userId: string, role: 'admin' | 'market' | 'customer') => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
    if (error) throw error
  },
}

// ── MARKETS ───────────────────────────────────────────────────

export const markets = {
  // Mercado: buscar o próprio cadastro
  getMine: async (userId: string): Promise<Market | null> => {
    const { data } = await supabase
      .from('markets')
      .select('*')
      .eq('user_id', userId)
      .single()
    return data
  },

  // Criar mercado no primeiro acesso
  create: async (userId: string, data: Partial<Market>) => {
    const { data: market, error } = await supabase
      .from('markets')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return market
  },

  // Salvar alterações do perfil
  update: async (marketId: string, data: Partial<Market>) => {
    const { error } = await supabase
      .from('markets')
      .update(data)
      .eq('id', marketId)
    if (error) throw error
  },

  // Admin: listar todos os mercados
  list: async (): Promise<Market[]> => {
    const { data } = await supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false })
    return data ?? []
  },

  // Admin: ativar/desativar mercado
  setActive: async (marketId: string, active: boolean) => {
    const { error } = await supabase
      .from('markets')
      .update({ active })
      .eq('id', marketId)
    if (error) throw error
  },
}

// ── OFFERS ────────────────────────────────────────────────────

export const offers = {
  // Público: listar ofertas ativas com dados do mercado
  list: async (category?: string): Promise<Offer[]> => {
    let q = supabase
      .from('offers')
      .select('*, markets(name, city, address)')
      .eq('active', true)
      .gte('valid_until', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })

    if (category && category !== 'Todos') q = q.eq('category', category)

    const { data } = await q
    return data ?? []
  },

  // Mercado: listar todas as próprias (incluindo expiradas)
  listByMarket: async (marketId: string) => {
    const { data } = await supabase
      .from('offer_stats')
      .select('*')
      .eq('market_id', marketId)
      .order('created_at', { ascending: false })
    return data ?? []
  },

  // Criar oferta
  create: async (marketId: string, data: Partial<Offer>) => {
    const { error } = await supabase
      .from('offers')
      .insert({ ...data, market_id: marketId })
    if (error) throw error
  },

  // Editar oferta
  update: async (offerId: string, data: Partial<Offer>) => {
    const { error } = await supabase
      .from('offers')
      .update(data)
      .eq('id', offerId)
    if (error) throw error
  },

  // Remover oferta
  remove: async (offerId: string) => {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId)
    if (error) throw error
  },

  // Registrar visualização
  trackView: async (offerId: string) => {
    await supabase.from('offer_views').insert({ offer_id: offerId })
  },

  // Admin: listar todas as ofertas
  listAll: async () => {
    const { data } = await supabase
      .from('offer_stats')
      .select('*, markets(name)')
      .order('created_at', { ascending: false })
    return data ?? []
  },
}

// ── SAVED OFFERS (lista de compras) ──────────────────────────

export const savedOffers = {
  list: async (userId: string): Promise<SavedOffer[]> => {
    const { data } = await supabase
      .from('saved_offers')
      .select('*, offers(*, markets(name))')
      .eq('user_id', userId)
    return data ?? []
  },

  toggle: async (offerId: string, userId: string) => {
    const { data: existing } = await supabase
      .from('saved_offers')
      .select('id')
      .eq('offer_id', offerId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      await supabase.from('saved_offers').delete().eq('id', existing.id)
      return false
    } else {
      await supabase.from('saved_offers').insert({ offer_id: offerId, user_id: userId })
      return true
    }
  },

  setChecked: async (savedId: string, checked: boolean) => {
    await supabase.from('saved_offers').update({ checked }).eq('id', savedId)
  },

  clear: async (userId: string) => {
    await supabase.from('saved_offers').delete().eq('user_id', userId)
  },
}
