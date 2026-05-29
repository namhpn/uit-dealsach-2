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

## Documentation Verification

Use this section for documentation-only tickets such as README or usage-guide updates.

1. Confirm the expected document exists and inspect the relevant top section:

   ```bash
   test -f README.md && sed -n '1,260p' README.md
   ```

   Expected result: the README includes project introduction, setup, usage examples, testing commands, API overview, known caveats, and links to deeper docs.

2. Confirm key README sections are present:

   ```bash
   grep -E "Project|Setup|Installation|Usage|Testing|Admin|Dashboard|Known" README.md
   ```

   Expected result: section headings or content lines match the documented coverage.

3. Check formatting-sensitive diff issues:

   ```bash
   git diff --check
   ```

   Expected result: no trailing whitespace or conflict marker issues.

4. Inspect changed files:

   ```bash
   git diff --name-only
   git status --short
   ```

   Expected result: tracked and newly created files are limited to the ticket's documentation and allowed bookkeeping files.

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

## Search Autocomplete Verification

Use this section for tickets that add or change asynchronous public search suggestions.

1. Confirm the suggestions route is registered:

   ```bash
   docker compose run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/public/books/suggestions"'
   ```

   Expected result: `GET /api/public/books/suggestions` is listed.

2. Run focused public catalog tests:

   ```bash
   docker compose run --rm --build app sh -lc 'cd backend && php vendor/bin/phpunit --filter PublicCatalogApiTest'
   ```

   Expected result: autocomplete tests pass for accented/unaccented queries, bounded result count, required suggestion fields, and archived-book exclusion.

3. Start the frontend app, type a non-empty Vietnamese keyword into the public header search input, and watch the suggestion panel.

   Expected result: loading, empty, and error states are shown in Vietnamese where applicable; selecting a suggestion opens the correct `/book/:id`; pressing Enter still navigates to `/search?...`.

## Homepage Discovery Refresh Verification

Use this section for tickets that change homepage discovery metadata, homepage card pricing presentation, or homepage banner CTA behavior.

1. Confirm discovery route is still registered:

   ```bash
   docker compose run --rm app sh -lc 'cd backend && php spark routes | grep "api/public/discovery"'
   ```

   Expected result: `GET /api/public/discovery` is listed.

2. Run focused public catalog tests and full backend tests:

   ```bash
   docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit --filter PublicCatalog'
   docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'
   ```

   Expected result: both commands pass.

## Product Detail Commerce Refresh Verification

Use this section for tickets that change ProductDetailPage layout hierarchy, public detail metadata, seller row states, or alert-form placement.

1. Run focused and full backend tests:

   ```bash
   docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit --filter PublicCatalog'
   docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit --filter AdminCatalog'
   docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'
   ```

   Expected result: all commands return `OK`.

2. Run frontend build:

   ```bash
   docker compose run --rm frontend npm run build
   ```

   Expected result: build succeeds.

3. Confirm public detail route still exists:

   ```bash
   docker compose run --rm app sh -lc 'cd backend && php spark routes | grep -E "api/public/books/\\([0-9]+\\)"'
   ```

   Expected result: `GET /api/public/books/([0-9]+)` is listed.

4. Open a public book detail page and verify:

   - hero uses one large cover frame with `contain` image behavior;
   - best-price panel shows current lowest eligible price or status label;
   - reference strikethrough price appears only when highest eligible price is greater than lowest;
   - seller groups remain visible with purchasable rows first and disabled hard-label blocks:
     - `CHƯA CÓ LIÊN KẾT`
     - `GIÁ THAM KHẢO CŨ`
     - `TẠM HẾT HÀNG`
   - seller CTA text is `ĐẾN NƠI BÁN`;
   - full alert form appears in/directly below the price-history module and uses `THEO DÕI GIẢM GIÁ`;
   - technical metadata shows seeded values where present and `Chưa cập nhật` when missing;
   - related books remain frontend-fallback based and capped to 4;
   - bottom disclaimer remains visible and complete.

3. Build frontend:

   ```bash
   docker compose run --rm frontend npm run build
   ```

   Expected result: Vite build succeeds (existing chunk-size warning is acceptable unless the ticket targets bundle splitting).

4. Open homepage and verify section order and CTA behavior:

   Expected result:
   * section order remains Hero → Featured books → Recent price drops → Popular clicked deals → How it works.
   * hero CTA actions navigate only to existing internal routes/anchors.
   * homepage card CTA text is `Đến nơi bán →` and opens `/book/{id}`, not external seller URLs.

5. Verify discovery response shape and homepage card data:

   Expected result:
   * each discovery section includes `title`, `subtitle`, `cta_label`, `cta_href`, `items`, and `empty_state`.
   * time-windowed sections include `window` metadata.
   * book cards include both `lowest_eligible_price` and `highest_eligible_price`.
   * reference/strikethrough pricing displays only when highest eligible price is greater than lowest eligible price.
   * homepage shows one module-level price disclaimer instead of per-card disclaimer text.

## Search Result Commerce Refresh Verification

Use this section for tickets that change `/search` layout, active filters, search-card commerce cues, or search pagination behavior.

1. Run focused and full backend tests:

   ```bash
   docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit --filter PublicCatalog'
   docker compose run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'
   ```

   Expected result: both commands return `OK`.

2. Run frontend build:

   ```bash
   docker compose run --rm frontend npm run build
   ```

   Expected result: build succeeds.

3. Open `/search` and verify the result hero:

   Expected result:
   * hard-bordered emerald hero renders;
   * heading is `Kết quả tìm kiếm` when no `q`;
   * heading context is `Kết quả tìm kiếm cho` plus query chip when `q` exists;
   * hero shows `Tìm thấy {total} đầu sách`;
   * hero contains sort control sourced from API `sorts`.

4. Verify filter panel behavior:

   Expected result:
   * visible filters include query, category, author, publisher, retailer, min/max price, and sort;
   * `Tình trạng` is not visible;
   * mobile filter toggle updates `aria-expanded`;
   * filter updates reset URL `page=1`.

5. Verify active filter chips:

   Expected result:
   * chips render for active visible filters and non-default sort;
   * removing each chip updates URL/results and resets `page=1`;
   * `Xóa bộ lọc` clears visible active filters.

6. Verify search cards and pagination:

   Expected result:
   * cards remain links to `/book/{id}`;
   * wishlist control does not trigger card navigation;
   * offer-count label is `NƠI BÁN`;
   * price-drop badge appears only on cards with API `price_drop`;
   * reference/strikethrough price appears only when `highest_eligible_price > lowest_eligible_price`;
   * numbered pagination uses backend pagination metadata and URL `page`.

7. Verify empty/validation states:

   Expected result:
   * empty state uses backend `empty_state.message` when present;
   * empty state exposes `Xóa bộ lọc` and `Về trang chủ` actions;
   * invalid price input (non-integer or `min > max`) shows a clear Vietnamese validation message.

8. Verify mobile layout at ~360px width:

   Expected result:
   * no unintended horizontal scrolling;
   * hero, filters, cards, and pagination remain readable in one-column flow.

## SMTP Delivery Verification

Use this section for tickets that add or change outbound email delivery behavior.

1. Seed data and verify the seeded Admin account email:

   ```bash
   docker compose run --rm app sh -lc 'cd backend && php spark migrate && php spark db:seed DealSachDemoSeeder'
   docker compose exec db sh -lc 'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" -N -e "SELECT normalized_email, role FROM users WHERE role='\''admin'\'' ORDER BY id"'
   ```

   Expected result: seeded Admin email is `24521102@gm.uit.edu.vn`.

2. Trigger an auth email-code request and inspect `outbound_emails`:

   ```bash
   curl -i -c /tmp/dealsach-auth-cookies.txt \
     -H 'Content-Type: application/json' \
     -d '{"email":"24521102@gm.uit.edu.vn"}' \
     http://localhost/api/auth/email-code/request
   docker compose exec db sh -lc 'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" -N -e "SELECT normalized_recipient_email, email_type, status FROM outbound_emails ORDER BY id DESC LIMIT 5"'
   ```

   Expected result: response keeps the neutral Vietnamese envelope with no OTP value; `outbound_emails` persists records and marks status according to SMTP availability (`queued` local fallback, `sent`/`failed` when SMTP is configured and attempted).

## CORS Verification (Credentialed Frontend)

Use this section for tickets that change API CORS behavior for frontend origins.

1. Set allowed origins in environment without hardcoding per deployment:

   ```ini
   cors.allowedOrigins = http://localhost:5173,https://dealsach.eu.cc
   ```

   Expected result: CORS allowed origins are managed by environment config instead of source edits.

2. Verify preflight response:

   ```bash
   docker compose run --rm app sh -lc "curl -i -X OPTIONS http://nginx/api/auth/email-code/request \
     -H 'Origin: http://localhost:5173' \
     -H 'Access-Control-Request-Method: POST' \
     -H 'Access-Control-Request-Headers: content-type'"
   ```

   Expected result: HTTP `204` with `Access-Control-Allow-Origin` matching the request origin, allowed headers/methods, and `Access-Control-Allow-Credentials: true`.

3. Verify credentialed auth request response headers:

   ```bash
   docker compose run --rm app sh -lc "curl -i -H 'Origin: http://localhost:5173' -H 'Content-Type: application/json' \
     -d '{\"email\":\"24521102@gm.uit.edu.vn\"}' http://nginx/api/auth/email-code/request"
   ```

   Expected result: HTTP `200` Vietnamese JSON envelope plus `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true`.

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

   Expected result: `admin_audit_logs` exists, and seed data includes active Admin `24521102@gm.uit.edu.vn`.

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
