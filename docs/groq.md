# Groq AI configuration

The implementation is ready for your own Groq and Supabase credentials. No real key is bundled. The browser never receives the Groq key.

## Configure

In `server/.env`:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
GROQ_API_KEY=your-groq-key
GROQ_MODEL=qwen/qwen3.8-27b
GROQ_TIMEOUT_SECONDS=45
SAMPLE_CATALOGUE_ENABLED=true
```

In `client/.env`, configure the matching `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_API_BASE_URL=http://localhost:8000`. Do not create any `VITE_GROQ_API_KEY` variable. Real `.env` files are ignored by Git.

Apply all five SQL migrations from `supabase/migrations/` in filename order, as described in [backend.md](backend.md). Restart both applications after changing environment values. Set `SAMPLE_CATALOGUE_ENABLED=false` in a deployment that must require a real database.

The default is Groq's currently documented vision model, `qwen/qwen3.8-27b`. The implementation uses its image input and JSON response support; the model name is configurable. See [Groq vision documentation](https://console.groq.com/docs/vision) and [Groq API reference](https://console.groq.com/docs/api-reference). Availability may vary by account or change over time.

From `server/`, check configuration without exposing keys:

```powershell
.\.venv\Scripts\python.exe scripts/check_setup.py
# Once credentials and migrations are configured:
.\.venv\Scripts\python.exe scripts/check_setup.py --live
```

The second command checks the database catalogue and Groq's model list. It does not run AI inference or create data. A missing setting or failed check produces exit code 1.

## Outfit matching

`POST /api/matches`, with the signed-in user's Supabase bearer token:

```json
{
  "items": [
    {"source": "store", "variant_id": "<variant UUID>"},
    {"source": "wardrobe", "wardrobe_item_id": "<owned garment UUID>"}
  ],
  "occasion": "weekend",
  "include_profile": false
}
```

Choose two or three distinct garments. Store-only, wardrobe-only, and mixed selections are supported. Store selections identify the exact size/color variant. Multiple variants of the same product are rejected. Occasions are `work`, `weekend`, and `evening`.

The response contains an overall integer score from 0–100, an explanation, and separate scored explanations for `colors`, `styles`, `patterns`, `clothing_types`, and `occasion`. It also includes suggestions, provider/model attribution, whether optional profile details were used, the number of photos analyzed, and a styling/fit disclaimer.

The frontend matcher uses this endpoint directly. There is no local score fallback. Changing the selection, occasion, or profile opt-in clears the previous analysis. Private page state resets on account changes.

## Wardrobe photo tagging

`POST /api/wardrobe/{wardrobe_item_id}/analyze` suggests a name, category/type, color, style, pattern, description, and confidence level. The photo must belong to the verified user. The UI shows suggestions for review and only saves them when the user selects **Use these details**. Low-confidence suggestions cannot be applied by that UI control.

Supported types remain T-shirts, shirts, hoodies, jeans, pants, shorts, skirts, and dresses. AI tagging does not infer the wearer's identity, body shape, skin tone, measurements, or attractiveness.

## Data handling and failures

- The backend resolves all selected items and checks ownership before downloading or sending photos. User-supplied URLs are not fetched. Private images are downloaded from the configured Supabase project using the user's token.
- Selected wardrobe photos are reduced to a maximum of 1024 pixels per side and re-encoded as JPEG, removing EXIF metadata, before transmission. Unreadable, unsupported, oversized, or inaccessible images produce errors.
- Store products use their database descriptions, selected size/color, category, style, and pattern. The AI is explicitly told that it has not viewed store photos; the seeded store assets are vector illustrations.
- By default, no profile fields are sent. Opt-in allows only saved height, weight, body shape, clothing size, and skin tone. Names, email addresses, delivery addresses, phone numbers, user IDs, access tokens, and private storage URLs are excluded from the AI payload.
- The database enforces eight combined matching/tagging requests per account per minute across API workers. Customers cannot modify these counters. Invalid selections and provider failures can consume quota after a reservation; a missing key does not.
- Groq calls time out after the configured interval. Rate limits return 429 with `Retry-After`; incomplete or invalid provider JSON returns 502; timeouts return 504. Configuration failures return 503. Raw provider errors and credentials are not returned.
- There are no automatic inference retries, stored AI conversations, or saved match-history rows. The server validates every score and explanation before returning it.

The AI tests use simulated provider responses and the browser tests simulate authenticated services. Actual Groq inference, email delivery, and hosted storage remain unverified until you configure your account credentials.
