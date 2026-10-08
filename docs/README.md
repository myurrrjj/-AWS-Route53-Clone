# Route 53 Clone

A functional clone of the AWS Route 53 web console. It recreates the Route 53
user experience and core workflows — hosted zones and DNS records — with a real
backend API and persistent SQLite storage. Actual DNS resolution is not
implemented; the focus is fidelity to the console.

Built for the Scaler SDE Fullstack assignment.

## Features

- Mocked authentication: sign in, sign up, sign out, and cookie-based session
  persistence across reloads.
- Hosted zones: full CRUD, search by name or comment, type filter, sortable
  pagination, bulk delete, and a two-step create wizard.
- DNS records: full CRUD inside a hosted zone, supporting A, AAAA, CNAME, TXT,
  MX, NS, PTR, SRV and CAA record types, with search, type filter, pagination,
  and bulk delete.
- Route 53 look and feel: AWS global navigation bar, Route 53 side navigation,
  breadcrumbs, data tables with row selection, modal forms, inline validation,
  and toast notifications.
- Mocked sections: Dashboard (with live summary stats), Traffic policies,
  Health checks, Resolver and Profiles.
- Bonus features: import records from BIND zone files, export a hosted zone as
  JSON or BIND, dark mode, and keyboard shortcuts.

## Tech stack

- Frontend: Next.js 14 (App Router) with TypeScript and Tailwind CSS.
- Backend: FastAPI with SQLAlchemy 2.0.
- Database: SQLite.

## Repository structure

```
route53-clone/
  backend/
    app/
      main.py          FastAPI app, middleware, router registration
      database.py      Engine, session factory, declarative base
      models.py        User, HostedZone, DnsRecord ORM models
      schemas.py       Pydantic request and response models
      security.py      Password hashing and verification
      deps.py          current_user dependency
      routers/
        auth.py        Login, register, logout, me
        zones.py       Hosted zone CRUD, export
        records.py     DNS record CRUD, bulk delete, BIND import
    seed.py            Creates the demo user and sample data
    requirements.txt
    tests/
      test_api.py      End-to-end API test using FastAPI TestClient
  frontend/
    app/
      layout.tsx               Root layout and providers
      page.tsx                 Redirects to hosted zones
      login/page.tsx           Sign in and sign up
      (console)/layout.tsx     Console shell (nav + sidebar + guard)
      (console)/dashboard/     Dashboard
      (console)/hosted-zones/  Zone list, create wizard, zone detail
      (console)/health-checks/ traffic-policies/ resolver/ profiles/
    components/                TopNav, SideNav, AppShell, Modal, Pagination,
                               RecordModal, FlashStack, providers, primitives
    lib/                       api client, types, formatting helpers
  docs/
    sample.zone                Example BIND file for the import feature
```

## Prerequisites

- Python 3.11 or newer (tested on 3.12; also works on 3.13 and 3.14)
- Node.js 18 or newer

The backend dependencies are pinned to minimum versions that ship prebuilt
wheels for current Python releases, including 3.14. If you are on Python 3.14
and see a `Failed building wheel for pydantic-core` error, make sure you are
installing from this `requirements.txt` (it requires `pydantic>=2.12` and
`SQLAlchemy>=2.0.45`, the first releases with 3.14 wheels). As a fallback, run
the backend on Python 3.12 or 3.13 instead.

## Backend setup

```
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --port 8000
```

The API is now on `http://127.0.0.1:8000`. Interactive docs are at
`http://127.0.0.1:8000/docs`.

`python seed.py` recreates the database and inserts one demo user plus four
sample hosted zones with records.

## Frontend setup

```
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. Next.js rewrites `/api/*` to the backend defined by
`BACKEND_URL` (defaults to `http://127.0.0.1:8000`), so the browser talks to a
single origin and the session cookie works without extra CORS configuration.

## Demo credentials

```
email:    demo@example.com
password: password123
```

You can also create a new account from the sign-in screen.

## Architecture overview

The frontend is a Next.js App Router application. All authenticated pages live
under a route group whose layout renders the console shell: the AWS top
navigation bar, the Route 53 side navigation, and a guard that redirects
unauthenticated visitors to the sign-in page. Data fetching goes through a small
typed API client in `lib/api.ts` that calls same-origin `/api` paths which Next.js
rewrites to the FastAPI service.

The backend is a FastAPI application organised into routers. Authentication uses
Starlette's signed-cookie session middleware; the login endpoint stores the user
id in the session and every protected endpoint resolves the current user through
a dependency. Data access uses SQLAlchemy 2.0 with the typed `Mapped` API over a
SQLite database file.

```
Browser  ->  Next.js (SSR + client)  ->  /api rewrite  ->  FastAPI  ->  SQLite
```

Request flow for a protected call:

1. The browser sends the session cookie with the request.
2. FastAPI resolves the current user from the session; a missing or expired
   session returns 401 and the frontend redirects to sign-in.
3. The router validates the payload with Pydantic, applies the change, and
   returns a typed response.

## Database schema

`users`

| Column        | Type    | Notes                        |
| ------------- | ------- | ---------------------------- |
| id            | integer | primary key                  |
| email         | string  | unique, indexed              |
| name          | string  |                              |
| password_hash | string  | PBKDF2-SHA256 with salt      |
| account_id    | string  | mocked AWS account id        |
| created_at    | datetime| UTC                          |

`hosted_zones`

| Column           | Type    | Notes                             |
| ---------------- | ------- | --------------------------------- |
| id               | string  | primary key, e.g. Z1A2B3C4D5E6F   |
| name             | string  | indexed, normalized to end with . |
| comment          | text    |                                   |
| type             | string  | Public or Private                 |
| private_zone     | boolean |                                   |
| caller_reference | string  |                                   |
| created_at       | datetime| UTC                               |

`dns_records`

| Column         | Type    | Notes                                    |
| -------------- | ------- | ---------------------------------------- |
| id             | integer | primary key                              |
| zone_id        | string  | foreign key to hosted_zones.id, cascade  |
| name           | string  | indexed, fully qualified                 |
| type           | string  | A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA, SOA |
| ttl            | integer | seconds                                  |
| value          | text    | one value per line for multiple values   |
| routing_policy | string  | Simple, Weighted, Latency, Failover, ... |
| set_identifier | string  | used by non-simple routing policies      |
| created_at     | datetime| UTC                                      |

Creating a hosted zone also creates its default NS and SOA records, mirroring
Route 53 behaviour. Deleting a zone cascades to its records.

## API overview

Base URL: `/api`

| Method | Path                                              | Description                          |
| ------ | ------------------------------------------------- | ------------------------------------ |
| GET    | /health                                           | Liveness check                       |
| POST   | /auth/login                                       | Sign in, sets session cookie         |
| POST   | /auth/register                                    | Create an account and sign in        |
| POST   | /auth/logout                                      | Clear the session                    |
| GET    | /auth/me                                          | Current user                         |
| GET    | /hosted-zones                                     | List zones (q, type, page, sort)     |
| POST   | /hosted-zones                                     | Create a zone                        |
| GET    | /hosted-zones/{id}                                | Get one zone                         |
| PATCH  | /hosted-zones/{id}                                | Update comment or type               |
| DELETE | /hosted-zones/{id}                                | Delete a zone and its records        |
| GET    | /hosted-zones/{id}/export                         | Export as json or bind               |
| GET    | /hosted-zones/{id}/records                        | List records (q, type, page, sort)   |
| POST   | /hosted-zones/{id}/records                        | Create a record                      |
| GET    | /hosted-zones/{id}/records/{rid}                  | Get one record                       |
| PATCH  | /hosted-zones/{id}/records/{rid}                  | Update a record                      |
| DELETE | /hosted-zones/{id}/records/{rid}                  | Delete a record                      |
| POST   | /hosted-zones/{id}/records/bulk-delete            | Delete several records               |
| POST   | /hosted-zones/{id}/records/import-bind            | Import a BIND zone file              |

List endpoints accept `q`, `type`, `page`, `page_size`, `sort` and `order` query
parameters and return `{ items, total, page, page_size, pages }`.

## Keyboard shortcuts

- `g` then `h` — go to hosted zones
- `g` then `d` — go to the dashboard
- `Esc` — close an open modal

## Testing

The backend ships with an end-to-end test that exercises auth, zone CRUD,
record CRUD, search, filtering, pagination, export and BIND import:

```
cd backend
python seed.py
python tests/test_api.py
```

## Notes and limitations

- Authentication is mocked; it is not intended for production use.
- DNS changes are stored but never applied to real name servers.
- The frontend proxies to the backend through Next.js rewrites, which is ideal
  for local development. For a hosted deployment, point `BACKEND_URL` at the
  deployed API and make sure the API sets the session cookie for that origin.
