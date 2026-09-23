import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('standalone setup and repeatable seed create the catalogue without resetting stock or prices', async () => {
  const db = new PGlite()
  try {
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
    await db.exec(await readFile(new URL('../setup.sql', import.meta.url), 'utf8'))
    const seed = await readFile(new URL('../seed.sql', import.meta.url), 'utf8')
    await db.exec(seed)
    const counts = await db.query('select (select count(*)::int from public.categories) as categories, (select count(*)::int from public.products) as products, (select count(*)::int from public.product_variants) as variants')
    assert.deepEqual(counts.rows[0], { categories: 5, products: 24, variants: 120 })
    const { rows: [variant] } = await db.query('select variant_id from public.product_variants limit 1')
    await db.query('update public.product_variants set stock_quantity = 7, price = 31.50 where variant_id = $1', [variant.variant_id])
    await db.exec(seed)
    const { rows: [updated] } = await db.query('select stock_quantity, price::float from public.product_variants where variant_id = $1', [variant.variant_id])
    assert.deepEqual(updated, { stock_quantity: 7, price: 31.5 })
    await db.exec('set role anon')
    const { rows: [catalogue] } = await db.query('select public.browse_products(p_limit => 100) as result')
    assert.equal(catalogue.result.total, 24)
    assert.equal(catalogue.result.items.length, 24)
  } finally { await db.close() }
})
