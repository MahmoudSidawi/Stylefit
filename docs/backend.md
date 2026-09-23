# Current data sources

All catalogue, account, wardrobe, cart, wishlist, orders, category names, saved looks and storefront content are read from Supabase. No offline sample catalogue or browser-only saved-look fallback exists. Groq remains the AI provider. Browser storage is used by Supabase Auth for sessions, not as the business database.

Apply `202609230002_live_content_looks.sql` to existing databases, then run `server/scripts/seed_storefront.py`. Homepage content lives in `site_content` (key `storefront`) and its photos in Supabase Storage. Import fixtures under `server/scripts/fixtures` are provisioning input only.

The historical implementation notes below describe earlier stages and are superseded by this section.

# Backend setup and implementation

The backend now implements the three basic categories: **Tops** (T-shirts, shirts, hoodies), **Bottoms** (jeans, pants, shorts, skirts), and **Dresses**. The 24 sample products (120 size variants) use local SVG illustrations and sample USD prices. The original BRD and ERD remain unchanged.

## Run locally

From `server/` in PowerShell:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host localhost --port 8000
```

Visit http://localhost:8000/docs for interactive request schemas. `/health`, `/api/categories`, and the sample `/api/products` catalogue work without credentials. Without Supabase, protected requests return 503 after a bearer token is supplied; missing tokens return 401. There is no fake successful write or in-memory order store.

## Enable persistent data

1. Use a Supabase project and run these SQL migrations, in order, in its SQL editor (or apply through your existing migration workflow):
   - `supabase/migrations/202609210001_shop.sql`
   - `supabase/migrations/202609210002_sample_catalogue.sql`
   - `supabase/migrations/202609210003_backend_completion.sql`
   - `supabase/migrations/202609210004_expanded_catalogue.sql`
   - `supabase/migrations/202609210005_catalogue_search.sql`
2. Copy `server/.env.example` to `server/.env` if the file does not already exist. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to that project's URL and public publishable key. Keep `CLIENT_ORIGIN=http://localhost:5173` for development. No secret/service-role key is required.
3. Set the same project URL and public key in `client/.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Set `VITE_API_BASE_URL=http://localhost:8000`.
4. Configure Supabase Auth's Site URL as `http://localhost:5173` and allow `http://localhost:5173/profile` and `http://localhost:5173/reset-password` as redirect URLs. Enable email/password sign-in and configure email delivery for confirmations and recovery.
5. Add `GROQ_API_KEY` to the server configuration for AI features; see [Groq setup](groq.md).
6. Restart client and server. Register and confirm the email, then sign in. `/profile` reads the protected API, saves the name, and signs out.

Promote an intended administrator explicitly from the trusted SQL editor, using their known account UUID:

```sql
update public.users set role = 'admin' where user_id = '<account-uuid>';
```

Self-registration always creates a customer, even if user metadata contains `role: admin`.

## API

All private calls send `Authorization: Bearer <Supabase access token>`. The server verifies the session through the project's Auth user endpoint. Data requests carry the same token and public API key so database RLS remains active. `client/src/services/shopApi.ts` provides typed callers.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/health` | Public liveness |
| GET | `/api/categories` | Three categories and their clothing types |
| GET | `/api/products` | Public active catalogue; `category`, `q`, `size`, `color`, `min_price`, `max_price`, `sort`, `limit`, `offset`; returns total count |
| GET | `/api/products/{id}` | Active product with active size/color variants |
| GET, PATCH | `/api/me` | Own profile; name and optional body fields |
| GET, PUT | `/api/cart` | Own cart; set absolute variant quantity from 1–99 |
| POST | `/api/cart/add` | Add quantity atomically |
| POST | `/api/cart/change-variant` | Change size/color atomically within a product |
| DELETE | `/api/cart/{variant_id}` | Remove own cart variant |
| GET, POST | `/api/wishlist` | Read/save own favorites |
| DELETE | `/api/wishlist/{product_id}` | Remove favorite |
| GET, POST | `/api/wardrobe` | Read/create own wardrobe records |
| PUT, DELETE | `/api/wardrobe/{id}` | Update/delete own garment; deletion also removes its image |
| POST | `/api/wardrobe/images` | Multipart `file`: validated JPG/PNG, maximum 5 MB and 25 megapixels |
| GET | `/api/wardrobe/{id}/image` | Own image URL, valid for 300 seconds |
| GET, POST | `/api/orders` | Own order history / place cash-on-delivery order from cart |
| GET, POST | `/api/admin/products` | Admin catalogue / atomic product and variant creation |
| PUT | `/api/admin/products/{id}` | Edit product; `is_active=false` hides it |
| POST | `/api/admin/products/{id}/variants` | Add size/color combination |
| PUT | `/api/admin/variants/{id}` | Edit price, stock, image, availability |
| POST | `/api/admin/images` | Admin-only public product-photo upload |
| PATCH | `/api/admin/categories/{id}` | Rename one of the three basic categories |
| GET | `/api/orders/{id}` | Own order detail |
| GET | `/api/wardrobe/{id}` | Own garment detail |
| DELETE | `/api/wardrobe/images/{filename}` | Remove an unused image in own folder |
| POST | `/api/matches` | Groq outfit analysis of 2?3 selected garments |
| POST | `/api/wardrobe/{id}/analyze` | Groq garment tagging suggestions |
| GET | `/api/admin/orders` | All orders for admin |
| PATCH | `/api/admin/orders/{id}` | Change status and collected-payment flag |

Upload a wardrobe photo first, then use the returned `image_url` object key in the garment payload. The `wardrobe` bucket is private. The key must use the authenticated user's folder. Signed URLs are temporary; save object keys, never signed URLs. Storage and database operations span two services: a failed garment creation or photo replacement can leave an unused image that needs cleanup. The unused-image deletion endpoint supports cleanup; no background cleanup job is included.

Example checkout body (prices, identity, and order status are never accepted from the customer):

```json
{
  "recipient_name": "Sample Customer",
  "phone": "+961 1234567",
  "delivery_address": "Building 12, Example Street, Beirut"
}
```

## Database and security decisions

- Nine application tables retain the ERD names and relationships. Supabase `auth.users` owns passwords. `public.users.user_id` references the Auth UUID; the diagram's `password_hash` is intentionally not duplicated in the application schema.
- `products.clothing_type` is added for the requested basic subtypes, with a database constraint enforcing the category/type pairing. Categories use readable text IDs and are fixed to the requested three groups.
- RLS enforces ownership on profiles, carts, favorites, orders, and wardrobe rows. Storage policies enforce the same private folder ownership. Customers cannot update their role or write order totals, stock, or order items directly.
- Checkout locks the customer's profile, then relevant products/variants in a consistent order. It rechecks availability, computes exact numeric totals, snapshots item names/sizes/colors/prices, creates the order, reduces stock, and clears the cart in one transaction. Cart changes use the same per-user lock. Repeating checkout against the cleared cart fails without another order.
- Status transitions: `placed → shipped → delivered`, or `placed → cancelled`. Cancelling a placed order restores stock once; repeated cancellation does not increase it again. Payment can be marked collected by an admin. A cancelled cash-on-delivery order cannot be marked paid.
- Products/variants are hidden instead of deleted so order history retains its references. Order history intentionally prevents deleting a referenced application account through a cascading deletion.
- Server requests use timeouts and redact unexpected upstream errors. Supabase secrets are never required by these handlers.

The implementation follows Supabase's [user-data integration](https://supabase.com/docs/guides/auth/managing-user-data), [RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security), and [private storage model](https://supabase.com/docs/guides/storage/buckets/fundamentals).

## Verification and remaining integration

```powershell
# From server/
.\.venv\Scripts\python.exe -m pytest -q
# From supabase/
npm ci
npm test
# From client/
npm run build
npm run lint
npx playwright install chromium
npm run test:e2e
```

API tests exercise authentication, validation, ownership filters, image handling, and request forwarding. Database tests execute all migrations in PGlite PostgreSQL with minimal Supabase Auth/Storage schema stubs, then exercise actual grants, RLS, checkout rollback, order snapshots, cancellation, and atomic product creation. They do not test Supabase email delivery, physical object storage, or multiple independent PostgreSQL connections under contention.

The API tests cover authentication, validation, image handling, Groq payloads, profile privacy, ownership, provider failures, and rate-limit rejection. PostgreSQL tests cover the schema and transactions including the shared quota. Playwright tests simulate the account/API services to check browsing, cash-on-delivery checkout, private-page access, and AI result invalidation.

All active frontend routes now use the API: catalogue, product details, wishlist, cart, checkout, orders, wardrobe, matcher, profile, admin products, and admin orders. The original catalogue, bag, checkout, wardrobe, and outfit studio layouts are routed again, with their data and actions connected to the backend. Remaining demo-only utilities are not used by active shopping flows. With no keys configured, public browsing returns the labeled sample seed and private pages require sign-in. Private operations and AI never report fabricated success.

No cloud project has been provisioned and no migration has been applied remotely. The user chose to configure keys later. The migrations and sample inventory are ready to apply; remote Supabase/Groq checks remain pending credentials. See [Groq setup and behavior](groq.md).

Verification completed: **56 API tests, 12 PostgreSQL tests, and 3 browser tests pass**. Production build and lint pass. Local smoke checks confirm the running API returns 24 products and the catalogue shows 9 Tops, 12 Bottoms, and 3 Dresses. Browser screenshots are in `docs/previews/backend-catalogue-desktop.png` and `docs/previews/backend-catalogue-mobile.png`.

## Standalone SQL files and restored frontend

For an empty Supabase project, run `supabase/setup.sql` once in SQL Editor, then run `supabase/seed.sql`. This is an alternative to applying the numbered migrations. On an already migrated database, do not run setup.sql; the seed alone is safe to repeat. The standalone setup/seed pair is tested with PostgreSQL, including a repeat seed that preserves changed stock and prices.

The original editorial homepage (`/catalogue`), sidebar catalogue (`/clothes`), product cards/previews, bag/checkout layout, wardrobe dashboard, and three-column outfit studio now use backend reads and writes. Groq supplies actual match results and reviewed wardrobe tags. Basic clothing categories and sample illustrations remain. Saved looks are stored locally per account; wardrobe, cart, orders, and favorites use Supabase. Fake demo checkout, discounts, and match scores are not used by these routes.

Restoration verification: **6 browser integration tests and 13 PostgreSQL tests pass**; build and lint pass. Browser tests mock external services and cover catalogue filters, original hero/product preview, cart/checkout, matcher request payload and invalidation, and wardrobe photo upload/AI tag review. Local desktop/mobile checks show no browser errors or horizontal overflow. Remote schema application remains a user setup step.
