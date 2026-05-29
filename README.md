# Thuis Kiosk

Een web-gebaseerde familiebeheer-applicatie voor gebruik als kiosk. Gebouwd met Next.js 14 App Router, Supabase en Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14.2 (App Router, TypeScript)
- **Database / Auth**: Supabase (Postgres + RLS + Realtime + Storage)
- **Styling**: Tailwind CSS 3.4 + shadcn/ui (handmatig)
- **Validatie**: Zod
- **Animaties**: Framer Motion
- **Weer**: Open-Meteo (gratis, geen API-key)
- **Tests**: Vitest (unit) + Playwright (e2e)
- **Deploy**: Vercel + Supabase Cloud

## Vereisten

- Node.js 20+
- Een [Supabase](https://supabase.com) project (gratis tier voldoet)
- Een [Vercel](https://vercel.com) account voor deployment

---

## Lokale Installatie

### 1. Repository klonen

```bash
git clone <repo-url> PRIVE-Thuis-Kiosk
cd PRIVE-Thuis-Kiosk
```

### 2. Afhankelijkheden installeren

```bash
npm install
```

### 3. Omgevingsvariabelen instellen

Kopieer het voorbeeld:

```bash
cp .env.example .env.local
```

Vul de waarden in vanuit je Supabase project dashboard (`Settings → API`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://<jouw-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # Alleen voor server-side registratie
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Waarschuwing**: Commit `.env.local` nooit naar git. De service role key heeft volledige database-toegang.

### 4. Database schema uitrollen

Installeer de Supabase CLI als je die nog niet hebt:

```bash
npm install -g supabase
supabase login
supabase link --project-ref <jouw-project-ref>
```

Migraties uitvoeren:

```bash
supabase db push
```

Of handmatig in de Supabase Dashboard SQL Editor de bestanden uitvoeren:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`

### 5. Testdata laden (optioneel)

```bash
supabase db seed
```

Of voer `supabase/seed.sql` handmatig uit in de SQL Editor.

> De seed maakt familie "Familie De Vries" aan, maar **geen auth-gebruikers**. Maak die handmatig aan via Supabase Dashboard → Authentication → Users, of gebruik de registratiepagina van de app.

### 6. Development server starten

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Script | Beschrijving |
|--------|--------------|
| `npm run dev` | Next.js development server |
| `npm run build` | Productie build |
| `npm run start` | Productie server starten |
| `npm run lint` | ESLint controleren |
| `npm run test:unit` | Vitest unit tests |
| `npm run test:e2e` | Playwright e2e tests |
| `npm test` | Alle tests |

---

## Supabase Setup

### Auth instellingen

Ga naar Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://jouw-domein.vercel.app`
- **Redirect URLs**: voeg toe: `https://jouw-domein.vercel.app/api/auth/callback`

Voor lokaal ontwikkelen, voeg ook toe: `http://localhost:3000/api/auth/callback`

### Realtime inschakelen

Ga naar Database → Replication en schakel Realtime in voor:
- `grocery_items`
- `task_instances`
- `announcements`
- `checklist_entries`

Dit is al gedaan via de migratie SQL, maar controleer of het actief is in het dashboard.

### Storage buckets

Voor de foto-module (toekomstig), maak een public bucket `family-photos` aan:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('family-photos', 'family-photos', true);
```

---

## Deployment naar Vercel

### 1. Project importeren

1. Ga naar [vercel.com/new](https://vercel.com/new)
2. Importeer de GitHub repository
3. Selecteer framework: **Next.js** (auto-detect)

### 2. Environment Variables instellen

In Vercel → Project → Settings → Environment Variables, voeg toe:

| Variabele | Waarde |
|-----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key uit Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key uit Supabase |
| `NEXT_PUBLIC_SITE_URL` | `https://jouw-domein.vercel.app` |

> Stel alle variabelen in voor Production, Preview én Development.

### 3. Deployen

```bash
git push origin main
```

Vercel detecteert de push en bouwt automatisch. Na ~2 minuten is de app live.

### 4. Supabase Site URL bijwerken

Na de eerste deploy, update in Supabase Dashboard → Authentication → URL Configuration:
- **Site URL** → `https://jouw-vercel-domein.vercel.app`

---

## Gebruikersrollen

| Rol | Rechten |
|-----|---------|
| `parent` | Volledig beheer: taken aanmaken, beloningen, aankondigingen, gezinsinstellingen |
| `kid` | Eigen taken afvinken, boodschappen toevoegen, punten bekijken, huiswerk bijhouden |
| `guest` | Alleen-lezen toegang tot dashboard en kalender |

Rollen worden opgeslagen in de `profiles` tabel en gecontroleerd via Supabase RLS policies.

---

## Architectuurbeslissingen

### Geen Prisma
Supabase Row Level Security werkt op basis van de JWT-sessie van de ingelogde gebruiker. Prisma gebruikt een service role connectie die RLS omzeilt. Door direct de Supabase JS client te gebruiken respecteert alle data-toegang automatisch de gedefinieerde policies.

### Geen localStorage
Sessies worden beheerd via httpOnly cookies door `@supabase/ssr`. Er wordt nergens `localStorage` of `sessionStorage` gebruikt, wat de app veilig maakt voor kiosk-gebruik (gedeeld apparaat).

### Server Components voor data
Dashboards en lijsten worden als Server Components gerenderd met directe Supabase queries. Client Components worden alleen gebruikt voor interactieve elementen (formulieren, realtime updates, optimistische updates).

---

## Modules Overzicht

| # | Module | Route | Status |
|---|--------|-------|--------|
| 1 | Dashboard | `/dashboard` | ✅ Volledig |
| 2 | Taken | `/tasks` | ✅ Volledig |
| 3 | Boodschappen | `/grocery` | ✅ Volledig |
| 4 | Ranglijst | `/leaderboard` | ✅ Basis |
| 5 | Profiel | `/profile` | ✅ Basis |
| 6 | Timer | `/timer` | ✅ Werkend |
| 7 | Kalender | `/calendar` | 🔄 Stub |
| 8 | Beloningen | `/rewards` | 🔄 Stub |
| 9 | Maaltijdplanner | `/meal-planner` | 🔄 Stub |
| 10 | Checklists | `/checklist` | 🔄 Stub |
| 11 | School | `/school` | 🔄 Stub |
| 12 | Huiswerk | `/homework` | 🔄 Stub |
| 13 | Schermtijd | `/screen-time` | 🔄 Stub |
| 14 | Prikbord | `/announcements` | 🔄 Stub |
| 15 | Smart Home | `/smart-home` | 🔄 Stub |
| 16 | Contacten | `/contacts` | 🔄 Stub |
| 17 | Klusjesrooster | `/chores` | 🔄 Stub |
| 18 | Foto's | `/photos` | 🔄 Stub |
| 19 | Notities | `/notes` | 🔄 Stub |
| 20 | Timer | `/timer` | ✅ Werkend |

---

## Bijdragen & Ontwikkeling

### Nieuwe module toevoegen

1. Maak `src/app/(kiosk)/<module>/page.tsx` aan
2. Voeg toe aan `NAV_ITEMS` in `src/lib/constants.ts`
3. Voeg eventuele API routes toe in `src/app/api/<module>/`
4. Voeg DB-tabellen toe via een nieuwe migratie in `supabase/migrations/`
5. Voeg RLS policies toe voor de nieuwe tabel(len)

### Code stijl

- TypeScript strict mode ingeschakeld
- Geen `any` types
- Alle API routes valideren invoer met Zod voor verwerking
- Server Components voor data-fetching, Client Components voor interactiviteit
- Alle tekst in het Nederlands (UI-labels, foutmeldingen)

---

## Licentie

Privé gebruik — [Familie De Vries / SYNTIQ]. Niet voor distributie.
