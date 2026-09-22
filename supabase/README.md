# Supabase setup and seed

For your empty Supabase project:

1. Open SQL Editor, create a new query, paste all of `setup.sql`, and run it once.
2. Create another query, paste all of `seed.sql`, and run it.
3. Refresh StyleFit at http://localhost:5173.

`setup.sql` contains the schema, RLS, storage policies, and functions from migrations 001, 003, and 005. It is an alternative to running migrations, not an extra migration. Do not run it on an already migrated database. If you already applied all five migrations, only `seed.sql` is needed (and your sample inventory is already present).

The seed creates 3 categories, 24 products, and 120 variants (XS through XL), with sample USD prices and 20 units per new variant. Repeating it does not reset stock or prices or create duplicates. It includes no user accounts or orders. Product illustrations are served from the app's `/clothes/` folder. Sign up normally to create an account.

Verify in SQL Editor:

```sql
select count(*) from public.categories; -- 3
select count(*) from public.products; -- 24 on a fresh project
select count(*) from public.product_variants; -- 120 on a fresh project
```

Then run the local connection check from `server/`:

```powershell
.\.venv\Scripts\python.exe scripts/check_setup.py --live
```
