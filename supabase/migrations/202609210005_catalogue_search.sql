begin;
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
