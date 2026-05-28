# DealSach

DealSach is a Vietnamese-first book price tracker and affiliate deal platform. It helps readers discover books, compare last observed reference prices from tracked Vietnamese retailer platforms and merchants, view price history, save books to a wishlist, create price alerts, and leave DealSach through validated affiliate Buy links.

DealSach is not a seller. It does not provide carts, checkout, online payment, shipping, order management, user reviews, voucher calculation, real retailer scraping, or real-time price guarantees. Public prices are reference prices from mock/demo observations or Admin-managed records.

Required public price disclaimer:

```text
Giá tham khảo được ghi nhận gần đây, vui lòng kiểm tra lại tại nơi bán trước khi mua.
```

The project documentation is written in English. Product UI, messages, validation copy, and emails are Vietnamese-first.

## Features

### Public Discovery

- Homepage with API-backed featured books, recent price drops, popular clicked deals, category shelves, and Vietnamese disclosure copy.
- Search and filters for title, author, publisher, category, ISBN, retailer platform, availability, and price range.
- Book detail pages with grouped offers, best eligible reference price, price history, wishlist action, alert creation, and Buy redirect actions.

### Price Comparison

- Tracks books, categories, retailer platforms, merchants, offers, observation cycles, and price observations.
- Uses centralized eligible-offer rules for current comparison, price filters, Buy eligibility, alerts, and reporting.
- Preserves historical observations and uses observation-time eligibility for book-level price history.

### Affiliate Buy Flow

- Guests and registered users can click eligible Buy actions.
- DealSach records a Buy Attempt, validates the destination, then records either an Affiliate Redirect or a Redirect Failure.
- Invalid, missing, unsafe, stale, unavailable, inactive, or removed offers do not become successful affiliate clicks.

### Accounts

- Email-code authentication with neutral login/register responses.
- Successful verification creates or reuses an active account and starts a session.
- Users can log out and manage account-level alert email preferences.

### Wishlist

- Registered users can add and remove books.
- Duplicate adds are no-op successes.
- Archived books remain visible in existing wishlists with an archived label but cannot be newly added.

### Price Alerts

- Registered users can create target-price and new-lowest-price alerts.
- Alert updates follow status-specific lifecycle rules.
- `php spark alerts:evaluate` processes deterministic mock alert evaluation and writes mock outbound alert emails when conditions pass.
- Email deal links land on DealSach first; users still click Buy separately before leaving for an external seller.
- Alert disable links are token-based and single-use for state changes.

### Admin

- Admin APIs require an active Admin session. Guests receive 401 JSON; registered non-admin users receive 403 JSON.
- Admin users can manage users, alerts, audit records, categories, books, retailer platforms, merchants, offers, and mock observations.
- Admin mutations are audited with sensitive fields masked.
- Admin dashboard reports summarize the last 7 days of Affiliate Redirects, Email Deal Link Clicks, Redirect Failures, alert metrics, email outcomes, price changes, and audit activity.

### Mock/Demo Scope

DealSach uses seeded demo data and Admin-managed records to demonstrate price observations, historical prices, alert behavior, redirect tracking, dashboard reports, and audit records. Real external retailer integration and real email delivery providers are intentionally out of scope.

## Tech Stack

- Backend: CodeIgniter 4, PHP 8.2, MariaDB
- Frontend: React, TypeScript, Vite, Tailwind CSS, Lucide icons, Recharts
- Runtime: Docker Compose with PHP-FPM, Nginx, MariaDB, frontend npm service, and phpMyAdmin

## Project Structure

```text
backend/                 CodeIgniter 4 app, migrations, seeders, services, models, tests
frontend/                React/Vite app
docs/                    Requirements, frontend specs, verification guide, tickets, implementation logs
docker-compose.yml       Local service stack
Dockerfile               PHP-FPM app image
docker/                  Container entrypoint/config helpers
composer.phar            Composer binary used by Docker install commands
```

## Setup and Installation

### Prerequisites

- Docker with Docker Compose
- Git
- A shell that can run the commands below

Host-level PHP, Composer, and Node are optional for normal project work because the documented workflow runs inside Docker.

### Clone or Open the Repository

```bash
git clone <repo-url> dealsach
cd dealsach
```

If the repository is already present, open the repo root:

```bash
cd /path/to/uit-dealsach-2
```

### Environment Files

The local repo state is expected to include repo-level `.env` and `backend/.env` files for the Dockerized demo environment. Do not commit secrets, production credentials, private tokens, or copied environment values into documentation or source files.

Use `.env.example` as the baseline template for local setup and CI-like demo environments. In particular, manage cross-origin frontend domains via environment values instead of hardcoded source edits:

```ini
cors.allowedOrigins = http://localhost:5173,https://dealsach.eu.cc
```

When your frontend domain changes (for example from `localhost:5173` to `dealsach.eu.cc`), update `cors.allowedOrigins` in environment config only and restart containers. No backend code change is required.

### Install Backend Dependencies

```bash
docker compose run --rm app sh -lc 'cd backend && php ../composer.phar install'
```

The app Docker image also installs backend Composer dependencies during build.

### Install Frontend Dependencies

```bash
docker compose run --rm frontend npm install
```

### Start the Stack

```bash
docker compose up -d --build
```

Useful local entry points:

- Public backend/API through Nginx: `http://localhost`
- Frontend Vite dev server: start separately with the command below
- phpMyAdmin: configured by Docker Compose; see known caveats for port `8080`

### Migrate and Seed

```bash
docker compose run --rm app sh -lc 'cd backend && php spark migrate'
docker compose run --rm app sh -lc 'cd backend && php spark db:seed DealSachDemoSeeder'
```

### Start the Frontend Dev Server

```bash
docker compose run --rm --service-ports frontend npm run dev -- --host 0.0.0.0
```

Vite normally serves the frontend on `http://localhost:5173`. In dev mode, frontend API requests are configured to reach the backend at `http://localhost`.

## Common Commands

### Backend Tests

```bash
docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'
```

### Frontend Build

```bash
docker compose run --rm frontend npm run build
```

The existing Vite chunk-size warning is known and does not by itself indicate build failure.

### PHP Lint

```bash
find backend/app/Controllers backend/app/Libraries backend/app/Models backend/app/Database/Migrations backend/tests/database backend/tests/feature -name '*.php' -print0 | xargs -0 -n1 php -l
```

### Route Inspection

```bash
docker compose run --rm app sh -lc 'cd backend && php spark routes'
docker compose run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/public|api/auth|api/user|api/admin|go/offers|email/deals|alerts/disable"'
```

### Alert Evaluation

```bash
docker compose run --rm app sh -lc 'cd backend && php spark alerts:evaluate'
```

Expected output includes counts for evaluated, triggered, emailed, suppressed, failed, baseline-set, expired, and auto-paused alert outcomes.

### Disposable Verification Workflow

Use a temporary Compose project for database-mutating checks:

```bash
docker compose -p dealsach_test up -d --build db
docker compose -p dealsach_test run --rm app sh -lc 'cd backend && php spark migrate && php spark db:seed DealSachDemoSeeder && php vendor/bin/phpunit'
docker compose -p dealsach_test down -v
```

## Usage Examples

### Browse and Search

1. Start the stack and seed the database.
2. Start the frontend dev server.
3. Open `http://localhost:5173`.
4. Search by Vietnamese title, author, publisher, category, or ISBN.
5. Use filters for category, author, publisher, retailer, availability, and price range.

Public pages should show Vietnamese copy and reference-price language. They should not imply DealSach sells books directly.

### Open a Book Detail Page

From search or homepage, open a book card. A detail page shows:

- Book metadata and cover fallback when a cover asset is missing.
- Lowest currently eligible reference price when available.
- Offer groups: purchasable, unavailable, stale reference, and missing valid seller link.
- Price history based on observation-time eligible prices.
- Wishlist and alert controls for registered users.

### Click Buy Through DealSach

Eligible offers expose a Buy action labeled in Vietnamese. Clicking Buy calls:

```text
GET /go/offers/{offerId}
```

Valid offers create an Affiliate Redirect and redirect externally. Invalid or ineligible offers create a Redirect Failure instead.

### Request and Verify an Email Code

Request a code:

```bash
curl -i -c /tmp/dealsach-auth-cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"email":"tester@example.com"}' \
  http://localhost/api/auth/email-code/request
```

Inspect the mock outbox:

```bash
docker compose exec db sh -lc 'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" -N -e "SELECT body_text FROM outbound_emails WHERE normalized_recipient_email='\''tester@example.com'\'' ORDER BY id DESC LIMIT 1"'
```

Verify the code:

```bash
curl -i -b /tmp/dealsach-auth-cookies.txt -c /tmp/dealsach-auth-cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"email":"tester@example.com","code":"<CODE_FROM_MOCK_OUTBOX>"}' \
  http://localhost/api/auth/email-code/verify
```

The response should set an HTTP-only `dealsach_session` cookie and return active user data.

### Manage Wishlist

After login:

- Use the book detail or card wishlist action in the UI.
- Or call the authenticated API:

```bash
curl -i -b /tmp/dealsach-auth-cookies.txt -X POST http://localhost/api/user/wishlist/books/1
curl -s -b /tmp/dealsach-auth-cookies.txt http://localhost/api/user/wishlist
curl -i -b /tmp/dealsach-auth-cookies.txt -X DELETE http://localhost/api/user/wishlist/books/1
```

### Create and Manage Alerts

After login:

- Open a book detail page.
- Create a target-price alert with a whole-number VND target price.
- Create a new-lowest-price alert without a target price.
- Open `/alerts` to pause, reactivate, renew, restart tracking, disable, or update allowed alerts.

Run alert evaluation:

```bash
docker compose run --rm app sh -lc 'cd backend && php spark alerts:evaluate'
```

Mock alert emails are stored in `outbound_emails`. Generated deal links and disable links are represented by persisted token-hash rows; use the UI/API flow rather than exposing token secrets in docs.

### Account Settings

Open `/account` after login to:

- View account information.
- Toggle account-level alert email suppression.
- Log out.

Email suppression does not change individual alert statuses.

### Admin Sign-In

Seed data includes an active Admin account record. Use the normal email-code login flow for the seeded Admin email, then inspect the mock outbox for the verification code. Do not place verification codes or secrets in committed files.

Admin areas:

- `/admin` or `/admin/dashboard` for dashboard reports.
- `/admin/books`, `/admin/categories`, `/admin/retailers`, `/admin/merchants`, `/admin/offers` for catalog management.
- `/admin/users` for user state management.
- `/admin/alerts` for alert review and Admin disable actions.
- `/admin/audit` for mutation history.
- `/admin/reports` for report/dashboard access.

### Admin Catalog Examples

Admin catalog pages support:

- Creating and updating categories.
- Creating, updating, archiving, restoring, and featuring books.
- Managing retailer approved destination domains.
- Managing merchants under retailer platforms.
- Creating and updating offers.
- Adding mock observations under offers.

Admin mutation screens and APIs preserve dependent history and write audit records. Records with dependent history are archived, deactivated, hidden, or status-changed instead of hard-deleted.

### Admin Dashboard Examples

Open `/admin/dashboard` or `/admin/reports` as Admin to review:

- Affiliate Redirect counts grouped by book and retailer platform.
- Email Deal Link Clicks separately from Affiliate Redirects.
- Redirect Failures separately from Affiliate Redirects.
- Active, evaluable, email-suppressed, auto-paused, and expired alert counts.
- Alert email sent/failed counts.
- Book-level price-change summaries.
- Recent Admin mutation audit activity.

The dashboard defaults to the last 7 days using `Asia/Ho_Chi_Minh` and does not support custom date ranges.

## API Route Overview

### Public Catalog

```text
GET /api/public/books
GET /api/public/books/{bookId}
GET /api/public/discovery
GET /api/public/filters
GET /go/offers/{offerId}
```

### Auth

```text
POST /api/auth/email-code/request
POST /api/auth/email-code/verify
GET /api/auth/me
POST /api/auth/logout
```

### Wishlist

```text
GET /api/user/wishlist
GET /api/user/wishlist/books/{bookId}
POST /api/user/wishlist/books/{bookId}
DELETE /api/user/wishlist/books/{bookId}
```

### Price Alerts and Preferences

```text
GET /api/user/alerts
GET /api/user/alerts/{alertId}
POST /api/user/alerts
PATCH /api/user/alerts/{alertId}
POST /api/user/alerts/{alertId}/pause
POST /api/user/alerts/{alertId}/reactivate
POST /api/user/alerts/{alertId}/renew
POST /api/user/alerts/{alertId}/restart-tracking
POST /api/user/alerts/{alertId}/disable
GET /api/user/alert-preferences
PATCH /api/user/alert-preferences
```

### Alert Email Links

```text
GET /email/deals/{token}
GET /alerts/disable/{token}
```

Email deal-link clicks are tracked separately from Affiliate Redirects. Alert disable links can disable an alert once; reusing links follows the existing no-op/error behavior depending on state.

### Admin Users, Alerts, and Audit

```text
GET /api/admin/me
GET /api/admin/users
GET /api/admin/users/{userId}
POST /api/admin/users/{userId}/deactivate
POST /api/admin/users/{userId}/reactivate
GET /api/admin/alerts
GET /api/admin/alerts/{alertId}
POST /api/admin/alerts/{alertId}/disable
GET /api/admin/audit
```

### Admin Catalog

```text
GET /api/admin/categories
POST /api/admin/categories
PATCH /api/admin/categories/{categoryId}
POST /api/admin/categories/{categoryId}/archive
POST /api/admin/categories/{categoryId}/restore
GET /api/admin/books
POST /api/admin/books
GET /api/admin/books/{bookId}
PATCH /api/admin/books/{bookId}
POST /api/admin/books/{bookId}/archive
POST /api/admin/books/{bookId}/restore
GET /api/admin/retailers
POST /api/admin/retailers
PATCH /api/admin/retailers/{retailerId}
POST /api/admin/retailers/{retailerId}/archive
POST /api/admin/retailers/{retailerId}/restore
GET /api/admin/merchants
POST /api/admin/merchants
PATCH /api/admin/merchants/{merchantId}
POST /api/admin/merchants/{merchantId}/archive
POST /api/admin/merchants/{merchantId}/restore
GET /api/admin/offers
POST /api/admin/offers
GET /api/admin/offers/{offerId}
PATCH /api/admin/offers/{offerId}
GET /api/admin/offers/{offerId}/observations
POST /api/admin/offers/{offerId}/observations
```

### Admin Dashboard and Reports

```text
GET /api/admin/dashboard
GET /api/admin/reports
```

## Testing and Verification

Recommended checks before closing implementation work:

```bash
find backend/app/Controllers backend/app/Libraries backend/app/Models backend/app/Database/Migrations backend/tests/database backend/tests/feature -name '*.php' -print0 | xargs -0 -n1 php -l
docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'
docker compose run --rm frontend npm run build
docker compose run --rm app sh -lc 'cd backend && php spark routes'
```

For standard manual QA workflows, see:

- `docs/Manual_Verification_Guide.md`
- `docs/Repo_Current_State.md`
- `docs/Known_Issues_And_Followups.md`

## Known Local Caveats

- Demo cover fallback: seeded books reference `/demo/covers/*` paths that are not present in the current static assets. The UI falls back to generated cover initials. See KI-0009.
- phpMyAdmin port conflict: full-stack startup can be blocked if host port `8080` is already in use. Stop the conflicting local service or use a future Compose override if one is added. See KI-0011.
- Admin category metadata: current category management is limited to existing schema fields such as name, slug, and lifecycle status. See KI-0012.
- Dashboard demo data: the dashboard API supports alert/email/audit metrics, but `DealSachDemoSeeder` does not yet seed rich dashboard-specific alert/email/audit scenarios. Tests cover these scenarios directly. See KI-0013.

## Development Workflow

DealSach uses a ticket-driven workflow. Each implementation ticket should define:

- Ticket ID
- Goal
- Dependencies
- Allowed areas
- Do not touch
- Requirements
- Non-goals
- Acceptance criteria
- Manual verification

Rules for development:

- Work one small ticket at a time.
- Keep edits inside the ticket's allowed areas.
- Do not change backend/frontend behavior for documentation-only tickets.
- Do not add Composer or npm dependencies casually.
- Preserve DealSach's product boundary: no cart, checkout, payment, shipping, orders, reviews, ratings, voucher calculation, real-time guarantees, or real external retailer integration unless requirements change.
- Prefer existing helpers, services, routes, components, and styles.
- Do not add browser automation, screenshots, Cypress, Playwright, or visual-regression artifacts unless a future ticket explicitly allows them.
- Update `docs/Repo_Current_State.md`, `docs/Known_Issues_And_Followups.md`, and `docs/Manual_Verification_Guide.md` when the ticket requires it.
- Add a completion report using `docs/templates/Completion_Report_Template.md`.

## Deeper Documentation

- Product and business rules: `docs/requirement-doc.md`
- Frontend requirements: `docs/frontend/frontend-req.md`
- Frontend design system: `docs/frontend/design-system.md`
- Tickets: `docs/Tickets.md`
- Current state: `docs/Repo_Current_State.md`
- Manual verification: `docs/Manual_Verification_Guide.md`
- Known issues: `docs/Known_Issues_And_Followups.md`
