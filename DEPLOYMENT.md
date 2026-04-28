# Deployment Guide

This is a split deployment: **MongoDB Atlas** for the database, **Render / Railway / Fly** for the API, **Vercel** for the Next.js frontend. Any combination of Node-hosting + Vercel works — the instructions below are the shortest path.

---

## 1 · MongoDB Atlas

1. Sign up at https://www.mongodb.com/cloud/atlas and create a free M0 cluster.
2. Database Access → add a user (remember the password).
3. Network Access → allow `0.0.0.0/0` during setup; tighten later to your API host's egress IPs.
4. Connect → Drivers → copy the `mongodb+srv://...` URI. Replace `<password>` and append the db name:
   ```
   mongodb+srv://USER:PASS@cluster.xxxxx.mongodb.net/menu-gen?retryWrites=true&w=majority
   ```

## 2 · Deploy the API (Render)

1. Push this repo to GitHub.
2. On https://render.com create a new **Web Service**.
3. Settings:
   - **Root directory**: `apps/api`
   - **Build command**: `npm install --workspaces --include-workspace-root && npm run build --workspace apps/api`
   - **Start command**: `npm run start --workspace apps/api`
   - **Node version**: 20
4. Environment variables:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` (Render injects `PORT`; the app honors it) |
   | `MONGODB_URI` | your Atlas URI |
   | `JWT_SECRET` | a long random string (`openssl rand -hex 48`) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CORS_ORIGIN` | your Vercel URL, e.g. `https://menu-gen.vercel.app` |
   | `PUBLIC_WEB_URL` | same as `CORS_ORIGIN` |
5. Deploy. Note the URL (e.g. `https://menu-gen-api.onrender.com`). Visit `/health` to confirm.

### Railway / Fly equivalents

- **Railway**: same envs, build `npm install --workspaces && npm run build:api`, start `npm run start:api`.
- **Fly.io**: add a `Dockerfile` in `apps/api` that builds the monorepo; expose `4000`.

## 3 · Deploy the Web (Vercel)

1. On https://vercel.com import the GitHub repo.
2. Settings:
   - **Root directory**: `apps/web`
   - **Framework preset**: Next.js (auto-detected)
   - **Build command**: `npm run build --workspace apps/web` (Vercel runs this from repo root if `Include source files outside of the root directory` is enabled; otherwise leave the default)
   - **Install command**: `npm install` (from repo root — workspaces hoist)
3. Environment variables:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | your API URL, e.g. `https://menu-gen-api.onrender.com` |
   | `NEXT_PUBLIC_SITE_URL` | your Vercel URL, e.g. `https://menu-gen.vercel.app` |
4. Deploy.

## 4 · Point the API back at the Web

On Render, update `CORS_ORIGIN` and `PUBLIC_WEB_URL` to the final Vercel URL. Redeploy the API so the QR codes encode the correct public URL.

## 5 · Custom domain (optional)

- Vercel: Project → Domains → add `menu.yourbrand.com`.
- Render: Service → Custom Domains → add `api.yourbrand.com`.
- Update `NEXT_PUBLIC_API_URL`, `CORS_ORIGIN`, `PUBLIC_WEB_URL` accordingly.

## 6 · Seed production with demo data (optional)

```bash
# locally, pointed at the production DB
cd apps/api
MONGODB_URI="mongodb+srv://..." npm run seed
```

## Scaling notes

- **DB**: add indexes as queries grow (the models already index `owner`, `slug`, `restaurant+sortOrder`).
- **API**: Render/Railway scale horizontally; the API is stateless (JWT-based).
- **Uploads**: wire `logoUrl`/`imageUrl` to Cloudinary, S3, or UploadThing. The schema already stores only URLs, so any provider works.
- **Caching**: `/api/public/menu/:slug` is a natural edge-cache candidate (add `Cache-Control: s-maxage=60, stale-while-revalidate=300`).
- **Rate limiting**: the API ships with per-IP limits on auth + global endpoints. Behind a CDN, set `trust proxy` accordingly (already on).

## Security checklist

- [x] Bcrypt password hashing (12 rounds)
- [x] JWT with short-ish default (7d) — rotate `JWT_SECRET` to revoke all sessions
- [x] Helmet for baseline HTTP headers
- [x] CORS locked to a known origin
- [x] Zod validation on every request body
- [x] Mongo `strictQuery` enforced
- [x] Owner-scoped queries on every protected route (no cross-tenant reads/writes)
- [ ] **TODO**: Add refresh tokens if session longevity becomes a concern
- [ ] **TODO**: Add WAF / Cloudflare in front of both apps
