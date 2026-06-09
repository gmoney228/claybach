# claybach.com

The unauthorized hype site for the Clay Ashworth bachelor party.

Built with [Astro](https://astro.build). Static output, no SSR, no client framework — just one HTML page with a typed d3-geo globe.

## Run it

```bash
npm install
npm run dev          # http://localhost:4321
```

Other scripts:

- `npm run build` — outputs static site to `dist/`
- `npm run preview` — serves the built output for a final check

## Project layout

```text
.
├── api/                              ← Vercel Edge functions (static site stays static)
│   ├── vote.ts                       ← POST { destination } → increments KV counter
│   └── votes.ts                      ← GET → returns all four counts
├── public/
│   ├── favicon.svg
│   └── land-110m.json                ← vendored world map (Natural Earth 110m, ~55 KB)
├── src/
│   ├── data/destinations.ts          ← the 4 candidate cities + their one-liners
│   ├── scripts/
│   │   ├── globe.ts                  ← d3-geo orthographic globe + spin animation
│   │   └── votes.ts                  ← live vote counts + Yakima leader indicator
│   ├── styles/global.css             ← :root tokens, body, grain, sprocket, amber rule
│   ├── layouts/BaseLayout.astro
│   ├── components/
│   │   ├── SprocketRail.astro
│   │   ├── AmberRule.astro
│   │   ├── Hero.astro
│   │   ├── GlobeSection.astro        ← globe + spin modal + Yakima scouting report
│   │   ├── VoteSection.astro         ← 01.5 — Cast your vote
│   │   ├── DateSection.astro         ← T-minus + decision progress bar
│   │   └── SiteFooter.astro
│   └── pages/index.astro             ← assembles everything
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── vercel.json
```

Most edits are obvious from the layout — change copy in the component, change cities in `src/data/destinations.ts`.

## Deploy to Vercel

You own `claybach.com` already. Two paths:

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel              # first run links the project
vercel --prod
```

Vercel auto-detects Astro: framework preset Astro, build command `npm run build`, output directory `dist`. Nothing to configure.

### Option B — GitHub → Vercel

1. Push to <https://github.com/gmoney228/claybach>.
2. Vercel → **Add New → Project → Import** that repo.
3. Accept the auto-detected Astro defaults. Deploy.

### Point claybach.com at the project

1. Vercel project → **Settings → Domains → Add** → `claybach.com` and `www.claybach.com`.
2. At your registrar, add the records Vercel shows you:
   - `A` for the apex `@` → `76.76.21.21`
   - `CNAME` for `www` → `cname.vercel-dns.com`
3. SSL provisions automatically once DNS propagates (usually under 10 minutes).

## Vote poll storage (Vercel KV / Upstash Redis)

The 4-button vote poll persists counts via the `/api/vote` and `/api/votes` Edge functions.
Without storage configured, the API still answers — it just returns zeros and silently accepts
clicks, so local dev works fine.

To enable real persistence:

1. In the Vercel dashboard → your project → **Storage → Add → Marketplace Database → Redis**.
   Pick **Upstash** (free tier is plenty). Vercel KV is the legacy name for the same thing;
   the integration auto-injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` into your project's
   environment for backward compatibility.
2. Redeploy (or just push) — the API picks up the env vars automatically.

That's it. No schema, no migrations. The keys are literally `votes:Las Vegas`, `votes:Portland`,
`votes:Yakima`, `votes:Coeur d'Alene`, each holding a plain integer.

### Local dev with real storage (optional)

If you want the votes to persist locally too:

```bash
echo 'KV_REST_API_URL=...'   >> .env
echo 'KV_REST_API_TOKEN=...' >> .env
```

The `.env` is gitignored. Or just skip this — the API gracefully returns zeros without it.

### Resetting the counts

```bash
npx vercel env pull .env.production.local   # if you want the live values
# Or, from a Redis client connected to your Upstash instance:
#   DEL "votes:Las Vegas" "votes:Portland" "votes:Yakima" "votes:Coeur d'Alene"
```

## What's where, when you want to edit

| Want to change... | File |
|---|---|
| Hero headline / subtitle / CTA | `src/components/Hero.astro` |
| Globe section copy / button label | `src/components/GlobeSection.astro` |
| Candidate cities, one-liners, hometown flag | `src/data/destinations.ts` |
| Yakima scouting report (stars, notes) | `src/components/GlobeSection.astro` (search `scouting-report`) |
| Globe behavior (rotation speed, spin duration, easing) | `src/scripts/globe.ts` |
| Vote button styling | `src/components/VoteSection.astro` |
| Vote API logic, KV keys | `api/vote.ts`, `api/votes.ts` |
| Countdown copy / progress bar percent | `src/components/DateSection.astro` |
| Footer line | `src/components/SiteFooter.astro` |
| Colors / fonts / spacing tokens | `src/styles/global.css` (`:root`) |
| Page title, OG tags, favicon | `src/layouts/BaseLayout.astro` |

## Stack

- [Astro 5](https://astro.build) — static output, zero JS framework runtime.
- [d3-geo](https://github.com/d3/d3-geo) + [topojson-client](https://github.com/topojson/topojson-client) — only the geo primitives, tree-shaken into the bundle.
- World map: [Natural Earth 110m land](https://github.com/topojson/world-atlas) (~55 KB topojson), served from `/public` with long-term cache headers.
- Vote storage: [`@vercel/kv`](https://www.npmjs.com/package/@vercel/kv) on Vercel Edge functions. The package is a thin wrapper over Upstash Redis; if you swap to the marketplace Upstash integration directly, the only change is `import { Redis } from '@upstash/redis'` and `const kv = Redis.fromEnv()` — the rest of the code is identical.
- Fonts: Playfair Display + DM Mono via Google Fonts (preconnected).
