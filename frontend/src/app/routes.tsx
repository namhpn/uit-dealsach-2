import { createBrowserRouter } from "react-router";
import Root from "./Root";
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SearchPage from "./pages/SearchPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "search", Component: SearchPage },
      { path: "book/:id", Component: ProductDetailPage },
    ],
  },
]);
