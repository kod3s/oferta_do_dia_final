create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  user_role text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'customer');
  insert into public.profiles (id, email, role)
  values (new.id, new.email, user_role)
  on conflict (id) do update set role = excluded.role;
  return new;
end;
$$;
