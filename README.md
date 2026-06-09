# claybach.com

The unauthorized hype site for the Clay Ashworth bachelor party.

Single static page. No build step. Just `index.html`.

## Local preview

Any static server works. Easiest:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the URL it prints.

## Deploy to Vercel

You already own `claybach.com`. Two paths:

### Option A — Vercel CLI (fastest)

```bash
npm i -g vercel
vercel              # first deploy → links project
vercel --prod       # promote to production
```

When prompted, accept the defaults. Vercel will detect this as a static site automatically.

### Option B — GitHub → Vercel

1. `git init && git add . && git commit -m "init"`
2. Push to a new GitHub repo.
3. In the Vercel dashboard: **Add New → Project → Import** that repo.
4. Framework Preset: **Other**. Build command: leave empty. Output directory: `.` (the repo root).
5. Deploy.

### Point claybach.com at it

1. In the Vercel project: **Settings → Domains → Add** → `claybach.com` and `www.claybach.com`.
2. Vercel will show DNS records (an `A` record to `76.76.21.21` for the apex, and a `CNAME` to `cname.vercel-dns.com` for `www`).
3. Add those records wherever you registered the domain.
4. SSL provisions automatically once DNS propagates (usually <10 minutes).

## Stack

- Pure HTML/CSS/JS, no framework.
- [d3-geo](https://github.com/d3/d3-geo) + [topojson-client](https://github.com/topojson/topojson-client) loaded from jsDelivr for the world map.
- World boundaries from [world-atlas](https://github.com/topojson/world-atlas) (110m land, ~100 KB).
- Fonts: Playfair Display + DM Mono via Google Fonts.

## Editing

Everything lives in `index.html`:

- **Hero copy**: search for `hero-title` / `hero-subtitle`.
- **Destinations**: search for `const destinations =`. Each entry needs `name`, `coords: [lon, lat]`, and `line`.
- **Date copy**: search for `countdown-note`.
- **Footer**: search for `footer-main`.
