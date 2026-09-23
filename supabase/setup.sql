-- StyleFit schema for a NEW Supabase project. Run once in SQL Editor, then run seed.sql.
-- Alternative to the migrations: do not run this on an already migrated project.
begin;

drop policy if exists wardrobe_images_read on storage.objects;
drop policy if exists wardrobe_images_upload on storage.objects;
drop policy if exists wardrobe_images_delete on storage.objects;
drop policy if exists product_images_read on storage.objects;
drop policy if exists product_images_upload on storage.objects;
drop policy if exists product_images_delete on storage.objects;

drop trigger if exists sync_stylefit_user on auth.users cascade;
drop function if exists public.sync_auth_user cascade;
drop function if exists public.is_admin cascade;
drop function if exists public.set_cart_item cascade;
drop function if exists public.place_order cascade;
drop function if exists public.update_order_status cascade;
drop function if exists public.create_product cascade;
drop function if exists public.reserve_ai_request cascade;
drop function if exists public.change_cart_variant cascade;
drop function if exists public.add_cart_item cascade;
drop function if exists public.browse_products cascade;

drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.wishlist_items cascade;
drop table if exists public.cart_items cascade;
drop table if exists public.wardrobe_items cascade;
drop table if exists public.product_variants cascade;
drop table if exists public.products cascade;
drop table if exists public.categories cascade;
drop table if exists public.users cascade;

-- Source: 202609210001_shop.sql
-- Supabase Auth owns credentials. public.users contains application profile data only.

create table public.users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  email text not null,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  height_cm numeric check (height_cm > 0 and height_cm <= 300),
  weight_kg numeric check (weight_kg > 0 and weight_kg <= 700),
  body_shape text, clothing_size text, skin_tone text,
  created_at timestamptz not null default now()
);
create table public.categories (
  category_id text primary key check (category_id in ('tops', 'bottoms', 'dresses')),
  name text not null unique
);
insert into public.categories values ('tops', 'Tops'), ('bottoms', 'Bottoms'), ('dresses', 'Dresses');

create table public.products (
  product_id uuid primary key default gen_random_uuid(),
  category_id text not null references public.categories,
  name text not null check (length(trim(name)) between 1 and 120),
  description text not null default '',
  clothing_type text not null,
  style text not null default 'casual', pattern text not null default 'solid',
  is_active boolean not null default true,
  check ((category_id = 'tops' and clothing_type in ('t-shirts', 'shirts', 'hoodies'))
    or (category_id = 'bottoms' and clothing_type in ('jeans', 'pants', 'shorts', 'skirts'))
    or (category_id = 'dresses' and clothing_type = 'dresses'))
);
create table public.product_variants (
  variant_id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products,
  size text not null check (length(trim(size)) > 0),
  color text not null check (length(trim(color)) > 0),
  price numeric(10,2) not null check (price > 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url text not null,
  is_active boolean not null default true,
  unique (product_id, size, color)
);
create table public.wardrobe_items (
  wardrobe_item_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users on delete cascade,
  category_id text not null references public.categories,
  name text not null check (length(trim(name)) between 1 and 120),
  image_url text not null check (image_url ~ ('^' || user_id::text || '/[^/]+$') and image_url not like '%..%'),
  color text,
  created_at timestamptz not null default now()
);
create table public.cart_items (
  cart_item_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users on delete cascade,
  variant_id uuid not null references public.product_variants,
  quantity integer not null check (quantity between 1 and 99),
  unique (user_id, variant_id)
);
create table public.wishlist_items (
  wishlist_item_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users on delete cascade,
  product_id uuid not null references public.products,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create table public.orders (
  order_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users,
  recipient_name text not null check (length(trim(recipient_name)) between 1 and 120),
  phone text not null check (length(phone) between 7 and 30 and phone ~ '^\+?[0-9 ()-]+$'),
  delivery_address text not null check (length(trim(delivery_address)) between 8 and 500),
  total_amount numeric(12,2) not null check (total_amount > 0),
  status text not null default 'placed' check (status in ('placed', 'shipped', 'delivered', 'cancelled')),
  is_paid boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.order_items (
  order_item_id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders,
  variant_id uuid not null references public.product_variants,
  product_name text not null, size text not null, color text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price > 0)
);
create index on public.products(category_id);
create index on public.wardrobe_items(user_id);
create index on public.orders(user_id);
create index on public.order_items(order_id);
create index on public.order_items(variant_id);

create function public.sync_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users(user_id, name, email)
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'Customer'), 120), coalesce(new.email, ''))
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;
create trigger sync_stylefit_user after insert or update of email on auth.users
for each row execute function public.sync_auth_user();
insert into public.users(user_id, name, email)
select id, left(coalesce(nullif(trim(raw_user_meta_data->>'name'), ''), 'Customer'), 120), coalesce(email, '') from auth.users
on conflict do nothing;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users where user_id = auth.uid() and role = 'admin');
$$;

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Explicit grants prevent direct REST callers from escalating role or writing orders/stock.
revoke all on public.users, public.categories, public.products, public.product_variants,
  public.wardrobe_items, public.cart_items, public.wishlist_items, public.orders, public.order_items
  from anon, authenticated;
grant select on public.categories, public.products, public.product_variants to anon, authenticated;
grant select on public.users, public.wardrobe_items, public.cart_items, public.wishlist_items,
  public.orders, public.order_items to authenticated;
grant update (name, height_cm, weight_kg, body_shape, clothing_size, skin_tone) on public.users to authenticated;
grant insert, update, delete on public.wardrobe_items, public.wishlist_items to authenticated;
grant update on public.products to authenticated;
grant insert, update on public.product_variants to authenticated;

create policy own_profile_read on public.users for select to authenticated using (user_id = auth.uid());
create policy own_profile_update on public.users for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy categories_read on public.categories for select to anon, authenticated using (true);
create policy products_read on public.products for select to anon, authenticated using (is_active or public.is_admin());
create policy products_admin on public.products for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy variants_read on public.product_variants for select to anon, authenticated
using (public.is_admin() or (is_active and exists (
  select 1 from public.products p where p.product_id = product_variants.product_id and p.is_active)));
create policy variants_admin_insert on public.product_variants for insert to authenticated with check (public.is_admin());
create policy variants_admin_update on public.product_variants for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy own_wardrobe on public.wardrobe_items for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_cart_read on public.cart_items for select to authenticated using (user_id = auth.uid());
create policy own_wishlist on public.wishlist_items for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy orders_read on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy order_items_read on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.order_id = order_items.order_id and (o.user_id = auth.uid() or public.is_admin())));

-- Cart mutation and checkout serialize per user. Inventory locks are ordered by UUID
-- across users to avoid deadlocks. A cleared cart makes double submissions harmless.
create function public.set_cart_item(p_variant_id uuid, p_quantity integer) returns void
language plpgsql security definer set search_path = '' as $$
declare v_stock integer;
begin
  if auth.uid() is null then raise exception 'Sign in to continue.'; end if;
  perform 1 from public.users where user_id = auth.uid() for update;
  if p_quantity is null or p_quantity < 0 or p_quantity > 99 then raise exception 'Quantity must be between 0 and 99.'; end if;
  if p_quantity = 0 then
    delete from public.cart_items where user_id = auth.uid() and variant_id = p_variant_id;
    return;
  end if;
  select v.stock_quantity into v_stock from public.product_variants v
  join public.products p using (product_id)
  where v.variant_id = p_variant_id and v.is_active and p.is_active;
  if v_stock is null or v_stock < p_quantity then raise exception 'This size or color is unavailable in the requested quantity.'; end if;
  insert into public.cart_items(user_id, variant_id, quantity) values (auth.uid(), p_variant_id, p_quantity)
  on conflict (user_id, variant_id) do update set quantity = excluded.quantity;
end;
$$;

create function public.place_order(p_recipient_name text, p_phone text, p_delivery_address text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_order uuid; v_total numeric(12,2); v_item record;
begin
  if auth.uid() is null then raise exception 'Sign in to continue.'; end if;
  perform 1 from public.users where user_id = auth.uid() for update;
  if not exists (select 1 from public.cart_items where user_id = auth.uid()) then raise exception 'Your cart is empty.'; end if;
  -- Freeze the product names/active flags as well as variant price and inventory.
  perform p.product_id from public.products p
  where p.product_id in (select v.product_id from public.product_variants v join public.cart_items c using (variant_id) where c.user_id = auth.uid())
  order by p.product_id for share;
  perform v.variant_id from public.product_variants v join public.cart_items c using (variant_id)
  where c.user_id = auth.uid() order by v.variant_id for update of v;
  for v_item in select c.quantity, v.stock_quantity, v.is_active as variant_active, p.is_active as product_active
    from public.cart_items c join public.product_variants v using (variant_id) join public.products p using (product_id)
    where c.user_id = auth.uid()
  loop
    if not v_item.variant_active or not v_item.product_active or v_item.quantity > v_item.stock_quantity
    then raise exception 'An item is unavailable or has insufficient stock. Review your cart.'; end if;
  end loop;
  select sum(c.quantity * v.price) into v_total from public.cart_items c join public.product_variants v using (variant_id)
  where c.user_id = auth.uid();
  insert into public.orders(user_id, recipient_name, phone, delivery_address, total_amount)
  values (auth.uid(), trim(p_recipient_name), trim(p_phone), trim(p_delivery_address), v_total) returning order_id into v_order;
  insert into public.order_items(order_id, variant_id, product_name, size, color, quantity, unit_price)
  select v_order, v.variant_id, p.name, v.size, v.color, c.quantity, v.price
  from public.cart_items c join public.product_variants v using (variant_id) join public.products p using (product_id)
  where c.user_id = auth.uid();
  update public.product_variants v set stock_quantity = v.stock_quantity - c.quantity
  from public.cart_items c where c.variant_id = v.variant_id and c.user_id = auth.uid();
  delete from public.cart_items where user_id = auth.uid();
  return v_order;
end;
$$;

create function public.update_order_status(p_order_id uuid, p_status text, p_is_paid boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare v_status text;
begin
  if not public.is_admin() then raise exception 'Administrator access required.'; end if;
  if p_status is null or p_status not in ('placed', 'shipped', 'delivered', 'cancelled') or p_is_paid is null then raise exception 'Invalid order status.'; end if;
  select status into v_status from public.orders where order_id = p_order_id for update;
  if v_status is null then raise exception 'Order not found.'; end if;
  if p_status <> v_status and not ((v_status = 'placed' and p_status in ('shipped', 'cancelled'))
     or (v_status = 'shipped' and p_status = 'delivered')) then raise exception 'This status transition is not allowed.'; end if;
  if p_status = 'cancelled' and p_is_paid then raise exception 'A cancelled cash-on-delivery order cannot be paid.'; end if;
  if p_status = 'cancelled' and v_status = 'placed' then
    perform v.variant_id from public.product_variants v join public.order_items i using (variant_id)
    where i.order_id = p_order_id order by v.variant_id for update of v;
    update public.product_variants v set stock_quantity = v.stock_quantity + i.quantity
    from public.order_items i where i.variant_id = v.variant_id and i.order_id = p_order_id;
  end if;
  update public.orders set status = p_status, is_paid = p_is_paid where order_id = p_order_id;
end;
$$;

create function public.create_product(p_product jsonb, p_variants jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'Administrator access required.'; end if;
  if p_variants is null or jsonb_typeof(p_variants) <> 'array' then raise exception 'Provide at least one variant.'; end if;
  if jsonb_array_length(p_variants) not between 1 and 100 then raise exception 'Provide between 1 and 100 variants.'; end if;
  insert into public.products(category_id, name, description, clothing_type, style, pattern, is_active)
  values (p_product->>'category_id', p_product->>'name', coalesce(p_product->>'description', ''),
    p_product->>'clothing_type', coalesce(p_product->>'style', 'casual'), coalesce(p_product->>'pattern', 'solid'),
    coalesce((p_product->>'is_active')::boolean, true)) returning product_id into v_id;
  insert into public.product_variants(product_id, size, color, price, stock_quantity, image_url, is_active)
  select v_id, x.size, x.color, x.price, x.stock_quantity, x.image_url, coalesce(x.is_active, true)
  from jsonb_to_recordset(p_variants) as x(size text, color text, price numeric, stock_quantity integer, image_url text, is_active boolean);
  return v_id;
end;
$$;

revoke all on function public.sync_auth_user() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.set_cart_item(uuid, integer) from public;
revoke all on function public.place_order(text, text, text) from public;
revoke all on function public.update_order_status(uuid, text, boolean) from public;
revoke all on function public.create_product(jsonb, jsonb) from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.set_cart_item(uuid, integer), public.place_order(text, text, text),
  public.update_order_status(uuid, text, boolean), public.create_product(jsonb, jsonb) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('wardrobe', 'wardrobe', false, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy wardrobe_images_read on storage.objects for select to authenticated
using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);
create policy wardrobe_images_upload on storage.objects for insert to authenticated
with check (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);
create policy wardrobe_images_delete on storage.objects for delete to authenticated
using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);

-- Source: 202609210003_backend_completion.sql
alter table public.products add column slug text unique;
grant update(name) on public.categories to authenticated;
create policy categories_admin_update on public.categories for update to authenticated
using (public.is_admin()) with check (public.is_admin());
alter table public.wardrobe_items
  add column clothing_type text,
  add column style text,
  add column pattern text,
  add column material text,
  add column size text,
  add constraint wardrobe_type_category check (clothing_type is null
    or (category_id = 'tops' and clothing_type in ('t-shirts', 'shirts', 'hoodies'))
    or (category_id = 'bottoms' and clothing_type in ('jeans', 'pants', 'shorts', 'skirts'))
    or (category_id = 'dresses' and clothing_type = 'dresses'));

-- Shared rate counters live with the account, not in an AI history table.
alter table public.users
  add column ai_window_started_at timestamptz,
  add column ai_requests_used integer not null default 0 check (ai_requests_used >= 0);

create function public.reserve_ai_request() returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_start timestamptz; v_count integer;
begin
  if auth.uid() is null then raise exception 'Sign in to continue.'; end if;
  select ai_window_started_at, ai_requests_used into v_start, v_count
  from public.users where user_id = auth.uid() for update;
  if not found then raise exception 'Profile not found.'; end if;
  if v_start is null or v_start <= clock_timestamp() - interval '1 minute' then
    update public.users set ai_window_started_at = clock_timestamp(), ai_requests_used = 1 where user_id = auth.uid();
    return true;
  end if;
  if v_count >= 8 then return false; end if;
  update public.users set ai_requests_used = ai_requests_used + 1 where user_id = auth.uid();
  return true;
end;
$$;
revoke all on function public.reserve_ai_request() from public;
grant execute on function public.reserve_ai_request() to authenticated;

-- Rename/move a cart selection without two independent HTTP writes.
create function public.change_cart_variant(p_from_variant uuid, p_to_variant uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_quantity integer; v_existing integer; v_stock integer;
begin
  if auth.uid() is null then raise exception 'Sign in to continue.'; end if;
  perform 1 from public.users where user_id = auth.uid() for update;
  if p_from_variant = p_to_variant then return; end if;
  select quantity into v_quantity from public.cart_items where user_id = auth.uid() and variant_id = p_from_variant;
  if not found then raise exception 'Cart item not found.'; end if;
  if not exists (select 1 from public.product_variants a join public.product_variants b using (product_id)
                 where a.variant_id = p_from_variant and b.variant_id = p_to_variant)
  then raise exception 'Choose another variant of the same product.'; end if;
  select quantity into v_existing from public.cart_items where user_id = auth.uid() and variant_id = p_to_variant;
  v_quantity := v_quantity + coalesce(v_existing, 0);
  select v.stock_quantity into v_stock from public.product_variants v join public.products p using (product_id)
  where v.variant_id = p_to_variant and v.is_active and p.is_active;
  if v_stock is null or v_stock < v_quantity or v_quantity > 99 then raise exception 'The selected variant has insufficient stock.'; end if;
  insert into public.cart_items(user_id, variant_id, quantity) values (auth.uid(), p_to_variant, v_quantity)
  on conflict (user_id, variant_id) do update set quantity = excluded.quantity;
  delete from public.cart_items where user_id = auth.uid() and variant_id = p_from_variant;
end;
$$;
revoke all on function public.change_cart_variant(uuid, uuid) from public;
grant execute on function public.change_cart_variant(uuid, uuid) to authenticated;

create function public.add_cart_item(p_variant_id uuid, p_quantity integer) returns void
language plpgsql security definer set search_path = '' as $$
declare v_quantity integer;
begin
  if auth.uid() is null then raise exception 'Sign in to continue.'; end if;
  if p_quantity is null or p_quantity not between 1 and 99 then raise exception 'Quantity must be between 1 and 99.'; end if;
  perform 1 from public.users where user_id = auth.uid() for update;
  select quantity into v_quantity from public.cart_items where user_id = auth.uid() and variant_id = p_variant_id;
  perform public.set_cart_item(p_variant_id, coalesce(v_quantity, 0) + p_quantity);
end;
$$;
revoke all on function public.add_cart_item(uuid, integer) from public;
grant execute on function public.add_cart_item(uuid, integer) to authenticated;

-- Product images are public; only admins may publish or delete them.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;
create policy product_images_read on storage.objects for select to anon, authenticated using (bucket_id = 'products');
create policy product_images_upload on storage.objects for insert to authenticated
with check (bucket_id = 'products' and public.is_admin());
create policy product_images_delete on storage.objects for delete to authenticated
using (bucket_id = 'products' and public.is_admin());

-- Source: 202609210005_catalogue_search.sql
create function public.browse_products(
  p_category text default null, p_query text default '', p_size text default null,
  p_color text default null, p_min_price numeric default 0, p_max_price numeric default null,
  p_sort text default 'name', p_limit integer default 50, p_offset integer default 0
) returns jsonb language sql stable security invoker set search_path = '' as $$
  with eligible as (
    select p.*, (select min(v.price) from public.product_variants v where v.product_id = p.product_id and v.is_active) as min_price
    from public.products p
    where p.is_active and (p_category is null or p.category_id = p_category)
      and strpos(lower(p.name), lower(coalesce(p_query, ''))) > 0
      and exists (select 1 from public.product_variants v where v.product_id = p.product_id and v.is_active
        and (p_size is null or v.size = p_size) and (p_color is null or v.color = p_color)
        and v.price >= coalesce(p_min_price, 0) and (p_max_price is null or v.price <= p_max_price))
  ), page as (
    select * from eligible order by
      case when p_sort = 'price_asc' then min_price end asc,
      case when p_sort = 'price_desc' then min_price end desc,
      case when p_sort = 'name' then name end asc, product_id
    limit greatest(1, least(coalesce(p_limit, 50), 100)) offset greatest(0, coalesce(p_offset, 0))
  )
  select jsonb_build_object('total', (select count(*) from eligible), 'items', coalesce((
    select jsonb_agg(to_jsonb(page) - 'min_price' || jsonb_build_object('product_variants', (
      select jsonb_agg(to_jsonb(v) order by v.size, v.color) from public.product_variants v
      where v.product_id = page.product_id and v.is_active
    ))) from page
  ), '[]'::jsonb));
$$;
revoke all on function public.browse_products(text,text,text,text,numeric,numeric,text,integer,integer) from public;
grant execute on function public.browse_products(text,text,text,text,numeric,numeric,text,integer,integer) to anon, authenticated;

commit;

-- Admins can view accounts and edit profile fields; role and credentials remain protected.
create policy admin_profiles_read on public.users for select to authenticated
using (public.is_admin());
create policy admin_profiles_update on public.users for update to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Add footwear and hats without changing existing users, inventory or orders.
begin;
alter table public.categories drop constraint if exists categories_category_id_check;
alter table public.categories add constraint categories_category_id_check
  check (category_id in ('tops', 'bottoms', 'dresses', 'shoes', 'hats'));
insert into public.categories(category_id, name) values ('shoes', 'Shoes'), ('hats', 'Hats') on conflict (category_id) do nothing;
alter table public.products drop constraint if exists products_check;
alter table public.products add constraint products_check check (
  (category_id = 'tops' and clothing_type in ('t-shirts', 'shirts', 'hoodies')) or
  (category_id = 'bottoms' and clothing_type in ('jeans', 'pants', 'shorts', 'skirts')) or
  (category_id = 'dresses' and clothing_type = 'dresses') or
  (category_id = 'shoes' and clothing_type = 'shoes') or
  (category_id = 'hats' and clothing_type = 'hats'));
alter table public.wardrobe_items drop constraint if exists wardrobe_type_category;
alter table public.wardrobe_items add constraint wardrobe_type_category check (clothing_type is null or
  (category_id = 'tops' and clothing_type in ('t-shirts', 'shirts', 'hoodies')) or
  (category_id = 'bottoms' and clothing_type in ('jeans', 'pants', 'shorts', 'skirts')) or
  (category_id = 'dresses' and clothing_type = 'dresses') or
  (category_id = 'shoes' and clothing_type = 'shoes') or
  (category_id = 'hats' and clothing_type = 'hats'));
notify pgrst, 'reload schema';
commit;

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
