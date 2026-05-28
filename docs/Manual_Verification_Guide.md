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

## Auth API Verification

Use this section for backend tickets that add or change email verification or session APIs.

1. Confirm routes are registered:

   ```bash
   docker compose run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/auth|email-code|logout|me"'
   ```

2. Request a verification code:

   ```bash
   curl -i -c /tmp/dealsach-auth-cookies.txt \
     -H 'Content-Type: application/json' \
     -d '{"email":"tester@example.com"}' \
     http://localhost/api/auth/email-code/request
   ```

   Expected result: a Vietnamese success envelope that does not include the verification code.

3. Inspect the mock outbox without printing database credentials:

   ```bash
   docker compose exec db sh -lc 'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" -N -e "SELECT body_text FROM outbound_emails WHERE normalized_recipient_email='\''tester@example.com'\'' ORDER BY id DESC LIMIT 1"'
   ```

   Expected result: one mock email body containing a 6-digit code and 10-minute expiry copy.

4. Verify the code:

   ```bash
   curl -i -b /tmp/dealsach-auth-cookies.txt -c /tmp/dealsach-auth-cookies.txt \
     -H 'Content-Type: application/json' \
     -d '{"email":"tester@example.com","code":"<CODE_FROM_MOCK_OUTBOX>"}' \
     http://localhost/api/auth/email-code/verify
   ```

   Expected result: a Vietnamese success envelope, active user data, and an HTTP-only `dealsach_session` cookie.

5. Read current account state:

   ```bash
   curl -s -b /tmp/dealsach-auth-cookies.txt http://localhost/api/auth/me
   ```

   Expected result: `authenticated` is `true` and the user email is `tester@example.com`.

6. Log out:

   ```bash
   curl -i -b /tmp/dealsach-auth-cookies.txt -c /tmp/dealsach-auth-cookies.txt \
     -X POST http://localhost/api/auth/logout
   ```

   Expected result: a Vietnamese success envelope and an expired `dealsach_session` cookie.

## Wishlist API Verification

Use this section for tickets that add or change authenticated wishlist APIs.

1. Confirm routes are registered:

   ```bash
   docker compose run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/user/wishlist"'
   ```

   Expected result: list, status, add, and remove wishlist routes are present.

2. Confirm guest access is rejected:

   ```bash
   curl -i http://localhost/api/user/wishlist
   ```

   Expected result: HTTP 401 with Vietnamese JSON containing `status`, `message`, `data`, and `errors`.

3. Authenticate using the Auth API verification flow above, then add a book:

   ```bash
   curl -i -b /tmp/dealsach-auth-cookies.txt \
     -X POST http://localhost/api/user/wishlist/books/1
   ```

   Expected result: Vietnamese success envelope with `wishlisted: true`.

4. Add the same book again and verify no duplicate row exists:

   ```bash
   curl -i -b /tmp/dealsach-auth-cookies.txt \
     -X POST http://localhost/api/user/wishlist/books/1
   docker compose exec db sh -lc 'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" -N -e "SELECT COUNT(*) FROM wishlist_items WHERE user_id=1 AND book_id=1"'
   ```

   Expected result: add returns success and the count remains `1`.

5. Check status, list, remove, and confirm status again:

   ```bash
   curl -s -b /tmp/dealsach-auth-cookies.txt http://localhost/api/user/wishlist/books/1
   curl -s -b /tmp/dealsach-auth-cookies.txt http://localhost/api/user/wishlist
   curl -i -b /tmp/dealsach-auth-cookies.txt -X DELETE http://localhost/api/user/wishlist/books/1
   curl -s -b /tmp/dealsach-auth-cookies.txt http://localhost/api/user/wishlist/books/1
   ```

   Expected result: status changes from `wishlisted: true` to `wishlisted: false`, and the list includes book-card metadata plus `added_at` before removal.

## Admin API Verification

Use this section for tickets that add or change restricted Admin APIs.

1. Confirm Admin routes are registered:

   ```bash
   docker compose run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/admin"'
   ```

   Expected result: Admin session, users, alerts, and audit routes are present.

2. Run focused Admin tests:

   ```bash
   docker compose -p dealsach_t0012 run --rm app sh -lc 'cd backend && php vendor/bin/phpunit --filter Admin'
   ```

   Expected result: Admin authorization, user state transition, alert disable, and audit tests pass.

3. Run migration and seed in a disposable project:

   ```bash
   docker compose -p dealsach_t0012 run --rm app sh -lc 'cd backend && php spark migrate && php spark db:seed DealSachDemoSeeder'
   ```

   Expected result: `admin_audit_logs` exists, and seed data includes active Admin `admin@dealsach.test`.

4. Verify guest and registered users cannot access Admin APIs, then verify an Admin can list users, deactivate/reactivate users, disable alerts, and view audit records.

   Expected result: guests receive HTTP 401, registered non-admin users receive HTTP 403, Admin mutations preserve history and create audit records.

## Admin Catalog Verification

Use this section for tickets that add or change Admin catalog APIs or pages.

1. Confirm Admin catalog routes are registered:

   ```bash
   docker compose -p dealsach_t0013 run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/admin/(categories|books|retailers|merchants|offers)"'
   ```

   Expected result: list, create, update, archive/restore, offer detail, and offer observation routes are present.

2. Run focused Admin catalog tests:

   ```bash
   docker compose -p dealsach_t0013 run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit --filter AdminCatalog'
   ```

   Expected result: Admin authorization, catalog lifecycle, audit masking, offer validation, eligibility review, and observation-time capture checks pass.

3. Build the Admin catalog frontend:

   ```bash
   docker compose -p dealsach_t0013 run --rm frontend npm run build
   ```

   Expected result: the React/Vite build succeeds and Admin catalog routes compile.

4. As a seeded Admin, open `/admin`, `/admin/books`, `/admin/categories`, `/admin/retailers`, `/admin/merchants`, `/admin/offers`, and one `/admin/offers/<id>` detail route.

   Expected result: pages render inside the existing Admin shell, show Vietnamese labels, and remain usable at 768px minimum width.

## Admin Dashboard Verification

Use this section for tickets that add or change Admin dashboard/report APIs or pages.

1. Confirm Admin dashboard routes are registered:

   ```bash
   docker compose -p dealsach_t0014 run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/admin/(dashboard|reports)"'
   ```

   Expected result: `GET /api/admin/dashboard` and `GET /api/admin/reports` are present.

2. Run focused Admin dashboard tests:

   ```bash
   docker compose -p dealsach_t0014 run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit --filter AdminDashboard'
   ```

   Expected result: Admin authorization, default 7-day metrics, grouping, archived markers, price-change summary, and no-audit-on-read checks pass.

3. Run the full backend suite and frontend build:

   ```bash
   docker compose -p dealsach_t0014 run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit'
   docker compose -p dealsach_t0014 run --rm frontend npm run build
   ```

   Expected result: PHPUnit exits 0, and the React/Vite build succeeds with no new dependency installation.

4. As an Admin, open `/admin`, `/admin/dashboard`, or `/admin/reports`.

   Expected result: the dashboard shows Vietnamese summary cards, grouped report tables, proportional CSS bar rows, the fixed 7-day Vietnam-time window, and links to existing Admin pages. Guest users see the existing Admin login prompt; registered non-admin users see the no-permission state.

## Frontend Alert Management Verification

Use this section for tickets that add or change the authenticated React price-alert UI.

1. Run the frontend build:

   ```bash
   docker compose -p dealsach_t0010 run --rm frontend npm run build
   ```

   Expected result: the Vite build succeeds without installing new runtime dependencies. The existing chunk-size warning is acceptable unless the ticket specifically targets bundle splitting.

2. Run backend tests to confirm the alert API contract remains stable:

   ```bash
   docker compose -p dealsach_t0010 run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'
   ```

   Expected result: PHPUnit exits 0.

3. Start the app and open `/alerts` as a guest.

   Expected result: the existing email-code auth dialog opens, and the page also shows a Vietnamese prompt without duplicating a separate login UI.

4. Authenticate with the email-code flow, then open `/book/<BOOK_ID>`.

   Expected result: the book detail page shows target-price and new-lowest-price alert creation controls. Target-price input accepts whole-number VND only.

5. Create both alert types from book detail, then open `/alerts`.

   Expected result: both alerts appear with book title, cover fallback when needed, category, alert type, status, target or baseline fields, expiry, notification count, current price, and comparison price when returned by the API.

6. Exercise only actions that are visible for the current status:

   * Active: update target price for target-price alerts, pause, restart tracking for new-lowest alerts, disable.
   * Paused: update target price for target-price alerts, reactivate, restart tracking for new-lowest alerts, disable.
   * Auto-paused: reactivate or disable.
   * Expired: renew or open the book detail page to create a new alert.
   * Disabled: history-only state; no reactivation control.

   Expected result: the UI updates the changed alert or shows the backend Vietnamese validation/conflict message.

7. Toggle the account-level alert email preference on `/alerts`.

   Expected result: the preference state changes, the UI explains that email suppression does not alter individual alert statuses, and existing alert statuses remain unchanged.

## Price Alert API Verification

Use this section for tickets that add or change authenticated price alert APIs.

1. Confirm routes are registered:

   ```bash
   docker compose run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/user/alerts|api/user/alert-preferences"'
   ```

   Expected result: list, detail, create, update, pause, reactivate, renew, restart-tracking, disable, and alert-preference routes are present.

2. Confirm guest access is rejected:

   ```bash
   curl -i http://localhost/api/user/alerts
   curl -i http://localhost/api/user/alert-preferences
   ```

   Expected result: HTTP 401 with Vietnamese JSON containing `status`, `message`, `data`, and `errors`.

3. Authenticate using the Auth API verification flow above, then create a target-price alert:

   ```bash
   curl -i -b /tmp/dealsach-auth-cookies.txt \
     -H 'Content-Type: application/json' \
     -d '{"book_id":1,"alert_type":"target_price","target_price":90000}' \
     http://localhost/api/user/alerts
   ```

   Expected result: Vietnamese success envelope with `alert_type: "target_price"`, `status: "Active"`, `target_price: 90000`, `notification_count: 0`, and an expiry timestamp.

4. Create the same target-price alert again and verify no duplicate row exists:

   ```bash
   curl -i -b /tmp/dealsach-auth-cookies.txt \
     -H 'Content-Type: application/json' \
     -d '{"book_id":1,"alert_type":"target_price","target_price":90000}' \
     http://localhost/api/user/alerts
   docker compose exec db sh -lc 'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" -N -e "SELECT COUNT(*) FROM price_alerts WHERE user_id=1 AND book_id=1 AND alert_type='\''target_price'\'' AND target_price=90000"'
   ```

   Expected result: create returns the existing alert and the count remains `1`.

5. Create and manage a new-lowest-price alert:

   ```bash
   curl -i -b /tmp/dealsach-auth-cookies.txt \
     -H 'Content-Type: application/json' \
     -d '{"book_id":1,"alert_type":"new_lowest_price"}' \
     http://localhost/api/user/alerts
   curl -s -b /tmp/dealsach-auth-cookies.txt http://localhost/api/user/alerts
   curl -i -b /tmp/dealsach-auth-cookies.txt -X POST http://localhost/api/user/alerts/<ALERT_ID>/pause
   curl -i -b /tmp/dealsach-auth-cookies.txt -X POST http://localhost/api/user/alerts/<ALERT_ID>/reactivate
   curl -i -b /tmp/dealsach-auth-cookies.txt -X POST http://localhost/api/user/alerts/<ALERT_ID>/restart-tracking
   curl -i -b /tmp/dealsach-auth-cookies.txt -X POST http://localhost/api/user/alerts/<ALERT_ID>/disable
   ```

   Expected result: the alert remains owned by the authenticated user, status changes follow the requested action, restart tracking resets notification fields, and disable preserves history.

6. Read and update alert email preferences:

   ```bash
   curl -s -b /tmp/dealsach-auth-cookies.txt http://localhost/api/user/alert-preferences
   curl -i -b /tmp/dealsach-auth-cookies.txt \
     -H 'Content-Type: application/json' \
     -X PATCH \
     -d '{"alert_emails_enabled":false}' \
     http://localhost/api/user/alert-preferences
   ```

   Expected result: default preference is enabled for users without a preference row; updating the preference does not change individual alert statuses.

## Alert Notification Engine Verification

Use this section for tickets that add or change alert evaluation, mock alert emails, email deal links, or disable-alert links.

1. Confirm PHP syntax for the changed backend alert surface:

   ```bash
   find backend/app/Commands backend/app/Controllers backend/app/Libraries backend/app/Models backend/app/Database/Migrations backend/tests/database backend/tests/feature -name '*.php' -print0 | xargs -0 -n1 php -l
   ```

   Expected result: no syntax errors.

2. Run alert-focused tests:

   ```bash
   docker compose -p dealsach_t0011 run --rm -e database.default.hostname=db app sh -lc 'cd backend && php vendor/bin/phpunit --filter Alert'
   ```

   Expected result: alert evaluator, mock email, suppression, failed retry, deal-link click, disable-link, and auto-pause tests pass.

3. Run a clean migration, seed, and evaluator command:

   ```bash
   docker compose -p dealsach_t0011 up -d --build db
   docker compose -p dealsach_t0011 exec db sh -lc 'mariadb-admin ping -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" --silent'
   docker compose -p dealsach_t0011 run --rm -e database.default.hostname=db app sh -lc 'cd backend && php spark migrate && php spark db:seed DealSachDemoSeeder && php spark alerts:evaluate'
   ```

   Expected result: migrations include `CreateAlertNotificationTables`, seed completes, and `alerts:evaluate` prints evaluated, triggered, emailed, suppressed, failed, baseline-set, expired, and auto-paused counts.

4. Verify email-link routes are registered:

   ```bash
   docker compose -p dealsach_t0011 run --rm -e database.default.hostname=db app sh -lc 'cd backend && php spark routes | grep -E "email/deals|alerts/disable"'
   ```

   Expected result: public DealSach landing and disable-link routes are present.

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
