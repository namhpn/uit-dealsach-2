# Known Issues and Follow-ups

Codex must record issues here instead of fixing them when they are outside the current ticket scope.

## Open Items

| ID | Date | Source Ticket | Area | Issue / Follow-up | Severity | Suggested Ticket |
|---|---:|---|---|---|---|---|
| KI-0009 | 2026-05-27 | T0006 | Frontend demo assets | Seeded books reference `/demo/covers/*` image paths, but those files are not present in the current frontend/backend static assets. The UI falls back to generated cover initials correctly, but real cover imagery would make manual homepage/detail verification closer to the intended visual design. | Low | Add committed demo cover assets or update seed paths to existing static assets. |
| KI-0014 | 2026-05-28 | T0018 | Docker/frontend runtime | `docker-compose.yml` pins `frontend` to `container_name: ds_frontend`, so running disposable project names like `docker compose -p dealsach_t0018 up -d --build` can fail when another stack already uses that container name. Ticket T0018 kept this out of scope and used `docker compose run ...` verification paths instead. | Medium | Remove fixed `container_name` values (or namespace them) so disposable `-p` stacks can run concurrently without name collisions. |

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
| KI-0011 | 2026-05-28 | Closed by T0016 verification. Running the documented default command `docker compose up -d --build` now starts all services without a phpMyAdmin `8080` conflict. T0012’s conflict was reclassified as one-time local environment state, so Compose was left unchanged. |
| KI-0012 | 2026-05-28 | Closed by T0016. Added `categories.display_label`, `categories.display_description`, and `categories.display_order` via migration, updated Admin category API/service/model behavior, exposed metadata in public filters, updated frontend category labels with fallback to `name`, and seeded deterministic category metadata. |
| KI-0013 | 2026-05-28 | Closed by T0016. `DealSachDemoSeeder` now inserts deterministic dashboard scenarios for active/suppressed/auto-paused/expired alerts, alert email sent/failed outcomes, email deal-link click data, and recent admin audit summaries within the last-7-days dashboard reporting window. |
