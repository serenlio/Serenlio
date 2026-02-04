# Serenlio – Deployment (Vercel + GitHub)

## 1. Push to GitHub

```bash
cd Serenlio
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_ORG/YOUR_REPO.git
git push -u origin main
```

(Use your actual GitHub repo URL and branch name.)

## 2. Vercel setup

1. Log in at [vercel.com](https://vercel.com) (use **Log in** if you already have an account).
2. **Add New Project** → **Import** your GitHub repo.
3. **Configure:**
   - **Framework Preset:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** leave empty (the app is served by the serverless API).
   - **Install Command:** `npm install`
4. **Environment variables** (in Vercel project → Settings → Environment Variables):

   | Name | Value | Notes |
   |------|--------|--------|
   | `DATABASE_URL` | Your PostgreSQL connection string | Required (e.g. Supabase, Neon, Railway). |
   | `SESSION_SECRET` | A long random string | Required for JWT auth (e.g. `openssl rand -hex 32`). |
   | `SUPABASE_AUDIO_BASE_URL` | Base URL for Supabase Storage audio | Optional. Example: `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/audio`. Session MP3 filenames (e.g. `morning-calm.mp3`) are appended to this. |

5. Deploy. The app builds and runs; all routes (including static) go through the serverless function.

## 3. DNS (custom domain)

After adding a custom domain in Vercel (Project → Settings → Domains):

- Vercel will show the records to add at your DNS provider.
- **A record:** point your root domain to Vercel’s IP (e.g. `76.76.21.21`).
- **CNAME:** for `www` (or subdomain), point to `cname.vercel-dns.com` (or the value Vercel shows).

Use the exact **A** and **CNAME** values shown in the Vercel dashboard for your project.

## 4. Database (Supabase)

**Getting the correct `DATABASE_URL`:**

1. In [Supabase](https://supabase.com/dashboard): open your project → click the green **Connect** button.
2. Go to the **Connection string** tab.
3. Choose **Session pooler** (or **Transaction pooler**).
4. Click **Copy** to copy the full URI (or copy it manually).
5. Replace `[YOUR-PASSWORD]` in that URI with your **database password**. If the password contains `@`, use `%40` for each `@` (e.g. `pass@@` → `pass%40%40`).
6. Put that **exact** URI in `.env` as `DATABASE_URL=` (one line). Do not change the host or username—use the values from the dialog.

**If you get "Tenant or user not found":** The username must be `postgres.[PROJECT_REF]` and the host must match your project’s region (e.g. `aws-0-us-west-1.pooler.supabase.com`). Use the URI from **Connect** as-is after replacing the password.

**Optional:** Reset the database password (Database → Settings → Reset database password) to a simple password without `@` (e.g. `MyPass123`) to avoid encoding issues, then use it in the URI.

**Run migrations:**

- Run `npm run db:push` against the same `DATABASE_URL` you use in Vercel (e.g. from your machine).
- Seed data (including session titles/descriptions and optional audio URLs) is created on first request if the DB is empty.

## 5. Audio (Supabase Storage)

- Upload MP3s to a **public** Supabase Storage bucket (e.g. `audio`).
- Set `SUPABASE_AUDIO_BASE_URL` to that bucket’s public base URL (no trailing filename).
- Seed uses filenames like `morning-calm.mp3`, `deep-sleep-journey.mp3`, etc. Match these in your bucket or update the seed in `server/routes.ts` to your filenames.
- For existing DBs, you can set `audioUrl` per session via `PUT /api/sessions/:id` with `{ "audioUrl": "https://..." }`.

## 6. Basic usage stats

- **Page:** `/stats` (linked in the nav as “Stats”).
- **API:** `GET /api/stats/usage` returns `{ userCount, sessions: [{ id, title, playCount }] }`.
