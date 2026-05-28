# UML Sequence Flows (Text Specification)

This file describes proposed UML sequence diagrams in text only.

## 1. Public Search Sequence

Participants:
- Guest/Registered User
- React Frontend
- Nginx
- CI4 PublicCatalogController/PublicCatalogService
- MariaDB

Flow:
1. User submits query/filter input.
2. Frontend calls `GET /api/public/books`.
3. Backend resolves eligible-offer and ranking rules.
4. Backend reads books/offers/observations/categories.
5. Backend returns paginated JSON summary.
6. Frontend renders cards, status labels, and disclaimer messaging.

## 2. Buy Redirect Sequence

Participants:
- User
- React Frontend (or direct link)
- Nginx
- CI4 BuyFlowController/BuyFlowService
- MariaDB
- External Seller

Flow:
1. User clicks Buy for offer.
2. Backend records Buy Attempt.
3. Backend validates offer and destination domain/path rules.
4. If valid: write Affiliate Redirect event and return HTTP redirect.
5. Browser navigates to external seller.
6. If invalid: write Redirect Failure and return DealSach error response/page.

## 3. Email-Code Login Sequence

Participants:
- User
- React Frontend
- CI4 AuthController/AuthService/EmailVerificationService
- MariaDB

Flow:
1. User requests code.
2. Backend stores verification code hash and mock outbound email.
3. User submits code.
4. Backend validates code and creates/reuses active user.
5. Backend creates user session token hash and sets session cookie.
6. Frontend calls `/api/auth/me` to render authenticated state.

## 4. Alert Evaluation Sequence

Participants:
- Scheduler/Operator
- CI4 Command `alerts:evaluate`
- AlertNotificationService/PriceAlertService
- PublicCatalogService
- MariaDB

Flow:
1. Scheduler runs alert evaluator command.
2. Service loads evaluable alerts and current eligible prices.
3. Service applies target/new-lowest rules.
4. On trigger: write alert event, outbound email, email deal link, disable token.
5. Service updates counters/status and persists result.
6. Command reports aggregate evaluation counts.

## 5. Admin Mutation and Audit Sequence

Participants:
- Admin User
- React Admin UI
- CI4 AdminController/AdminCatalogService/AdminService
- AdminAuditService
- MariaDB

Flow:
1. Admin submits mutation request.
2. Backend enforces admin authorization.
3. Service validates mutation constraints and writes data changes.
4. Audit service writes `admin_audit_logs` entry with masked sensitive fields.
5. Backend returns updated entity state for UI refresh.
