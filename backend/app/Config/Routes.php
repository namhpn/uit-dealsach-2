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
