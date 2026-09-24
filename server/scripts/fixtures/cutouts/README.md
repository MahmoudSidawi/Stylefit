# Garment-only demo photographs

The active PNG fixtures contain isolated garments and retain their original
transparent backgrounds. `sources.json` records each download, source page and
SHA-256 checksum. These third-party assets are for the educational demo;
StickPNG explicitly restricts its images to personal use, and other source
terms apply. Obtain commercial rights or replace assets before commercial use.

The collection uses a coordinated casual palette: white, grey, black, navy,
blue, khaki and muted day dresses. It contains 36 products: 9 tops, 12 bottoms,
5 dresses, 5 shoes and 5 hats, using 34 distinct photos. Three denim shorts
products share a representative garment photo. Shoes now include canvas
high-tops, trail runners, suede loafers, lace-up boots and flat sandals.
Neutral Striped Day Dress is retired; Black Casual Sundress replaces it.

From `server/`, run `.venv/Scripts/python.exe scripts/seed_cutouts.py` after
the initial demo import. It preserves product/variant IDs, stock, prices and
existing orders; updates the sample descriptions, colors and photos; and fills
the Demo Customer wardrobe to five pieces in each category. Original database
rows are backed up in the ignored `.env.cutout-backup.json` before the first
write. Previous storage objects are retained. Apply the WebP bucket migration
on a new database before importing (the configured project is already updated).

The import and future image uploads produce transparent WebP display assets
with a maximum dimension of 720 pixels. The current 34 photos use about 1.1 MB
combined, compared with 17.3 MB of source PNGs. Public object names include a
content hash and long cache lifetimes; wardrobe objects remain private.

Single-shoe asset names declare `shoe-single-left-` or `shoe-single-right-` to
describe the source view. The preview mirrors one isolated shoe onto each
foot without stretching it. Unknown pair photos retain their aspect ratio.

Runtime pages read Supabase records and Storage URLs, not these fixtures.
The mannequin measures transparent margins in the browser and positions the
whole garment by type. This is a two-dimensional outfit preview, not a physical
size simulation or virtual try-on of a customer's body.
