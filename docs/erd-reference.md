# ERD reference

Transcribed from [StyleFit_ERD.drawio](StyleFit_ERD.drawio). Names, field markers, optional labels, and relationship cardinalities are preserved. This is documentation, not a migration or a redesigned schema.

## Entities and fields

| Entity | Fields in diagram order |
| --- | --- |
| `users` | `PK user_id`, `name`, `email`, `password_hash`, `role`, `height_cm (optional)`, `weight_kg (optional)`, `body_shape (optional)`, `clothing_size (optional)`, `skin_tone (optional)`, `created_at` |
| `wardrobe_items` | `PK wardrobe_item_id`, `FK user_id`, `FK category_id`, `name`, `image_url`, `color (optional)`, `created_at` |
| `categories` | `PK category_id`, `name` |
| `products` | `PK product_id`, `FK category_id`, `name`, `description`, `style`, `pattern`, `is_active` |
| `wishlist_items` | `PK wishlist_item_id`, `FK user_id`, `FK product_id`, `created_at` |
| `cart_items` | `PK cart_item_id`, `FK user_id`, `FK variant_id`, `quantity` |
| `product_variants` | `PK variant_id`, `FK product_id`, `size`, `color`, `price`, `stock_quantity`, `image_url`, `is_active` |
| `orders` | `PK order_id`, `FK user_id`, `recipient_name`, `phone`, `delivery_address`, `total_amount`, `status`, `is_paid`, `created_at` |
| `order_items` | `PK order_item_id`, `FK order_id`, `FK variant_id`, `product_name`, `size`, `color`, `quantity`, `unit_price` |

## Relationships

The source side is exactly one in every relationship. The last column shows the number of target rows per source row.

| Source | Target | Target cardinality |
| --- | --- | --- |
| `categories` | `products` | `0..*` |
| `products` | `product_variants` | `1..*` |
| `users` | `orders` | `0..*` |
| `orders` | `order_items` | `1..*` |
| `product_variants` | `order_items` | `0..*` |
| `users` | `wardrobe_items` | `0..*` |
| `users` | `cart_items` | `0..*` |
| `users` | `wishlist_items` | `0..*` |
| `categories` | `wardrobe_items` | `0..*` |
| `product_variants` | `cart_items` | `0..*` |
| `products` | `wishlist_items` | `0..*` |

## Implementation boundary

The diagram defines nine application tables and eleven relationships. It does not define SQL data types or deletion rules; these are not inferred here. No database tables, constraints, storage buckets, or policies are created in the foundation task.

The supplied ERD includes `users.password_hash`. The project request assigns authentication to Supabase. How the application `users` entity maps to Supabase Auth identities, and how the diagram represents credential ownership, must be resolved before database implementation. The source diagram has not been edited and no separate password store has been implemented.

The BRD says the cart and wishlist use item tables directly and optional profile details remain in `users`. Do not add separate cart, wishlist, profile, or AI history entities without an explicit scope change.
