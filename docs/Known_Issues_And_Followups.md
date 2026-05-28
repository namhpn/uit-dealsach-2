# Known Issues and Follow-ups

Codex must record issues here instead of fixing them when they are outside the current ticket scope.

## Open Items

| ID | Date | Source Ticket | Area | Issue / Follow-up | Severity | Suggested Ticket |
|---|---:|---|---|---|---|---|
| KI-0009 | 2026-05-27 | T0006 | Frontend demo assets | Seeded books reference `/demo/covers/*` image paths, but those files are not present in the current frontend/backend static assets. The UI falls back to generated cover initials correctly, but real cover imagery would make manual homepage/detail verification closer to the intended visual design. | Low | Add committed demo cover assets or update seed paths to existing static assets. |
| KI-0011 | 2026-05-27 | T0012 | Docker local ports | `docker compose -p dealsach_t0012 up -d --build` could not start the full stack because host port `8080` was already allocated for phpMyAdmin. Backend test, migration, seed, route, and frontend build checks passed, but direct HTTP stack verification was blocked by the local port conflict. | Low | Make the phpMyAdmin host port configurable or document an alternate Compose override for manual verification. |
| KI-0012 | 2026-05-27 | T0013 | Admin category metadata | T0013 can update category name, slug, and lifecycle status, but the existing `categories` table has no display-metadata columns. No schema migration was added because the ticket did not define exact metadata fields and changes stayed scoped to the current schema. | Low | Define concrete category display metadata fields, then add a migration/API/UI update for them. |
| KI-0013 | 2026-05-28 | T0014 | Demo dashboard data | The Admin dashboard report API supports alert, email, audit, redirect, and price-change metrics, and tests seed those scenarios directly. `DealSachDemoSeeder` still clears alert/email/audit rows without reseeding dashboard-specific alert/email/audit scenarios; seed edits were outside T0014 allowed areas. | Low | Add demo dashboard seed scenarios for active/suppressed/auto-paused/expired alerts, alert emails, email clicks, and Admin audit summaries. |

## Closed Items

| ID | Closed Date | Resolution |
|---|---:|---|
| KI-0001 | 2026-05-26 | Closed by T0001. `docker compose run --rm frontend npm install` completed, created local `frontend/node_modules/`, generated `frontend/package-lock.json`, and `docker compose run --rm frontend npm run build` passed. |
| KI-0002 | 2026-05-26 | Closed by T0001. Added `backend/phpunit.xml` for normal local PHPUnit runs without coverage reporting; `docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` exits 0. |
| KI-0003 | 2026-05-26 | Closed by T0001. `AGENTS.md` now references `docs/templates/Completion_Report_Template.md` and Docker command examples no longer require `--env-file backend/.env`. |
| KI-0004 | 2026-05-26 | Closed by T0002. `docker compose run --rm frontend npm audit` reports 0 vulnerabilities after updating the existing Vite dev dependency from `6.3.5` to `6.4.2`; the high-severity issue affected `vite <=6.4.1`. |
| KI-0005 | 2026-05-26 | Closed by T0002. `.gitignore` now covers `/frontend/node_modules/` and `/frontend/dist/` without duplicate conflicting frontend generated-output rules. |
| KI-0006 | 2026-05-26 | Closed before T0003 implementation. T0001 and T0002 are merged into local `main`, and T0003 started from `main` at `b1c5ab4` (`Add ticket T0003`). |
| KI-0007 | 2026-05-26 | Closed by T0004. Added Buy Attempt, Affiliate Redirect, and Redirect Failure persistence; seeded successful redirects; and updated `GET /api/public/discovery` so `popular_clicked_deals` ranks successful Affiliate Redirect records from the last 7 days with redirect counts and top retailer metadata. |
| KI-0008 | 2026-05-27 | Closed by T0006. Added an idempotent PHP container entrypoint that creates required `backend/writable` runtime subdirectories and normalizes ownership to `www-data:www-data` during container startup, limited to `/var/www/html/backend/writable`. Verified a fresh `dealsach_t0006` stack served `GET /api/public/discovery` and `GET /go/offers/5` without manual `chown`. |
| KI-0010 | 2026-05-27 | Closed during T0011 verification. The workspace now has repo-level `.env` and `backend/.env` files with the expected Compose and CI4 database keys. A fresh disposable `dealsach_t0011` database volume was recreated from those values, and clean migration/seed plus `php spark alerts:evaluate` passed after MariaDB became ready. |
