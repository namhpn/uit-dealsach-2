FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
    git \
    icu-dev \
    libintl \
    unzip

RUN docker-php-ext-install \
    intl \
    mysqli \
    pdo_mysql

RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

WORKDIR /var/www/html

COPY composer.phar /usr/local/bin/composer
RUN chmod +x /usr/local/bin/composer

COPY backend/composer.json backend/composer.lock ./backend/
RUN cd backend && composer install --no-interaction --prefer-dist --optimize-autoloader

COPY backend ./backend
RUN chown -R www-data:www-data backend/writable

COPY docker/php-entrypoint.sh /usr/local/bin/dealsach-php-entrypoint
RUN chmod +x /usr/local/bin/dealsach-php-entrypoint

ENTRYPOINT ["dealsach-php-entrypoint"]
CMD ["php-fpm"]
