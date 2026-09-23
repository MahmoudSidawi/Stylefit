# Demo customer and clothing photographs

The demo customer email is `demo.customer@stylefit.test`. Its generated password
is saved only in the Git-ignored `server/.env.demo-access` file. Sign in through
the normal customer login page. The account has ten wardrobe items and one
sample cash-on-delivery order containing a T-shirt, jeans, running shoes and a cap.
The order is marked TEST ORDER with a no-delivery address, remains unpaid, and
does not charge a payment method. Checkout reserves inventory normally.

The wardrobe contains a T-shirt, shirt, hoodie, jeans, pants, shorts, skirt,
dress, shoes and hat. Wardrobe photographs are private objects owned by the demo
customer; catalogue photographs are in the public `products/demo-photos` folder.
The database stores these object keys or URLs, not image bytes.

Existing sample products use representative photographs by clothing type;
these are demonstration photos, not exact photographs of every size/color or
named cut. Existing product prices and inventory are preserved when photos are
updated. A backup of previous image URLs is saved locally in
`server/.env.demo-image-backup.json`.

Photo source URLs are recorded in `server/app/data/photo_sources.json`.
Photos come from Unsplash and are included under the [Unsplash License](https://unsplash.com/license).
The cap photograph is by [Mediamodifier](https://unsplash.com/photos/white-baseball-cap-on-white-surface-t8HiP3e5abg).
Bundled copies in `client/public/clothes/photos` are input to the import script only; runtime images come from Supabase.

For an existing database, apply `supabase/migrations/202609230001_shoes_hats.sql`.
New database installations using `setup.sql` already include these categories.
To populate another configured development database, run from `server/`:

```powershell
.\.venv\Scripts\python.exe scripts/seed_demo.py
```

The script uses the server's privileged key, never exposes it to the frontend,
and reuses deterministic demo wardrobe/product IDs. Reruns reuse the account
and existing order rather than placing another purchase.

The outfit builder keeps dresses and bottoms mutually exclusive. Adding either
replaces the other; this also applies to loaded saved looks. The backend rejects
such combinations before downloading wardrobe photos or requesting AI analysis.
This restriction applies to outfits, not to owning both garments in a wardrobe
or purchasing both in a shopping bag. Shoes and hats have their own outfit slots.
