-- Keep existing bucket visibility and limits; permit optimized upload output.
update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'image/webp')
where id in ('products', 'wardrobe')
  and allowed_mime_types is not null
  and not ('image/webp' = any(allowed_mime_types));
