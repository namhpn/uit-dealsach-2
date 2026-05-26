export const PRICE_DISCLAIMER = "Giá tham khảo được ghi nhận gần đây, vui lòng kiểm tra lại tại nơi bán trước khi mua.";

const API_ORIGIN =
  typeof window !== "undefined" && window.location.port === "5173"
    ? "http://localhost"
    : "";

export type BookStatusValue =
  | "available_now"
  | "missing_valid_seller_link"
  | "temporarily_unavailable"
  | "stale_reference"
  | "no_tracked_offer";

export interface BookCardDto {
  id: number;
  title: string;
  author: string;
  publisher: string;
  category: string;
  category_slug: string;
  isbn: string | null;
  cover_image: string | null;
  is_featured: boolean;
  offer_count: number;
  lowest_eligible_price: number | null;
  status: { value: BookStatusValue; label: string };
  price_disclaimer: string;
  price_drop?: {
    amount: number;
    from_price: number;
    to_price: number;
    date: string;
  };
  popular_clicked_deal?: {
    redirect_count_7d: number;
    top_retailer: { name: string; redirect_count_7d: number } | null;
  };
}

export interface DiscoverySection {
  title: string;
  items: BookCardDto[];
  empty_state: string | null;
}

export interface DiscoveryResponse {
  featured_books: DiscoverySection;
  recent_price_drops: DiscoverySection;
  popular_clicked_deals: DiscoverySection;
  price_disclaimer: string;
}

export interface FilterOption {
  id?: number;
  name?: string;
  slug?: string;
  value?: string;
  label?: string;
}

export interface FiltersResponse {
  categories: Required<Pick<FilterOption, "id" | "name" | "slug">>[];
  authors: string[];
  publishers: string[];
  retailers: Required<Pick<FilterOption, "id" | "name" | "slug">>[];
  availability: Required<Pick<FilterOption, "value" | "label">>[];
  sorts: Required<Pick<FilterOption, "value" | "label">>[];
}

export interface PaginatedBooksResponse {
  items: BookCardDto[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  sort: string;
  price_disclaimer: string;
  empty_state: { message: string } | null;
}

export interface BookDetailResponse {
  book: {
    id: number;
    title: string;
    author: string;
    publisher: string;
    category: string;
    category_slug: string;
    isbn: string | null;
    description: string | null;
    cover_image: string | null;
    is_featured: boolean;
  };
  summary: {
    lowest_eligible_price: number | null;
    offer_count: number;
    status: { value: BookStatusValue; label: string };
    price_disclaimer: string;
    affiliate_disclosure: string;
  };
  offers: OfferGroups;
  price_history: PriceHistoryPoint[];
}

export interface OfferDto {
  id: number;
  title: string;
  retailer: { id: number; name: string; slug: string };
  merchant: { id: number; name: string; slug: string };
  latest_price: number | null;
  last_available_price: number | null;
  availability: string;
  status_label: string;
  buy_action: {
    available: boolean;
    method: "affiliate_redirect";
    offer_id: number;
    url: string;
    label: string;
    disclosure: string;
  } | null;
  price_disclaimer: string;
}

export interface OfferGroups {
  purchasable: OfferDto[];
  unavailable: OfferDto[];
  stale_reference: OfferDto[];
  missing_valid_seller_link: OfferDto[];
}

export interface PriceHistoryPoint {
  date: string;
  lowest_price: number;
}

interface ApiEnvelope<T> {
  status: "success" | "error";
  message: string;
  data: T;
  errors: Record<string, string> | null;
}

export async function fetchDiscovery(): Promise<DiscoveryResponse> {
  return apiGet<DiscoveryResponse>("/api/public/discovery");
}

export async function fetchFilters(): Promise<FiltersResponse> {
  return apiGet<FiltersResponse>("/api/public/filters");
}

export async function fetchBooks(params: URLSearchParams): Promise<PaginatedBooksResponse> {
  const query = params.toString();
  return apiGet<PaginatedBooksResponse>(`/api/public/books${query ? `?${query}` : ""}`);
}

export async function fetchBookDetail(bookId: string): Promise<BookDetailResponse> {
  return apiGet<BookDetailResponse>(`/api/public/books/${bookId}`);
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    headers: { Accept: "application/json" },
  });
  const body = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || body.status !== "success") {
    throw new Error(body.message || "Không thể tải dữ liệu DealSach.");
  }

  return body.data;
}

export function formatVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function apiErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Không thể tải dữ liệu. Vui lòng thử lại sau.";
}

export function coverFallback(title: string): string {
  return title.slice(0, 2).toUpperCase();
}
