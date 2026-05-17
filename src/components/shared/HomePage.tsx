interface HomePageProps {
  setPage: (p: string) => void
}

export function HomePage({ setPage }: HomePageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Hero */}
      <div className="text-center py-20">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          🗺️ Ofertas do bairro, na palma da mão
        </div>
        <h1 className="text-4xl font-medium text-gray-900 mb-4 leading-tight">
          Encontre as melhores promoções<br />dos supermercados perto de você
        </h1>
        <p className="text-gray-500 text-base max-w-md mx-auto mb-8 leading-relaxed">
          Consumidores descobrem ofertas reais. Mercados atraem mais clientes. Simples assim.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => setPage('offers')} className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors">
            Ver ofertas de hoje
          </button>
          <button onClick={() => setPage('auth')} className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Cadastrar meu mercado
          </button>
        </div>
        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-gray-400">
          <span>✓ Gratuito para consumidores</span>
          <span>✓ Sem cadastro obrigatório</span>
          <span>✓ Ofertas verificadas</span>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
        {[
          { icon: '🔍', title: 'Busque por produto ou mercado', desc: 'Filtre por categoria, compare preços e encontre a melhor oferta no menor tempo.' },
          { icon: '🛒', title: 'Monte sua lista de compras', desc: 'Salve as melhores ofertas, marque os itens no mercado e compartilhe no WhatsApp.' },
          { icon: '📊', title: 'Mercados: painel completo', desc: 'Publique ofertas em segundos e veja quantos clientes visualizaram e salvaram.' },
        ].map(f => (
          <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="text-3xl mb-4">{f.icon}</div>
            <h3 className="font-medium text-sm mb-2">{f.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="mb-20">
        <h2 className="text-2xl font-medium text-center mb-2">Planos para mercados</h2>
        <p className="text-sm text-gray-400 text-center mb-8">Consumidores sempre gratuitos.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
          {[
            { name: 'Grátis', price: 'R$ 0', sub: '/mês', items: ['Até 5 ofertas ativas', 'Página do mercado', 'Métricas básicas'], featured: false },
            { name: 'Pro', price: 'R$ 49', sub: '/mês', items: ['Ofertas ilimitadas', 'Destaque na busca local', 'Alertas para clientes', 'Painel analítico completo', 'Suporte prioritário'], featured: true },
          ].map(p => (
            <div key={p.name} className={`rounded-2xl p-6 border ${p.featured ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-white'}`}>
              <h3 className="font-medium mb-1">{p.name}</h3>
              <div className="text-3xl font-semibold mb-4">{p.price}<span className="text-sm font-normal text-gray-400">{p.sub}</span></div>
              <ul className="flex flex-col gap-2 mb-6">
                {p.items.map(i => <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-emerald-500">✓</span>{i}</li>)}
              </ul>
              <button onClick={() => setPage('auth')} className={`w-full py-2.5 text-sm rounded-xl font-medium transition-colors ${p.featured ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {p.featured ? 'Falar com suporte' : 'Começar grátis'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
