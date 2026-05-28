import { createBrowserRouter } from "react-router";
import Root from "./Root";
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SearchPage from "./pages/SearchPage";
import WishlistPage from "./pages/WishlistPage";
import AlertsPage from "./pages/AlertsPage";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminAlertsPage from "./pages/AdminAlertsPage";
import AdminAuditPage from "./pages/AdminAuditPage";
import AdminBooksPage from "./pages/AdminBooksPage";
import AdminBookDetailPage from "./pages/AdminBookDetailPage";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminMerchantsPage from "./pages/AdminMerchantsPage";
import AdminOffersPage from "./pages/AdminOffersPage";
import AdminRetailersPage from "./pages/AdminRetailersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "search", Component: SearchPage },
      { path: "book/:id", Component: ProductDetailPage },
      { path: "wishlist", Component: WishlistPage },
      { path: "alerts", Component: AlertsPage },
      { path: "account", Component: AccountPage },
      { path: "admin", Component: AdminDashboardPage },
      { path: "admin/dashboard", Component: AdminDashboardPage },
      { path: "admin/reports", Component: AdminReportsPage },
      { path: "admin/menu", Component: AdminPage },
      { path: "admin/users", Component: AdminUsersPage },
      { path: "admin/books", Component: AdminBooksPage },
      { path: "admin/categories", Component: AdminCategoriesPage },
      { path: "admin/retailers", Component: AdminRetailersPage },
      { path: "admin/merchants", Component: AdminMerchantsPage },
      { path: "admin/offers", Component: AdminOffersPage },
      { path: "admin/offers/:id", Component: AdminBookDetailPage },
      { path: "admin/alerts", Component: AdminAlertsPage },
      { path: "admin/audit", Component: AdminAuditPage },
    ],
  },
]);
