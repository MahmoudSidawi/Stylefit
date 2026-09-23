import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

// Actual PostgreSQL RLS/functions, with a minimal Supabase Auth/Storage schema.
// This does not simulate Supabase's HTTP services or object storage bytes.
const db = new PGlite()
const alice = '11111111-1111-4111-8111-111111111111'
const bob = '22222222-2222-4222-8222-222222222222'
const admin = '33333333-3333-4333-8333-333333333333'
let variant, product, order
async function identity(id, role = 'authenticated') {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id ?? ''])
  await db.exec(`set role ${role}`)
}
async function scalar(sql, params = []) {
  const { rows } = await db.query(sql, params)
  return Object.values(rows[0])[0]
}

before(async () => {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(), bucket_id text, name text);
    create function storage.foldername(name text) returns text[] language sql immutable as
      $$ select string_to_array(name, '/') $$;
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated;
    grant select, insert, delete on storage.objects to authenticated;
  `)
  for (const migration of ['202609210001_shop.sql', '202609210002_sample_catalogue.sql', '202609210003_backend_completion.sql', '202609210004_expanded_catalogue.sql', '202609210005_catalogue_search.sql', '202609220001_admin_accounts.sql', '202609230001_shoes_hats.sql', '202609230002_live_content_looks.sql']) {
    await db.exec(await readFile(new URL(`../migrations/${migration}`, import.meta.url), 'utf8'))
  }
  for (const id of [alice, bob, admin]) {
    await db.query('insert into auth.users(id, email, raw_user_meta_data) values ($1, $2, $3)',
      [id, `${id}@example.test`, JSON.stringify({ name: 'Test', role: 'admin' })])
  }
  assert.equal(await scalar('select role from public.users where user_id = $1', [alice]), 'customer')
  await db.query("update public.users set role = 'admin' where user_id = $1", [admin])
  const { rows } = await db.query("select variant_id, product_id from public.product_variants where size = 'M' order by variant_id limit 1")
  ;({ variant_id: variant, product_id: product } = rows[0])
})
after(async () => { await db.close() })

test('saved looks are private and storefront content is editable only by admins', async () => {
  await identity(alice)
  const { rows: [look] } = await db.query("insert into public.saved_looks(user_id,name,occasion,selection) values ($1,'Weekend outfit','weekend',$2) returning id", [alice, JSON.stringify([{ garmentId: product + ':white', size: 'M' }])])
  await identity(bob)
  assert.equal(await scalar('select count(*)::int from public.saved_looks'), 0)
  await assert.rejects(db.query("insert into public.saved_looks(user_id,name,occasion,selection) values ($1,'Stolen look','weekend',$2)", [alice, '[{"garmentId":"x","size":"M"}]']), /row-level security/)
  await db.query('delete from public.saved_looks where id = $1', [look.id])
  await identity(alice)
  assert.equal(await scalar('select count(*)::int from public.saved_looks'), 1)
  await db.query('delete from public.saved_looks where id = $1', [look.id])
  await assert.rejects(db.query("insert into public.site_content values ('test','{}')"), /row-level security/)
  await identity(admin)
  await db.query("insert into public.site_content values ('test','{\"title\":\"Database title\"}')")
  await identity(null, 'anon')
  assert.equal(await scalar("select data->>'title' from public.site_content where key='test'"), 'Database title')
  await identity(admin)
  await db.query("delete from public.site_content where key='test'")
})

test('shoes and hats save with valid categories and reject mismatched types', async () => {
  await identity(admin)
  for (const category of ['shoes', 'hats']) {
    const { rows: [item] } = await db.query(
      'insert into public.wardrobe_items(user_id, category_id, clothing_type, name, image_url) values ($1,$2,$2,$2,$3) returning wardrobe_item_id',
      [admin, category, `${admin}/${category}.jpg`])
    await assert.rejects(db.query("update public.wardrobe_items set clothing_type = 'jeans' where wardrobe_item_id = $1", [item.wardrobe_item_id]), /check constraint/)
    await db.query('delete from public.wardrobe_items where wardrobe_item_id = $1', [item.wardrobe_item_id])
  }
})

test('anonymous browsing exposes only active products and variants', async () => {
  await identity(null, 'anon')
  assert.equal(await scalar('select count(*)::int from public.categories'), 5)
  assert.equal(await scalar('select count(*)::int from public.products'), 24)
  await assert.rejects(db.query('select * from public.users'), /permission denied/)
  await assert.rejects(db.query('select public.place_order($1,$2,$3)', ['Test', '1234567', 'Street 123']), /permission denied/)
  await identity(admin)
  await db.query('update public.products set is_active = false where product_id = $1', [product])
  await identity(null, 'anon')
  assert.equal(await scalar('select count(*)::int from public.product_variants where product_id = $1', [product]), 0)
  await identity(admin)
  await db.query('update public.products set is_active = true where product_id = $1', [product])
})

test('profiles cannot escalate roles or read another account', async () => {
  await identity(alice)
  assert.equal(await scalar('select count(*)::int from public.users'), 1)
  await assert.rejects(db.query("update public.users set role = 'admin' where user_id = $1", [alice]), /permission denied/)
  assert.equal((await db.query("update public.users set name = 'Intruder' where user_id = $1 returning *", [bob])).rows.length, 0)
  assert.equal(await scalar('select public.is_admin()'), false)
})

test('wishlist and private wardrobe enforce ownership against direct SQL clients', async () => {
  await identity(alice)
  await db.query('insert into public.wishlist_items(user_id, product_id) values ($1,$2)', [alice, product])
  await assert.rejects(db.query('insert into public.wishlist_items(user_id, product_id) values ($1,$2)', [bob, product]), /row-level security/)
  await db.query("insert into public.wardrobe_items(user_id, category_id, name, image_url) values ($1, 'tops', 'Shirt', $2)", [alice, `${alice}/photo.jpg`])
  await assert.rejects(db.query("insert into public.wardrobe_items(user_id, category_id, name, image_url) values ($1, 'tops', 'Shirt', $2)", [alice, `${bob}/photo.jpg`]), /check constraint/)
  await db.query("insert into storage.objects(bucket_id, name) values ('wardrobe', $1)", [`${alice}/photo.jpg`])
  await assert.rejects(db.query("insert into storage.objects(bucket_id, name) values ('wardrobe', $1)", [`${bob}/photo.jpg`]), /row-level security/)
  await identity(bob)
  assert.equal(await scalar('select count(*)::int from public.wishlist_items'), 0)
  assert.equal(await scalar('select count(*)::int from public.wardrobe_items'), 0)
  assert.equal(await scalar('select count(*)::int from storage.objects'), 0)
  assert.equal((await db.query('delete from public.wardrobe_items returning *')).rows.length, 0)
})

test('cart validates stock and blocks direct unchecked writes', async () => {
  await identity(alice)
  await assert.rejects(db.query('insert into public.cart_items(user_id, variant_id, quantity) values ($1,$2,1)', [alice, variant]), /permission denied/)
  await assert.rejects(db.query('select public.set_cart_item($1, 21)', [variant]), /unavailable/)
  await assert.rejects(db.query('select public.set_cart_item($1, -1)', [variant]), /Quantity/)
  await db.query('select public.set_cart_item($1, 2)', [variant])
  await identity(bob)
  assert.equal(await scalar('select count(*)::int from public.cart_items'), 0)
})

test('checkout takes authoritative prices, snapshots items, decrements stock and clears cart atomically', async () => {
  await identity(alice)
  const price = Number(await scalar('select price from public.product_variants where variant_id = $1', [variant]))
  order = await scalar('select public.place_order($1,$2,$3)', ['Alice', '+961 1234567', 'Street 123, Beirut'])
  assert.equal(Number(await scalar('select total_amount from public.orders where order_id = $1', [order])), price * 2)
  assert.equal(await scalar('select stock_quantity from public.product_variants where variant_id = $1', [variant]), 18)
  assert.equal(await scalar('select count(*)::int from public.cart_items'), 0)
  assert.equal(await scalar('select count(*)::int from public.order_items where order_id = $1', [order]), 1)
  await assert.rejects(db.query('select public.place_order($1,$2,$3)', ['Alice', '1234567', 'Street 123']), /empty/)
  await identity(bob)
  assert.equal(await scalar('select count(*)::int from public.orders'), 0)
  assert.equal(await scalar('select count(*)::int from public.order_items'), 0)
  await assert.rejects(db.query("select public.update_order_status($1, 'cancelled', false)", [order]), /Administrator/)
})

test('cancellation restores inventory exactly once and rejects invalid transitions', async () => {
  await identity(admin)
  await db.query("select public.update_order_status($1, 'cancelled', false)", [order])
  await db.query("select public.update_order_status($1, 'cancelled', false)", [order])
  assert.equal(await scalar('select stock_quantity from public.product_variants where variant_id = $1', [variant]), 20)
  await assert.rejects(db.query("select public.update_order_status($1, 'placed', false)", [order]), /transition/)
  await assert.rejects(db.query("select public.update_order_status($1, 'cancelled', true)", [order]), /cannot be paid/)
})

test('stock changing after adding to cart rolls back the entire checkout', async () => {
  await identity(alice)
  await db.query('select public.set_cart_item($1, 3)', [variant])
  await identity(admin)
  await db.query('update public.product_variants set stock_quantity = 1 where variant_id = $1', [variant])
  await identity(alice)
  await assert.rejects(db.query('select public.place_order($1,$2,$3)', ['Alice', '1234567', 'Street 123']), /insufficient stock/)
  assert.equal(await scalar('select quantity from public.cart_items where variant_id = $1', [variant]), 3)
  assert.equal(await scalar('select stock_quantity from public.product_variants where variant_id = $1', [variant]), 1)
  assert.equal(await scalar('select count(*)::int from public.orders'), 1)
})

test('admin product creation rolls back if variants are invalid', async () => {
  await identity(admin)
  const payload = JSON.stringify({ name: 'Test Shirt', category_id: 'tops', clothing_type: 'shirts' })
  await assert.rejects(db.query('select public.create_product($1,$2)', [payload, '[]']), /variants/)
  await assert.rejects(db.query('select public.create_product($1,$2)', [payload, JSON.stringify([
    { size: 'M', color: 'white', price: -1, stock_quantity: 5, image_url: '/clothes/basic-tee.svg' },
  ])]), /check constraint/)
  assert.equal(await scalar("select count(*)::int from public.products where name = 'Test Shirt'"), 0)
  const id = await scalar('select public.create_product($1,$2)', [payload, JSON.stringify([
    { size: 'M', color: 'white', price: 25, stock_quantity: 5, image_url: '/clothes/basic-tee.svg' },
  ])])
  assert.equal(await scalar('select count(*)::int from public.product_variants where product_id = $1', [id]), 1)
})

test('shared AI quota cannot be reset by the customer', async () => {
  await identity(alice)
  for (let i = 0; i < 8; i++) assert.equal(await scalar('select public.reserve_ai_request()'), true)
  assert.equal(await scalar('select public.reserve_ai_request()'), false)
  await assert.rejects(db.query('update public.users set ai_requests_used = 0 where user_id = $1', [alice]), /permission denied/)
  await identity(bob)
  assert.equal(await scalar('select public.reserve_ai_request()'), true)
  await db.exec('reset role')
  await db.query("update public.users set ai_window_started_at = now() - interval '2 minutes' where user_id = $1", [alice])
  await identity(alice)
  assert.equal(await scalar('select public.reserve_ai_request()'), true)
  assert.equal(await scalar('select ai_requests_used from public.users where user_id = $1', [alice]), 1)
})

test('catalogue search paginates, filters variants and treats wildcards as literal text', async () => {
  await identity(null, 'anon')
  const result = await scalar("select public.browse_products(p_category => 'dresses', p_limit => 2)")
  assert.equal(result.total, 3)
  assert.equal(result.items.length, 2)
  assert.equal((await scalar("select public.browse_products(p_category => 'bottoms')")).total, 12)
  assert.equal((await scalar("select public.browse_products(p_size => 'XXL')")).total, 0)
  assert.equal((await scalar("select public.browse_products(p_query => '%')")).total, 0)
  const ordered = await scalar("select public.browse_products(p_sort => 'price_desc', p_limit => 100)")
  const prices = ordered.items.map((p) => Math.min(...p.product_variants.map((v) => v.price)))
  assert.deepEqual(prices, [...prices].sort((a, b) => b - a))
  assert.equal((await scalar("select public.browse_products(p_min_price => 30, p_max_price => 40)")).items.every((p) => p.product_variants.some((v) => v.price >= 30 && v.price <= 40)), true)
})

test('adding quantities and changing size are atomic cart operations', async () => {
  await identity(admin)
  await db.query('update public.product_variants set stock_quantity = 20 where product_id = $1', [product])
  const next = await scalar('select variant_id from public.product_variants where product_id = $1 and variant_id <> $2 limit 1', [product, variant])
  await identity(bob)
  await db.query('select public.add_cart_item($1, 1)', [variant])
  await db.query('select public.add_cart_item($1, 2)', [variant])
  assert.equal(await scalar('select quantity from public.cart_items where variant_id = $1', [variant]), 3)
  await db.query('select public.change_cart_variant($1,$2)', [variant, next])
  assert.equal(await scalar('select quantity from public.cart_items where variant_id = $1', [next]), 3)
  assert.equal(await scalar('select count(*)::int from public.cart_items where variant_id = $1', [variant]), 0)
  await assert.rejects(db.query('select public.add_cart_item($1, 21)', [next]), /unavailable/)
  assert.equal(await scalar('select quantity from public.cart_items where variant_id = $1', [next]), 3)
})

test('category editing and public product image uploads require admin', async () => {
  await identity(alice)
  assert.equal((await db.query("update public.categories set name = 'Changed' where category_id = 'tops' returning *")).rows.length, 0)
  await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('products','test.jpg')"), /row-level security/)
  await identity(admin)
  await db.query("insert into storage.objects(bucket_id,name) values ('products','test.jpg')")
  assert.equal((await db.query("update public.categories set name = 'Tops' where category_id = 'tops' returning *")).rows.length, 1)
})


test('admin can list and edit customer names but cannot grant roles through the client', async () => {
  await identity(admin)
  assert.equal(await scalar('select count(*)::int from public.users'), 3)
  await db.query("update public.users set name = 'Updated Customer' where user_id = $1", [bob])
  await assert.rejects(db.query("update public.users set role = 'admin' where user_id = $1", [bob]), /permission denied/)
  await identity(bob)
  assert.equal(await scalar('select name from public.users'), 'Updated Customer')
  assert.equal(await scalar('select count(*)::int from public.users'), 1)
})

test('cash-on-delivery starts unpaid and only admin can record collection', async () => {
  await identity(admin)
  await db.query('update public.product_variants set stock_quantity = 10, is_active = true where variant_id = $1', [variant])
  await identity(alice)
  await db.query('select public.set_cart_item($1, 1)', [variant])
  const placed = await scalar('select public.place_order($1,$2,$3)', ['Customer', '1234567', 'Example Street 123'])
  assert.equal(await scalar('select is_paid from public.orders where order_id = $1', [placed]), false)
  await assert.rejects(db.query("select public.update_order_status($1, 'placed', true)", [placed]), /Administrator/)
  await identity(admin)
  await db.query("select public.update_order_status($1, 'shipped', false)", [placed])
  await db.query("select public.update_order_status($1, 'delivered', true)", [placed])
  await identity(alice)
  assert.equal(await scalar('select is_paid from public.orders where order_id = $1', [placed]), true)
})
