export type Role = 'admin' | 'market' | 'customer'
export type Plan = 'free' | 'pro'

export interface Profile {
  id: string
  email: string
  role: Role
  created_at: string
}

export interface Market {
  id: string
  user_id: string
  name: string
  cnpj?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  description?: string
  plan: Plan
  active: boolean
  created_at: string
}

export interface Offer {
  id: string
  market_id: string
  name: string
  image_url?: string
  category: string
  price: number
  unit: string
  stock?: number
  note?: string
  valid_until?: string
  active: boolean
  created_at: string
  markets?: Pick<Market, 'name' | 'city' | 'address'>
}

export interface OfferStats extends Offer {
  views: number
  saves: number
}

export interface SavedOffer {
  id: string
  user_id: string
  offer_id: string
  checked: boolean
  created_at: string
  offers?: Offer & { markets?: Pick<Market, 'name'> }
}

export const CATEGORIES = [
  'Hortifrúti', 'Carnes', 'Laticínios', 'Padaria',
  'Bebidas', 'Limpeza', 'Higiene', 'Congelados', 'Outros',
]

export const UNITS = [
  'kg', 'g', 'unidade', 'litro', 'ml',
  'dúzia', 'pacote', 'caixa', 'fardo',
]
