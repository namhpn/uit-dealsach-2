# DealSach Agent Guide

## Project Overview

DealSach is a Vietnamese-first book price tracker and affiliate deal platform. It helps users discover books, compare last observed reference prices from external sellers, view price history, manage wishlists, create price alerts, and leave DealSach through validated affiliate Buy links.

DealSach is not a seller. Do not add carts, checkout, payment, shipping, orders, reviews, ratings, comments, real-time price guarantees, voucher calculation, or direct purchase flows unless the requirements are explicitly changed.

Primary references:

- Product and business rules: `docs/requirement-doc.md`
- Frontend requirements: `docs/frontend/frontend-req.md`
- Frontend design system: `docs/frontend/design-system.md`
- Docker stack: `docker-compose.yml`

Tech stack:

- Frontend: React, TypeScript, Vite, Tailwind CSS, Radix/shadcn-style primitives, Lucide icons, Recharts
- Backend: CodeIgniter 4 on PHP 8.2
- Database: MariaDB
- Local runtime: Docker Compose with PHP-FPM, Nginx, MariaDB, and phpMyAdmin

Use the repo-local `ci4` skills for CodeIgniter work, `ui-ux-pro-max` plus the frontend docs for UI work, and `viet-chuyen-nghiep` for Vietnamese public text, validation copy, emails, and user-facing explanations.

Use `diagnostic-protocol` for debugging, bug fixing, database/API/UI behavior changes, and production-affecting work: reproduce or verify the current system, trace the full flow, identify the exact break point, apply the smallest viable fix, and confirm the result with evidence.

Use the repo-local `rtk` skill when the `rtk` command is available. Prefer `rtk <command>` for routine shell commands to reduce token-heavy output, and use `rtk proxy <command>` when raw output is needed for exact diagnostics.

## Build and Test Commands

Run backend commands from `backend/`. Run frontend commands from `frontend/`. The Docker PHP service mounts the repository root, so CI4 commands inside the container must explicitly `cd backend`.

Install backend dependencies in Docker:

```bash
docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php ../composer.phar install'
```

Install frontend dependencies on the host:

```bash
cd frontend
npm install
```

Start the full Docker stack:

```bash
docker compose --env-file backend/.env up -d --build
```

Stop the stack:

```bash
docker compose --env-file backend/.env down
```

Run CI4 Spark commands in Docker:

```bash
docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php spark list'
docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php spark migrate'
```

Run backend tests in Docker:

```bash
docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'
```

Run a temporary Dockerized test environment and remove its volumes afterward:

```bash
docker compose --env-file backend/.env -p dealsach_test up -d --build db
docker compose --env-file backend/.env -p dealsach_test run --rm app sh -lc 'cd backend && php ../composer.phar install && php vendor/bin/phpunit'
docker compose --env-file backend/.env -p dealsach_test down -v
```

Run the frontend dev server:

```bash
cd frontend
npm run dev
```

Build the frontend:

```bash
cd frontend
npm run build
```

Inspect Docker logs during debugging:

```bash
docker compose --env-file backend/.env logs --tail=200 app
docker compose --env-file backend/.env logs --tail=200 nginx
docker compose --env-file backend/.env logs --tail=200 db
```

## Code Style Guidelines

Backend:

- Follow CodeIgniter 4 conventions, not Laravel conventions.
- Keep HTTP handling in controllers, data access in models, reusable business logic in services/libraries, and presentation in views or API response layers.
- Use CI4 validation, request, response, model, migration, seed, filter, and query builder APIs.
- Prefer model/query-builder parameter binding over raw SQL string interpolation.
- Keep entity lifecycle behavior aligned with `docs/requirement-doc.md`; preserve history by archiving, deactivating, hiding, or status-changing rather than hard-deleting business records with dependent history.
- Use `Asia/Ho_Chi_Minh` for product time rules and display date-times as required by the docs.

Frontend:

- Follow `docs/frontend/design-system.md` and `docs/frontend/frontend-req.md` before adding or changing UI.
- Use React + TypeScript with typed props and data models.
- Keep DealSach visually Vietnamese-first, dense, scannable, and comparison-focused.
- Use the established Neubrutalist direction: sharp corners, hard black borders/shadows, emerald primary surfaces, red discount/action emphasis, warm off-white surfaces, and Be Vietnam Pro for Vietnamese UI.
- Use Lucide icons where appropriate and Recharts for price history/report charts.
- Use `Intl.NumberFormat("vi-VN")` or an existing formatter for whole-number VND.
- Keep public copy in Vietnamese and use `viet-chuyen-nghiep` guidance for tone, clarity, and natural wording.
- Never imply DealSach sells books directly. Keep the required price disclaimer near price and Buy areas: `Giá tham khảo được ghi nhận gần đây, vui lòng kiểm tra lại tại nơi bán trước khi mua.`

General:

- Keep changes scoped to the requested feature or bug.
- Prefer existing local helpers, routes, components, config patterns, and naming conventions.
- Do not introduce new frameworks or large abstractions without a concrete local need.
- Do not rewrite generated/vendor/dependency directories.

## Testing Instructions

Use Docker for backend tests and integration checks. Prefer a temporary Compose project name such as `dealsach_test` for test runs that may create or mutate database volumes.

Before backend changes:

- Run the relevant PHPUnit subset when possible.
- For database behavior, verify migrations/seeds against a disposable Dockerized MariaDB environment.
- Check CI4 logs and Docker logs when debugging runtime behavior.

Before frontend changes:

- Run `npm run build` from `frontend/`.
- Manually inspect important responsive states for public pages, especially search, book cards, book detail, Buy flow messaging, wishlist prompts, alert flows, empty states, and admin tables.
- Verify Vietnamese text does not overflow buttons, cards, mobile headers, filters, or status badges.

For bug fixes:

- Follow `diagnostic-protocol`: reproduce or verify the current behavior, trace source-to-output data flow, identify the first failing point, patch only that point, and confirm with evidence.
- Record the exact command, route, payload, log line, or UI state used for verification.
- Re-run the command or interaction that reproduced the bug.
- Add or update tests when the behavior is business-critical, security-sensitive, or likely to regress.

## Security Considerations

- Treat `backend/.env` values as local/demo secrets. Do not add new secrets, tokens, production passwords, or private credentials to the repo.
- Validate all external seller destinations before redirecting. Unsafe, missing, or invalid destinations must create redirect failures, not successful affiliate redirects.
- Do not expose raw admin-only timestamps or operational details on public pages; public pages show reference-price language, while admin pages may show exact checked times.
- Keep CSRF, session, cookie, and validation settings aligned with CI4 security conventions.
- Escape user-visible output and sanitize/validate request input, including search, filters, IDs, email verification codes, affiliate URLs, and admin-managed records.
- Use parameterized queries/query builder APIs. Never concatenate user input into SQL.
- Preserve auditability for admin mutations, redirect failures, alert state changes, and email deal-link engagement.
- Do not weaken authentication, admin authorization, route filters, or lifecycle restrictions for convenience during demos.
