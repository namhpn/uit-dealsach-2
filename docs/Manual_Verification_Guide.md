# Manual Verification Guide

## General Rules

Manual verification must be small, practical, and tied to the ticket.

A passing build is required when possible, but it is not sufficient by itself.

## Baseline Frontend Verification

1. Run:

```bash
   cd frontend
   npm install
   npm run dev
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
   npm run build
   ```

8. Confirm the build succeeds.

## Baseline Backend Verification

1. Run:

   ```bash
   docker compose --env-file backend/.env up -d --build
   ```

2. Run:

   ```bash
   docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php spark list'
   ```

3. Run migrations if the ticket requires database behavior:

   ```bash
   docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php spark migrate'
   ```

4. Run backend tests when available:

   ```bash
   docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'
   ```

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
