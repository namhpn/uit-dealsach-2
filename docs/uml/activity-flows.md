# UML Activity Flows (Text Specification)

This file describes proposed UML activity diagrams in text only.

## 1. Discovery and Buy Flow

1. User opens homepage or search page.
2. System returns discovery/search data with offer eligibility summaries.
3. User opens book detail.
4. User chooses Buy on eligible offer.
5. System records Buy Attempt.
6. System validates offer status, freshness, and affiliate destination safety.
7. If valid: record Affiliate Redirect and redirect externally.
8. If invalid/missing/unsafe: record Redirect Failure and show Vietnamese error page.

## 2. Email Verification Flow

1. User submits email.
2. System enforces request cooldown/rate limits.
3. System creates active verification code hash and mock outbound email.
4. User submits code.
5. System validates code state, expiry, and attempts.
6. If valid: create/reuse active user, create session, invalidate other active codes.
7. If invalid: return Vietnamese validation/error state.

## 3. Wishlist Flow

1. Authenticated user triggers wishlist add/remove.
2. System validates active session and target book status.
3. Add uses unique `(user_id, book_id)` behavior (idempotent duplicate add).
4. Remove is safe no-op when row does not exist.
5. Wishlist page renders saved items and archived-book marker when relevant.

## 4. Price Alert Flow

1. Authenticated user creates alert from book detail.
2. System validates alert type, price rules, and duplicate non-terminal rule.
3. System stores alert and initial baseline/comparison state.
4. Evaluator processes cycles and checks eligible current offers.
5. If conditions pass and email is allowed: write event, create outbound email and links.
6. System updates notification counters and handles auto-pause/expiry transitions.
7. User can apply status-allowed actions (pause/reactivate/disable/renew/restart).

## 5. Admin Catalog Management Flow

1. Admin user opens catalog page.
2. Admin submits create/update/archive/restore or observation mutation.
3. System validates lifecycle constraints and merchant/retailer/domain consistency.
4. System writes mutation and persists related state effects.
5. System writes masked audit record.
6. UI refreshes with updated status/history-aware data.
