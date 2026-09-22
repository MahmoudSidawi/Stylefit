> Historical reference for the earlier project stage. See [backend.md](backend.md) for the current implementation and resolved database/authentication decisions.

# Security requirements for later implementation

This foundation implements a public health endpoint only. Placeholder login and admin pages do not authenticate or authorize anyone.

## Protected FastAPI endpoints

Before adding AI matching, require the Supabase user's access token in the Authorization bearer header. Use a maintained JWT verification library with the project's trusted signing keys (JWKS for asymmetric signing), or Supabase Auth verification appropriate to the project's signing configuration. Validate signature, expiry, issuer, and audience; do not merely decode claims. Reject missing/invalid tokens with 401, then enforce ownership and admin permissions with 403 where appropriate. Never trust a client-supplied user ID as identity.

Verify that every selected private wardrobe item belongs to the authenticated user before accessing its image or sending it to AI. The frontend route is not an authorization boundary. See [Supabase JWT verification](https://supabase.com/docs/guides/auth/jwts).

## Database and image storage

Database tables exposed through Supabase need appropriate grants and Row Level Security policies based on the supplied ERD. The policies must enforce user ownership and admin rights for each relevant operation. Exact entity names and relationships are recorded in [erd-reference.md](erd-reference.md); SQL and policies remain deferred under the foundation-only scope.

The ERD lists `users.password_hash`, while the project request assigns authentication to Supabase. Resolve credential ownership and the mapping between the application `users` entity and Supabase Auth before implementing the database. No duplicate password store or authentication logic has been added.

Wardrobe images must use private storage with ownership policies for upload, read, update, and delete. Use authenticated downloads or short-lived signed URLs when needed. Test unauthenticated access and attempts to access another user's records/images. Public store imagery, if approved, needs distinct access rules. See [Supabase storage access control](https://supabase.com/docs/guides/storage/security/access-control) and [private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals).

## Credentials and CORS

Only the public Supabase project URL and publishable key belong in the browser. AI credentials and Supabase secret/service-role keys remain server-only; these Supabase privileged keys bypass RLS, so any future use requires explicit authorization checks. See [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).

CORS allows the exact configured local client origin and the Authorization header. Bearer tokens do not require cookie credentials. CORS is not an authentication mechanism. See [FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/).

Real environment files must not be committed. No credentials, protected endpoints, database policies, or storage policies have been provisioned in this foundation.
