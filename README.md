# DealSach

DealSach is a Vietnamese-first book price tracker and affiliate deal platform. Users discover books, compare last observed reference prices, view price history, save wishlist items, create price alerts, and leave DealSach through validated affiliate Buy links.

## Core Features

- Public discovery: featured books, recent price drops, popular clicked deals, and search/filter.
- Book comparison: grouped offer states and observation-time price history.
- Affiliate flow: Buy Attempt, Affiliate Redirect, and Redirect Failure tracking.
- Account flows: email-code auth, session, wishlist, and alert preference control.
- Price alerts: target-price and new-lowest alert lifecycles with deterministic evaluator.
- Admin: catalog/user/alert management, audit trail, and 7-day reporting dashboard.

## System Architecture

### Runtime Components

- Browser client for public/admin UI interactions.
- React + TypeScript frontend (Vite dev server for local development).
- Nginx as HTTP entrypoint.
- CodeIgniter 4 backend (controllers, services, models).
- MariaDB persistence.
- Mock outbound email persistence (`outbound_emails`) with SMTP boundary reserved for future integration.

### Main Data Domains

- Catalog and observations: categories, books, retailers, merchants, offers, observation cycles, price observations.
- Buy-flow events: buy attempts, affiliate redirects, redirect failures.
- Account and personalization: users, sessions, verification codes, wishlist.
- Alerts and notifications: alerts, alert events, deal links/clicks, disable tokens, user alert preferences.
- Admin governance: admin audit logs.

### Design Documentation

- ERD: [docs/design/ERD.md](docs/design/ERD.md)
- UML (text specs): [docs/uml/README.md](docs/uml/README.md)

## Tech Stack

- Backend: CodeIgniter 4, PHP 8.2, MariaDB
- Frontend: React, TypeScript, Vite, Tailwind CSS, Lucide icons, Recharts
- Local runtime: Docker Compose (`app`, `nginx`, `db`, `frontend`, `phpmyadmin`)

## Project Structure

```text
backend/                 CodeIgniter app, migrations, seeders, services, models, tests
frontend/                React/Vite app
docs/                    Requirements, design docs, verification guide, tickets, implementation logs
docker-compose.yml       Local service stack
Dockerfile               PHP-FPM app image
docker/                  Container entrypoint/config helpers
```

## Setup

### Prerequisites

- Docker with Docker Compose
- Git

### Install and Start

```bash
docker compose run --rm app sh -lc 'cd backend && php ../composer.phar install'
docker compose run --rm frontend npm install
docker compose up -d --build
docker compose run --rm app sh -lc 'cd backend && php spark migrate'
docker compose run --rm app sh -lc 'cd backend && php spark db:seed DealSachDemoSeeder'
```

### Frontend Dev Server

```bash
docker compose run --rm --service-ports frontend npm run dev -- --host 0.0.0.0
```

## Key Commands

```bash
docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'
docker compose run --rm frontend npm run build
docker compose run --rm app sh -lc 'cd backend && php spark routes'
docker compose run --rm app sh -lc 'cd backend && php spark alerts:evaluate'
```

## API Surface (Route Families)

- Public: `/api/public/*`, `/go/offers/{offerId}`
- Auth: `/api/auth/*`
- User: `/api/user/wishlist/*`, `/api/user/alerts*`, `/api/user/alert-preferences`
- Email link endpoints: `/email/deals/{token}`, `/alerts/disable/{token}`
- Admin: `/api/admin/*`

## Documentation Map

- Product requirements: [docs/requirement-doc.md](docs/requirement-doc.md)
- Frontend requirements: [docs/frontend/frontend-req.md](docs/frontend/frontend-req.md)
- Frontend design system: [docs/frontend/design-system.md](docs/frontend/design-system.md)
- Manual verification guide: [docs/Manual_Verification_Guide.md](docs/Manual_Verification_Guide.md)
- Tickets index: [docs/Tickets.md](docs/Tickets.md)
- Repo state: [docs/Repo_Current_State.md](docs/Repo_Current_State.md)
- Known issues: [docs/Known_Issues_And_Followups.md](docs/Known_Issues_And_Followups.md)
