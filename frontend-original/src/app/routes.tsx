import { createBrowserRouter } from "react-router";
import Root from "./Root";
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SearchResultPage from "./pages/SearchResultPage";
import WishlistPage from "./pages/WishlistPage";
import AlertPage from "./pages/AlertPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "book/:id", Component: ProductDetailPage },
      { path: "search", Component: SearchResultPage },
      { path: "wishlist", Component: WishlistPage },
      { path: "alerts", Component: AlertPage },
    ],
  },
]);
