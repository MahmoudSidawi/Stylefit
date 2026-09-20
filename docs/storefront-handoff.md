# Storefront — page 1 review

The first implemented page is `/catalogue`; `/` redirects to it. The user approved this page. The second page, `/matcher`, is now ready for review; see [matcher-handoff.md](matcher-handoff.md). Other routes remain placeholders, and unavailable destinations and integrations are labeled as coming soon.

## Run

```powershell
cd client
npm ci
npm run dev
```

Open http://localhost:5173/catalogue. No backend or environment configuration is required for this frontend preview.

## Structure

- `client/src/app/App.tsx`: application routes.
- `client/src/features/products/pages/CataloguePage.tsx`: storefront composition and view state.
- `client/src/features/products/components/`: collection hero, filters, product cards, preview dialog, demo bag, and editorial sections.
- `client/src/features/products/data/`: the eight products supplied by the design, isolated as mock data.
- `client/src/features/products/hooks/useDemoShop.ts`: validated local storage, favorites, and bag updates.
- `client/src/components/layout/`: storefront header and footer.
- `client/src/components/ui/`: reusable icon and accessible modal dialog.
- `client/src/styles/tokens.css`: shared design variables.
- `client/src/features/products/styles/catalogue.css`: responsive storefront styling, scoped to avoid restyling the placeholder pages.
- `client/src/assets/`: supplied editorial photographs and locally hosted Playfair Display / Plus Jakarta Sans fonts, with font licenses.

The existing React, TypeScript, Vite, React Router, and plain CSS setup is retained. No runtime or development dependencies were added to the project.

## Working interactions

Search garment names/materials; filter by category, maximum price, size, or saved items; sort by editorial order, sample match score, or price; toggle illustrative pairing notes; choose sizes; save favorites; preview products; and add/update/remove demo bag items. Product-and-size combinations are separate bag entries. Bag counts and subtotals are calculated from the selections. Favorites and bag selections survive a reload in the same browser.

Empty states, filter reset, missing/corrupt local storage recovery, storage write failure feedback, mobile navigation, focus styles, reduced motion, dialog focus containment, Escape dismissal, and focus restoration are implemented.

## Deliberately unfinished integrations

Product availability, real AI matching, wardrobe sync, personal sizing, authentication, checkout, newsletter subscriptions, and the remaining pages are not connected. No purchases or AI requests are made. The supplied design's fictitious precision metrics and personal profile were replaced with honest preview copy. Match badges explicitly identify sample scores. Only the eight supplied products are shown, so counts are accurate and fictitious pagination was omitted.

## Verification

- TypeScript check, Oxlint, and Vite production build.
- Chrome browser interaction checks using temporary Playwright tooling: search, category filtering, empty/reset states, all sort modes, pairing toggle, favorites, price/size filters, bag size selection, quantities, subtotal, removal, and reload persistence.
- Dialog keyboard checks: Tab/Shift+Tab containment, Escape, and return focus.
- Mobile menu and bag; malformed JSON and invalid persisted records.
- Responsive overflow checks at 320, 390, 600, 768, 1024, 1280, and 1440 px.
- All supplied image assets load; browser verification completed without console errors or failed resource requests.
- Desktop and mobile screenshots visually compared against the supplied storefront design.

Screenshots: [desktop](previews/storefront-desktop.png), [mobile](previews/storefront-mobile.png).

This page was approved before work moved to the matcher. The local preview server remains available for reviewing both pages.
