## Roomvia – Find homes and flatmates with ease

A modern, production-ready Next.js application that helps users discover rental listings, connect with flatmates, and gain market/broker insights. Built with a clean UI, real-time chat, powerful filters, and Supabase-backed data.

### Quick links

- Live app: coming soon
- Tech stack: Next.js 15, React Server Components, Tailwind CSS, Radix UI, Supabase (Auth, DB, Storage), Recharts, Cloudinary

## Features (what you’ll see as you scroll)

### Landing & Navigation

- Minimal navbar with smart CTA that adapts by section (Add Listing vs Add Your Profile)
- Accessible components and consistent theming with Tailwind utilities

### Search & Listings

- Rich filter bar (budget, gender, food preference, company, state, city, area, lifestyle options)
- Infinite-scroll grids for flats and flatmates with responsive cards and hover interactions
- Saved items system with redesigned Saved page (stats, segmented tabs, polished cards)

### Flatmates

- Compact, elegant flatmate cards with: age, gender, location, company, budget, tags, preferred areas, amenities, and a Connect action
- Save/unsave profiles and chat with verified users

### Chat (Real‑time)

- In-app chat sidebar and popup windows powered by Supabase
- Auto-username bootstrap: on first login we set a friendly, unique username from the email before the @
- Unread counts, typing-friendly input, minimized/expanded chat states

### Broker Analytics

- Market insights with quick stats, property-type distribution, budget ranges, top areas, and amenities
- Performance view for brokers (views, saves, messages, phone reveals, per‑listing summary)
- AI/Statistical recommendations panel with export placeholders
- Charts use a platform-consistent, soft typography and muted grid/legend styles

### Media & Uploads

- Cloudinary-backed image uploading for profile photos and listings
- Responsive image grids and galleries

### Accessibility & UX

- Consistent focus rings, keyboard navigation, color contrast, and touch targets
- Subtle micro-interactions, gradients, shadows, and motion

## Project structure

```text
roomvia-landing/
  src/
    app/                 # App Router pages (listings, flatmates, profile, saved, broker analytics)
    components/          # UI, cards, charts, chat, navbar and shared components
    contexts/            # Auth and Chat providers
    hooks/               # Data and UI hooks (analytics, filters, infinite scroll, saves)
    lib/                 # Supabase, auth, chat, analytics, cloudinary, utils
    providers/           # Query client provider
  public/                # Public assets
  database/              # SQL migrations
  scripts/               # Setup documentation & schema helpers
  supabase-*.sql         # Schema definition files
```

## Getting started

### Prerequisites

- Node.js 18+
- Supabase project (URL + anon key)
- Cloudinary account (optional for image uploads)

### Install

```bash
npm install
```

### Environment

Create `.env.local` in `roomvia-landing/` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Optional – used by /api/upload if you enable uploads via a proxy route
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
```

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Database & Auth

- Supabase is used for Auth (OTP email/SMS) and Postgres DB.
- Profiles table supports both `user_id` and legacy `id` PK shapes (the code handles either).
- On first login, the app ensures a profile exists and auto-creates a friendly username from the email before `@` (unique, sanitized). It writes to `profiles.name` or falls back to `profiles.full_name` if `name` doesn’t exist.

### Key tables (high-level)

- `profiles`: `user_id` (or `id`), `name`/`full_name`, `account_type`, `avatar_url`, `locked`
- `flats`: listing data, images, attributes
- `flatmates`: user preferences, location, budget, amenities
- `saves`: saved flats and people
- `chats`, `messages`: conversations and messages (supports legacy and current schemas)

Migrations and schema helpers live in `database/` and root SQL files (e.g., `supabase-*.sql`).

## Notable modules

### Auth (`src/lib/auth.ts`)

- `getUserFast` de-dupes session fetches
- OTP flows for email and phone
- `ensureProfileWithUsername()` creates or backfills a unique `name`/`full_name` from email

### Chat (`src/lib/chat.ts`, `src/contexts/chat-context.tsx`)

- Utilities to create/find chats, send/receive messages, mark read
- Sidebar lists chats with unread badges; chat windows support minimize/expand

### Analytics (`src/app/broker/analytics/` + `src/components/broker/InsightCharts.tsx`)

- Muted axis/legend/tick styles for platform-consistent charts
- Market insights, performance dashboard, recommendations panel

### Flatmates & Listings

- Feature-rich filters (gender, budget, food preference, company, state, city, dynamic area)
- Compact cards with tags, badges, and actions

### Saved items (`/saved`)

- Redesigned UI: stats, segmented tabs, card overlays, and quick actions

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build (typecheck + lint)
npm run start      # Start production server
```

## Deployment

- Any Node-capable host or Vercel works great.
- Set environment variables for Supabase (and Cloudinary if used).

## Contributing

- Fork and create feature branches.
- Keep PRs focused and include screenshots for UI changes.
- Follow the existing code style (typed APIs, clear naming, early returns, minimal nesting).

## Roadmap

- Dark mode and theme switcher
- PDF/CSV export in Analytics
- Push notifications for chat
- Enhanced broker CRM tools

## License

MIT

---

Built with care for a smooth, elegant rental experience. If you ship with Roomvia, we’d love to hear from you! 🚀
