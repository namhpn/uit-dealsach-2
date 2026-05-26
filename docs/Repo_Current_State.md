# Repo Current State

Last updated: 2026-05-26

## Current Branch

`feature/t0003-public-catalog-read-apis`

Baseline source for T0003: `main` at `b1c5ab4` (`Add ticket T0003`), after T0001 and T0002 were merged.

## Completed Tickets

| Ticket | Date | Summary |
|---|---:|---|
| T0000 | 2026-05-26 | Captured baseline folder structure, scripts, dependency state, and build/test results without changing application behavior. |
| T0001 | 2026-05-26 | Normalized Docker Compose commands, added Dockerized frontend npm service, installed frontend npm dependencies, and fixed the default backend PHPUnit baseline without runtime feature changes. |
| T0002 | 2026-05-26 | Added core DealSach domain schema, CI4 models, deterministic Vietnamese demo seed data, backend tests, frontend Vite audit fix, and frontend generated-output ignore coverage. |
| T0003 | 2026-05-26 | Added public catalog JSON read APIs, centralized current offer eligibility, book detail offer grouping, book-level price history, search/filter/sort/pagination, discovery sections, and backend API tests without changing frontend UI or database schema. |

## Current Folder Structure

Relevant folders after T0003:

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
```

T0002 added:

```text
backend/app/Database/Migrations/2026-05-26-000001_CreateCoreDomainTables.php
backend/app/Database/Seeds/DealSachDemoSeeder.php
backend/app/Models/CategoryModel.php
backend/app/Models/BookModel.php
backend/app/Models/RetailerPlatformModel.php
backend/app/Models/MerchantModel.php
backend/app/Models/OfferModel.php
backend/app/Models/ObservationCycleModel.php
backend/app/Models/PriceObservationModel.php
backend/tests/database/DealSachDomainDatabaseTest.php
```

T0003 added:

```text
backend/app/Controllers/PublicCatalogController.php
backend/app/Libraries/PublicCatalogService.php
backend/tests/feature/PublicCatalogApiTest.php
```

T0003 updated:

```text
backend/app/Config/Routes.php
```

## Installed Dependencies

### Frontend

* `frontend/package-lock.json` remains the npm lockfile.
* `vite` was updated from `6.3.5` to `6.4.2` to resolve the high-severity npm audit issue affecting `vite <=6.4.1`.
* No new runtime dependencies were added.
* `frontend/node_modules/` and `frontend/dist/` are ignored by `.gitignore`.

### Backend

* No Composer dependency changes.
* `backend/app/Config/Database.php` now lets container-provided `database.default.*` environment values override stale local `.env` database values outside PHPUnit.
* `backend/app/Config/Paths.php` now creates missing CI4 writable subdirectories for fresh Docker named volumes.
* T0003 added no Composer dependencies.

## Available Scripts / Commands

Frontend:

```bash
docker compose run --rm frontend npm install
docker compose run --rm frontend npm audit
docker compose run --rm frontend npm run build
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
| Frontend | `docker compose run --rm frontend npm install` | Passed | 289 packages audited, 0 vulnerabilities after Vite update. |
| Frontend | `docker compose run --rm frontend npm audit` | Passed | 0 vulnerabilities. |
| Frontend | `docker compose run --rm frontend npm run build` | Passed | Existing Vite chunk-size warning remains; no UI source changed. |
| Backend | PHP lint for new migration, seeder, and test | Passed | No syntax errors. |
| Backend | `docker compose -p dealsach_t0002 run --rm app sh -lc 'cd backend && php spark migrate'` | Passed | Clean disposable MariaDB project. |
| Backend | `docker compose -p dealsach_t0002 run --rm app sh -lc 'cd backend && php spark db:seed DealSachDemoSeeder'` | Passed | Deterministic demo data inserted. |
| Backend | `docker compose -p dealsach_t0002 run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed | 10 tests, 42 assertions. |
| Backend | `php -l backend/app/Libraries/PublicCatalogService.php` | Passed | No syntax errors. |
| Backend | `php -l backend/app/Controllers/PublicCatalogController.php` | Passed | No syntax errors. |
| Backend | `php -l backend/tests/feature/PublicCatalogApiTest.php` | Passed | No syntax errors. |
| Backend | `php -l backend/app/Config/Routes.php` | Passed | No syntax errors. |
| Backend | `cd backend && php vendor/bin/phpunit tests/feature/PublicCatalogApiTest.php` | Passed | 13 tests, 82 assertions. |
| Backend | `cd backend && php vendor/bin/phpunit` | Passed | 23 tests, 124 assertions. |
| Backend | `docker compose -p dealsach_t0003 run --rm app sh -lc 'cd backend && php spark migrate'` | Passed | Clean disposable MariaDB project. |
| Backend | `docker compose -p dealsach_t0003 run --rm app sh -lc 'cd backend && php spark db:seed DealSachDemoSeeder'` | Passed | Deterministic demo data inserted. |
| Backend | `docker compose -p dealsach_t0003 run --rm app sh -lc 'cd backend && php spark routes'` | Passed | Public catalog API routes registered. |
| Backend | `docker compose -p dealsach_t0003 run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed | 23 tests, 124 assertions. |

## Public API State

T0003 registers these public JSON routes:

```text
GET /api/public/books
GET /api/public/books/{bookId}
GET /api/public/discovery
GET /api/public/filters
```

Catalog read behavior now lives in `App\Libraries\PublicCatalogService` and is reused by list, detail, discovery, and filters responses. It centralizes EO-001 through EO-009 current eligibility, 48-hour freshness, valid affiliate destination checks, public no-price status priority, offer grouping, price range filtering, observation-time price history, and recent price-drop calculation.

`GET /api/public/discovery` returns `popular_clicked_deals` as a safe empty section until future click-event and affiliate redirect persistence tickets exist.

## Mock Data State

Seeded counts from disposable MariaDB:

| Table | Count |
|---|---:|
| books | 12 |
| retailer_platforms | 4 |
| merchants | 8 |
| offers | 24 |
| observation_cycles | 14 |
| price_observations | 170 |

Scenario coverage:

* 6 books with 14 days of observations.
* 6 books with multi-retailer price history.
* 12 price-drop offer scenarios.
* 3 tied lowest-price book scenarios.
* 2 unavailable-offer scenarios.
* 2 stale-price scenarios.
* 4 redirect-failure offer scenarios through missing or invalid destinations.

## Manual Verification Performed

1. Reviewed required docs and T0003 scope.
2. Created branch `feature/t0003-public-catalog-read-apis` from `main`.
3. Confirmed changes are limited to allowed backend API/read-model areas, tests, and required process docs.
4. Ran PHP syntax checks for the new public catalog service, controller, route file, and feature test.
5. Ran targeted public catalog feature tests locally.
6. Ran the full backend PHPUnit suite locally.
7. Started a clean disposable database with `docker compose -p dealsach_t0003 up -d --build db`.
8. Ran migrations against disposable MariaDB.
9. Ran `DealSachDemoSeeder` against disposable MariaDB.
10. Ran `php spark routes` in Docker and confirmed the four public catalog API routes are registered.
11. Ran the backend PHPUnit suite in Docker.

Browser/UI verification was not performed because T0003 does not modify frontend source or runtime UI behavior.

## Known Issues

See `docs/Known_Issues_And_Followups.md`.

Closed in T0002:

* KI-0004 — frontend npm audit is clean after updating Vite to `6.4.2`.
* KI-0005 — `.gitignore` covers frontend generated outputs.

Closed before T0003:

* KI-0006 — T0001 and T0002 are now merged into local `main`; T0003 started from current `main`.

Open after T0003:

* KI-0007 — popular clicked deals need future click-event / affiliate redirect persistence before they can show ranked public data.

## Next Recommended Ticket

T0004 — Public frontend integration for catalog API responses, including search/list/detail/discovery rendering and responsive manual browser verification, or a backend redirect/click persistence ticket if popular clicked deals should be unlocked first.
