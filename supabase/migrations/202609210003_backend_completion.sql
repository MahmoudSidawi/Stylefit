begin;

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

commit;
