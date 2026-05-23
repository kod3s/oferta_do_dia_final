import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../services/supabase'
import { Store, MapPin, ImageIcon } from 'lucide-react'

export function MarketOnboarding({ onCreated }: { onCreated: () => void }) {
  const { profile } = useApp()
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoPreviewError, setLogoPreviewError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!name.trim() || !city.trim()) {
      setError('Nome e cidade são obrigatórios.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error: err } = await supabase.from('markets').insert({
        user_id: profile!.id,
        name: name.trim(),
        city: city.trim(),
        logo_url: logoUrl.trim() || null,
        plan: 'free',
        active: true,
      })
      if (err) throw err
      onCreated()
    } catch (e: any) {
      setError(e.message || 'Erro ao criar mercado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Store className="text-emerald-600" size={26} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Configure seu mercado</h2>
          <p className="text-sm text-gray-500 mt-1">Essas informações aparecerão nas suas ofertas</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Nome do mercado *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Supermercado Central"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              <MapPin size={13} className="inline mr-1" />
              Cidade *
            </label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Ex: São Paulo, SP"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              <ImageIcon size={13} className="inline mr-1" />
              URL do logotipo <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              value={logoUrl}
              onChange={e => { setLogoUrl(e.target.value); setLogoPreviewError(false) }}
              placeholder="https://exemplo.com/logo.png"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
            {logoUrl && !logoPreviewError && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={logoUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                  onError={() => setLogoPreviewError(true)}
                />
                <span className="text-xs text-emerald-600">Logo carregada ✓</span>
              </div>
            )}
            {logoPreviewError && (
              <p className="text-xs text-red-500 mt-1">URL inválida ou imagem não carregou.</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              A logo aparecerá em todas as suas ofertas. Hospede em imgur.com ou similar.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Salvando...' : 'Criar meu mercado'}
          </button>
        </div>
      </div>
    </div>
  )
}
