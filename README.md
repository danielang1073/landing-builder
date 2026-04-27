# Landing Builder

Visual drag-and-drop landing page builder built with Next.js, Puck, Prisma, and Tailwind CSS.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Visual editor | [@puckeditor/core](https://puckeditor.com) |
| Database | SQLite via Prisma |
| Styles | Tailwind CSS v4 |
| Icons | react-icons (Lucide set) |

## Project structure

```
app/
  editor/[slug]/     # Visual editor (Puck)
  [slug]/            # Public published page
  api/pages/[slug]/  # REST API: GET / PUT / DELETE
  sitemap.ts         # Auto-generated sitemap
  robots.ts          # robots.txt rules
components/
  blocks/            # Puck components (Header, Hero, Card, CardGrid)
  styles/            # Component CSS files using @apply
registry/
  puck.config.tsx    # Central Puck component registry
prisma/
  schema.prisma      # Page model
```

## Available components

| Component | Description |
|-----------|-------------|
| `Header` | Navigation bar with dual logos, nav pills, and phone number |
| `Hero` | Two-column section with image, headline, CTA, and trust bar |
| `Card` | Image card with title and subtitle |
| `CardGrid` | Drop zone container for cards (2 / 3 / 4 columns) |

## Getting started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env — set DATABASE_URL and NEXT_PUBLIC_SITE_URL

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

Open [http://localhost:3000/editor/my-page](http://localhost:3000/editor/my-page) to create a page with slug `my-page`.

The published page is available at [http://localhost:3000/my-page](http://localhost:3000/my-page).

## Environment variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite file path | `file:./dev.db` |
| `NEXT_PUBLIC_SITE_URL` | Full public URL — used for SEO metadata, sitemap, and canonical tags | `https://yourdomain.com` |

## SEO

Each published page supports per-page SEO fields configurable directly in the editor under the **Page** tab (root level in Puck):

- **Meta título** — overrides the page title in `<title>` and Open Graph
- **Meta descripción** — populates `<meta name="description">` and OG description
- **URL imagen Open Graph** — used for social sharing previews (Twitter, Facebook, LinkedIn)

The sitemap is auto-generated at `/sitemap.xml` and includes all published pages.
Editor and API routes are excluded from indexing via `robots.txt`.

## Page API

```
GET    /api/pages/:slug   # Fetch page data
PUT    /api/pages/:slug   # Save / publish page
DELETE /api/pages/:slug   # Delete page
```
