#!/bin/sh
set -e

# Render tells us which port to listen on
PORT=${PORT:-10000}
sed -ri "s/Listen [0-9]+/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:[0-9]+>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

php artisan config:cache
php artisan migrate --force
php artisan db:seed --class=ProductionSeeder --force

exec apache2-foreground