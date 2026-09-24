-- Add merchandise departments without resetting stock, orders or customer data.
begin;
alter table public.products add column if not exists department text;
alter table public.wardrobe_items add column if not exists department text;
update public.products set department = 'men' where department is null and product_id in ('51716184-f837-537b-839c-c8a215c569a2', '8725e9ab-89ac-5e8c-ac32-cca304ef92f3', '61a1681a-7a8f-5553-b682-9172fd229f77', '1278d516-86ea-58a1-9aa4-4f9f7e993d1c', '572b1e84-23cb-524f-9d63-d3e6cc13cb49', 'b4ad99cb-1364-5d17-bd00-b02c3e783781', 'd062127e-6b48-5c05-9b97-868c7f33e1df', '8dec22df-1472-5904-af66-fe2dcb1c6adb');
update public.products set department = 'women' where department is null and product_id in ('90321c1e-cb18-5d5c-8406-52a7b44e7b94', '9179261c-99ca-5bef-915d-549630a30fc4', '97012236-4a8f-5035-aa6d-04b096729177', '9d5f74e3-4e4f-5bb6-98bd-fc9e219e1481', 'a35a99ea-dd8c-5735-ac45-23e0afaa3252', 'd9749be6-9fa2-5f1c-8124-bf6635b5c9f8', '8b8a0d08-d8ab-5bff-8795-750db703821f', 'a614b874-0442-5591-8684-39609af0fccd', '7c8be1ea-4724-5e7b-9fc2-7723528d01eb', '6fcb2e9d-41f6-533b-9e1d-4e84f6ad315a', '233fe4ff-0b5b-5a85-80b9-3bc275bc1dd3', '810ada22-b267-57a7-ba23-cc76de2a145d', '168d03a3-2792-52a1-a3a5-0de3057643de', 'a3690b5e-0fb6-596d-a4b8-bbdd3366067c');
update public.products set department = case when clothing_type in ('dresses', 'skirts') then 'women' else 'unisex' end where department is null;
-- Match demo garments to their product image; unrelated customer items stay unisex.
update public.wardrobe_items w set department = p.department
from public.products p join public.product_variants v using (product_id)
where w.department is null and w.name = p.name
  and split_part(w.image_url, '/', 2) = 'cutout-v2-' || regexp_replace(v.image_url, '^.*/', '');
update public.wardrobe_items set department = case when clothing_type in ('dresses', 'skirts') then 'women' else 'unisex' end where department is null;
alter table public.products alter column department set default 'unisex', alter column department set not null;
alter table public.wardrobe_items alter column department set default 'unisex', alter column department set not null;
alter table public.products drop constraint if exists products_department_check;
alter table public.products add constraint products_department_check check (department in ('men', 'women', 'unisex'));
alter table public.wardrobe_items drop constraint if exists wardrobe_department_check;
alter table public.wardrobe_items add constraint wardrobe_department_check check (department in ('men', 'women', 'unisex'));
create or replace function public.create_product(p_product jsonb, p_variants jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'Administrator access required.'; end if;
  if p_variants is null or jsonb_typeof(p_variants) <> 'array' then raise exception 'Provide at least one variant.'; end if;
  if jsonb_array_length(p_variants) not between 1 and 100 then raise exception 'Provide between 1 and 100 variants.'; end if;
  insert into public.products(category_id, name, description, clothing_type, style, pattern, is_active, department)
  values (p_product->>'category_id', p_product->>'name', coalesce(p_product->>'description', ''),
    p_product->>'clothing_type', coalesce(p_product->>'style', 'casual'), coalesce(p_product->>'pattern', 'solid'),
    coalesce((p_product->>'is_active')::boolean, true), coalesce(p_product->>'department', 'unisex')) returning product_id into v_id;
  insert into public.product_variants(product_id, size, color, price, stock_quantity, image_url, is_active)
  select v_id, x.size, x.color, x.price, x.stock_quantity, x.image_url, coalesce(x.is_active, true)
  from jsonb_to_recordset(p_variants) as x(size text, color text, price numeric, stock_quantity integer, image_url text, is_active boolean);
  return v_id;
end;
$$;

notify pgrst, 'reload schema';
commit;
