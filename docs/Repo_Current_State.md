# Repo Current State

Last updated: 2026-05-27

## Current Branch

`feature/t0006-close-review-gaps`

Baseline source for T0006: `main` at `e78bc49` (`Add ticket T0006`).

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

## Installed Dependencies

### Frontend

* `frontend/package-lock.json` remains the npm lockfile.
* No new runtime dependencies were added in T0004.
* `frontend/node_modules/` and `frontend/dist/` are ignored by `.gitignore`.

### Backend

* No Composer dependency changes.
* T0004 added no Composer dependencies.
* T0006 added no Composer dependency changes.

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
| Frontend | `docker compose run --rm frontend npm run build` | Passed for T0005 | Existing Vite chunk-size warning remains. |
| Frontend | `docker compose -p dealsach_t0006 run --rm frontend npm run build` | Passed for T0006 | Existing Vite chunk-size warning remains. |
| Manual UI | Chrome headless screenshots at `/`, `/book/3`, and `/search?q=Tony&availability=available_now` | Passed for T0005 | Verified desktop 1366px homepage/detail and 360px mobile search render without unintended horizontal scrolling in captured states. |
| Manual UI | Chrome headless screenshots at `/` 1366px, `/` 360px, and `/search?q=Tony&availability=available_now` 360px | Passed for T0006 | Verified homepage section order, no duplicate homepage search input, API-backed featured category shelves, and mobile rendering. Screenshots saved in `/private/tmp/dealsach-t0006-home-1366.png`, `/private/tmp/dealsach-t0006-home-360.png`, and `/private/tmp/dealsach-t0006-search-360.png`. |
| API/Buy flow | `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost/go/offers/5` | Passed for T0005 | Returned `302 https://tiki.vn/nha-gia-kim-demo` after KI-0008 writable ownership workaround. |
| API/Buy flow | `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost/go/offers/5` | Passed for T0006 | Returned `302 https://tiki.vn/nha-gia-kim-demo` on a fresh disposable stack without manual `chown`. |
| Backend | `docker compose -p dealsach_t0006 run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` | Passed for T0006 | 27 tests, 161 assertions. |
| Docker runtime | `docker compose -p dealsach_t0006 up -d --build`; migrate/seed; writable/API/redirect checks | Passed for T0006 | `backend/writable` paths owned by `www-data www-data`; `GET /api/public/filters` and `GET /api/public/discovery` returned 200. Initial first migrate attempt hit MariaDB startup timing with `Connection refused`, rerun passed after DB was ready. |

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

T0006 expanded featured and popular-clicked demo coverage:

* Featured books now span 6 active API filter categories: `cong-nghe`, `kinh-te`, `ky-nang-song`, `lich-su`, `thieu-nhi`, and `van-hoc-viet-nam`.
* Discovery popular clicked deals include multiple ranked books across Tiki, Fahasa, Lazada, and Shopee.

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

## Known Issues

See `docs/Known_Issues_And_Followups.md`.

Closed in T0004:

* KI-0007 — popular clicked deals now use persisted successful Affiliate Redirect records.

Closed in T0006:

* KI-0008 — fresh disposable long-running Docker app containers now normalize `backend/writable` ownership during startup without a manual `chown`.

## Next Recommended Ticket

T0007 — Decide whether to add real demo cover image assets for `/demo/covers/*`, or continue with the next small public feature ticket. T0006 verification still shows graceful cover fallback cards because the referenced demo cover files are absent.
