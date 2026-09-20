# Outfit Harmony Studio — page 2 review

The Storefront and Matcher were approved. The matcher is available at `/matcher`, linked from the shared header and footer. Wardrobe, Shopping Bag, and Checkout were subsequently completed together at the user's request; see [the remaining pages handoff](remaining-pages-handoff.md).

## Preview and run

Open http://localhost:5173/matcher. The local Vite server is left running for review.

To restart from the repository root:

```powershell
cd client
npm run dev
```

No backend credentials are needed. Screenshots: [desktop](previews/matcher-desktop.png) and [mobile](previews/matcher-mobile.png).

## Structure

`client/src/features/matcher/` contains the page, components, domain types, isolated sample garment data, outfit state, saved-look persistence, local scoring rules, and responsive styles. It reuses the existing header, footer, icons, accessible dialog, demo bag, and design styles. No dependencies were added.

`features/products/data/demoInventory.ts` combines the original catalogue inventory with five studio fixtures for the shared bag. The approved catalogue continues to show its original eight products. Adding a whole look uses one state update, preserving all selected product/size combinations.

The nine supplied matcher photographs are hosted locally in `src/assets/matcher/`.

## Working behavior

- Search and filter five sample store pieces or the current local wardrobe, initially populated with six labeled sample pieces. Uploaded garments can be staged directly using Match with Store in the Wardrobe.
- Compose up to five slots: layer, core, anchor, footwear, accessory. Adding a different garment in the same slot replaces the existing garment.
- Change sizes, remove pieces, clear the canvas, restore the sample outfit, or swap the suggested layer.
- Change occasion and check the local demonstration score. Editing the selection, sizes, or occasion invalidates the displayed result until checked again.
- Save up to 20 named looks in this browser. Names require at least three characters. Load or delete saved looks; sizes and occasion are restored with each look.
- Add all store pieces to the shared demo bag; sample wardrobe pieces contribute zero cost and are excluded from purchase selections. Bag totals and selections persist when moving between the Storefront and Matcher.
- Empty, single-piece, owned-only, invalid saved-data, full saved-look collection, and storage write failure states are handled. Native dialogs support focus containment, Escape dismissal, and focus restoration. Source tabs support arrow keys, Home, and End.

## Demo boundaries

There is no connected AI model, wardrobe account, fit prediction, payment processing, or personalized body profile. Wardrobe and checkout work as local frontend previews. The visible score uses documented local rules: color tags (40%), top/trouser coverage and fabric variety (35%), and occasion tags (25%). Sizes are retained for bag selection but are not evaluated for fit. The panel explicitly labels these as demo rules and explains the calculation.

Unlike the source mockup, no fictional discount, model version, body measurements, or verified fitting claims are displayed. Sample prices use USD consistently with the existing catalogue; these are mock values, not live offers or currency conversions.

## Verification

- TypeScript check, Oxlint, and Vite production build passed.
- Chrome/Playwright checks passed for source search/filtering, keyboard tabs, selection/replacement, size and occasion changes, score invalidation/recalculation, saving/loading/deleting looks, name validation, persistence, invalid storage, and keyboard dialog behavior.
- Shared-bag regression checked adding multiple studio products at once, excluding owned pieces, preserving selected sizes, navigating to the approved catalogue, adding another product there, and returning to the matcher with the correct count/subtotal.
- Default and full five-slot layouts tested without horizontal overflow at mobile/tablet/desktop widths; the default layout was checked at 320, 390, 540, 600, 768, 1024, 1143, 1280, and 1440 px.
- All page images load. Browser checks completed without JavaScript console errors or failed resource requests.
- Desktop and mobile screenshots were captured for review and the desktop rendering compared with the supplied design.

The original matcher screenshots show the earlier sample archive; the live page now uses the shared Wardrobe collection.
