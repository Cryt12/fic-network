# Philippine Food Innovation Network

A web app for the network of Food Innovation Centers (FICs) in the Philippines. Members sign up, register their FIC with a geotag, and see every FIC on a shared map. A superadmin sees all entries and accounts, reviews login activity, and downloads filtered Excel reports.

## Features

- **Map** of every FIC (Leaflet + OpenStreetMap), clustered pins, popups, full-detail panel.
- **Signup in three steps**: account, location (region + geotag by map click, drag, browser location, or typed coordinates), FIC details. Signup creates the member's first entry.
- **My Entries**: search, edit, delete (soft delete). Only the owner can change an entry, enforced by a Laravel policy.
- **Recently logged in** panel with names masked by the API (`Rosa***`), refreshed every 30 seconds.
- **Admin Panel** (superadmin only, enforced server-side):
  - All entries with every field, filters (search, region, LTO status, assistance type, date range, member) and totals.
  - Excel report (`.xlsx`) with a Summary sheet and an Entries sheet, using the same filters.
  - Users list with logins and failed login attempts, and each user's full login history.
- **Login protection**: 5 wrong passwords lock that email + IP for 1 minute; every failed attempt is recorded (never the password).

## Stack

| | |
|---|---|
| Backend | Laravel 13, PHP 8.3, Sanctum (SPA cookie auth), PostgreSQL 16, OpenSpout (Excel) |
| Frontend | React 19 + TypeScript (strict), Vite, Tailwind CSS v4, shadcn/ui, TanStack Query, React Router, react-hook-form + zod, react-leaflet |

```
backend/    Laravel API (port 8111)
frontend/   React SPA (port 5111; Vite proxies /api and /sanctum to the backend)
```

## Requirements

- PHP 8.3+ with `pdo_pgsql`, `mbstring`, `xml`, `zip`, `curl`
- Composer 2
- Node.js 22+
- PostgreSQL 16

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
```

Edit `backend/.env`:

- `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` for your PostgreSQL.
- `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD`: the only superadmin account. Public signup cannot use this email.

Create the databases, then migrate and create the superadmin:

```bash
createdb fic_network
createdb fic_network_test        # used by the test suite
php artisan migrate
php artisan db:seed --class=SuperadminSeeder
```

> `php artisan db:seed` (without `--class`) also creates 12 demo members with sample entries when `APP_ENV=local`. Handy for trying the app; skip it for real data.

Re-running `SuperadminSeeder` resets the superadmin's name and password to the values in `.env`.

### 2. Frontend

```bash
cd frontend
npm install
```

## Running

Use two terminals:

```bash
cd backend && php artisan serve      # http://localhost:8111
cd frontend && npm run dev           # http://localhost:5111  <- open this
```

## Tests and checks

```bash
cd backend
php artisan test        # feature + unit tests (uses the fic_network_test database)
vendor/bin/pint --test  # code style

cd frontend
npm run lint
npm run build           # type-checks (tsc) and builds to frontend/dist
```

## Adding a FIC field

1. A migration adding the column to `fic_entries`.
2. Its rule in `backend/app/Http/Requests/FicEntryRequest.php` (`fieldRules()`; signup reuses it).
3. Its value in `backend/app/Http/Resources/FicEntryResource.php`.
4. Its definition in `frontend/src/features/entries/fields.ts` (form, validation, table, popup and detail panel are all built from it).

The Excel report picks the field up automatically; give it a nicer column heading in `LABELS` in `backend/app/Reports/EntryReport.php` if needed.

## Deploying (outline)

- Build the frontend (`npm run build`) and serve `frontend/dist` with nginx; route unknown paths to `index.html`.
- Proxy `/api`, `/sanctum` (and later `/storage`) to Laravel through PHP-FPM, on the same domain as the SPA.
- In `backend/.env`: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` and `FRONTEND_URL` set to your domain, `SANCTUM_STATEFUL_DOMAINS=your.domain`, `SESSION_SECURE_COOKIE=true`.
- Use HTTPS: browsers only allow "Use my current location" on secure pages.
- Run `php artisan migrate --force`, `php artisan db:seed --class=SuperadminSeeder --force`, and `php artisan optimize`.
