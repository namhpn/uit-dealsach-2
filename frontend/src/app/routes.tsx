import { createBrowserRouter } from "react-router";
import Root from "./Root";
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SearchPage from "./pages/SearchPage";
import WishlistPage from "./pages/WishlistPage";
import AlertsPage from "./pages/AlertsPage";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminAlertsPage from "./pages/AdminAlertsPage";
import AdminAuditPage from "./pages/AdminAuditPage";

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
      { path: "admin", Component: AdminPage },
      { path: "admin/users", Component: AdminUsersPage },
      { path: "admin/alerts", Component: AdminAlertsPage },
      { path: "admin/audit", Component: AdminAuditPage },
    ],
  },
]);
