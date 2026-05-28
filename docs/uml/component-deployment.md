# UML Component and Deployment View (Text Specification)

This file describes proposed UML component/deployment diagrams in text only.

## Component View

### Client Boundary

- Browser/client executes React app.
- Browser stores/uses HTTP-only session cookie for authenticated flows.
- Browser is responsible for initiating external-seller navigation only after backend redirect validation.

### Frontend Component

- React + TypeScript + Vite public and admin UI.
- Calls backend JSON routes through Nginx.
- Renders catalog, auth, wishlist, alerts, and admin workflows.

### Edge/Web Component

- Nginx handles HTTP ingress and forwards PHP requests to CI4 app.
- Provides the application boundary between browser and backend runtime.

### Backend Component

- CodeIgniter 4 controllers expose route families: public, auth, user, admin, buy-flow, email-link.
- Services apply business rules: eligibility, redirects, alert lifecycle/evaluation, admin lifecycle/audit.
- Models/query builders persist and read MariaDB state.

### Data Component

- MariaDB stores core catalog, observations, buy-flow events, account/session records, wishlist, alerts, notification/link events, and admin audit logs.

### Email Provider Boundary

- In current scope, outbound email records are written to local persistence (`outbound_emails`) as mock delivery behavior.
- External SMTP provider remains a deployment boundary and integration point, but real provider telemetry is out of scope.

## Deployment View (Local Docker)

Nodes:
- Browser/client (outside Docker network)
- `frontend` container (Vite dev server for local development)
- `nginx` container (HTTP entrypoint)
- `app` container (PHP-FPM + CodeIgniter)
- `db` container (MariaDB)
- `phpmyadmin` container (optional admin tool)

Connections:
1. Browser -> `frontend` for local UI development (`http://localhost:5173`).
2. Browser/API clients -> `nginx` (`http://localhost`) for backend endpoints.
3. `nginx` -> `app` for PHP request handling.
4. `app` -> `db` for persistence.
5. `phpmyadmin` -> `db` for local database inspection.

Data/Trust boundaries:
- Browser is untrusted input boundary.
- Backend validates request input, auth state, admin access, and redirect safety.
- Database is trusted persistence for history-preserving records.
