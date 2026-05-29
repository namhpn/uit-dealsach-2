# Repo Current State

Last updated: 2026-05-29

## Current Branch

`feature/t0019-commerce-homepage-refresh`

Baseline source for T0007: local `main` after T0006 merge.

## Completed Tickets

| Ticket | Date | Summary |
|---|---:|---|
| T0000 | 2026-05-26 | Captured baseline folder structure, scripts, dependency state, and build/test results without changing application behavior. |
| T0001 | 2026-05-26 | Normalized Docker Compose commands, added Dockerized frontend npm service, installed frontend npm dependencies, and fixed the default backend PHPUnit baseline without runtime feature changes. |
| T0002 | 2026-05-26 | Added core DealSach domain schema, CI4 models, deterministic Vietnamese demo seed data, backend tests, frontend Vite audit fix, and frontend generated-output ignore coverage. |
| T0003 | 2026-05-26 | Added public catalog JSON read APIs, centralized current offer eligibility, book detail offer grouping, book-level price history, search/filter/sort/pagination, discovery sections, and backend API tests without changing frontend UI or database schema. |
| T0004 | 2026-05-26 | Added public Buy-flow event persistence, `/go/offers/{offerId}` redirect handling, Affiliate Redirect-backed popular clicked deals, and API-backed homepage/search/detail React pages. |
| T0005 | 2026-05-26 | Restored the public homepage and book detail Neubrutalist visual structure from `frontend-original/` while preserving API-backed discovery, search, detail, offer grouping, and Buy-flow behavior. |
| T0006 | 2026-05-27 | Closed T0005 review gaps: header categories now load from public filters, homepage featured books render as API-backed category shelves, duplicate homepage search was removed, demo data better exercises featured shelves and popular clicked deals, and Docker startup normalizes `backend/writable` ownership automatically. |
| T0007 | 2026-05-27 | Added backend email verification, mock outbound email storage, user session persistence, auth JSON endpoints, and tests for request limits, code lifecycle, session rejection, logout, and existing public API stability. |
| T0008 | 2026-05-27 | Added authenticated wishlist persistence, JSON wishlist APIs, frontend email-code auth state/dialog, wishlist route/page, and wishlist actions on cards and book detail. |
| T0009 | 2026-05-27 | Added price alert persistence, alert event history, account-level alert email preferences, authenticated alert/preference JSON APIs, and backend tests for alert creation, duplicate rules, owner scoping, lifecycle actions, expiry normalization, preferences, and public API stability. |
| T0010 | 2026-05-27 | Added frontend price-alert API helpers, authenticated `/alerts` management page, book-detail alert creation controls, alert lifecycle actions, and account-level alert email preference controls. |
| T0011 | 2026-05-27 | Added deterministic alert evaluation, mock alert emails, email deal-link click tracking, disable-alert links, alert notification persistence, focused backend tests, and authenticated `/account` settings integration. |
| T0012 | 2026-05-27 | Added restricted Admin APIs, Admin audit persistence, deterministic seeded first Admin setup, user deactivation/reactivation safety behavior, Admin alert disabling, focused backend tests, and build-safe Admin frontend pages. |
| T0013 | 2026-05-27 | Added Admin catalog APIs and pages for categories, books, retailer platforms, merchants, offers, and mock price observations, with audit logging, lifecycle effects, offer validation, eligibility review, and focused tests. |
| T0014 | 2026-05-28 | Added Admin dashboard/report APIs and pages for 7-day operational metrics, grouped Affiliate Redirects, email engagement, redirect failures, alert/email counts, book-level price changes, audit summaries, and focused tests. |
| T0015 | 2026-05-28 | Added the top-level project README and usage guide covering scope, setup, workflows, routes, testing, known caveats, and ticket-driven development guidance. |
| T0016 | 2026-05-28 | Fixed local credentialed API CORS preflight/response handling, added env-driven allowed origins, implemented category display metadata schema/API/UI support, seeded deterministic dashboard alert/email/audit scenarios, and closed KI-0011/0012/0013 with full backend/frontend verification. |
| T0017 | 2026-05-28 | Added ERD and markdown-only UML documentation, then refactored README with a concise System Architecture section and direct links to design docs. |
| T0018 | 2026-05-28 | Added async public search autocomplete, conditional Office 365 SMTP delivery with safe fallback for outbound auth/alert emails, updated seeded Admin email, and refreshed verification docs/tests. |
| T0019 | 2026-05-29 | Refreshed the homepage as commerce-first Neubrutalism with frontend-configured banner actions, discovery metadata + reference-price support, seeded same-day freshness stability, and public-catalog/frontend verification updates. |

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

T0005 changed only public frontend presentation files and required process docs:

```text
frontend/src/app/Root.tsx
frontend/src/app/pages/HomePage.tsx
frontend/src/app/pages/ProductDetailPage.tsx
frontend/src/app/shared.tsx
docs/Repo_Current_State.md
docs/Known_Issues_And_Followups.md
```

T0006 changed:

```text
Dockerfile
docker/php-entrypoint.sh
backend/app/Database/Seeds/DealSachDemoSeeder.php
backend/tests/feature/PublicCatalogApiTest.php
frontend/src/app/Root.tsx
frontend/src/app/pages/HomePage.tsx
frontend/src/app/shared.tsx
docs/Manual_Verification_Guide.md
docs/Repo_Current_State.md
docs/Known_Issues_And_Followups.md
```

T0007 changed:

```text
backend/app/Config/Routes.php
backend/app/Controllers/AuthController.php
backend/app/Database/Migrations/2026-05-27-000001_CreateAccountAccessTables.php
backend/app/Database/Seeds/DealSachDemoSeeder.php
backend/app/Libraries/AuthService.php
backend/app/Libraries/EmailVerificationService.php
backend/app/Models/UserModel.php
backend/app/Models/EmailVerificationCodeModel.php
backend/app/Models/UserSessionModel.php
backend/app/Models/OutboundEmailModel.php
backend/tests/database/AccountAccessDatabaseTest.php
backend/tests/feature/AuthFeatureTest.php
docs/Manual_Verification_Guide.md
docs/Repo_Current_State.md
```

T0011 changed:

```text
backend/app/Commands/EvaluateAlerts.php
backend/app/Controllers/AlertEmailLinkController.php
backend/app/Config/Routes.php
backend/app/Database/Migrations/2026-05-27-000004_CreateAlertNotificationTables.php
backend/app/Libraries/AlertNotificationService.php
backend/app/Libraries/PublicCatalogService.php
backend/app/Models/AlertDisableTokenModel.php
backend/app/Models/EmailDealLinkClickModel.php
backend/app/Models/EmailDealLinkModel.php
backend/tests/database/PriceAlertDatabaseTest.php
backend/tests/feature/PriceAlertFeatureTest.php
frontend/src/app/Root.tsx
frontend/src/app/routes.tsx
frontend/src/app/pages/AccountPage.tsx
docs/Manual_Verification_Guide.md
docs/implementation_logs/T0011.md
docs/Repo_Current_State.md
docs/Known_Issues_And_Followups.md
```

T0012 changed:

```text
backend/app/Config/Routes.php
backend/app/Controllers/AdminController.php
backend/app/Database/Migrations/2026-05-27-000005_CreateAdminAuditLogsTable.php
backend/app/Database/Seeds/DealSachDemoSeeder.php
backend/app/Libraries/AdminAuditService.php
backend/app/Libraries/AdminService.php
backend/app/Models/AdminAuditLogModel.php
backend/tests/feature/AdminFeatureTest.php
frontend/src/app/api.ts
frontend/src/app/Root.tsx
frontend/src/app/routes.tsx
frontend/src/app/pages/AdminPage.tsx
frontend/src/app/pages/AdminUsersPage.tsx
frontend/src/app/pages/AdminAlertsPage.tsx
frontend/src/app/pages/AdminAuditPage.tsx
docs/Manual_Verification_Guide.md
docs/implementation_logs/T0012.md
docs/Repo_Current_State.md
docs/Known_Issues_And_Followups.md
```

T0013 changed:

```text
backend/app/Config/Routes.php
backend/app/Controllers/AdminController.php
backend/app/Libraries/AdminAuditService.php
backend/app/Libraries/AdminCatalogService.php
backend/tests/feature/AdminCatalogFeatureTest.php
frontend/src/app/api.ts
frontend/src/app/routes.tsx
frontend/src/app/pages/AdminPage.tsx
frontend/src/app/pages/AdminCatalogPage.tsx
frontend/src/app/pages/AdminBooksPage.tsx
frontend/src/app/pages/AdminBookDetailPage.tsx
frontend/src/app/pages/AdminCategoriesPage.tsx
frontend/src/app/pages/AdminRetailersPage.tsx
frontend/src/app/pages/AdminMerchantsPage.tsx
frontend/src/app/pages/AdminOffersPage.tsx
docs/Manual_Verification_Guide.md
docs/implementation_logs/T0013.md
docs/Repo_Current_State.md
```

T0014 changed:

```text
backend/app/Config/Routes.php
backend/app/Controllers/AdminController.php
backend/app/Libraries/AdminDashboardService.php
backend/tests/feature/AdminDashboardFeatureTest.php
frontend/src/app/api.ts
frontend/src/app/routes.tsx
frontend/src/app/pages/AdminPage.tsx
frontend/src/app/pages/AdminDashboardPage.tsx
frontend/src/app/pages/AdminReportsPage.tsx
docs/Manual_Verification_Guide.md
docs/implementation_logs/T0014.md
docs/Repo_Current_State.md
docs/Known_Issues_And_Followups.md
```

T0015 changed:

```text
README.md
docs/Manual_Verification_Guide.md
docs/implementation_logs/T0015.md
docs/Repo_Current_State.md
```

T0016 changed:

```text
backend/app/Config/Cors.php
backend/app/Config/Filters.php
backend/app/Config/Routes.php
backend/app/Controllers/AdminController.php
backend/app/Controllers/AuthController.php
backend/app/Controllers/PublicCatalogController.php
backend/app/Database/Migrations/2026-05-26-000001_CreateCoreDomainTables.php
backend/app/Database/Migrations/2026-05-28-000001_AddCategoryDisplayMetadataToCategories.php
backend/app/Database/Seeds/DealSachDemoSeeder.php
backend/app/Libraries/AdminCatalogService.php
backend/app/Libraries/PublicCatalogService.php
backend/app/Models/CategoryModel.php
backend/tests/database/DealSachDomainDatabaseTest.php
backend/tests/feature/AdminCatalogFeatureTest.php
backend/tests/feature/AdminDashboardFeatureTest.php
backend/tests/feature/CorsFeatureTest.php
backend/tests/feature/PriceAlertFeatureTest.php
backend/tests/feature/PublicCatalogApiTest.php
frontend/src/app/Root.tsx
frontend/src/app/api.ts
frontend/src/app/pages/AdminCategoriesPage.tsx
frontend/src/app/pages/SearchPage.tsx
frontend/src/app/shared.tsx
.env.example
README.md
docs/Manual_Verification_Guide.md
docs/implementation_logs/T0016.md
docs/Repo_Current_State.md
docs/Known_Issues_And_Followups.md
```

T0017 changed:

```text
README.md
docs/design/ERD.md
docs/uml/README.md
docs/uml/use-cases.md
docs/uml/activity-flows.md
docs/uml/sequence-flows.md
docs/uml/component-deployment.md
docs/Repo_Current_State.md
```

T0018 changed:

```text
backend/app/Commands/EvaluateAlerts.php
backend/app/Config/Email.php
backend/app/Config/Routes.php
backend/app/Controllers/PublicCatalogController.php
backend/app/Database/Seeds/DealSachDemoSeeder.php
backend/app/Libraries/AlertNotificationService.php
backend/app/Libraries/EmailVerificationService.php
backend/app/Libraries/PublicCatalogService.php
backend/tests/feature/AdminDashboardFeatureTest.php
backend/tests/feature/PublicCatalogApiTest.php
frontend/src/app/Root.tsx
frontend/src/app/api.ts
docs/Manual_Verification_Guide.md
docs/implementation_logs/T0018.md
docs/Repo_Current_State.md
docs/Known_Issues_And_Followups.md
```

T0019 changed:

```text
backend/app/Database/Seeds/DealSachDemoSeeder.php
backend/app/Libraries/PublicCatalogService.php
backend/tests/feature/PublicCatalogApiTest.php
frontend/src/app/Root.tsx
frontend/src/app/api.ts
frontend/src/app/pages/AccountPage.tsx
frontend/src/app/pages/AlertsPage.tsx
frontend/src/app/pages/HomePage.tsx
frontend/src/app/pages/ProductDetailPage.tsx
frontend/src/app/pages/WishlistPage.tsx
frontend/src/app/shared.tsx
docs/Manual_Verification_Guide.md
docs/implementation_logs/T0019.md
docs/Repo_Current_State.md
```

T0008 changed:

```text
backend/app/Config/Routes.php
backend/app/Controllers/WishlistController.php
backend/app/Database/Migrations/2026-05-27-000002_CreateWishlistItemsTable.php
backend/app/Libraries/WishlistService.php
backend/app/Models/WishlistItemModel.php
backend/tests/database/WishlistDatabaseTest.php
backend/tests/feature/WishlistFeatureTest.php
frontend/src/app/api.ts
frontend/src/app/Root.tsx
frontend/src/app/routes.tsx
frontend/src/app/shared.tsx
frontend/src/app/auth/
frontend/src/app/pages/ProductDetailPage.tsx
frontend/src/app/pages/WishlistPage.tsx
docs/Manual_Verification_Guide.md
docs/Repo_Current_State.md
```

T0009 changed:

```text
backend/app/Config/Routes.php
backend/app/Controllers/PriceAlertController.php
backend/app/Controllers/AlertPreferenceController.php
backend/app/Database/Migrations/2026-05-27-000003_CreatePriceAlertTables.php
backend/app/Database/Seeds/DealSachDemoSeeder.php
backend/app/Libraries/PublicCatalogService.php
backend/app/Libraries/PriceAlertService.php
backend/app/Libraries/AlertPreferenceService.php
backend/app/Models/PriceAlertModel.php
backend/app/Models/PriceAlertEventModel.php
backend/app/Models/UserAlertPreferenceModel.php
backend/tests/database/PriceAlertDatabaseTest.php
backend/tests/feature/PriceAlertFeatureTest.php
docs/Manual_Verification_Guide.md
docs/Repo_Current_State.md
docs/Known_Issues_And_Followups.md
```

T0010 changed:

```text
frontend/src/app/api.ts
frontend/src/app/Root.tsx
frontend/src/app/routes.tsx
frontend/src/app/pages/ProductDetailPage.tsx
frontend/src/app/pages/AlertsPage.tsx
docs/Manual_Verification_Guide.md
docs/implementation_logs/T0010.md
docs/Repo_Current_State.md
```

## Installed Dependencies

### Frontend

* `frontend/package-lock.json` remains the npm lockfile.
* No new runtime dependencies were added in T0004.
* `frontend/node_modules/` and `frontend/dist/` are ignored by `.gitignore`.

### Backend

* No Composer dependency changes.
* T0004 added no Composer dependencies.
* T0006 added no Composer dependency changes.
* T0007 added no Composer dependency changes.
* T0008 added no frontend or backend dependency changes.
* T0009 added no frontend, backend, Composer, or npm dependency changes.
* T0010 added no frontend, backend, Composer, or npm dependency changes.
* T0011 added no frontend, backend, Composer, or npm dependency changes.
* T0012 added no frontend, backend, Composer, or npm dependency changes.
* T0013 added no frontend, backend, Composer, or npm dependency changes.
* T0014 added no frontend, backend, Composer, or npm dependency changes.
* T0015 added no frontend, backend, Composer, or npm dependency changes.
* T0016 added no frontend, backend, Composer, or npm dependency changes.
* T0017 added no frontend, backend, Composer, or npm dependency changes.
* T0018 added no frontend, backend, Composer, or npm dependency changes.
* T0019 added no frontend, backend, Composer, or npm dependency changes.

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
docker compose run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/auth|email-code|logout|me"'
docker compose run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/user/wishlist"'
docker compose run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/user/alerts|api/user/alert-preferences"'
docker compose run --rm app sh -lc 'cd backend && php spark alerts:evaluate'
docker compose -p dealsach_t0013 run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit --filter AdminCatalog'
docker compose -p dealsach_t0013 run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/admin/(categories|books|retailers|merchants|offers)"'
docker compose -p dealsach_t0014 run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit --filter AdminDashboard'
docker compose -p dealsach_t0014 run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/admin/(dashboard|reports)"'
docker compose run --rm app sh -lc 'cd backend && php spark routes | grep -E "email/deals|alerts/disable"'
docker compose run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/admin"'
docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit --filter "Auth|AdminCatalog|AdminDashboard|Cors"'
```

## Build/Test Status

| Area | Command | Last Result | Notes |
|---|---|---|---|
| Backend | `docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit --filter PublicCatalog'` | Passed for T0019 | 17 tests, 143 assertions. |
| Backend | `docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed for T0019 | 78 tests, 778 assertions. |
| Frontend | `docker compose run --rm frontend npm run build` | Passed for T0019 | Vite production build passed; existing chunk-size warning remains. |
| Backend routes | `docker compose run --rm app sh -lc 'cd backend && php spark routes \| grep "api/public/discovery"'` | Passed for T0019 | Confirmed `GET /api/public/discovery` route remains registered. |
| Backend | `docker compose -p dealsach_t0018 run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit --filter "Auth\|Alert\|PublicCatalog"'` | Passed for T0018 | 46 tests, 550 assertions. Includes autocomplete endpoint coverage and existing auth/alert regression checks. |
| Backend | `docker compose -p dealsach_t0018 run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed for T0018 | 78 tests, 764 assertions. |
| Frontend | `docker compose -p dealsach_t0018 run --rm frontend npm run build` | Passed for T0018 | Vite build passed; existing chunk-size warning remains and no new dependencies were installed. |
| Backend/Docker DB | `docker compose -p dealsach_t0018 run --rm app sh -lc 'cd backend && php spark migrate && php spark db:seed DealSachDemoSeeder'` | Passed for T0018 | Seeder now creates active Admin `24521102@gm.uit.edu.vn`. |
| Backend routes | `docker compose -p dealsach_t0018 run --rm app sh -lc 'cd backend && php spark routes \| grep -E "api/public/books/suggestions\|api/auth/email-code/request"'` | Passed for T0018 | Confirmed new autocomplete route and existing auth email-code request route are registered. |
| Backend | PHP lint for T0004 migration, controllers, service, models, route file, and tests | Passed | No syntax errors. |
| Backend | `cd backend && php vendor/bin/phpunit` | Passed | 27 tests, 149 assertions. |
| Backend | `docker compose -p dealsach_t0004 run --rm app sh -lc 'cd backend && php spark migrate'` | Passed | Clean disposable MariaDB project; Buy-flow event tables created. |
| Backend | `docker compose -p dealsach_t0004 run --rm app sh -lc 'cd backend && php spark db:seed DealSachDemoSeeder'` | Passed | Demo books, observations, Buy Attempts, Affiliate Redirects, and Redirect Failures inserted. |
| Backend | `docker compose -p dealsach_t0004 run --rm app sh -lc 'cd backend && php spark routes'` | Passed | Public catalog API routes and `GET /go/offers/{offerId}` registered. |
| Backend | `docker compose -p dealsach_t0004 run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed | 27 tests, 149 assertions. |
| Frontend | `docker compose run --rm frontend npm run build` | Passed | Existing Vite chunk-size warning remains. Host-local `npm run build` failed before code compilation because the host `frontend/node_modules` is missing Rollup's optional native package; Dockerized build is the repo-standard result. |
| Frontend | `docker compose run --rm frontend npm run build` | Passed for T0005 | Existing Vite chunk-size warning remains. |
| Frontend | `docker compose -p dealsach_t0006 run --rm frontend npm run build` | Passed for T0006 | Existing Vite chunk-size warning remains. |
| Manual UI | Chrome headless screenshots at `/`, `/book/3`, and `/search?q=Tony&availability=available_now` | Passed for T0005 | Verified desktop 1366px homepage/detail and 360px mobile search render without unintended horizontal scrolling in captured states. |
| Manual UI | Chrome headless screenshots at `/` 1366px, `/` 360px, and `/search?q=Tony&availability=available_now` 360px | Passed for T0006 | Verified homepage section order, no duplicate homepage search input, API-backed featured category shelves, and mobile rendering. Screenshots saved in `/private/tmp/dealsach-t0006-home-1366.png`, `/private/tmp/dealsach-t0006-home-360.png`, and `/private/tmp/dealsach-t0006-search-360.png`. |
| API/Buy flow | `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost/go/offers/5` | Passed for T0005 | Returned `302 https://tiki.vn/nha-gia-kim-demo` after KI-0008 writable ownership workaround. |
| API/Buy flow | `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost/go/offers/5` | Passed for T0006 | Returned `302 https://tiki.vn/nha-gia-kim-demo` on a fresh disposable stack without manual `chown`. |
| Backend | `docker compose -p dealsach_t0006 run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed for T0006 | 27 tests, 161 assertions. |
| Docker runtime | `docker compose -p dealsach_t0006 up -d --build`; migrate/seed; writable/API/redirect checks | Passed for T0006 | `backend/writable` paths owned by `www-data www-data`; `GET /api/public/filters` and `GET /api/public/discovery` returned 200. Initial first migrate attempt hit MariaDB startup timing with `Connection refused`, rerun passed after DB was ready. |
| Backend | `find backend/app/Controllers backend/app/Libraries backend/app/Models backend/app/Database/Migrations backend/tests -name '*.php' -print0 | xargs -0 -n1 php -l` | Passed for T0007 | No syntax errors in changed backend app and test files. |
| Backend | `cd backend && php vendor/bin/phpunit` | Passed for T0007 | Host PHP 8.4 / SQLite test runtime: 37 tests, 258 assertions. |
| Backend | `docker compose run --rm app sh -lc 'cd backend && php spark migrate && php spark db:seed DealSachDemoSeeder'` | Passed for T0007 | First run hit MariaDB startup timing with `Connection refused`; rerun passed and created `users`, `email_verification_codes`, `outbound_emails`, and `user_sessions`. |
| Backend | `docker compose run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/auth|email-code|logout|me"'` | Passed for T0007 | Confirmed `POST /api/auth/email-code/request`, `POST /api/auth/email-code/verify`, `GET /api/auth/me`, and `POST /api/auth/logout`. |
| Backend | `docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed for T0007 | Docker PHP 8.2 test runtime: 37 tests, 258 assertions. |
| API/Auth | HTTP auth flow through `http://localhost` | Passed for T0007 | Requested code for `tester@example.com`, confirmed mock outbox code, verified session cookie, read authenticated `/api/auth/me`, logged out with expired cookie, and confirmed guest `/api/auth/me`. |
| Frontend | `docker compose -p dealsach_t0010 run --rm frontend npm run build` | Passed for T0010 | Vite build completed; existing chunk-size warning remains. |
| Backend | `docker compose -p dealsach_t0010 run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed for T0010 | Docker PHP 8.2 test runtime: 56 tests, 520 assertions. |
| Backend | `find backend/app/Controllers backend/app/Libraries backend/app/Models backend/app/Database/Migrations backend/tests/database backend/tests/feature -name '*.php' -print0 \| xargs -0 -n1 php -l` | Passed for T0012 | No syntax errors in changed backend app and test files. |
| Backend | `docker compose -p dealsach_t0012 run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit --filter Admin'` | Passed for T0012 | 4 tests, 26 assertions. |
| Backend | `docker compose -p dealsach_t0012 run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed for T0012 | 64 tests, 612 assertions. |
| Frontend | `docker compose -p dealsach_t0012 run --rm frontend npm run build` | Passed for T0012 | Existing Vite chunk-size warning remains. |
| Backend/Docker | `docker compose -p dealsach_t0012 run --rm --build app sh -lc 'cd backend && php spark migrate && php spark db:seed DealSachDemoSeeder'` | Passed for T0012 | `admin_audit_logs` migration ran and `DealSachDemoSeeder` completed. |
| Backend/Docker | Admin route and seed DB checks | Passed for T0012 | `api/admin/*` routes registered; `admin@dealsach.test` seeded as active Admin; `admin_audit_logs` table exists. Full stack `up` was blocked by host port `8080` conflict for phpMyAdmin; tracked as KI-0011. |
| Backend | `find backend/app/Controllers backend/app/Libraries backend/app/Models backend/app/Database/Migrations backend/tests/database backend/tests/feature -name '*.php' -print0 \| xargs -0 -n1 php -l` | Passed for T0013 | No syntax errors in changed backend app and test files. |
| Backend | `docker compose -p dealsach_t0013 run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit --filter AdminCatalog'` | Passed for T0013 | 5 tests, 41 assertions. |
| Backend | `docker compose -p dealsach_t0013 run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed for T0013 | 69 tests, 653 assertions. |
| Frontend | `docker compose -p dealsach_t0013 run --rm frontend npm run build` | Passed for T0013 | Existing Vite chunk-size warning remains. |
| Backend/Docker | `docker compose -p dealsach_t0013 run --rm --build app sh -lc 'cd backend && php spark migrate && php spark db:seed DealSachDemoSeeder'` | Passed for T0013 | Clean migration and seed completed. |
| Backend routes | `docker compose -p dealsach_t0013 run --rm app sh -lc 'cd backend && php spark routes \| grep -E "api/admin/(categories\|books\|retailers\|merchants\|offers)"'` | Passed for T0013 | Confirmed Admin catalog list, create, update, archive/restore, offer detail, and observation routes. |
| Backend | `php -l backend/app/Libraries/AdminDashboardService.php`; `php -l backend/app/Controllers/AdminController.php`; `php -l backend/tests/feature/AdminDashboardFeatureTest.php` | Passed for T0014 | No syntax errors in changed backend service, controller, and focused test. |
| Backend | `docker compose -p dealsach_t0014 run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit --filter AdminDashboard'` | Passed for T0014 | 2 tests, 30 assertions. |
| Backend | `docker compose -p dealsach_t0014 run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed for T0014 | 71 tests, 683 assertions. |
| Frontend | `docker compose -p dealsach_t0014 run --rm frontend npm run build` | Passed for T0014 | Existing Vite chunk-size warning remains. |
| Backend/Docker | `docker compose -p dealsach_t0014 run --rm --build app sh -lc 'cd backend && php spark migrate && php spark db:seed DealSachDemoSeeder'` | Passed for T0014 | Clean migration and seed completed. Dashboard-specific alert/email/audit demo scenarios remain a follow-up because seed edits were outside T0014 scope. |
| Backend routes | `docker compose -p dealsach_t0014 run --rm app sh -lc 'cd backend && php spark routes \| grep -E "api/admin/(dashboard\|reports)"'` | Passed for T0014 | Confirmed `GET /api/admin/dashboard` and `GET /api/admin/reports`. |
| Docs | `test -f README.md && sed -n '1,260p' README.md` | Passed for T0015 | README exists and includes project introduction, setup, usage examples, testing commands, API overview, caveats, and docs links. |
| Docs | `grep -E "Project\|Setup\|Installation\|Usage\|Testing\|Admin\|Dashboard\|Known" README.md` | Passed for T0015 | Key README coverage terms are present. |
| Docs | `git diff --check` | Passed for T0015 | No whitespace or conflict-marker issues. |
| Scope | `git diff --name-only`; `git status --short` | Passed for T0015 | Changed tracked and newly created files are limited to `README.md`, `docs/Manual_Verification_Guide.md`, `docs/Repo_Current_State.md`, and `docs/implementation_logs/T0015.md`. |
| Docs | `test -f docs/design/ERD.md && sed -n '1,260p' docs/design/ERD.md` | Passed for T0017 | ERD file exists and includes Mermaid `erDiagram` content for current schema domains. |
| Docs | `find docs/uml -maxdepth 1 -type f -name '*.md' -print -exec sed -n '1,180p' {} \\;` | Passed for T0017 | Markdown-only UML files cover use-case, activity-flow, sequence-flow, and component/deployment views. |
| Docs | `sed -n '1,240p' README.md`; `grep -E "System Architecture|ERD|UML" README.md`; `grep -E "Testing and Verification|Known Local Caveats|Deeper Documentation" README.md || true` | Passed for T0017 | README now contains System Architecture + design links and no longer includes the removed detailed sections. |
| Scope | `git diff --name-only`; `git diff --check` | Passed for T0017 | Diff is documentation-only and limited to T0017 allowed areas plus `docs/Repo_Current_State.md`. |
| Backend | `docker compose run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit --filter "Auth\|AdminCatalog\|AdminDashboard\|Cors"'` | Passed for T0016 | 19 tests, 215 assertions. |
| Backend | `docker compose run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed for T0016 | 76 tests, 747 assertions. |
| Frontend | `docker compose run --rm frontend npm run build` | Passed for T0016 | Vite build passed; existing chunk-size warning remains. |
| Manual API | CORS/auth/admin/filter/dashboard/reports curl workflow (via `docker compose run --rm app` to `http://nginx`) | Passed for T0016 | Preflight returned `204` with matching origin + credentials; auth request/verify and `/api/admin/me` included credentialed CORS headers; category metadata and seeded dashboard/report sections returned non-empty data. |
| Docker runtime | `docker compose up -d --build` | Passed for T0016 | No recurring phpMyAdmin `8080` conflict in this environment; KI-0011 reclassified and closed. |
| API/Public stability | `GET /api/public/books`; `GET /go/offers/5` | Passed for T0007 | Public books returned HTTP 200; Buy redirect returned `302 https://tiki.vn/nha-gia-kim-demo`. |
| Backend | `cd backend && php vendor/bin/phpunit` | Passed for T0008 | Host PHP 8.4 / SQLite runtime: 45 tests, 331 assertions. |
| Backend | `docker compose -p dealsach_t0008 run --rm app sh -lc 'cd backend && php spark migrate && php spark db:seed DealSachDemoSeeder'` | Passed for T0008 | Clean disposable MariaDB project created `wishlist_items` after account-access tables and seeded demo data. |
| Backend | `docker compose -p dealsach_t0008 run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/user/wishlist"'` | Passed for T0008 | Confirmed wishlist list, status, add, and remove routes. |
| Backend | `docker compose -p dealsach_t0008 run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed for T0008 | Docker PHP 8.2 runtime: 45 tests, 331 assertions. |
| Frontend | `docker compose -p dealsach_t0008 run --rm frontend npm run build` | Passed for T0008 | Existing Vite chunk-size warning remains. |
| API/Auth/Wishlist | HTTP auth and wishlist flow through `http://localhost` | Passed for T0008 | Guest wishlist returned 401; requested and verified email code; add and duplicate-add returned success; duplicate row count stayed 1; list included book-card metadata and `added_at`; remove returned success; final status returned `wishlisted: false`. |
| API/Public stability | `GET /api/public/filters`; `GET /api/public/discovery`; `GET /api/public/books`; `GET /go/offers/5` | Passed for T0008 | Public APIs returned 200; Buy redirect returned `302 https://tiki.vn/nha-gia-kim-demo`. |
| Backend | `find backend/app/Controllers backend/app/Libraries backend/app/Models backend/app/Database/Migrations backend/tests/database backend/tests/feature -name '*.php' -print0 \| xargs -0 -n1 php -l` | Passed for T0009 | Host PHP 8.5 syntax check; no syntax errors in checked backend app and test files. |
| Backend | `docker compose -p dealsach_t0009 run --rm app sh -lc 'cd backend && php vendor/bin/phpunit --filter PriceAlert'` | Passed for T0009 | Docker PHP 8.2 runtime: 11 tests, 191 assertions. |
| Backend | `docker compose -p dealsach_t0009 run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed for T0009 | Docker PHP 8.2 runtime: 56 tests, 519 assertions. |
| Backend/Docker DB | `docker compose -p dealsach_t0009 run --rm -e database.default.hostname=db -e database.default.database=dealsach -e database.default.username=dealsach -e database.default.password=dealsach app sh -lc 'cd backend && php spark migrate && php spark db:seed DealSachDemoSeeder'` | Passed for T0009 | Clean disposable MariaDB project with explicit demo DB environment variables; first run before MariaDB readiness returned `Connection refused`, rerun after logs showed `ready for connections` passed. |
| Backend routes | `docker compose -p dealsach_t0009 run --rm -e database.default.hostname=db -e database.default.database=dealsach -e database.default.username=dealsach -e database.default.password=dealsach app sh -lc 'cd backend && php spark routes \| grep -E "api/user/alerts\|api/user/alert-preferences"'` | Passed for T0009 | Confirmed alert list/detail/create/update/pause/reactivate/renew/restart-tracking/disable and alert preference read/update routes. |

## Public API State

Registered public routes after T0004:

```text
GET /api/public/books
GET /api/public/books/{bookId}
GET /api/public/discovery
GET /api/public/filters
GET /go/offers/{offerId}
```

Registered auth routes after T0007:

```text
POST /api/auth/email-code/request
POST /api/auth/email-code/verify
GET /api/auth/me
POST /api/auth/logout
```

Registered wishlist routes after T0008:

```text
GET /api/user/wishlist
GET /api/user/wishlist/books/{bookId}
POST /api/user/wishlist/books/{bookId}
DELETE /api/user/wishlist/books/{bookId}
```

Registered alert routes after T0009:

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

Registered Admin routes after T0012:

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

Registered Admin catalog routes after T0013:

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

Registered Admin dashboard/report routes after T0014:

```text
GET /api/admin/dashboard
GET /api/admin/reports
```

Catalog read behavior lives in `App\Libraries\PublicCatalogService` and is reused by list, detail, discovery, filters, and Buy-flow eligibility checks. It centralizes current eligibility, 48-hour freshness, valid affiliate destination checks, public no-price status priority, offer grouping, price range filtering, observation-time price history, recent price-drop calculation, and popular-clicked deal ranking.

T0004 adds `App\Libraries\BuyFlowService` for Buy Attempt, Affiliate Redirect, and Redirect Failure event writes. `GET /go/offers/{offerId}` records a Buy Attempt for known offers, validates current eligible-offer and approved-domain destination rules, records Affiliate Redirect only on successful external redirects, and records Redirect Failure for known invalid or ineligible offers.

`GET /api/public/discovery` now ranks `popular_clicked_deals` from successful Affiliate Redirect records in the last 7 days using `Asia/Ho_Chi_Minh`, grouped by book and sorted by redirect count descending then title ascending. Cards include redirect count and top retailer metadata.

T0007 adds `App\Libraries\EmailVerificationService` and `App\Libraries\AuthService`. Verification requests normalize email, enforce 60-second cooldown, 5/hour and 10/day request limits, invalidate older active codes, store SHA-256 code hashes, and write deterministic mock emails to `outbound_emails`. Verification creates or reuses active users, rejects deactivated users, marks codes used, invalidates remaining active codes, creates 7-day hashed-token sessions, and sets an HTTP-only same-origin cookie.

T0008 adds `App\Libraries\WishlistService` and `App\Controllers\WishlistController`. Wishlist endpoints require an active session from `AuthService`, store one `wishlist_items` row per user/book pair, treat duplicate adds and missing removes as no-op successes, reject archived or nonexistent books on add, and keep existing archived-book wishlist entries visible with an archived marker.

T0009 adds `App\Libraries\PriceAlertService`, `App\Libraries\AlertPreferenceService`, `App\Controllers\PriceAlertController`, and `App\Controllers\AlertPreferenceController`. Alert endpoints require an active session from `AuthService`, support target-price and new-lowest alert creation, enforce non-terminal duplicate rules, normalize past-due non-terminal alerts to Expired on service reads/actions, record alert events for creation and state-changing actions, and do not evaluate alerts or send alert emails. Alert preferences default to enabled when no row exists and update account-level email suppression without changing individual alert statuses.

T0012 adds `App\Controllers\AdminController`, `App\Libraries\AdminService`, and `App\Libraries\AdminAuditService`. Admin endpoints require an active authenticated user with `role=admin`, reject guests with 401, reject registered non-admin users with 403, audit Admin mutations, block self/last-active-Admin deactivation, invalidate sessions for deactivated users, disable their Active alerts, and preserve historical records.

T0013 adds `App\Libraries\AdminCatalogService` through `AdminController`. Admin catalog mutations audit create, update, archive, restore, offer-status, and mock-observation writes; mask affiliate URLs to domain/path summaries; validate active categories for books; enforce merchant-retailer consistency; validate `https://` affiliate destinations against approved retailer domains; pause Active alerts when books are archived; and capture observation-time state for newly added mock observations.

T0014 adds `App\Libraries\AdminDashboardService` through `AdminController`. Admin dashboard/report reads require Admin authorization, default to a fixed 7-day `Asia/Ho_Chi_Minh` window, do not accept custom date ranges, do not write audit records, and return summary cards plus grouped Affiliate Redirect, email engagement, redirect failure, alert, price-change, and audit-summary sections.

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

T0006 expanded featured and popular-clicked demo coverage:

* Featured books now span 6 active API filter categories: `cong-nghe`, `kinh-te`, `ky-nang-song`, `lich-su`, `thieu-nhi`, and `van-hoc-viet-nam`.
* Discovery popular clicked deals include multiple ranked books across Tiki, Fahasa, Lazada, and Shopee.

T0007 adds account-access tables but no seeded demo accounts. `DealSachDemoSeeder` now clears `user_sessions`, `outbound_emails`, `email_verification_codes`, and `users` before reseeding catalog and Buy-flow demo data.

T0008 adds the `wishlist_items` table. Demo seeding does not create wishlist rows; wishlist state is user-specific and created through authenticated API calls or tests.

T0009 adds `price_alerts`, `price_alert_events`, and `user_alert_preferences`. Demo seeding clears these tables before account and catalog tables but does not create alert rows; alert state is user-specific and created through authenticated API calls or tests.

## Manual Verification Performed

T0005:

1. Reviewed required docs, T0005 ticket, and original reference files in `frontend-original/src/app/pages/HomePage.tsx`, `frontend-original/src/app/pages/ProductDetailPage.tsx`, and `frontend-original/src/app/shared.tsx`.
2. Created branch `feature/t0005-restore-public-frontend-design` from `main`.
3. Confirmed changed application files stay limited to public frontend UI files allowed by T0005.
4. Confirmed active runtime mock catalog arrays are removed from `frontend/src/app` with `rg -n "priceDropBooks|popularDeals|featuredCategories|const product =|const retailers =" frontend/src/app`.
5. Confirmed forbidden marketplace wording is absent from `frontend/src/app` with `rg -n "giỏ|checkout|thanh toán|giao hàng|đơn hàng|shipping|payment|voucher|coupon|review|rating|đánh giá|bình luận" frontend/src/app`.
6. Ran `docker compose run --rm frontend npm run build`; build passed with the existing Vite chunk-size warning.
7. Started disposable stack with `docker compose -p dealsach_t0005 up -d --build`.
8. Ran `docker compose -p dealsach_t0005 run --rm app sh -lc 'cd backend && php spark migrate && php spark db:seed DealSachDemoSeeder'`; migrations and seed passed.
9. Started Dockerized Vite dev server with `docker compose -p dealsach_t0005 run --rm --service-ports frontend npm run dev -- --host 0.0.0.0`.
10. Hit KI-0008 on the long-running app container, then applied disposable workaround `docker compose -p dealsach_t0005 exec app sh -lc 'chown -R www-data:www-data backend/writable'`.
11. Verified `GET /api/public/discovery` returned HTTP 200 JSON with featured books, recent price drops, and popular clicked deal metadata.
12. Verified `GET /api/public/books/3` returned API-backed detail data with purchasable and missing-link offer groups plus price history.
13. Verified `GET /go/offers/5` returned `302 https://tiki.vn/nha-gia-kim-demo`.
14. Captured homepage at 1366px: original-style banner carousel, prominent search, API-backed featured books, recent price-drop rail, and Neubrutalist cards rendered.
15. Captured book detail at 1366px: original-style hero, disabled wishlist affordance, best-price block, market-price row, affiliate disclosure, and grouped offer structure rendered.
16. Captured search at 360px and 1600px height: mobile header, horizontally scrollable category chips, filters, result card, pagination, and required disclaimer rendered without unintended horizontal scrolling in the captured state.

T0006:

1. Reviewed required docs and `docs/implementation_logs/T0006.md`.
2. Created branch `feature/t0006-close-review-gaps` from `main`.
3. Confirmed `rg -n "navCategories|featuredCategories|priceDropBooks|popularDeals" frontend/src/app` returns no active runtime mock arrays/header category list.
4. Ran `docker compose -p dealsach_t0006 up -d --build`; fresh app container started with `php-fpm` as the long-running process.
5. Ran migrations and `DealSachDemoSeeder`; the first attempt hit MariaDB startup timing, rerun passed.
6. Verified `backend/writable`, `cache`, `logs`, `session`, and `uploads` are owned by `www-data www-data` inside the running app container.
7. Verified `GET /api/public/filters` returned 200 with the active seeded category slugs.
8. Verified `GET /api/public/discovery` returned 200 with featured books grouped across multiple categories and popular clicked deal metadata.
9. Verified `GET /go/offers/5` returned `302 https://tiki.vn/nha-gia-kim-demo` without manual ownership correction.
10. Ran Dockerized backend PHPUnit and frontend build; both passed.
11. Captured homepage at 1366px and 360px plus mobile search at 360px. Screenshots:
    * `/private/tmp/dealsach-t0006-home-1366.png`
    * `/private/tmp/dealsach-t0006-home-360.png`
    * `/private/tmp/dealsach-t0006-search-360.png`

T0007:

1. Reviewed required docs and `docs/implementation_logs/T0007.md`.
2. Created branch `feature/t0007-backend-email-session-foundation` from local `main`.
3. Added account-access migration, models, auth services, `AuthController`, auth routes, and focused database/feature tests within the ticket allowed areas.
4. Ran PHP syntax checks for backend app and test files; all checked files reported no syntax errors.
5. Ran host PHPUnit with SQLite: `37 tests, 258 assertions`.
6. Attempted `docker compose -p dealsach_t0007 up -d --build`; Docker build succeeded, but the repo's fixed `container_name` values collided with the already-running default DealSach containers. After the user stopped containers, default Compose verification was used.
7. Ran `docker compose run --rm app sh -lc 'cd backend && php spark migrate && php spark db:seed DealSachDemoSeeder'`; first attempt hit MariaDB startup timing, rerun passed.
8. Confirmed auth routes with `php spark routes | grep -E "api/auth|email-code|logout|me"`.
9. Ran Dockerized PHPUnit: `37 tests, 258 assertions`.
10. Started `docker compose up -d nginx app db`.
11. Requested a code for `tester@example.com`; HTTP response was a Vietnamese success envelope and did not include the code.
12. Queried the mock outbox via the DB container environment variables and confirmed one verification email body contained a 6-digit code.
13. Verified the code through `POST /api/auth/email-code/verify`; response set an HTTP-only `dealsach_session` cookie and returned active registered user data.
14. Verified `GET /api/auth/me` returned authenticated user state, then `POST /api/auth/logout` invalidated the session and returned an expired cookie.
15. Verified guest `GET /api/auth/me` after logout.
16. Verified public API stability: `GET /api/public/books` returned 200 and `GET /go/offers/5` returned `302 https://tiki.vn/nha-gia-kim-demo`.

T0009:

1. Reviewed required docs and `docs/implementation_logs/T0009.md`.
2. Created branch `feature-t0009-price-alert-apis` after the normal slash branch name failed in this environment.
3. Added alert, alert-event, and alert-preference migrations, models, services, controllers, routes, seed cleanup, and backend database/feature tests within T0009 allowed areas.
4. Ran host PHP syntax checks across backend app, migration, database test, and feature test files; all checked files reported no syntax errors.
5. Ran Dockerized alert PHPUnit subset: `11 tests, 191 assertions`.
6. Ran Dockerized full backend PHPUnit: `56 tests, 519 assertions`.
7. Verified clean disposable MariaDB migrations and `DealSachDemoSeeder` with explicit demo DB environment variables; first attempts before DB readiness returned `Connection refused`, rerun after MariaDB logged `ready for connections` passed.
8. Confirmed alert and alert-preference routes with `php spark routes | grep -E "api/user/alerts|api/user/alert-preferences"`.
9. Public catalog and Buy-flow smoke stability are covered by `PriceAlertFeatureTest::testPublicCatalogAndBuyFlowSmokeStillPassAfterAlertMigration`, which verifies public filters, discovery, books, and `GET /go/offers/{offerId}`.

T0010:

1. Reviewed required docs and `docs/implementation_logs/T0010.md`.
2. Created branch `feature/t0010-price-alert-frontend` from local `main`.
3. Added frontend alert DTOs/API helpers, `/alerts` route/page, header alert navigation, book-detail alert creation controls, lifecycle action controls, and account-level alert email preference UI within T0010 allowed areas.
4. Ran `docker compose -p dealsach_t0010 run --rm frontend npm run build`; Vite build passed with the existing chunk-size warning.
5. Ran `docker compose -p dealsach_t0010 run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'`; Docker PHP 8.2 PHPUnit passed with `56 tests, 520 assertions`.
6. Confirmed the disposable `dealsach_t0010` DB container was left running after tests, then stopped the project with `docker compose -p dealsach_t0010 down`.
7. Did not create browser screenshots, browser/UI automation tests, or visual-regression artifacts. Interactive browser checks for `/alerts` and book-detail alert creation remain a recommended manual follow-up before merge if visual evidence is required.

T0013:

1. Reviewed required docs and `docs/implementation_logs/T0013.md`.
2. Created branch `t0013-admin-catalog-management`; the preferred slash branch name could not be created inside the sandbox because `.git` refs were read-only until Git command escalation was approved.
3. Added Admin catalog APIs, service behavior, audit masking, focused AdminCatalog feature tests, typed frontend API helpers, and Admin catalog routes/pages within T0013 allowed areas.
4. Ran PHP syntax checks across backend controllers, libraries, models, migrations, and tests; all checked files reported no syntax errors.
5. Ran Dockerized AdminCatalog PHPUnit subset: `5 tests, 41 assertions`.
6. Ran Dockerized full backend PHPUnit: `69 tests, 653 assertions`.
7. Ran Dockerized frontend build; Vite build passed with the existing chunk-size warning.
8. Ran clean disposable migration and `DealSachDemoSeeder`; both completed.
9. Confirmed Admin catalog routes with `php spark routes | grep -E "api/admin/(categories|books|retailers|merchants|offers)"`.
10. Did not create browser automation, screenshots, Cypress, Playwright, or visual-regression artifacts. Interactive browser checks for the new Admin catalog pages remain recommended before merge if visual evidence is required.

T0014:

1. Reviewed required docs and `docs/implementation_logs/T0014.md`.
2. Created branch `feature/t0014-admin-dashboard-reports` from local `main`.
3. Added read-only Admin dashboard/report routes, `AdminDashboardService`, controller wiring, focused AdminDashboard feature tests, typed frontend API helpers, and `/admin`, `/admin/dashboard`, and `/admin/reports` React dashboard pages within T0014 allowed areas.
4. Ran PHP syntax checks for the new dashboard service, Admin controller, and dashboard feature test; all reported no syntax errors.
5. Ran Dockerized AdminDashboard PHPUnit subset: `2 tests, 30 assertions`.
6. Ran Dockerized full backend PHPUnit: `71 tests, 683 assertions`.
7. Ran Dockerized frontend build; Vite build passed with the existing chunk-size warning.
8. Ran clean disposable migration and `DealSachDemoSeeder`; both completed.
9. Confirmed Admin dashboard/report routes with `php spark routes | grep -E "api/admin/(dashboard|reports)"`.
10. Did not create browser automation, screenshots, Cypress, Playwright, or visual-regression artifacts per ticket non-goals.

T0015:

1. Reviewed required docs and `docs/implementation_logs/T0015.md`.
2. Created branch `docs/t0015-project-readme-usage-guide` from local `main`.
3. Added a top-level `README.md` covering DealSach scope, setup, Docker commands, public/auth/wishlist/alert/Admin usage examples, API routes, testing, project structure, known caveats, and development workflow.
4. Added a reusable README/documentation verification section to `docs/Manual_Verification_Guide.md`.
5. Ran README existence/content inspection, key-section grep, `git diff --check`, `git diff --name-only`, `git status --short`, and changed-file scope inspection.
6. Did not run backend PHPUnit or frontend build because T0015 is documentation-only and no application files changed.

T0017:

1. Reviewed required docs and `docs/implementation_logs/T0017.md`.
2. Created branch `docs/t0017-design-docs-architecture-readme` from local `main`.
3. Added `docs/design/ERD.md` with Mermaid ERD coverage for catalog, buy-flow, account/session/email, wishlist, price-alert, notification/link tracking, and admin audit tables.
4. Added markdown-only UML text specifications under `docs/uml/` for use-case, activity-flow, sequence-flow, and component/deployment views.
5. Refactored `README.md` to add a direct System Architecture section, link to ERD/UML docs, and remove detailed sections that were intentionally trimmed by ticket scope.
6. Ran documentation verification commands from T0017 manual verification; all passed.
7. Did not run backend PHPUnit or frontend build because T0017 is documentation-only and no runtime source files changed.

T0018:

1. Reviewed required docs and `docs/implementation_logs/T0018.md`.
2. Added `GET /api/public/books/suggestions` in public routes and controller response wiring.
3. Implemented bounded public autocomplete suggestion logic in `PublicCatalogService`, reusing existing accented/unaccented + partial search behavior and archived-book exclusion.
4. Added frontend async autocomplete in the shared header search input: Vietnamese loading/empty/error states, bounded suggestion list, and book-detail navigation on suggestion click while preserving Enter-to-search behavior.
5. Wired `Config\Email` to `SMTP_ADDRESS`, `SMTP_PORT`, `SMTP_USERNAME`, and `SMTP_PASSWORD` with conditional SMTP enablement.
6. Updated auth and alert outbound email flows to keep `outbound_emails` persistence first, then attempt SMTP delivery only when configuration is complete, while preserving safe local fallback when SMTP is incomplete.
7. Updated seeded Admin email to `24521102@gm.uit.edu.vn` and aligned seeded audit actor email values.
8. Ran focused Dockerized backend tests (`Auth|Alert|PublicCatalog`), full backend PHPUnit, and frontend Dockerized build; all passed.
9. Ran disposable migration/seed and verified seeded Admin email plus route registration for autocomplete and auth email-code request.
10. Updated reusable verification guidance for autocomplete + SMTP in `docs/Manual_Verification_Guide.md`.

T0019:

1. Reviewed required docs and `docs/implementation_logs/T0019.md`.
2. Created branch `feature/t0019-commerce-homepage-refresh` from local `main`.
3. Updated public discovery payload metadata (`subtitle`, `cta_label`, `cta_href`, optional `window`) and added `highest_eligible_price` to public book cards without introducing dynamic homepage section architecture.
4. Refreshed homepage/shared UI to keep API-backed section order while adding controlled Neubrutalist CTA behavior, category shelf descriptions, module-level disclaimer placement, and `Đến nơi bán →` book-detail navigation.
5. Split frontend color tokens so `secondary` now represents a neutral accent and `dealRed` is used for commercial/error emphasis in allowed pages.
6. Updated seeded observation timestamps to avoid future-dated “today” observations and kept deterministic tie/drop scenario coverage while adding at least one highest-vs-lowest reference spread.
7. Ran Dockerized `PublicCatalog` subset, full backend PHPUnit, frontend build, and discovery route registration check; all passed.
8. Did not complete browser screenshot/manual UI capture in this run; interactive homepage visual verification remains recommended before merge if visual evidence is required.

## Known Issues

See `docs/Known_Issues_And_Followups.md`.

Closed in T0004:

* KI-0007 — popular clicked deals now use persisted successful Affiliate Redirect records.

Closed in T0006:

* KI-0008 — fresh disposable long-running Docker app containers now normalize `backend/writable` ownership during startup without a manual `chown`.

Open after T0019:

* KI-0009 remains open — demo book cover paths still rely on fallback rendering because the referenced `/demo/covers/*` image files are not present.
* KI-0011, KI-0012, and KI-0013 are closed by T0016.
* KI-0014 added in T0018 — `frontend` uses fixed `container_name: ds_frontend`, which breaks concurrent disposable `docker compose -p ...` stacks.

## Next Recommended Ticket

Prioritize a small infrastructure ticket to remove fixed `container_name` usage from Docker Compose (KI-0014), then follow with KI-0009 demo cover asset alignment.
