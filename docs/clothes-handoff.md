# Storefront and All Clothes

- `/catalogue` is the editorial storefront with exactly four default Best Sellers cards. These are explicit sample selections in `features/products/data/bestSellers.ts`, not live sales rankings.
- `/clothes` displays all eight catalogue products. Category, maximum price, size, and saved-item filters sit in a left sidebar on desktop and an expandable panel on mobile. Sorting, search, empty results, and reset work together.
- The shared header, storefront hero, Best Sellers section, and footer link to All Clothes. Empty-bag and add-another-piece links also open the full catalogue.
- Both pages reuse product cards, product previews, favorites, and the existing local bag. Search uses the URL's `q` parameter; clearing filters removes it. Prices, match scores, and inventory remain sample data.

The shared `CataloguePage` takes an `allClothes` option to avoid duplicating product interactions. `CatalogueFilters`, `CatalogueSort`, and `clothes.css` provide the new collection layout. No dependencies were added.

Verified with TypeScript/Vite build, Oxlint, and Chrome browser checks: four storefront cards, eight catalogue cards, sidebar placement, combined category/price/size/saved filters, empty/reset states, both price sorts, search, favorites, selected bag size and persistence, preview/Escape, mobile filter toggle, and layouts at 320, 390, 600, 768, 960, 1024, 1280, and 1440 pixels without horizontal overflow or browser errors.

Previews: [Storefront](http://localhost:5173/catalogue), [All Clothes](http://localhost:5173/clothes). Screenshots: [All Clothes desktop](previews/clothes-desktop.png), [All Clothes mobile](previews/clothes-mobile.png), [Storefront desktop](previews/storefront-desktop.png).
