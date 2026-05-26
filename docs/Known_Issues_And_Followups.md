# Known Issues and Follow-ups

Codex must record issues here instead of fixing them when they are outside the current ticket scope.

## Open Items

| ID | Date | Source Ticket | Area | Issue / Follow-up | Severity | Suggested Ticket |
|---|---:|---|---|---|---|---|
| KI-0007 | 2026-05-26 | T0003 | Public discovery API | `popular_clicked_deals` returns a safe Vietnamese empty section because click-event, Buy Attempt, Affiliate Redirect, and redirect-failure persistence are explicitly outside T0003. Ranked popular deals need persisted successful affiliate redirects over the last 7 days. | Medium | Add backend click/redirect persistence and public popular-clicked-deals ranking. |

## Closed Items

| ID | Closed Date | Resolution |
|---|---:|---|
| KI-0001 | 2026-05-26 | Closed by T0001. `docker compose run --rm frontend npm install` completed, created local `frontend/node_modules/`, generated `frontend/package-lock.json`, and `docker compose run --rm frontend npm run build` passed. |
| KI-0002 | 2026-05-26 | Closed by T0001. Added `backend/phpunit.xml` for normal local PHPUnit runs without coverage reporting; `docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` exits 0. |
| KI-0003 | 2026-05-26 | Closed by T0001. `AGENTS.md` now references `docs/templates/Completion_Report_Template.md` and Docker command examples no longer require `--env-file backend/.env`. |
| KI-0004 | 2026-05-26 | Closed by T0002. `docker compose run --rm frontend npm audit` reports 0 vulnerabilities after updating the existing Vite dev dependency from `6.3.5` to `6.4.2`; the high-severity issue affected `vite <=6.4.1`. |
| KI-0005 | 2026-05-26 | Closed by T0002. `.gitignore` now covers `/frontend/node_modules/` and `/frontend/dist/` without duplicate conflicting frontend generated-output rules. |
| KI-0006 | 2026-05-26 | Closed before T0003 implementation. T0001 and T0002 are merged into local `main`, and T0003 started from `main` at `b1c5ab4` (`Add ticket T0003`). |
