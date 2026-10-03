-- ============================================================
-- OFERTA DO DIA — Schema simplificado (admin-only)
-- Cole no SQL Editor do Supabase e execute
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'customer' check (role in ('admin', 'market', 'customer')),
  created_at timestamptz default now()
);

create table if not exists markets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  city text,
  phone text,
  description text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references markets(id) on delete cascade,
  name text not null,
  image_url text,
  category text not null,
  price numeric(10,2) not null,
  unit text not null,
  note text,
  valid_until date,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists offer_views (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references offers(id) on delete cascade,
  viewed_at timestamptz default now()
);

create table if not exists whatsapp_shares (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references markets(id) on delete cascade,
  offer_id uuid references offers(id) on delete cascade,
  quantity int default 1,
  unit_price numeric(10,2),
  shared_at timestamptz default now()
);

alter table profiles enable row level security;
alter table markets enable row level security;
alter table offers enable row level security;
alter table offer_views enable row level security;
alter table whatsapp_shares enable row level security;

create policy "publico le mercados" on markets for select using (active = true);
create policy "publico le ofertas" on offers for select using (active = true);
create policy "publico insere views" on offer_views for insert with check (true);
create policy "publico insere shares" on whatsapp_shares for insert with check (true);

create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

create policy "admin le profiles" on profiles for select using (auth.uid() = id or is_admin());
create policy "admin markets" on markets for all using (is_admin());
create policy "admin offers" on offers for all using (is_admin());

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Após rodar, execute:
-- update profiles set role = 'admin' where email = 'SEU_EMAIL';
