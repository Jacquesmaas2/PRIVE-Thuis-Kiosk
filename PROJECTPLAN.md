# Thuis Kiosk — Project Plan

## Deliverable A: Project Overzicht & Doelen

### Wat is Thuis Kiosk?
Een web-gebaseerde familiebeheer-applicatie ontworpen voor gebruik als altijd-aan kiosk (tablet/scherm in de keuken of gang). Alle gezinsleden (ouders en kinderen) beheren hun taken, boodschappen, afspraken en meer via een touch-vriendelijke interface.

### Kernprincipes
- **100% web-based** — draait in elke moderne browser, geen installatie nodig
- **Geen lokale opslag** — alle data opgeslagen server-side in Supabase/Postgres
- **Multi-user RBAC** — rol: `parent` (beheer), `kid` (gebruik), `guest` (alleen lezen)
- **Security by design** — Row Level Security op databaseniveau, httpOnly cookies
- **Kiosk-vriendelijk** — grote touch targets (min. 48×48 px), geen hover-afhankelijke UI
- **Realtime** — boodschappenlijst en aankondigingen syncen direct via Supabase Realtime

---

## Deliverable B: Repository Structuur

```
PRIVE-Thuis-Kiosk/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Login, register pagina's
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (kiosk)/                 # Alle beveiligde kiosk-pagina's
│   │   │   ├── layout.tsx           # Auth-check + NavBar
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── tasks/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── grocery/page.tsx
│   │   │   ├── calendar/page.tsx
│   │   │   ├── leaderboard/page.tsx
│   │   │   ├── rewards/page.tsx
│   │   │   ├── meal-planner/page.tsx
│   │   │   ├── checklist/page.tsx
│   │   │   ├── school/page.tsx
│   │   │   ├── homework/page.tsx
│   │   │   ├── screen-time/page.tsx
│   │   │   ├── announcements/page.tsx
│   │   │   ├── smart-home/page.tsx
│   │   │   ├── contacts/page.tsx
│   │   │   ├── timer/page.tsx
│   │   │   ├── chores/page.tsx
│   │   │   ├── photos/page.tsx
│   │   │   ├── notes/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── callback/route.ts   # PKCE exchange
│   │   │   │   ├── register/route.ts   # Familie aanmaken
│   │   │   │   └── signout/route.ts
│   │   │   ├── dashboard/summary/route.ts
│   │   │   └── grocery/lists/
│   │   │       ├── route.ts
│   │   │       └── [listId]/
│   │   │           ├── route.ts
│   │   │           └── items/
│   │   │               ├── route.ts
│   │   │               └── [itemId]/route.ts
│   │   │   └── tasks/
│   │   │       ├── route.ts
│   │   │       └── [id]/
│   │   │           ├── route.ts
│   │   │           └── complete/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                 # Redirect → /dashboard
│   ├── components/
│   │   ├── auth/                    # LoginForm, RegisterForm
│   │   ├── dashboard/               # WelcomeBanner, WeatherWidget, TasksSummaryCard, AnnouncementsCard, PointsCard
│   │   ├── grocery/                 # GroceryListView, GroceryItemRow, AddItemForm
│   │   ├── shared/                  # NavBar, UserAvatar, PointsBadge, PageHeader, LoadingSpinner, ErrorBoundary, ConfirmDialog
│   │   ├── tasks/                   # TaskCard, TaskList, CreateTaskForm
│   │   └── ui/                      # shadcn/ui bascomponenten
│   ├── hooks/
│   │   ├── useGroceryRealtime.ts
│   │   └── useTasks.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser client
│   │   │   └── server.ts            # Server client + getAuthProfile()
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   ├── weather.ts               # Open-Meteo integratie
│   │   └── validations/
│   │       ├── auth.ts
│   │       ├── grocery.ts
│   │       └── tasks.ts
│   ├── middleware.ts                 # Auth redirect + sessie refresh
│   ├── providers/
│   │   └── SupabaseProvider.tsx
│   └── types/
│       ├── database.types.ts        # Gegenereerde Supabase types
│       └── index.ts                 # App-level types
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_rls_policies.sql
│   └── seed.sql
├── tests/
│   ├── e2e/tasks.spec.ts
│   └── unit/
│       ├── grocery.test.ts
│       └── tasks.test.ts
├── .env.example
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Deliverable C: Database Schema

Zie `supabase/migrations/001_initial_schema.sql` voor het volledige schema.

### Kerntabellen

| Tabel | Doel |
|-------|------|
| `families` | Familie-entiteit met naam en tijdzone |
| `profiles` | Gebruikersprofiel (display_name, role, color, avatar_url) |
| `tasks` | Taakdefinities met punten en herhaling |
| `task_instances` | Concrete taakopdrachten met status (pending/completed/approved) |
| `points_ledger` | Append-only puntenmutaties per profiel |
| `rewards` | Inwisselbare beloningen |
| `redemptions` | Inlewisselingen + status (pending/approved) |
| `grocery_lists` | Actieve/historische boodschappenlijsten |
| `grocery_items` | Artikelen per lijst met categorie en check-status |
| `announcements` | Berichten op het prikbord (priority: low/medium/high/urgent) |
| `checklist_items` | Terugkerende ochtendroutine-stappen |
| `calendar_events` | Familieafspraken met herhaling |
| `meal_plans` / `meals` | Weekmenu per gezin |
| `homework` | Huiswerkopdrachten met vak en vervaldatum |
| `screen_time_credits` | Schermtijdkrediet per profiel |
| `photos` / `albums` | Fotoarchief in Supabase Storage |
| `notes` | Persoonlijke en gedeelde notities |
| `contacts` | Familiecontacten en noodnummers |
| `smart_home_tiles` | Snelkoppelingen naar Home Assistant/webhooks |
| `audit_log` | Append-only beveiligingslog |

### Views
- `user_points_balance` — SUM van points_ledger per profiel
- `user_screen_time_balance` — Totaal schermtijdkrediet per profiel

### RLS-aanpak
Zie `supabase/migrations/002_rls_policies.sql`.

Hulpfuncties:
```sql
auth_family_id()  -- Geeft family_id terug van ingelogde gebruiker
auth_role()       -- Geeft role terug ('parent' | 'kid' | 'guest')
is_parent()       -- Shorthand voor auth_role() = 'parent'
```

Beleidsregels:
- Alle data is family-scoped (users zien alleen hun eigen gezinsdata)
- Alleen parents mogen taken aanmaken/bewerken/verwijderen
- Kinderen mogen eigen taken afronden
- `points_ledger` is append-only (no UPDATE/DELETE)
- `audit_log` is insert-only

---

## Deliverable D: API Ontwerp

### Authenticatie
| Methode | Route | Toegang | Beschrijving |
|---------|-------|---------|--------------|
| POST | `/api/auth/register` | Publiek | Familie + parent profiel aanmaken |
| GET | `/api/auth/callback` | Publiek | PKCE OAuth exchange |
| POST | `/api/auth/signout` | Ingelogd | Sessie beëindigen |

### Dashboard
| Methode | Route | Toegang | Beschrijving |
|---------|-------|---------|--------------|
| GET | `/api/dashboard/summary` | Ingelogd | Familie, taken, punten, weer, aankondigingen |

### Taken
| Methode | Route | Toegang | Beschrijving |
|---------|-------|---------|--------------|
| GET | `/api/tasks` | Ingelogd | Lijst task instances (filter: status, assignee) |
| POST | `/api/tasks` | Parent | Nieuwe taak + eerste instance aanmaken |
| GET | `/api/tasks/[id]` | Ingelogd | Taak detail |
| PATCH | `/api/tasks/[id]` | Parent | Taak updaten |
| DELETE | `/api/tasks/[id]` | Parent | Taak verwijderen |
| POST | `/api/tasks/[id]/complete` | Eigenaar | Taak afronden + punten bijboeken |

### Boodschappen
| Methode | Route | Beschrijving |
|---------|-------|--------------|
| GET | `/api/grocery/lists` | Actieve lijst ophalen |
| POST | `/api/grocery/lists` | Nieuwe lijst aanmaken (parent) |
| GET/PATCH/DELETE | `/api/grocery/lists/[listId]` | Lijst beheren |
| GET/POST | `/api/grocery/lists/[listId]/items` | Artikelen ophalen / toevoegen |
| PATCH/DELETE | `/api/grocery/lists/[listId]/items/[itemId]` | Artikel bijwerken / verwijderen |

Alle POST/PATCH endpoints valideren invoer met Zod en retourneren gestructureerde foutmeldingen:
```json
{ "error": "Validation error", "details": { "fieldErrors": { ... } } }
```

---

## Deliverable E: UI Wireframes per Module

### 1. Dashboard
- **Header**: Begroeting (goedemorgen/middag/avond), avatar, familienaam, dag+datum
- **Weer**: Temperatuur, conditie-emoji, luchtvochtigheid, windsnelheid
- **Taken samenvatting**: Openstaande taken met puntenbadges, link naar takenpagina
- **Prikbord**: Laatste aankondigingen met prioriteitsbadge (kleurcode)
- **Punten**: Eigen saldo + mini-ranglijst van kinderen

### 2. Taken & Beloningen
- **Taken lijst**: Tabs "Te doen" / "Gedaan", kaartjes met naam/punten/vervaldatum/avatar
- **Taak detail**: Volledige beschrijving, "Afvinken" knop met bevestigingsdialog
- **Nieuw** (parent): Formulier met naam, omschrijving, punten, herhaling, toewijzing, vervaldatum
- **Beloningen**: Grid van beloningskaarten met puntsprijs en inwisselknop

### 3. Boodschappen
- **Lijst**: Gegroepeerd per categorie (zuivel, groente, etc.) met emoji-iconen
- **Check-functie**: Grote touch-targets met vinkje en doorstreping bij afvinken
- **Toevoegen**: Inline formulier (naam + aantal + categorie) bovenaan de pagina
- **Realtime**: Wijzigingen van andere gezinsleden verschijnen direct zonder te verversen

### 4. Kalender
- **Weekoverzicht**: 7 kolommen, evenementen als gekleurde blokken
- **Maandoverzicht**: Grid met stip-indicatoren per dag
- **Evenement aanmaken** (parent): Titel, datum/tijd, locatie, deelnemers, herhaling

### 5. Ranglijst
- **Podium**: Top 3 met medaille-emoji's (🥇🥈🥉)
- **Volledige lijst**: Genummerd, gesorteerd op punten, avatar + naam + saldo
- **Periode-filter**: Vandaag / Deze week / Allertijden

### 6. Maaltijdplanner
- **Weekrooster**: 7 × 3 raster (ontbijt, lunch, diner)
- **Maaltijdkaart**: Naam, recept-link, thumbnail
- **Koppeling boodschappen**: "Ingrediënten toevoegen aan lijst" knop

### 7. Checklists
- **Profielselectie**: Kies wie de routine doet
- **Ochtendroutine**: Vaste stappen (tanden poetsen, rugtas inpakken, enz.) met check-animatie
- **Voortgangsbalk**: Percentage voltooid voor motivatie

### 8. School
- **Links**: Kaartjes per kind met schoolwebsite, roostertool, digitaal leerplatform
- **Rooster**: Eenvoudige weekweergave van lessen
- **Notities**: Korte notities per vak

### 9. Huiswerk
- **Lijst per kind**: Sortering op vervaldatum, kleurcode per vak
- **Toevoegen**: Vak, beschrijving, vervaldatum, moeilijkheidsgraad
- **Status**: Te doen → In progress → Klaar

### 10. Schermtijd
- **Saldo**: Beschikbare minuten per kind
- **Verzoek**: Kind kan extra minuten aanvragen (ouder keurt goed)
- **Historie**: Grafiek van ingezet krediet per week

### 11. Prikbord (volledig)
- **Lijst**: Alle aankondigingen gesorteerd op prioriteit + datum
- **Aanmaken** (parent): Titel, inhoud, prioriteit, verloopdatum
- **Sticky-bovenaan**: Urgente berichten krijgen rode banner

### 12. Smart Home
- **Tegelraster**: Grote touch-tiles (aan/uit, scene, URL-webhook)
- **Status**: Realtime statusweergave via polling of WebSocket
- **Aanpassen** (parent): Tile naam, icoon, kleur, actie-URL

### 13. Contacten
- **Kaartjes**: Avatar, naam, relatie, telefoon (groot tap-to-call)
- **Noodcontacten**: Bovenaan met rode markering
- **Toevoegen** (parent): Naam, relatie, telefoon, e-mail, notitie

### 14. Timer
- **Stopwatch**: Grote digitale display, start/stop/reset
- **Afteltimer**: Stel minuten/seconden in; geluid bij 0 (Web Audio API)
- **Sneltimers**: Vooringestelde knoppen (5 min, 10 min, 30 min)

### 15. Klusjesrooster
- **Rotatierooster** : Week-overzicht, welk kind doet welke klus
- **Afvinken**: Klus als gedaan markeren voor vandaag
- **Klusbeheer** (parent): Naam, omschrijving, rotatie-interval, toegewezen profielen

### 16. Foto's
- **Albums**: Grid van albumomslagen
- **Album detail**: Masonry foto-grid met tap-to-fullscreen
- **Upload**: Drag-and-drop of kiezer, opslaan in Supabase Storage

### 17. Notities
- **Lijst**: Kaartjes met titel + samenvatting, sorteerbaar op datum
- **Editor**: SimpleMDE of contentEditable met basis opmaak
- **Privé/gedeeld toggle**: Notitie alleen voor jezelf of voor iedereen

### 18. Profiel
- **Avatar + naam + rol** weergave
- **Puntensaldo** prominent
- **Uitloggen** knop (groot, onderaan)
- **Profielbewerking**: Weergavenaam en kleur aanpassen (toekomstig)

### 19. Login
- **Simpel formulier**: E-mail + wachtwoord, "Inloggen" knop
- **Link naar registratie**: "Nieuw gezin aanmaken"
- **Foutmelding**: Inline onder het formulier

### 20. Registratie
- **Stap 1**: Familie aanmaken (naam, tijdzone)
- **Stap 2**: Ouder-account (weergavenaam, e-mail, wachtwoord)
- **RLS-setup**: Familie + profiel aangemaakt via service role API route

---

## Deliverable F: Core Modules Implementatie Status

| Module | Status | Bestanden |
|--------|--------|-----------|
| ✅ Dashboard | Volledig | `dashboard/page.tsx` + 5 componenten |
| ✅ Taken | Volledig | `tasks/` + 3 API routes + 3 componenten + hook |
| ✅ Boodschappen | Volledig | `grocery/page.tsx` + 5 API routes + 3 componenten + hook |
| 🔄 Overige 17 | Stub | Elk eigen `page.tsx` met PageHeader |

---

## Deliverable G: Teststrategie

### Unit Tests (Vitest)
Locatie: `tests/unit/`

- **`tasks.test.ts`**: Validatie `createTaskSchema`, `completeTaskSchema`, `approveTaskSchema`; `todayISO()` hulpfunctie
- **`grocery.test.ts`**: Validatie `createGroceryListSchema`, `addGroceryItemSchema`, `updateGroceryItemSchema`

Uitvoeren:
```bash
npm run test:unit
```

### End-to-End Tests (Playwright)
Locatie: `tests/e2e/`

- **`tasks.spec.ts`**: Login → navigate to tasks → afvinken taak → bevestigingsdialog → redirect; grocery item toevoegen
- Vereist: draaiende Next.js dev-server + Supabase project + test credentials in `.env.test`

Uitvoeren:
```bash
npm run test:e2e
```

### Test-variabelen
```env
PLAYWRIGHT_BASE_URL=http://localhost:3000
TEST_EMAIL=mama@devries.test
TEST_PASSWORD=TestWachtwoord123!
```

---

## Deliverable H: Deployment

Zie `README.md` voor stap-voor-stap instructies.

### Stack
- **Frontend + API**: Vercel (Next.js serverless)
- **Database + Auth + Storage + Realtime**: Supabase (cloud)

### Milestones

| # | Milestone | Bevat |
|---|-----------|-------|
| 1 | Foundation | Config, DB schema, types, middleware |
| 2 | Auth | Login, register, PKCE callback, RLS |
| 3 | Dashboard | Dashboard pagina + alle widgets |
| 4 | Taken | Tasks CRUD + puntensysteem |
| 5 | Boodschappen | Grocery CRUD + Realtime |
| 6 | Stubs | 17 stub-pagina's voor overige modules |
| 7 | Tests | Unit + e2e testdekking |
| 8 | Productie | Vercel deploy, seed prod, monitoring |
| 9+ | Modules | Kalender, Beloningen, Schermtijd, ... |
