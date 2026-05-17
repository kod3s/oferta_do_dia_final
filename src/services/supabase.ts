/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js'
import type { Market, Offer, SavedOffer, Profile } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const auth = {
  signUp: async (email: string, password: string, role: 'customer' | 'market' = 'customer') => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        role,
      })
    }
    return { data, error }
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (
    cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]
  ) => supabase.auth.onAuthStateChange(cb),
}

export const profiles = {
  get: async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) { console.error(error); return null }
    return data
  },

  list: async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from('profiles').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  setMarketPlan: async (userId: string, plan: 'free' | 'pro') => {
    const { error } = await supabase.from('markets').update({ plan }).eq('user_id', userId)
    if (error) throw error
  },

  setRole: async (userId: string, role: 'admin' | 'market' | 'customer') => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (error) throw error
  },
}

export const markets = {
  getMine: async (userId: string): Promise<Market | null> => {
    const { data, error } = await supabase
      .from('markets').select('*').eq('user_id', userId).maybeSingle()
    if (error) { console.error(error); return null }
    return data
  },

  create: async (userId: string, data: Partial<Market>) => {
    const { data: market, error } = await supabase
      .from('markets').insert({ ...data, user_id: userId }).select().single()
    if (error) throw error
    return market
  },

  update: async (marketId: string, data: Partial<Market>) => {
    const { error } = await supabase.from('markets').update(data).eq('id', marketId)
    if (error) throw error
  },

  list: async (): Promise<Market[]> => {
    const { data, error } = await supabase
      .from('markets').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  setActive: async (marketId: string, active: boolean) => {
    const { error } = await supabase.from('markets').update({ active }).eq('id', marketId)
    if (error) throw error
  },
}

export const offers = {
  list: async (category?: string): Promise<Offer[]> => {
    let q = supabase
      .from('offers').select('*, markets(name, city, address)')
      .eq('active', true)
      .gte('valid_until', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
    if (category && category !== 'Todos') q = q.eq('category', category)
    const { data, error } = await q
    if (error) throw error
    return data ?? []
  },

  listByMarket: async (marketId: string) => {
    const { data, error } = await supabase
      .from('offers').select('*').eq('market_id', marketId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  create: async (marketId: string, data: Partial<Offer>) => {
    const { error } = await supabase.from('offers').insert({ ...data, market_id: marketId })
    if (error) throw error
  },

  update: async (offerId: string, data: Partial<Offer>) => {
    const { error } = await supabase.from('offers').update(data).eq('id', offerId)
    if (error) throw error
  },

  remove: async (offerId: string) => {
    const { error } = await supabase.from('offers').delete().eq('id', offerId)
    if (error) throw error
  },

  trackView: async (offerId: string) => {
    await supabase.from('offer_views').insert({ offer_id: offerId })
  },

  listAll: async () => {
    const { data, error } = await supabase
      .from('offers').select('*, markets(name)').order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },
}

export const savedOffers = {
  list: async (userId: string): Promise<SavedOffer[]> => {
    const { data, error } = await supabase
      .from('saved_offers').select('*, offers(*, markets(name))').eq('user_id', userId)
    if (error) throw error
    return data ?? []
  },

  toggle: async (offerId: string, userId: string) => {
    const { data: existing } = await supabase
      .from('saved_offers').select('id').eq('offer_id', offerId).eq('user_id', userId).maybeSingle()
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
