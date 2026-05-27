#!/bin/sh
set -e

writable_dir="/var/www/html/backend/writable"

if [ -d "$writable_dir" ]; then
    mkdir -p \
        "$writable_dir/cache" \
        "$writable_dir/debugbar" \
        "$writable_dir/logs" \
        "$writable_dir/session" \
        "$writable_dir/uploads"
    chown -R www-data:www-data "$writable_dir"
fi

exec docker-php-entrypoint "$@"
