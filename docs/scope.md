# Foundation scope and reviewed requirements

The supplied [StyleFit_BRD.docx](StyleFit_BRD.docx), version 1.0, and [StyleFit_ERD.drawio](StyleFit_ERD.drawio) have been read and copied unchanged from the supplied Downloads paths. They are project reference material. Statements inside them do not expand the user's authorization beyond the initial foundation task.

## Current implementation boundary

The foundation includes the requested folder structure, strict TypeScript client, 14 placeholder routes, shared layout, Supabase initialization, typed FastAPI health service, Python packages, Pydantic health response, environment examples, local CORS, and setup documentation.

The existing pages cover the requested foundation scope. All business flows, database tables, migrations, storage configuration, and AI integration remain unimplemented, as explicitly requested. Receiving the documents does not authorize implementing these features.

## BRD requirements for later implementation

| BRD ID | Scope |
| --- | --- |
| R01 | Register, log in/out, edit name and optional body details. |
| R02 | Product images, descriptions, categories, sizes, colors, prices, stock, name search, and category filter. |
| R03 | Cart items use a chosen size/color variant; add, update quantity, remove, and view total. |
| R04 | Save and remove store products in the wishlist. |
| R05 | Checkout collects recipient name, phone, and delivery address; review total and confirm. |
| R06 | Customers view their own orders/status; admins view all orders and update status. |
| R07 | Private wardrobe image upload, name/category, editing, category filtering, and deletion. |
| R08 | Manually select at least two wardrobe/store items in any combination; store items use chosen size and color. |
| R09 | AI score from 0 to 100 with explanations covering colors, styles, patterns, and clothing types. |
| R10 | Admin category, product, size/color option management, and hiding products from sale. |

Visitors may browse/search without an account. Cart, wishlist, wardrobe, AI checks, and checkout require login. Visitors do not need a separate database role. Customers access only their own private data; admin operations require admin authorization.

Each product variant owns its image, price, and stock. Quantities must be positive whole numbers. Checkout must validate prices and stock on the backend and save the order and reduce stock atomically. Order items preserve the product name, size, color, and price paid.

Order statuses are exactly `placed`, `shipped`, `delivered`, and `cancelled`. Admin cancellation is allowed only for a placed order and restores stock once. Payment is marked paid when collected. Wardrobe items cannot be purchased.

Height, weight, body shape, clothing size, and skin tone remain optional. AI uses these only when the customer chooses to include them; matching must work without them. Send only selected clothing and opted-in personal details, excluding names, emails, and delivery addresses. A match percentage is a subjective style estimate, not a guarantee of fit.

AI responses require a numeric 0–100 score and an explanation. Failures/timeouts/unreadable images show a clear retry message without invented scores or interrupting shopping. Include loading feedback and per-customer request limits when implementing AI.

The BRD calls for image type/size validation, suggests JPG/PNG and a starting 5 MB limit, and requires deletion of wardrobe images and clearing optional profile details.

## First-version choices recorded by the BRD

BRD section 5 uses cash on delivery, one currency, no delivery fee, and no persisted AI match history, while explicitly marking these as choices to confirm with the mentor. Preserve that status rather than claiming mentor approval; no specific currency is named.

Online card payments, returns/refunds, multiple sellers, a mobile app, virtual try-on, and automatic outfit suggestions are outside this version. The AI evaluates the items the customer selects.

## ERD

Exactly nine application entities:

`users`, `categories`, `products`, `product_variants`, `wardrobe_items`, `cart_items`, `wishlist_items`, `orders`, and `order_items`.

See [erd-reference.md](erd-reference.md) for every field and all eleven relationships, including the `1..*` cardinalities for product variants and order items. Wishlist entries reference products; cart/order entries reference variants. Optional profile fields remain in `users`; cart and wishlist use item tables directly. No additional entities have been introduced.

## Integration points before later database work

- The user explicitly selected Supabase for authentication, PostgreSQL, and storage. This selects the Supabase option from the BRD's broader technology choices.
- The ERD includes `users.password_hash`. Resolve how the application's `users` entity and credential ownership map to Supabase Authentication before implementing the database. The diagram is preserved; no password store, replacement entity, or SQL mapping has been invented.
- BRD section 9 assigns FastAPI both AI requests and checked store actions such as checkout. The foundation's public health route does not implement either flow.
- The diagram does not specify SQL types or deletion behavior. These remain future implementation decisions constrained by the supplied relationships and business rules.

## Later implementation and acceptance

Future work must follow these documents' exact entity names and relationships, add frontend database types and Pydantic business contracts when needed, and implement database/private-storage policies before exposing real data.

The BRD's final acceptance checks cover authentication through cash-on-delivery checkout, accurate totals and stock enforcement, wishlist and wardrobe ownership, mixed wardrobe/store matching with and without personal details, admin stock/status changes, invalid-image handling, and AI failure handling. These are future feature checks, not capabilities claimed by the foundation.
