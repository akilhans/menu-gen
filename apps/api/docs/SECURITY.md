# Security review — OWASP Top 10 (2021)

## Findings & status

| Code | Category | Status | Notes |
|---|---|---|---|
| A01 | Broken Access Control | ✅ | All `/api/*` (non-public, non-auth) routes scope every query by `restaurant.owner === req.userId`. Added `requireObjectId` middleware so invalid `:id` params 404 cleanly instead of leaking Mongoose `CastError`. |
| A02 | Cryptographic Failures | ✅ | `JWT_SECRET` now refuses to load in production unless explicitly set and ≥ 32 chars. The `dev-secret-change-me` fallback only applies in dev. |
| A03 | Injection (NoSQL) | ✅ | Zod validates every body schema. Added `mongoSanitize` middleware that strips `$`-prefixed and dotted keys from `req.body`/`req.query`/`req.params` before any controller runs. Combined, this blocks both `{"email":{"$gt":""}}` operator injection and dotted-path traversal. |
| A04 | Insecure Design | 🟡 | Public `/api/public/orders` is rate-limited at 20/min/IP, but there is no per-restaurant cap. Acceptable for current scale; revisit if a single venue gets traffic-bombed via shared IP. |
| A05 | Security Misconfiguration | ✅ | Removed `cors({ credentials: true })` — the API is Bearer-token only, so cookie credentials add zero benefit and one constraint. `helmet()` runs at defaults (no global CORP loosening); the `/uploads` path scopes `Cross-Origin-Resource-Policy: cross-origin` to itself, plus `nosniff` and `Content-Disposition: inline`. |
| A06 | Vulnerable Components | — | Out of scope this pass — run `npm audit` periodically. |
| A07 | Identification & Auth Failures | 🟡 | JWT 7d, no refresh token, no per-email rate-limit. Auth limiter is per-IP (30 attempts / 15 min). Acceptable but document. Consider `rate-limiter-flexible` keyed on `email` for a future pass. |
| A08 | Software & Data Integrity Failures | ✅ | File uploads now verify magic bytes (PNG / JPEG / GIF / WebP) before accepting. Files that don't match are unlinked and the request 400s. Combined with the upload route's `Content-Type` check + `nosniff` + `Content-Disposition: inline`, an attacker can no longer upload `evil.html` masquerading as an image. |
| A09 | Security Logging & Monitoring | — | Out of scope. |
| A10 | SSRF | — | No outbound HTTP on user-controlled input. |

## Cross-cutting fixes

### XSS via CSS injection in customer menu

`restaurant.coverUrl` was being interpolated into a CSS `background: url(...)` template. Even with a server-side `z.string().url()` check, that validator accepted `javascript:` URLs (which would be inert in a `url()` context but still problematic in other CSS sinks). Fix:

1. **Server (`utils/zod.ts`)**: replaced `z.string().url()` with `safeUrl()` everywhere the URL is user-supplied (`logoUrl`, `coverUrl`, `imageUrl`). The new validator accepts only `http:` and `https:` protocols.
2. **Client (`CustomerMenu.tsx`)**: the URL is now wrapped via `JSON.stringify(...)` when interpolated into `url(...)`, so any `)`, `"`, or newline in the URL is escaped and cannot break out of the CSS function.

### CSRF

Not applicable as a class — the API authenticates with `Authorization: Bearer <jwt>`, and browsers do not auto-attach that header cross-origin. There are no session cookies.

## Manual verification checklist

- `curl -X POST https://test.opketme.uz/api/auth/login -H 'Content-Type: application/json' -d '{"email":{"$gt":""},"password":""}'` should return 400 (Zod rejects non-string), and even if it didn't, `mongoSanitize` would strip `$gt` first.
- Uploading a `.png` file whose body is `<script>alert(1)</script>` should return `400 File is not a valid image` and leave nothing in `uploads/`.
- Setting `coverUrl` to `javascript:alert(1)` via PATCH `/api/restaurant/me` should return 400 with `"URL must use http or https"`.
- Hitting `PATCH /api/items/not-an-objectid` should return 404, not 500.
- Booting the API in production without `JWT_SECRET` should fail fast with a clear error.
