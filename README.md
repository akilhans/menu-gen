# menu-gen — QR Menu Generator

Production-grade, mobile-first platform for restaurants to build digital menus and share them via QR codes.

## Stack

- **Monorepo** — npm workspaces
- **Frontend** — Next.js 14 (App Router), TypeScript, TailwindCSS, Framer Motion
- **Backend** — Node.js, Express, TypeScript, Mongoose
- **Database** — MongoDB
- **Auth** — JWT (access tokens) + bcrypt
- **QR** — `qrcode` with SVG + PNG output
- **Shared types** — `packages/shared`

## Structure

```
menu-gen/
├── apps/
│   ├── api/          # Express REST API
│   └── web/          # Next.js frontend (dashboard + public menu)
├── packages/
│   └── shared/       # Shared TypeScript types
├── package.json      # Workspace root
├── DEPLOYMENT.md
└── README.md
```

## Quickstart

```bash
# 1. Install
npm install

# 2. Configure environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Fill in MONGODB_URI, JWT_SECRET, etc.

# 3. Run both apps in parallel
npm run dev
```

- API → http://localhost:4000
- Web → http://localhost:3000

## Features

- Restaurant owner registration + JWT login
- Restaurant profile (name, logo, theme color, currency, slug)
- Categories (name, sort order)
- Menu items (name, description, price, image, availability, tags, allergens)
- QR code generation (PNG + SVG download) tied to the restaurant slug
- Public, mobile-first customer menu at `/menu/[slug]`
- Dashboard: overview, menu editor, QR, settings
- Type-safe end-to-end (shared types package)

## Scripts

| Command           | What it does                          |
|-------------------|---------------------------------------|
| `npm run dev`     | Runs API (4000) and Web (3000)        |
| `npm run build`   | Builds all workspaces                 |
| `npm run seed`    | Seeds demo restaurant + menu          |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md).
