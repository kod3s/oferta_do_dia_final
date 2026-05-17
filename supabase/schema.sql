-- ============================================================
-- OFERTA DO DIA — Schema completo
-- Cole no SQL Editor do Supabase e execute
-- ============================================================

-- TABELA: Perfis de usuário (espelha auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'customer' check (role in ('admin', 'market', 'customer')),
  created_at timestamptz default now()
);

-- TABELA: Mercados
create table markets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  cnpj text,
  address text,
  city text,
  state text default 'SP',
  zip text,
  phone text,
  description text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  active boolean default true,
  created_at timestamptz default now()
);

-- TABELA: Ofertas
create table offers (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references markets(id) on delete cascade,
  name text not null,
  emoji text default '🏷️',
  category text not null,
  price numeric(10,2) not null check (price >= 0),
  unit text not null,
  stock int,
  note text,
  valid_until date,
  active boolean default true,
  created_at timestamptz default now()
);

-- TABELA: Lista de compras (salvamentos)
create table saved_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  offer_id uuid references offers(id) on delete cascade,
  checked boolean default false,
  created_at timestamptz default now(),
  unique (user_id, offer_id)
);

-- TABELA: Visualizações (analytics simples, sem JOIN pesado)
create table offer_views (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references offers(id) on delete cascade,
  viewed_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table markets enable row level security;
alter table offers enable row level security;
alter table saved_offers enable row level security;
alter table offer_views enable row level security;

-- PROFILES
create policy "Usuário vê o próprio perfil"
  on profiles for select using (auth.uid() = id);

create policy "Admin vê todos os perfis"
  on profiles for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin atualiza qualquer perfil"
  on profiles for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Trigger: criar perfil automaticamente ao registrar
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, role)
  values (new.id, new.email, 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- MARKETS
create policy "Público vê mercados ativos"
  on markets for select using (active = true);

create policy "Mercado gerencia o próprio cadastro"
  on markets for all using (user_id = auth.uid());

create policy "Admin gerencia todos os mercados"
  on markets for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- OFFERS
create policy "Público vê ofertas ativas"
  on offers for select using (
    active = true
    and (valid_until is null or valid_until >= current_date)
  );

create policy "Mercado gerencia próprias ofertas"
  on offers for all using (
    market_id in (select id from markets where user_id = auth.uid())
  );

create policy "Admin gerencia todas as ofertas"
  on offers for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- SAVED_OFFERS
create policy "Usuário gerencia própria lista"
  on saved_offers for all using (user_id = auth.uid());

-- OFFER_VIEWS
create policy "Qualquer um pode registrar view"
  on offer_views for insert with check (true);

create policy "Mercado vê views das próprias ofertas"
  on offer_views for select using (
    offer_id in (
      select o.id from offers o
      join markets m on o.market_id = m.id
      where m.user_id = auth.uid()
    )
  );

create policy "Admin vê todas as views"
  on offer_views for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- VIEWS UTILITÁRIAS
-- ============================================================

-- Resumo de métricas por oferta (usado no painel do mercado)
create or replace view offer_stats as
select
  o.id,
  o.name,
  o.emoji,
  o.category,
  o.price,
  o.unit,
  o.valid_until,
  o.active,
  o.market_id,
  count(distinct ov.id) as views,
  count(distinct so.id) as saves
from offers o
left join offer_views ov on ov.offer_id = o.id
left join saved_offers so on so.offer_id = o.id
group by o.id;

-- ============================================================
-- PRIMEIRO ADMIN
-- Após criar sua conta no app, rode este comando
-- substituindo o e-mail pelo seu:
-- ============================================================
-- update profiles set role = 'admin' where email = 'seu@email.com';
