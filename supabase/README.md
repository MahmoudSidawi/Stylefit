# Supabase setup and seed

For your empty Supabase project:

1. Open SQL Editor, create a new query, paste all of `setup.sql`, and run it once.
2. Create another query, paste all of `seed.sql`, and run it.
3. Refresh StyleFit at http://localhost:5173.

`setup.sql` contains the schema, RLS, storage policies, and functions from migrations 001, 003, and 005. It is an alternative to running migrations, not an extra migration. Do not run it on an already migrated database. If you already applied the original five migrations, apply the admin accounts migration below; `seed.sql` is optional (and your sample inventory is already present).

Setup creates 5 categories. The seed creates 24 products, and 120 variants (XS through XL), with sample USD prices and 20 units per new variant. Repeating it does not reset stock or prices or create duplicates. It includes no user accounts or orders. Representative product photos are served from the app's `/clothes/photos/` folder. Sign up normally to create an account.

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


## Separate administrator account

For an existing database, run `migrations/202609220001_admin_accounts.sql` in the Supabase SQL Editor. Fresh installations already include it in `setup.sql`.

Create a separate user in Supabase Authentication > Users with the desired admin email and a private password, then run the following in SQL Editor, replacing the example email:

```sql
update public.users set role = 'admin' where email = 'your-admin@example.com';
select email, role from public.users where email = 'your-admin@example.com';
```

Sign in at `/admin/login`. Its session is separate from the customer session. Products, user names, orders and cash-on-delivery payment collection can be managed there. Passwords and roles cannot be edited through the user management page.

Customers use `/login`, `/register`, and `/profile`. Login and registration return to `/catalogue` (the homepage). Registration still requires email confirmation when enabled; allow `/catalogue` in Supabase Auth redirect URLs.

Checkout supports cash on delivery only. No online card payment provider is integrated. Automated tests cover order totals, inventory, rollback, unpaid orders and administrator payment collection. Live payment collection has not been performed.


Admin user listing and name edits verify the caller's admin role first, then use the server-only `SUPABASE_SECRET_KEY` for the limited account query. This supports existing databases before the optional admin profile policies are applied. The key must never be added to client environment variables. Other store requests continue to use the caller's RLS identity.
# Shoes, hats, and demo customer

Existing projects: run `migrations/202609230001_shoes_hats.sql` in SQL Editor.
It preserves current data and adds the two supported categories. Do not rerun
`setup.sql` on an existing project. See [demo setup](../docs/demo-account.md) for
the photo catalogue and sample customer.

## Live homepage and saved outfits

Run `migrations/202609230002_live_content_looks.sql` on existing projects. Then run `server/scripts/seed_storefront.py` using the configured server environment. Runtime catalogue data requires Supabase; sample files are used only by explicit import scripts.

## Clothing departments and optimized photos

Existing projects: apply `migrations/202609240001_webp_images.sql` and `migrations/202609240002_clothing_departments.sql`. Fresh installations include both in `setup.sql`. Departments are stored on products and wardrobe items; Men and Women filters include Unisex pieces. Administrators can change product departments, and customers can classify their own wardrobe items.
