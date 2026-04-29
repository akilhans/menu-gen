# Query plans & index audit

Run `db.collection.find(...).explain('executionStats')` against your dev or
staging Atlas cluster after deploying. Compare:

- `winningPlan.stage` — `IXSCAN` is what we want; `COLLSCAN` means missing index.
- `winningPlan.indexName` — confirms the planner chose the index we wanted.
- `executionStats.totalKeysExamined` vs `totalDocsExamined` — large gap means
  the index isn't covering the predicate (good); equal counts mean the index
  matches every document selectivity-wise.
- `executionStats.executionTimeMillis` — keep an eye when the dataset grows.

## Orders

### `listOrders(status?)` → `Order.find({ restaurant, status? }).sort({ createdAt: -1 })`

| Variant | Index used | Notes |
|---|---|---|
| no status filter | `restaurant_1_createdAt_-1` | sorted IXSCAN, no in-memory sort |
| with status | `restaurant_1_status_1_createdAt_-1` | added in this PR |

Before the new index, the status-filtered case used the looser
`restaurant_1_createdAt_-1` plus a residual filter on `status`. That works,
but reads documents Mongo will discard. For a 50k-order restaurant filtering
to "pending" (often <1% of rows), the new compound cuts `docsExamined` by
~100×.

### `getOrderStats` (`$facet` aggregation)

Outer `$match: { restaurant, createdAt >= 14d, status: { $ne: 'cancelled' } }`
runs first, served by `restaurant_1_createdAt_-1`. Sub-pipelines see only the
already-restricted document set in memory — no further index lookups.

Two extra small aggregations run in parallel:

- `statusCounts` group-by-status — uses `restaurant_1_status_1_createdAt_-1`,
  index-only scan via `$group` with `_id: '$status'`.
- `topItems` `$unwind` + group — covered by `restaurant_1_status_1_*` prefix.
- `avgPrepTime` (status ∈ `[ready, completed]`) — uses the same compound.

### Pending count

The new partial index `restaurant_pending_partial`
(`partialFilterExpression: { status: 'pending' }`) is tiny (only documents
where status is `pending`), fits comfortably in RAM, and serves the hot KPI
chip on the dashboard with a single bucket lookup.

## Menu

### `/api/public/menu/:slug`

Two parallel reads:

1. `Category.find({ restaurant }).sort({ sortOrder, createdAt })`
   — uses `restaurant_1_sortOrder_1`.
2. `MenuItem.find({ restaurant, available: true }).sort({ sortOrder, createdAt })`
   — uses the new `restaurant_1_available_1_sortOrder_1`. Before this index,
   the planner used `restaurant_1_category_1_sortOrder_1` and applied a
   residual filter on `available`. Functional, but reads hidden items off
   disk. The new index avoids that and keeps the customer-facing path tight.

The two queries are issued in parallel via `Promise.all` and joined in app
memory via a `Map<categoryId, items[]>` — single-pass O(N) merge, not an
N+1 lookup.

## Index hygiene

Removed standalone single-field `index: true` declarations on
`{ restaurant }` (Order, MenuItem, Category) and `{ status }` (Order). The
new compound indexes cover those prefixes, so the standalones were dead
weight (extra writes on every insert/update with no read benefit).

To clean up the existing single-field indexes on a deployed cluster:

```js
db.orders.dropIndex('restaurant_1');
db.orders.dropIndex('status_1');
db.menuitems.dropIndex('restaurant_1');
db.categories.dropIndex('restaurant_1');
```

Run these only after the new indexes have been created (Mongoose creates
them automatically on app boot via `autoIndex` — verify with
`db.orders.getIndexes()` first in production).
