# StyleFit – AI Clothing Store and Clothes Matcher

A beginner-friendly foundation for a 10-day project: React, Vite, TypeScript, React Router, FastAPI, and Supabase.

The supplied [BRD](docs/StyleFit_BRD.docx) and [ERD](docs/StyleFit_ERD.drawio) have been reviewed and copied unchanged into `docs/`. Their scope and exact entity names and relationships are recorded in [scope.md](docs/scope.md) and [erd-reference.md](docs/erd-reference.md).

Eight frontend pages are implemented: Storefront, All Clothes, Outfit Harmony Studio, Your Wardrobe, Shopping Bag, Checkout, Login, and Registration. See [the storefront handoff](docs/storefront-handoff.md), [All Clothes](docs/clothes-handoff.md), [the matcher handoff](docs/matcher-handoff.md), [the three commerce pages handoff](docs/remaining-pages-handoff.md), and [the login and registration handoff](docs/auth-handoff.md) for working interactions, verification, and screenshots. Database tables, migrations, storage buckets, and real AI integration remain deferred. The ERD's `users.password_hash` field and its integration with the requested Supabase Authentication need resolution before database implementation; the diagram has not been redesigned.

## Current scope

The client opens the responsive Storefront at `/catalogue`, with four sample best sellers. `/clothes` provides the full collection, left-side filters, sorting, search, product previews, favorites, and a local demo bag. `/matcher` provides the outfit canvas, source archive, saved looks, and clearly labeled local demo scoring. `/wardrobe` supports local photo uploads and garment management; `/cart` supports quantities, sizes, saved items, and a demo discount; `/checkout` validates details and previews an order without placing it. `/login` and `/register` provide frontend form previews. Other routes remain placeholders. The server exposes `GET /health`, returning `{"status":"ok"}`, with a Pydantic response model and local CORS configuration.

Authentication, admin authorization, live catalogue data, cloud uploads, payment processing, real orders, personalization, and AI matching are not connected. Favorites, bag selections, saved looks, and wardrobe photos use browser local storage for demonstration only. Checkout contact/address details remain in memory and are not persisted or sent. Routes are public; this frontend has no account access controls.

The intended matcher uses manually selected wardrobe items, store items, or both, and explains color, style, pattern, and clothing-type compatibility. Its matching percentage is a **subjective styling estimate, not a guarantee of fit**. Optional height, weight, body shape, clothing size, and skin tone remain optional future personalization inputs.

## Structure

The tree below describes the original foundation. New storefront code follows the feature-based structure documented in [storefront-handoff.md](docs/storefront-handoff.md), and the route entry is now `client/src/app/App.tsx`.

```text
stylefit/
├── client/
│   ├── src/
│   │   ├── components/       # Reusable placeholder component
│   │   ├── pages/
│   │   │   └── admin/        # AdminProducts and AdminOrders placeholders
│   │   ├── layouts/         # Shared navigation and page outlet
│   │   ├── context/         # Reserved for future React context
│   │   ├── services/        # Supabase client and typed FastAPI requests
│   │   ├── hooks/           # Reserved for future hooks
│   │   ├── types/           # Shared API and environment types
│   │   ├── styles/          # Global CSS
│   │   ├── utils/           # Reserved for future utilities
│   │   ├── App.tsx          # Routes
│   │   └── main.tsx         # React entry point
│   ├── .env.example
│   └── package.json
├── server/
│   ├── app/
│   │   ├── api/             # HTTP endpoints
│   │   ├── core/            # Environment settings
│   │   ├── schemas/         # Pydantic request/response contracts
│   │   ├── services/        # Reserved for future AI integration
│   │   └── main.py
│   ├── tests/               # Health and CORS tests
│   ├── .env.example
│   └── requirements.txt
├── supabase/
│   └── migrations/          # Reserved for a later database implementation task
├── docs/                    # Original BRD/ERD, scope, ERD reference, security
├── .gitignore
└── README.md
```

Empty directories use `.gitkeep` files so Git retains them. React components use `.tsx`; other frontend code uses `.ts`. TypeScript strict mode is enabled in both application and Vite configuration projects. Shared business types and Pydantic request models should be added only when implementing approved features; health has no request body.

## Prerequisites

- Node.js 24 LTS with npm (tested with Node 24.13.0).
- Python 3.11 or newer (tested with Python 3.13.9).
- Git.
- A Supabase project and its public configuration only when connecting authentication/data/storage. No credentials are required to view placeholders or run health checks.

## Install and run on Windows (PowerShell)

Open two terminals at the repository root.

Terminal 1 — client:

```powershell
cd client
npm ci
Copy-Item .env.example .env
npm run dev
```

Open http://localhost:5173. Vite uses a fixed port and fails if 5173 is occupied, keeping its origin consistent with server CORS. You may leave Supabase placeholders unchanged for now. Restart Vite after changing environment values.

Terminal 2 — server:

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host localhost --port 8000
```

These commands invoke the virtual environment directly; PowerShell activation is unnecessary. Copy example files only on first setup to avoid overwriting your own configuration. Dependencies and the virtual environment may already exist in this working copy.

- Health: http://localhost:8000/health
- Interactive API documentation: http://localhost:8000/docs

Restart the server after editing `server/.env`.

For macOS/Linux, use `cp .env.example .env`, create the environment with `python3 -m venv .venv`, and replace `.\.venv\Scripts\python.exe` with `.venv/bin/python`. Other commands are the same.

## Environment variables and credentials

Client `client/.env`:

| Variable | Value | Needed now? |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL | Only when Supabase is used |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your project's public publishable key | Only when Supabase is used |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Default works locally |

`getSupabaseClient()` in `client/src/services/supabase.ts` creates and reuses the Supabase client on first use. Missing/example credentials produce a clear error at that point, while placeholder pages still work. This scaffold uses Supabase's [public publishable key configuration](https://supabase.com/docs/reference/javascript/initializing). Never put a secret or service-role key into the client.

`getHealth()` in `client/src/services/api.ts` makes a typed FastAPI request, checks HTTP errors, and validates the response shape. It accepts an optional AbortSignal. It is ready for future components to call; placeholder pages do not poll the API.

Server `server/.env`:

| Variable | Value | Needed now? |
| --- | --- | --- |
| `CLIENT_ORIGIN` | `http://localhost:5173`, no trailing slash | Default works locally |
| `SUPABASE_URL` | Your Supabase project URL | Reserved for future token validation |
| `SUPABASE_SECRET_KEY` | Leave empty; server secret if privileged access is later needed | No |
| `AI_API_KEY` | Leave empty; future AI provider credential | No |

Server settings load `server/.env` by an absolute path derived from the configuration file. AI keys and any Supabase secret/service-role keys belong exclusively on the server. Never prefix them with `VITE_`. Real environment files, dependencies, virtual environments, caches, and build outputs are ignored by Git.

Before connecting real features, configure Supabase Auth's local site/redirect URLs for http://localhost:5173 and implement approved database/storage policies. The current scaffold does not create remote resources or call an AI provider.

## Routes

| Page | Route |
| --- | --- |
| Home | `/` |
| Login | `/login` |
| Register | `/register` |
| Catalogue | `/catalogue` |
| All Clothes | `/clothes` |
| ProductDetails | `/products/:productId` |
| Wardrobe | `/wardrobe` |
| Matcher | `/matcher` |
| Cart | `/cart` |
| Wishlist | `/wishlist` |
| Checkout | `/checkout` |
| Orders | `/orders` |
| Profile | `/profile` |
| AdminProducts | `/admin/products` |
| AdminOrders | `/admin/orders` |

The home route redirects to `/catalogue`. Product previews open in catalogue dialogs, and the shared header links to the Shopping Bag page. Login and registration provide validated frontend forms, with authentication still unconnected. Dedicated product, wishlist, orders, profile, and admin routes remain placeholders. Unknown paths display a simple not-found placeholder.

## Security requirements before implementing features

Protected AI endpoints **must validate Supabase access tokens on the server** before accessing private items or calling an AI provider. Send the user's access token in `Authorization: Bearer <access_token>`; verify the signature, expiration, expected issuer and audience, and derive identity from the verified token. Decoding a JWT or receiving a user ID is insufficient. See [Supabase JWT guidance](https://supabase.com/docs/guides/auth/jwts).

Database and storage access requires appropriate access policies. Keep wardrobe images private, enforce ownership and admin authorization using the approved data model, and test cross-user denial. Supabase secret/service-role keys bypass RLS and must never be exposed to browsers. See [storage access control](https://supabase.com/docs/guides/storage/security/access-control) and [docs/security.md](docs/security.md).

CORS only controls browser access; it is not authentication. The current health endpoint is intentionally public and checks application liveness only, not Supabase or AI availability.

## Verification commands

From `client/`:

```powershell
npm run typecheck
npm run build
npm run lint
```

From `server/`:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

With the server running, from another PowerShell terminal:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

Expected status: `ok`. The tests also verify allowed local CORS preflight and rejection of an unlisted origin. The client production build is written to `client/dist/`.

See [docs/scope.md](docs/scope.md) for the reviewed BRD scope, open integration points, and deferred implementation.
