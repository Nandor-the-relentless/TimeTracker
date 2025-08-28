# Treats Time by WT — Standalone (Web + Desktop + Mobile)
Runs the same UI/UX across **Web (Vite)**, **Desktop (Tauri)**, and **Mobile (Capacitor)** using **Supabase** for auth & DB. Design/behavior unchanged from your Base44 app.

## Prerequisites
- Node 18+ and pnpm (`npm i -g pnpm`)
- Supabase project (cloud)
- Desktop: Rust (Tauri)
- Mobile: Xcode / Android Studio

## 1) Install
```bash
pnpm install
```

## 2) Configure Supabase
1. Create a Supabase project.
2. SQL Editor → run `supabase/schema.sql`.
3. Settings → API → copy **Project URL** and **anon key**.

Create `apps/web/.env.local`:
```ini
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
APP_PUBLIC_URL=https://treats-time-by-wt.vercel.app
```

## 3) Local Development
**Web**
```bash
pnpm dev:web   # http://localhost:5173
```

**Desktop (Tauri)**
```bash
pnpm dev:desktop
```

**Mobile (Capacitor)**
```bash
cd apps/mobile
pnpm sync
npx cap run ios --external      # or: npx cap run android --external
```

## 4) Production Builds
**Web**
```bash
pnpm build:web
pnpm preview:web
```

**Desktop**
```bash
pnpm build:desktop   # artifacts in apps/desktop/src-tauri/target/release
```

**Mobile**
```bash
pnpm build:mobile
```

## 5) Deploy
### Vercel (recommended)
- Connect repo → set Project Root to `apps/web`
- Add env vars from `.env.local`

### Notes
- Bundle ID (`com.wt.treatstime`) can be customized before store submission.
