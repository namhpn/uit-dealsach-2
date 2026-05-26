# Repo Current State

Last updated: 2026-05-26

## Current Branch

`feature/t0002-core-domain-mock-data-frontend-hygiene`

Baseline source for T0002: `chore/t0001-dockerized-dev-tooling`.

Note: local `main` did not yet contain T0001 when T0002 work started, so this branch was fast-forwarded to the T0001 prerequisite branch before T0002 changes were applied.

## Completed Tickets

| Ticket | Date | Summary |
|---|---:|---|
| T0000 | 2026-05-26 | Captured baseline folder structure, scripts, dependency state, and build/test results without changing application behavior. |
| T0001 | 2026-05-26 | Normalized Docker Compose commands, added Dockerized frontend npm service, installed frontend npm dependencies, and fixed the default backend PHPUnit baseline without runtime feature changes. |
| T0002 | 2026-05-26 | Added core DealSach domain schema, CI4 models, deterministic Vietnamese demo seed data, backend tests, frontend Vite audit fix, and frontend generated-output ignore coverage. |

## Current Folder Structure

Relevant folders after T0002:

```text
backend/
├── app/
│   ├── Config/
│   ├── Database/
│   │   ├── Migrations/
│   │   └── Seeds/
│   └── Models/
├── tests/
│   └── database/
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

1. Reviewed required docs and ticket scope.
2. Ran Dockerized frontend install, audit, and build.
3. Verified `.gitignore` covers `/frontend/node_modules/` and `/frontend/dist/`.
4. Ran PHP syntax checks for the new backend migration, seeder, and test.
5. Started a clean disposable database with `docker compose -p dealsach_t0002 up -d --build db`.
6. Ran migrations against disposable MariaDB.
7. Ran `DealSachDemoSeeder` against disposable MariaDB.
8. Ran the backend PHPUnit suite.
9. Queried seeded table counts from disposable MariaDB.
10. Ran `git status --short` to verify generated frontend outputs are not staged/tracked.
11. Stopped and removed the disposable Docker project with `docker compose -p dealsach_t0002 down -v`.

Browser/UI verification was not performed because T0002 does not modify frontend source or runtime UI behavior.

## Known Issues

See `docs/Known_Issues_And_Followups.md`.

Closed in T0002:

* KI-0004 — frontend npm audit is clean after updating Vite to `6.4.2`.
* KI-0005 — `.gitignore` covers frontend generated outputs.

Open after T0002:

* KI-0006 — local `main` must receive T0001 before `main...HEAD` accurately represents only T0002 changes.

## Next Recommended Ticket

T0003 — Public read model/API foundation for active books, eligible offers, latest observations, stale/unavailable states, and redirect-link readiness without changing frontend UI.
