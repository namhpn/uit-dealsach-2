# Known Issues and Follow-ups

Codex must record issues here instead of fixing them when they are outside the current ticket scope.

## Open Items

| ID | Date | Source Ticket | Area | Issue / Follow-up | Severity | Suggested Ticket |
|---|---:|---|---|---|---|---|
| KI-0001 | 2026-05-26 | T0000 | Frontend dependencies | `npm run build` from `frontend/` fails with `sh: vite: command not found` because `frontend/node_modules/` is absent. No frontend install was performed because T0000 is baseline capture only. | Medium | T0001 — Install/verify frontend dependencies and skeleton build if allowed. |
| KI-0002 | 2026-05-26 | T0000 | Backend test tooling | `docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` runs 5 tests with 7 assertions successfully, but exits non-zero because PHPUnit reports `No code coverage driver available`. | Low | T0001 — Decide whether to configure a coverage driver, adjust PHPUnit coverage behavior, or accept warning-only test output. |
| KI-0003 | 2026-05-26 | T0000 | Process docs | `AGENTS.md` says to use `docs/Completion_Report_Template.md`, but the template exists at `docs/templates/Completion_Report_Template.md`. | Low | Documentation cleanup ticket to align the referenced completion report path. |

## Closed Items

| ID | Closed Date | Resolution |
|---|---:|---|
| - | - | - |
