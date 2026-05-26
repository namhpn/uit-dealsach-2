# Repo Current State

Last updated: YYYY-MM-DD

## Current Branch

`main`

## Completed Tickets

| Ticket | Date | Summary |
|---|---:|---|
| - | - | - |

## Current Folder Structure

```text
backend/
frontend/
docs/
docker-compose.yml
AGENTS.md
```

## Tech Stack

Frontend:

* React
* TypeScript
* Vite
* Tailwind CSS

Backend:

* CodeIgniter 4
* PHP 8.2
* MariaDB

Runtime:

* Docker Compose
* Nginx
* PHP-FPM
* phpMyAdmin

## Installed Dependencies

### Frontend

Pending baseline check.

### Backend

Pending baseline check.

## Available Scripts / Commands

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
```

### Backend

```bash
docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php ../composer.phar install'
docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php spark migrate'
docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'
```

## Build/Test Status

| Area     | Command                            | Last Result | Notes           |
| -------- | ---------------------------------- | ----------- | --------------- |
| Frontend | `npm run build`                    | Unknown     | Not yet checked |
| Backend  | `php vendor/bin/phpunit`           | Unknown     | Not yet checked |
| Docker   | `docker compose ... up -d --build` | Unknown     | Not yet checked |

## Known Issues

See `docs/Known_Issues_And_Followups.md`.

## Next Recommended Ticket

T0001 — Capture repo baseline state.
