# menu-gen REST API reference

Base URL: `https://test.opketme.uz` (see `apps/web/.env.example`).
All bodies are JSON. Authenticated routes require `Authorization: Bearer <jwt>` (obtain via `/api/auth/login`).
Error shape: `{ message: string, code?: string, details?: unknown }`.

---

## Auth

### `POST /api/auth/register`

Create a new user **and** their default Restaurant. Public.

**Body**

| field            | type     | rules                       |
|------------------|----------|-----------------------------|
| `name`           | string   | 2–80 chars                  |
| `email`          | string   | valid email                 |
| `password`       | string   | 8–100 chars                 |
| `restaurantName` | string   | 2–120 chars                 |

**Returns** `201` `{ token, user: { id, email, name, createdAt } }`.

**Caveats**
- `email` is lowercased server-side; the index is case-insensitive.
- Returns `409 DUPLICATE` if email is already taken (account enumeration is by design — UX wins; mitigate via rate limiting).
- Rate-limited at 30 requests / 15 min / IP.

---

### `POST /api/auth/login`

**Body**: `{ email, password }`. **Returns**: `{ token, user }`. **401** on bad credentials. Same rate limit as `/register`.

### `GET /api/auth/me`

Authenticated. Returns the current user (`{ user }`). Use after page reload to revalidate the cached token.

---

## Restaurant

### `GET /api/restaurant/me`

Authenticated. Returns the caller's restaurant. **404** if none (shouldn't happen — created at registration).

### `PATCH /api/restaurant/me`

Authenticated. Partial update.

**Body** (all optional):

| field         | type     | rules                                            |
|---------------|----------|--------------------------------------------------|
| `name`        | string   | 2–120                                            |
| `description` | string   | ≤ 500                                            |
| `logoUrl`     | url      | http/https only (`safeUrl()`)                    |
| `coverUrl`    | url      | http/https only                                  |
| `currency`    | string   | exactly 3 chars (e.g. `USD`)                     |
| `themeColor`  | string   | `#RRGGBB`                                        |
| `address`     | string   | ≤ 240                                            |
| `phone`       | string   | ≤ 40                                             |
| `instagram`   | string   | ≤ 80                                             |
| `slug`        | string   | 2–60, `[a-z0-9-]+`; auto-deduped if taken        |

**Caveat**: changing `slug` invalidates printed QR codes. The API auto-suffixes
`-2`, `-3`, ... if the requested slug collides with another restaurant.

---

## Categories

Authenticated. All routes are restaurant-scoped to the caller.

| method | path | body | returns |
|---|---|---|---|
| GET    | `/api/categories`     | —                                | `{ categories: [...] }` |
| POST   | `/api/categories`     | `{ name, sortOrder? }`           | `201 { category }` |
| PATCH  | `/api/categories/:id` | `{ name?, sortOrder? }`          | `{ category }` |
| DELETE | `/api/categories/:id` | —                                | `204` |

`:id` is validated as an ObjectId by `requireObjectId` middleware — invalid ids return 404 cleanly.

`DELETE` cascades: every `MenuItem` in the category is removed.

---

## Menu items

Authenticated. Same shape as categories, plus modifier groups.

| method | path | returns |
|---|---|---|
| GET    | `/api/items`     | `{ items: [...] }` (sorted `sortOrder ASC`) |
| POST   | `/api/items`     | `201 { item }` |
| PATCH  | `/api/items/:id` | `{ item }` |
| DELETE | `/api/items/:id` | `204` |

**`POST /api/items` body**

| field           | type      | notes                                                |
|-----------------|-----------|------------------------------------------------------|
| `category`      | objectId  | required, must belong to the caller's restaurant     |
| `name`          | string    | 1–120                                                |
| `description`   | string    | ≤ 500                                                |
| `price`         | number    | ≥ 0                                                  |
| `imageUrl`      | url\|""   | http/https only; empty string clears                 |
| `available`     | boolean   | default `true`                                       |
| `tags`          | string[]  | ≤ 10, each ≤ 30 chars                                |
| `allergens`     | string[]  | ≤ 20, each ≤ 30 chars                                |
| `modifierGroups`| group[]   | ≤ 10; see below                                      |
| `sortOrder`     | int       | optional; default = item count in target category    |

**Modifier group shape**

```ts
{
  id: string;          // 1-40, must be unique within the item
  name: string;
  selectionType: 'single' | 'multiple';
  required?: boolean;
  min?: number;        // default: 1 if required else 0
  max?: number;        // default: 1 (single) or options.length (multiple)
  options: [{
    id: string;        // unique within the group
    name: string;
    priceDelta: number;
    available?: boolean;
  }];
}
```

Server enforces `max >= min` and forbids `max > 1` on `single` groups.

---

## Public (unauthenticated)

### `GET /api/public/menu/:slug`

Returns the full restaurant + categories + items, filtered to `available: true`.

```ts
{ restaurant: Restaurant, categories: (Category & { items: MenuItem[] })[] }
```

Backed by the `restaurant_1_available_1_sortOrder_1` index — see
`docs/QUERY_PLANS.md`.

### `POST /api/public/orders`

Create an order from the customer-facing menu. Public, rate-limited
(20/min/IP). Validates every selected modifier against the live menu item;
prices are recomputed server-side, so the client cannot tamper.

**Body**

```ts
{
  restaurantSlug: string,
  table: string,                            // 1–20 chars
  items: [{
    menuItem: ObjectId,                     // must exist & be available
    quantity: 1..99,
    notes?: string,                         // ≤ 240
    selectedModifiers?: { groupId, optionId }[]
  }],
  customerNote?: string                     // ≤ 500
}
```

**Returns** `201 { order }`.

---

## Orders (owner-side)

Authenticated.

### `GET /api/orders?status=pending|preparing|ready|completed|cancelled|all&limit=N`

Default limit 100, max 500. Sorted `createdAt DESC`. Backed by the new
`restaurant_1_status_1_createdAt_-1` compound index when a status filter is
present, falls back to `restaurant_1_createdAt_-1` otherwise.

### `PATCH /api/orders/:id`

Body: `{ status }`. Updates and returns the order. The compound index makes
this an `IXSCAN` even on busy tenants.

### `GET /api/orders/stats`

Returns the dashboard analytics blob. See `OrderStats` in `packages/shared/src/index.ts` for the full shape:

- KPI buckets: `today`, `thisWeek`, `thisMonth` (each `{ orders, revenue, averageOrderValue }`)
- `pending` count
- `statusCounts` (used to badge the filter chips)
- `hourlyToday[24]` — orders by hour of today
- `daily[14]` — last 14 days, dense (zero-filled) for charting
- `topItems[5]` — top 5 by quantity, all-time, excluding cancelled
- `avgPrepTimeMinutes` — average minutes from `createdAt` to `updatedAt` for orders that reached `ready`/`completed` in the last 30 days; `null` if none yet

**Performance note**: a single `$facet` aggregation returns `today/week/month/hourly/daily` in one roundtrip; two small parallel aggregations cover `statusCounts`, `topItems`, and `avgPrepTime`. See `docs/QUERY_PLANS.md`.

---

## QR

### `GET /api/qr`

Authenticated. Returns `{ url, dataUrl }` where `url` is the public menu URL and `dataUrl` is a base64 PNG suitable for `<img src="...">`.

### `GET /api/qr/download.png` and `download.svg`

Streamed file responses (download).

---

## Uploads

### `POST /api/uploads/image`

Authenticated. `multipart/form-data` with field `file`. Limits:

- 5 MB max
- single file per request
- mime must start with `image/`
- **magic-byte verified** server-side (PNG/JPEG/GIF/WebP). Files that lie about their type are deleted and the request 400s.

Returns `{ url }` of the public path under `/uploads/...`. Static serving sets `Cross-Origin-Resource-Policy: cross-origin`, `X-Content-Type-Options: nosniff`, and `Content-Disposition: inline`.

Rate-limited at 30 uploads / minute / IP.

---

## Health

`GET /health` → `{ ok: true, env }`. Suitable for Render health checks.
