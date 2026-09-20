# Wardrobe, Shopping Bag, and Checkout

The user authorized completing the remaining three pages together after approving Storefront and Matcher. These React/TypeScript pages follow the supplied StyleFit designs, share the existing navigation and components, and support desktop, tablet, and mobile layouts. No project dependencies were added.

## Preview

Run `npm run dev --prefix client` from the repository root, then open:

| Page | Local preview | Screenshots |
| --- | --- | --- |
| Your Wardrobe | http://localhost:5173/wardrobe | [Desktop](previews/wardrobe-desktop.png), [mobile](previews/wardrobe-mobile.png) |
| Shopping Bag | http://localhost:5173/cart | [Desktop](previews/cart-desktop.png), [mobile](previews/cart-mobile.png) |
| Checkout | http://localhost:5173/checkout | [Desktop](previews/checkout-desktop.png), [mobile](previews/checkout-mobile.png) |

Add products from the catalogue or matcher, or use **Load sample bag** in the empty bag. The optional demo promo code is `DEMO10`.

## Working behavior

- Wardrobe starts with six labeled sample pieces and their supplied photographs. Search, category filters, and counts reflect the current collection. Add a photo by file selection or drag and drop, enter garment details, edit items, or confirm removal. Match with Store opens the matcher with that garment staged. Owned pieces are excluded from purchase totals.
- Photos accept JPG, PNG, or WebP up to 2 MB and 12,000 pixels per dimension. Photos and details stay in this browser's local storage; there is no cloud upload or automatic image recognition. The collection allows up to 60 items, subject to browser storage capacity. Storage failures preserve the previous collection and show an error.
- Shopping Bag shares products, favorites, sizes, and quantities with Storefront and Matcher. Change sizes, merge matching variants, adjust quantities, remove pieces, save for later, or move saved pieces back. Search filters the displayed rows without changing the actual order total.
- The summary calculates USD totals, a validated 10% demo code, and demo shipping. Standard delivery is $12 below $300 merchandise subtotal and free from $300; express is $25. Taxes are explicitly not calculated.
- Checkout validates required contact/address fields, email format, and demo acknowledgement. Delivery changes update the summary and final review dialog. Sample details make it easy to inspect the flow. No payment details are collected and no real order is created. Contact/address details are kept only in component memory; the bag remains available after review.
- Empty collections/bags, failed photo reads, unsupported files, invalid stored data, storage quota failures, and empty checkout are handled. Dialogs support focus containment and Escape. Shared navigation now opens the dedicated bag page.

## Code organization

`client/src/features/wardrobe/` contains the page, garment components, typed local store, sample data, photo validation, and styles. The matcher adapter converts wardrobe metadata into local demo styling tags; it does not analyze photos. Deleted wardrobe pieces invalidate saved looks that require them.

`client/src/features/cart/` contains bag rows, saved-item cards, the reusable order summary, total calculations, and shared commerce styles. `client/src/features/checkout/` contains the page, validated fields, and order preview. These reuse shared layout, icons, dialogs, inventory, and `useDemoShop` persistence.

## Verification

TypeScript, Oxlint, and the Vite production build pass. Chrome/Playwright checks cover upload validation and drag and drop; add/edit/delete and persistence; wardrobe-to-matcher selection; saved looks; exclusion of owned garments from bag totals; quantities, sizes, variant merging, saved items, discount errors; checkout validation, delivery totals, order review, keyboard dialogs, and non-persistence of checkout details. Storage quota and corrupt data recovery were also exercised.

All three pages were checked for horizontal overflow at 320, 390, 600, 768, 1024, 1280, and 1440 pixels. Browser checks found no JavaScript errors or failed resource requests. Screenshots are included above. Browser tooling was installed only in a temporary folder and was not added to the app dependencies.

Backend authentication, database/storage integration, genuine AI analysis, payment processing, and real order creation remain outside this frontend implementation.
