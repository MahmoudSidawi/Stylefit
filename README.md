# StyleFit

Original frontend layouts are restored and connected to the backend. For a new Supabase database, run [setup.sql](supabase/setup.sql) once, then [seed.sql](supabase/seed.sql). See [SQL setup instructions](supabase/README.md).


React + TypeScript frontend, FastAPI backend, and Supabase Auth/PostgreSQL/private storage.

The clothing collection uses **Tops** (T-shirts, shirts, hoodies), **Bottoms** (jeans, pants, shorts, skirts), **Dresses**, **Shoes**, and **Hats**. The sample garments include clothing photographs, standard sizes, and sample USD prices.

The backend provides catalogue browsing, authenticated profiles, carts, wishlists, wardrobe records/images, transactional cash-on-delivery checkout, order history, and protected admin product/order operations. All active shopping, wardrobe, account, and admin screens use the APIs. Groq powers outfit matching and wardrobe photo tagging, with ownership checks, validated results, optional profile input, and per-account rate limits.

Add your keys later using [the Groq configuration guide](docs/groq.md). The project contains no real API keys.

See [backend setup and API documentation](docs/backend.md) for migrations, environment configuration, endpoint payloads, security decisions, and current limitations.

## Start locally

Requires Node.js and Python 3.11+.

Client, from `client/`:

```powershell
npm ci
npm run dev
```

Server, from `server/`:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host localhost --port 8000
```

Existing installations can reuse their `.venv`. The frontend opens at http://localhost:5173 and API documentation at http://localhost:8000/docs. Only the health endpoint runs without cloud credentials; the catalogue requires Supabase. Persistent operations require the Supabase configuration and migrations in [the setup guide](docs/backend.md).

Copy `.env.example` to `.env` in each app only when setting up for the first time; avoid overwriting existing values. Public project URL/key belong in both configurations. No privileged Supabase secret is required. Real `.env` files are ignored by Git.

## Structure

- `client/src/features/live/`: active catalogue, cart, checkout, wardrobe, Groq matcher, and admin pages.
- `client/src/features/auth/`: account registration, sign-in, recovery, and session handling.
- `client/src/services/shopApi.ts`: typed API calls carrying the signed-in user's token.
- `client/public/clothes/`: basic garment illustrations.
- `server/app/api/`: catalogue, private shopping, admin, image, and health endpoints.
- `server/app/core/`: settings and verified Supabase identity dependencies.
- `server/app/schemas/`: request validation and basic clothing taxonomy.
- `server/app/services/`: Supabase gateway using the caller's RLS identity.
- `supabase/migrations/`: nine application tables, grants, RLS, transactional functions, private bucket, and sample inventory.
- `supabase/tests/`: PostgreSQL policy and transaction tests.
- `docs/`: original project references, earlier frontend handoffs, and current backend guide.

## Checks

```powershell
# client/
npm run build
npm run lint
npx playwright install chromium
npm run test:e2e
# server/
.\.venv\Scripts\python.exe -m pytest -q
# supabase/
npm ci
npm test
```

The original [BRD](docs/StyleFit_BRD.docx) and [ERD](docs/StyleFit_ERD.drawio) are preserved. The [backend guide](docs/backend.md) records the implementation mapping: Supabase owns passwords, profiles use the Auth UUID, and products have a validated clothing subtype. Earlier handoff documents describe their original implementation stage.

See [demo customer and photo setup](docs/demo-account.md) for the prepared account, sample order and outfit rules.

All runtime business data comes from Supabase. Apply `202609230002_live_content_looks.sql` to existing projects, then run `server/scripts/seed_storefront.py` to import homepage content. Saved looks now sync to the account. No sample catalogue fallback or browser-only business data remains.
