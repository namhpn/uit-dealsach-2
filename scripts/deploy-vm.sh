#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

NGINX_CONTAINER_NAME="ds_backend"
FRONTEND_DEV_CONTAINER_NAME="ds_frontend"
TUNNEL_NETWORK_NAME="tunnel"

connect_container_to_network() {
  local container_name="$1"
  local network_name="$2"

  if ! docker ps -a --format '{{.Names}}' | grep -Fxq "$container_name"; then
    echo "Container '$container_name' does not exist."
    exit 1
  fi

  if docker inspect "$container_name" \
    --format '{{json .NetworkSettings.Networks}}' \
    | grep -q "\"$network_name\""; then
    echo "Container '$container_name' is already connected to network '$network_name'."
  else
    echo "Connecting '$container_name' to network '$network_name'..."
    docker network connect "$network_name" "$container_name"
  fi
}

cleanup_existing_stack() {
  echo "Stopping existing Docker Compose stack and removing volumes..."
  docker compose down -v --remove-orphans || true

  echo "Removing stale frontend container '$FRONTEND_DEV_CONTAINER_NAME'..."
  docker rm -f "$FRONTEND_DEV_CONTAINER_NAME" >/dev/null 2>&1 || true
}

cleanup_existing_stack

echo "Installing backend dependencies..."
docker compose run --rm app sh -lc 'cd backend && php ../composer.phar install'

echo "Installing frontend dependencies..."
docker compose run --rm frontend npm install

echo "Building and starting Docker stack..."
docker compose up -d --build

echo "Running database migrations..."
docker compose run --rm app sh -lc 'cd backend && php spark migrate'

echo "Running demo seeder..."
docker compose run --rm app sh -lc 'cd backend && php spark db:seed DealSachDemoSeeder'

echo "Restarting frontend dev server..."
docker compose rm -sf frontend || true
docker rm -f "$FRONTEND_DEV_CONTAINER_NAME" >/dev/null 2>&1 || true

docker compose run -d \
  --name "$FRONTEND_DEV_CONTAINER_NAME" \
  --service-ports \
  frontend \
  npm run dev -- --host 0.0.0.0

echo "Ensuring Docker network '$TUNNEL_NETWORK_NAME' exists..."
docker network inspect "$TUNNEL_NETWORK_NAME" >/dev/null 2>&1 \
  || docker network create "$TUNNEL_NETWORK_NAME"

echo "Connecting deployment containers to '$TUNNEL_NETWORK_NAME'..."
connect_container_to_network "$NGINX_CONTAINER_NAME" "$TUNNEL_NETWORK_NAME"
connect_container_to_network "$FRONTEND_DEV_CONTAINER_NAME" "$TUNNEL_NETWORK_NAME"

echo "Deployment containers:"
docker compose ps
docker ps --filter "name=$FRONTEND_DEV_CONTAINER_NAME"
docker network inspect "$TUNNEL_NETWORK_NAME" \
  --format '{{range $id, $container := .Containers}}{{println $container.Name}}{{end}}'
