# Manual Verification Guide

## General Rules

Manual verification must be small, practical, and tied to the ticket.

A passing build is required when possible, but it is not sufficient by itself.

Each ticket must update this guide when it changes a reusable verification workflow, command, route family, browser check, Docker project pattern, product checklist item, or manual QA expectation. If a ticket does not change the guide, the completion report must explicitly say that no guide update was needed.

Prefer disposable Docker Compose project names for database-mutating checks:

```bash
docker compose -p dealsach_t0000 up -d --build db
docker compose -p dealsach_t0000 run --rm app sh -lc 'cd backend && php spark migrate'
docker compose -p dealsach_t0000 run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'
docker compose -p dealsach_t0000 down -v
```

Replace `dealsach_t0000` with the current ticket ID, for example `dealsach_t0003`.

Before closing a ticket, inspect the changed file list:

```bash
git diff --name-only main...HEAD
git status --short
```

Expected result: changes stay inside the ticket's allowed areas, plus required process docs.

## Baseline Frontend Verification

1. Run:

```bash
docker compose run --rm frontend npm install
docker compose run --rm --service-ports frontend npm run dev -- --host 0.0.0.0
```

2. Open the local frontend URL.

3. Confirm the app loads.

4. Confirm no obvious browser console errors.

5. Confirm Vietnamese text renders correctly.

6. Confirm layout does not break at:

   * 360px public mobile width
   * 768px admin minimum width where applicable
   * 1366px desktop width

7. Run:

   ```bash
   docker compose run --rm frontend npm run build
   ```

8. Confirm the build succeeds.

## Baseline Backend Verification

1. Run:

   ```bash
   docker compose up -d --build
   ```

2. Run:

   ```bash
   docker compose run --rm app sh -lc 'cd backend && php spark list'
   ```

3. Run migrations if the ticket requires database behavior:

   ```bash
   docker compose run --rm app sh -lc 'cd backend && php spark migrate'
   ```

4. Run backend tests when available:

   ```bash
   docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'
   ```

5. For Docker runtime tickets or HTTP verification, confirm the long-running app container owns writable runtime paths without manual correction:

   ```bash
   docker compose exec app sh -lc 'ls -ld backend/writable backend/writable/cache backend/writable/logs backend/writable/session backend/writable/uploads'
   ```

   Expected result: the listed paths are owned by `www-data www-data`, and public HTTP/API checks do not require a manual `chown`.

## API Verification

Use this section for backend tickets that add or change JSON APIs.

1. Confirm routes are registered:

   ```bash
   docker compose run --rm app sh -lc 'cd backend && php spark routes'
   ```

2. Verify each changed route returns the expected HTTP status and JSON envelope:

   ```json
   {
     "status": "success",
     "message": "...",
     "data": {},
     "errors": null
   }
   ```

3. Verify invalid input returns a non-2xx status with Vietnamese validation errors.

4. Verify public responses do not expose admin-only fields or exact internal timestamps unless the requirement explicitly allows them.

5. For database-backed API behavior, verify the result against the seeded database state, a focused PHPUnit feature test, or both.

## Public Catalog API Checks

Use this section for DealSach catalog read endpoints.

1. Confirm these routes exist when the catalog API is in scope:

   ```text
   GET /api/public/books
   GET /api/public/books/{bookId}
   GET /api/public/discovery
   GET /api/public/filters
   ```

2. Verify list responses include pagination, book-card fields, offer count, lowest eligible price when available, one no-price status when unavailable, and the required price disclaimer.

3. Verify detail responses group public offers into `purchasable`, `unavailable`, `stale_reference`, and `missing_valid_seller_link`.

4. Verify stale, unavailable, missing-link, pending review, inactive, and removed/invalid offers do not expose active Buy actions.

5. Verify book-level price history uses observation-time eligibility and does not disappear because of current stale or unavailable states.

6. Verify search supports accented and unaccented Vietnamese input, partial matching, and ISBN matching that ignores hyphens and spaces.

7. Verify price range filters use only currently eligible offers and exclude books without currently eligible offers.

## DealSach Product Verification Checklist

Use relevant items only:

* Public copy is Vietnamese-first.

* Prices use whole-number VND formatting.

* Public pages do not imply real-time price guarantees.

* Required disclaimer appears near price/Buy areas:

  `Giá tham khảo được ghi nhận gần đây, vui lòng kiểm tra lại tại nơi bán trước khi mua.`

* DealSach never appears to sell books directly.

* No cart, checkout, payment, order, shipping, review, rating, voucher, or real external retailer integration is introduced.

* Affiliate redirects are validated before external navigation.

* Invalid destinations produce redirect failures, not affiliate clicks.

* Admin-only details do not leak to public pages.
