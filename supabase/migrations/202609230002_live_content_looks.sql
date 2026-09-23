-- Persistent customer looks and editable storefront content. No existing data is reset.
begin;
create table if not exists public.saved_looks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  name text not null check (length(trim(name)) between 3 and 60),
  occasion text not null check (occasion in ('work', 'weekend', 'evening')),
  selection jsonb not null check (jsonb_typeof(selection) = 'array' and jsonb_array_length(selection) between 1 and 5),
  created_at timestamptz not null default now()
);
alter table public.saved_looks enable row level security;
grant select, insert, delete on public.saved_looks to authenticated;
drop policy if exists own_saved_looks on public.saved_looks;
create policy own_saved_looks on public.saved_looks to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists saved_looks_owner on public.saved_looks(user_id, created_at desc);

create table if not exists public.site_content (
  key text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object')
);
alter table public.site_content enable row level security;
grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;
drop policy if exists public_site_content on public.site_content;
create policy public_site_content on public.site_content for select to anon, authenticated using (true);
drop policy if exists admin_site_content on public.site_content;
create policy admin_site_content on public.site_content to authenticated
  using (public.is_admin()) with check (public.is_admin());
notify pgrst, 'reload schema';
commit;
