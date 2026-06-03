import { createBrowserRouter } from "react-router";
import Root from "./Root";
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SearchPage from "./pages/SearchPage";
import WishlistPage from "./pages/WishlistPage";
import AlertsPage from "./pages/AlertsPage";
import AccountPage from "./pages/AccountPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminAlertsPage from "./pages/AdminAlertsPage";
import AdminAuditPage from "./pages/AdminAuditPage";
import AdminBooksPage from "./pages/AdminBooksPage";
import AdminBookDetailPage from "./pages/AdminBookDetailPage";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminMerchantsPage from "./pages/AdminMerchantsPage";
import AdminOffersPage from "./pages/AdminOffersPage";
import AdminRetailersPage from "./pages/AdminRetailersPage";
import NotFoundPage from "./pages/NotFoundPage";
import RouteErrorPage from "./pages/RouteErrorPage";

const routeErrorElement = <RouteErrorPage />;

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    errorElement: routeErrorElement,
    children: [
      { index: true, Component: HomePage, errorElement: routeErrorElement },
      { path: "search", Component: SearchPage, errorElement: routeErrorElement },
      { path: "book/:id", Component: ProductDetailPage, errorElement: routeErrorElement },
      { path: "wishlist", Component: WishlistPage, errorElement: routeErrorElement },
      { path: "alerts", Component: AlertsPage, errorElement: routeErrorElement },
      { path: "account", Component: AccountPage, errorElement: routeErrorElement },
      { path: "admin", Component: AdminDashboardPage, errorElement: routeErrorElement },
      { path: "admin/dashboard", Component: AdminDashboardPage, errorElement: routeErrorElement },
      { path: "admin/users", Component: AdminUsersPage, errorElement: routeErrorElement },
      { path: "admin/books", Component: AdminBooksPage, errorElement: routeErrorElement },
      { path: "admin/categories", Component: AdminCategoriesPage, errorElement: routeErrorElement },
      { path: "admin/retailers", Component: AdminRetailersPage, errorElement: routeErrorElement },
      { path: "admin/merchants", Component: AdminMerchantsPage, errorElement: routeErrorElement },
      { path: "admin/offers", Component: AdminOffersPage, errorElement: routeErrorElement },
      { path: "admin/offers/:id", Component: AdminBookDetailPage, errorElement: routeErrorElement },
      { path: "admin/alerts", Component: AdminAlertsPage, errorElement: routeErrorElement },
      { path: "admin/audit", Component: AdminAuditPage, errorElement: routeErrorElement },
      { path: "*", Component: NotFoundPage, errorElement: routeErrorElement },
    ],
  },
]);
