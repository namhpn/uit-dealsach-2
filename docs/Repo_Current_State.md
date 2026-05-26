# Repo Current State

Last updated: 2026-05-26

## Current Branch

`feature/t0004-public-catalog-affiliate-buy-flow`

Baseline source for T0004: `main` at `8aacdbb` (`Add ticket T0004`), after T0003 was merged.

## Completed Tickets

| Ticket | Date | Summary |
|---|---:|---|
| T0000 | 2026-05-26 | Captured baseline folder structure, scripts, dependency state, and build/test results without changing application behavior. |
| T0001 | 2026-05-26 | Normalized Docker Compose commands, added Dockerized frontend npm service, installed frontend npm dependencies, and fixed the default backend PHPUnit baseline without runtime feature changes. |
| T0002 | 2026-05-26 | Added core DealSach domain schema, CI4 models, deterministic Vietnamese demo seed data, backend tests, frontend Vite audit fix, and frontend generated-output ignore coverage. |
| T0003 | 2026-05-26 | Added public catalog JSON read APIs, centralized current offer eligibility, book detail offer grouping, book-level price history, search/filter/sort/pagination, discovery sections, and backend API tests without changing frontend UI or database schema. |
| T0004 | 2026-05-26 | Added public Buy-flow event persistence, `/go/offers/{offerId}` redirect handling, Affiliate Redirect-backed popular clicked deals, and API-backed homepage/search/detail React pages. |

## Current Folder Structure

Relevant folders after T0004:

```text
backend/
├── app/
│   ├── Config/
│   ├── Controllers/
│   ├── Database/
│   │   ├── Migrations/
│   │   └── Seeds/
│   ├── Libraries/
│   └── Models/
├── tests/
│   ├── database/
│   └── feature/
└── phpunit.xml

frontend/
├── package.json
├── package-lock.json
└── src/
    └── app/
        ├── api.ts
        ├── pages/
        └── shared.tsx
```

T0004 added:

```text
backend/app/Controllers/BuyFlowController.php
backend/app/Database/Migrations/2026-05-26-000002_CreateBuyFlowEventTables.php
backend/app/Libraries/BuyFlowService.php
backend/app/Models/BuyAttemptModel.php
backend/app/Models/AffiliateRedirectModel.php
backend/app/Models/RedirectFailureModel.php
backend/tests/feature/BuyFlowFeatureTest.php
frontend/src/app/api.ts
frontend/src/app/pages/SearchPage.tsx
```

## Installed Dependencies

### Frontend

* `frontend/package-lock.json` remains the npm lockfile.
* No new runtime dependencies were added in T0004.
* `frontend/node_modules/` and `frontend/dist/` are ignored by `.gitignore`.

### Backend

* No Composer dependency changes.
* T0004 added no Composer dependencies.

## Available Scripts / Commands

Frontend:

```bash
docker compose run --rm frontend npm install
docker compose run --rm frontend npm audit
docker compose run --rm frontend npm run build
docker compose run --rm --service-ports frontend npm run dev -- --host 0.0.0.0
```

Backend:

```bash
docker compose run --rm app sh -lc 'cd backend && php spark migrate'
docker compose run --rm app sh -lc 'cd backend && php spark db:seed DealSachDemoSeeder'
docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'
docker compose run --rm app sh -lc 'cd backend && php spark routes'
```

## Build/Test Status

| Area | Command | Last Result | Notes |
|---|---|---|---|
| Backend | PHP lint for T0004 migration, controllers, service, models, route file, and tests | Passed | No syntax errors. |
| Backend | `cd backend && php vendor/bin/phpunit` | Passed | 27 tests, 149 assertions. |
| Backend | `docker compose -p dealsach_t0004 run --rm app sh -lc 'cd backend && php spark migrate'` | Passed | Clean disposable MariaDB project; Buy-flow event tables created. |
| Backend | `docker compose -p dealsach_t0004 run --rm app sh -lc 'cd backend && php spark db:seed DealSachDemoSeeder'` | Passed | Demo books, observations, Buy Attempts, Affiliate Redirects, and Redirect Failures inserted. |
| Backend | `docker compose -p dealsach_t0004 run --rm app sh -lc 'cd backend && php spark routes'` | Passed | Public catalog API routes and `GET /go/offers/{offerId}` registered. |
| Backend | `docker compose -p dealsach_t0004 run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed | 27 tests, 149 assertions. |
| Frontend | `docker compose run --rm frontend npm run build` | Passed | Existing Vite chunk-size warning remains. Host-local `npm run build` failed before code compilation because the host `frontend/node_modules` is missing Rollup's optional native package; Dockerized build is the repo-standard result. |

## Public API State

Registered public routes after T0004:

```text
GET /api/public/books
GET /api/public/books/{bookId}
GET /api/public/discovery
GET /api/public/filters
GET /go/offers/{offerId}
```

Catalog read behavior lives in `App\Libraries\PublicCatalogService` and is reused by list, detail, discovery, filters, and Buy-flow eligibility checks. It centralizes current eligibility, 48-hour freshness, valid affiliate destination checks, public no-price status priority, offer grouping, price range filtering, observation-time price history, recent price-drop calculation, and popular-clicked deal ranking.

T0004 adds `App\Libraries\BuyFlowService` for Buy Attempt, Affiliate Redirect, and Redirect Failure event writes. `GET /go/offers/{offerId}` records a Buy Attempt for known offers, validates current eligible-offer and approved-domain destination rules, records Affiliate Redirect only on successful external redirects, and records Redirect Failure for known invalid or ineligible offers.

`GET /api/public/discovery` now ranks `popular_clicked_deals` from successful Affiliate Redirect records in the last 7 days using `Asia/Ho_Chi_Minh`, grouped by book and sorted by redirect count descending then title ascending. Cards include redirect count and top retailer metadata.

## Mock Data State

Seeded counts from disposable MariaDB after T0004:

| Table | Count |
|---|---:|
| books | 12 |
| retailer_platforms | 4 |
| merchants | 8 |
| offers | 24 |
| observation_cycles | 14 |
| price_observations | 170 |
| buy_attempts | 8 |
| affiliate_redirects | 7 |
| redirect_failures | 1 |

Scenario coverage:

* 6 books with 14 days of observations.
* 6 books with multi-retailer price history.
* 12 price-drop offer scenarios.
* 3 tied lowest-price book scenarios.
* 2 unavailable-offer scenarios.
* 2 stale-price scenarios.
* 4 redirect-failure offer scenarios through missing or invalid destinations.
* Seeded successful Affiliate Redirect scenarios for popular clicked deals.

## Manual Verification Performed

1. Reviewed required docs and T0004 scope.
2. Created branch `feature/t0004-public-catalog-affiliate-buy-flow` from `main`.
3. Confirmed changes are limited to allowed backend Buy-flow/API, frontend public UI, tests, and required process docs.
4. Ran PHP syntax checks for new and changed backend files.
5. Ran local backend PHPUnit.
6. Started a clean disposable database with `docker compose -p dealsach_t0004 up -d --build db`.
7. Ran migrations against disposable MariaDB.
8. Ran `DealSachDemoSeeder` against disposable MariaDB.
9. Ran `php spark routes` in Docker and confirmed public catalog API routes plus `GET /go/offers/{offerId}`.
10. Ran Docker backend PHPUnit.
11. Ran Docker frontend build.
12. Started the disposable full stack and Dockerized Vite dev server.
13. Captured homepage at 1366px: API-backed hero, featured books, and discovery sections rendered.
14. Captured search page at 360px with `q=Tony&availability=available_now`: filters and mobile header rendered; category chips remain horizontally scrollable.
15. Captured book detail at 1366px: API-backed metadata, grouped offers, Buy action, price disclaimer, affiliate disclosure, and price history rendered.
16. Verified `GET /go/offers/5` returns HTTP 302 with `Location: https://tiki.vn/nha-gia-kim-demo`.
17. Verified `GET /go/offers/6` returns HTTP 409 Vietnamese failure page.
18. Verified `GET /api/public/discovery` returns CORS-enabled JSON and popular clicked deal metadata from persisted Affiliate Redirect records.

## Known Issues

See `docs/Known_Issues_And_Followups.md`.

Closed in T0004:

* KI-0007 — popular clicked deals now use persisted successful Affiliate Redirect records.

Open after T0004:

* KI-0008 — fresh disposable long-running Docker app containers can need writable-volume ownership normalization before serving HTTP traffic.

## Next Recommended Ticket

T0005 — Normalize long-running Docker writable-volume ownership, or continue with the next small public feature ticket after merging T0004.
