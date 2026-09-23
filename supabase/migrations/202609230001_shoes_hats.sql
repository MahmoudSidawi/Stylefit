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
