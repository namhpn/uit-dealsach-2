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
