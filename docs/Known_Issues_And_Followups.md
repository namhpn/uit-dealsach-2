# Known Issues and Follow-ups

Codex must record issues here instead of fixing them when they are outside the current ticket scope.

## Open Items

| ID | Date | Source Ticket | Area | Issue / Follow-up | Severity | Suggested Ticket |
|---|---:|---|---|---|---|---|
| KI-0004 | 2026-05-26 | T0001 | Frontend dependencies | `docker compose run --rm frontend npm install` completed, but npm reported 1 high-severity audit issue. Dependency upgrades were outside T0001 unless required for the baseline build. | Medium | T0002 — Review npm audit findings and update affected frontend dependencies within project constraints. |
| KI-0005 | 2026-05-26 | T0001 | Git hygiene | `frontend/node_modules/` and Vite build output are not covered by a repo `.gitignore` rule. T0001 did not edit `.gitignore` because it was outside the allowed areas; `frontend/node_modules/` remains untracked and must not be committed. | Low | T0002 — Add frontend generated-output ignore rules if `.gitignore` is in scope. |

## Closed Items

| ID | Closed Date | Resolution |
|---|---:|---|
| KI-0001 | 2026-05-26 | Closed by T0001. `docker compose run --rm frontend npm install` completed, created local `frontend/node_modules/`, generated `frontend/package-lock.json`, and `docker compose run --rm frontend npm run build` passed. |
| KI-0002 | 2026-05-26 | Closed by T0001. Added `backend/phpunit.xml` for normal local PHPUnit runs without coverage reporting; `docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` exits 0. |
| KI-0003 | 2026-05-26 | Closed by T0001. `AGENTS.md` now references `docs/templates/Completion_Report_Template.md` and Docker command examples no longer require `--env-file backend/.env`. |
