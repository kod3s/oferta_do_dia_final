export interface Market {
  id: string
  name: string
  logo_url?: string | null
  city?: string
  phone?: string
  description?: string
  active: boolean
  created_at: string
}

export interface Offer {
  id: string
  market_id: string
  name: string
  image_url?: string | null
  category: string
  price: number
  unit: string
  note?: string
  valid_until?: string | null
  active: boolean
  created_at: string
  markets?: Pick<Market, 'id' | 'name' | 'logo_url' | 'city'>
}

export const CATEGORIES = [
  'Hortifrúti', 'Carnes', 'Laticínios', 'Padaria',
  'Bebidas', 'Mercearia', 'Limpeza', 'Higiene', 'Outros',
]

export const UNITS = [
  'kg', 'g', 'unidade', 'litro', 'ml',
  'dúzia', 'pacote', 'caixa', 'fardo',
]
