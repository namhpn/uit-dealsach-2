# Repo Current State

Last updated: 2026-05-26

## Current Branch

`docs/t0000-capture-baseline-state`

Baseline source branch before ticket work: `main` was clean and ahead of `origin/main` by 1 commit.

## Completed Tickets

| Ticket | Date | Summary |
|---|---:|---|
| T0000 | 2026-05-26 | Captured baseline folder structure, scripts, dependency state, and build/test results without changing application behavior. |

## Current Folder Structure

Top-level folders and key project areas observed:

```text
.
├── .codex/
│   └── skills/
├── backend/
│   ├── app/
│   │   ├── Config/
│   │   ├── Controllers/
│   │   ├── Database/
│   │   ├── Filters/
│   │   ├── Helpers/
│   │   ├── Language/
│   │   ├── Libraries/
│   │   ├── Models/
│   │   ├── ThirdParty/
│   │   └── Views/
│   ├── public/
│   ├── tests/
│   ├── vendor/
│   └── writable/
├── database/
├── docker/
│   └── nginx/
├── docs/
│   ├── frontend/
│   └── templates/
└── frontend/
    └── src/
        ├── app/
        └── styles/
```

Important root files:

```text
AGENTS.md
Dockerfile
composer.phar
docker-compose.yml
```

## Tech Stack

Frontend:

* React
* TypeScript
* Vite
* Tailwind CSS
* Radix UI primitives
* Lucide React
* Recharts

Backend:

* CodeIgniter 4 app starter
* PHP 8.2
* PHPUnit 10
* MariaDB through Docker Compose

Runtime:

* Docker Compose
* PHP-FPM
* Nginx
* MariaDB
* phpMyAdmin

## Installed Dependencies

### Frontend

Observed state:

* `frontend/package.json` exists.
* `frontend/node_modules/` is not present.
* `frontend/package-lock.json` is not present.
* `frontend/pnpm-lock.yaml` is not present.
* `frontend/pnpm-workspace.yaml` exists.

No frontend dependencies were installed during T0000.

### Backend

Observed state:

* `backend/composer.json` exists.
* `backend/composer.lock` exists.
* `backend/vendor/` exists.
* `backend/.env` exists.

Docker image build also runs `composer install` from the existing backend lockfile.

## Available Scripts / Commands

### Frontend

Declared in `frontend/package.json`:

```bash
npm run build
npm run dev
```

Documented setup command:

```bash
cd frontend
npm install
```

### Backend

Declared in `backend/composer.json`:

```bash
composer test
```

Documented Docker commands:

```bash
docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php ../composer.phar install'
docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php spark list'
docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php spark migrate'
docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'
docker compose --env-file backend/.env up -d --build
docker compose --env-file backend/.env down
```

### Docker Services

`docker compose --env-file backend/.env config --services` reports:

```text
db
app
nginx
phpmyadmin
```

## Build/Test Status

| Area | Command | Last Result | Notes |
|---|---|---|---|
| Frontend | `npm run build` from `frontend/` | Failed | `vite: command not found` because `frontend/node_modules/` is absent. |
| Backend | `docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php spark list'` | Passed | CodeIgniter v4.7.3 command list loads successfully in Docker. |
| Backend | `docker compose --env-file backend/.env run --rm app sh -lc 'cd backend && php vendor/bin/phpunit'` | Failed with warning | 5 tests and 7 assertions pass, but command exits non-zero because PHPUnit reports `No code coverage driver available`. |
| Docker | `docker compose --env-file backend/.env up -d --build` | Passed | App image built and services started. |

## Manual Verification Performed

1. Inspected required project documentation and ticket scope.
2. Verified actual folder structure under `backend/`, `frontend/`, `docs/`, `docker/`, and `database/`.
3. Verified frontend script declarations from `frontend/package.json`.
4. Verified backend dependency and script declarations from `backend/composer.json`.
5. Checked frontend dependency state without installing packages.
6. Checked backend dependency state without changing Composer files.
7. Ran frontend build command and recorded the dependency failure.
8. Ran CodeIgniter Spark command discovery through Docker.
9. Ran backend PHPUnit suite through Docker and recorded the coverage-driver warning.
10. Built and started the Docker stack with the documented Compose command.
11. Stopped the Docker stack with `docker compose --env-file backend/.env down` after verification.

Browser/UI verification was not performed because T0000 is a repo baseline ticket and the frontend cannot build or run without installing dependencies.

## Known Issues

See `docs/Known_Issues_And_Followups.md`.

## Next Recommended Ticket

T0001 — Verify project skeleton builds.
