# Relay

A Next.js app that connects GitHub, Notion, Gmail, and Google Calendar through Composio. GitHub is read-only; Notion is used to create task pages, repository reports, and workspace notes from GitHub data. Users sign up / sign in with email + password (Auth.js v5), and each user's Composio connections are stored in Neon Postgres via Prisma.

## Stack

- Next.js 16 (App Router) + React 19
- Auth.js v5 (NextAuth) — Credentials provider, JWT sessions, `bcryptjs` password hashing
- Neon Postgres + Prisma 7 (driver adapter `@prisma/adapter-pg`)
- Composio for GitHub/Notion tools, OpenAI Responses API for the assistant

## Required Environment

Create `.env.local` with (see `.env.example`):

```txt
COMPOSIO_API_KEY=
GITHUB_AUTH_CONFIG_ID=
NOTION_AUTH_CONFIG_ID=
GMAIL_AUTH_CONFIG_ID=
GOOGLECALENDAR_AUTH_CONFIG_ID=

DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
AUTH_SECRET=
AUTH_TRUST_HOST=true
```

Generate `AUTH_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Do not set `COMPOSIO_BASE_URL` — the `@composio/core` SDK reads it and breaks if it points at a versioned REST path.

The user OpenAI API key is **not** stored in the database or `.env.local`. Each user enters their own key and model in the app; those values stay in browser `sessionStorage` only.

## Database Setup

```bash
npm install
npm run db:migrate    # creates User + Connection tables on Neon and generates the client
```

Other DB scripts: `npm run db:generate` (regenerate client), `npm run db:deploy` (apply migrations in CI/prod), `npm run db:studio`.

## Local Run

```bash
npm run dev
```

Then open `http://localhost:3000`. You'll be redirected to `/signin`; create an account at `/signup`.

For OAuth testing with ngrok, expose port `3000` and open the ngrok URL. The Composio callback URL is generated from the current browser origin:

```txt
https://your-ngrok-url.ngrok-free.app/api/composio/callback
```

## Deploying to Vercel

1. Push this repo to GitHub and import it in [Vercel](https://vercel.com).
2. Add these **Environment Variables** in the Vercel project settings:

   `COMPOSIO_API_KEY`, `GITHUB_AUTH_CONFIG_ID`, `NOTION_AUTH_CONFIG_ID`, `GMAIL_AUTH_CONFIG_ID`, `GOOGLECALENDAR_AUTH_CONFIG_ID`, `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`

3. Apply database migrations to your production Neon database (once):

   ```bash
   npm run db:deploy
   ```

4. **Update Composio OAuth callback URLs** (required after you know your Vercel URL):

   In the [Composio dashboard](https://app.composio.dev), open each auth config (GitHub, Notion, Gmail, Google Calendar) and set the allowed callback / redirect URL to:

   ```txt
   https://<your-vercel-domain>/api/composio/callback
   ```

   Example: `https://relay.vercel.app/api/composio/callback`

   The Relay app sends this URL automatically from `window.location.origin` when a user clicks **Connect** — but Composio must allow that origin in the auth config, or OAuth will fail after deploy.

5. Redeploy on Vercel if you changed env vars after the first deploy.

`npm run build` runs `prisma generate` automatically; `postinstall` also regenerates the Prisma client on Vercel.

For local ngrok testing, optionally set `ALLOWED_DEV_ORIGINS=https://your-subdomain.ngrok-free.dev` in `.env.local`.

## Data Storage

- Users (`email`, `passwordHash`) and their Composio `Connection` rows (one per toolkit) live in Neon Postgres.
- The Composio `user_id` is the authenticated `User.id`. API routes derive the user from the session — clients never send their own user/account IDs.
- OpenAI API key and selected model are stored in browser `sessionStorage` only.

## Safety Rule

The app blocks GitHub write tools in the backend. GitHub is only used for reading repositories, issues, comments, and file contents. Notion writes are allowed.
