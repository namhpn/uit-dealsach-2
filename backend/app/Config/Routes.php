<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');
$routes->get('go/offers/(:num)', 'BuyFlowController::offer/$1');

$routes->group('api/public', static function (RouteCollection $routes): void {
    $routes->get('books', 'PublicCatalogController::books');
    $routes->get('books/(:num)', 'PublicCatalogController::book/$1');
    $routes->get('discovery', 'PublicCatalogController::discovery');
    $routes->get('filters', 'PublicCatalogController::filters');
});

$routes->group('api/auth', static function (RouteCollection $routes): void {
    $routes->post('email-code/request', 'AuthController::requestEmailCode');
    $routes->post('email-code/verify', 'AuthController::verifyEmailCode');
    $routes->get('me', 'AuthController::me');
    $routes->post('logout', 'AuthController::logout');
});

$routes->group('api/user', static function (RouteCollection $routes): void {
    $routes->get('wishlist', 'WishlistController::index');
    $routes->get('wishlist/books/(:num)', 'WishlistController::status/$1');
    $routes->post('wishlist/books/(:num)', 'WishlistController::add/$1');
    $routes->delete('wishlist/books/(:num)', 'WishlistController::remove/$1');
    $routes->get('alerts', 'PriceAlertController::index');
    $routes->get('alerts/(:num)', 'PriceAlertController::show/$1');
    $routes->post('alerts', 'PriceAlertController::create');
    $routes->patch('alerts/(:num)', 'PriceAlertController::update/$1');
    $routes->post('alerts/(:num)/pause', 'PriceAlertController::pause/$1');
    $routes->post('alerts/(:num)/reactivate', 'PriceAlertController::reactivate/$1');
    $routes->post('alerts/(:num)/renew', 'PriceAlertController::renew/$1');
    $routes->post('alerts/(:num)/restart-tracking', 'PriceAlertController::restartTracking/$1');
    $routes->post('alerts/(:num)/disable', 'PriceAlertController::disable/$1');
    $routes->get('alert-preferences', 'AlertPreferenceController::show');
    $routes->patch('alert-preferences', 'AlertPreferenceController::update');
});
