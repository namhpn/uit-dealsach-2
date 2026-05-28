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
  | "no_tracked_offer"
  | "archived";

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
  wishlisted?: boolean;
  archived?: boolean;
  added_at?: string;
  wishlist_item_id?: number;
}

export interface CurrentUserDto {
  id: number;
  email: string;
  role: "registered" | "admin";
  status: "active" | "deactivated";
  alert_email_enabled: boolean;
}

export interface AuthStateDto {
  authenticated: boolean;
  user: CurrentUserDto | null;
}

export interface WishlistStatusDto {
  book_id: number;
  wishlisted: boolean;
}

export interface WishlistListResponse {
  items: BookCardDto[];
}

export type PriceAlertType = "target_price" | "new_lowest_price";
export type PriceAlertStatus = "Active" | "Paused" | "Auto-paused" | "Expired" | "Disabled";

export interface PriceAlertBookDto {
  id: number;
  title: string;
  author: string;
  publisher: string;
  category_name: string;
  category_slug: string;
  cover_image: string | null;
}

export interface PriceAlertEventDto {
  id: number;
  event_type: string;
  previous_status: PriceAlertStatus | null;
  new_status: PriceAlertStatus | null;
  summary: Record<string, unknown> | null;
  created_at: string;
}

export interface PriceAlertDto {
  id: number;
  book_id: number;
  book: PriceAlertBookDto | null;
  alert_type: PriceAlertType;
  status: PriceAlertStatus;
  target_price: number | null;
  baseline_price: number | null;
  baseline_pending: boolean;
  comparison_price: number | null;
  last_notified_price: number | null;
  notification_count: number;
  expires_at: string;
  current_lowest_eligible_price: { price: number; offer_count: number } | null;
  alert_emails_enabled: boolean;
  recent_events: PriceAlertEventDto[];
  created_at: string;
  updated_at: string;
}

export interface PriceAlertListResponse {
  items: PriceAlertDto[];
}

export interface AlertPreferenceDto {
  alert_emails_enabled: boolean;
}

export interface AdminUserDto {
  id: number;
  email: string;
  role: "registered" | "admin";
  status: "active" | "deactivated";
  alert_email_enabled: boolean;
  wishlist_count: number;
  alert_count: number;
  active_alert_count: number;
  active_session_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AdminAlertDto {
  id: number;
  user_id: number;
  user_email: string;
  book_id: number;
  book_title: string;
  alert_type: PriceAlertType;
  status: PriceAlertStatus;
  target_price: number | null;
  notification_count: number;
  expires_at: string;
  recent_events: PriceAlertEventDto[];
  created_at: string;
  updated_at: string;
}

export interface AdminAuditLogDto {
  id: number;
  admin_user_id: number | null;
  actor_email: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  summary: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminCategoryDto {
  id: number;
  name: string;
  slug: string;
  display_label: string | null;
  display_description: string | null;
  display_order: number;
  status: "active" | "archived";
  book_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AdminBookDto {
  id: number;
  title: string;
  author: string;
  publisher: string;
  isbn: string | null;
  description: string | null;
  cover_image: string | null;
  primary_category_id: number;
  category: { id: number; name: string; slug: string; status: string };
  is_featured: boolean;
  status: "active" | "archived";
  offer_count?: number;
  active_alert_count?: number;
  wishlist_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AdminRetailerDto {
  id: number;
  name: string;
  slug: string;
  approved_domains: string[];
  status: "active" | "archived";
  merchant_count?: number;
  offer_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AdminMerchantDto {
  id: number;
  retailer_platform_id: number;
  name: string;
  slug: string;
  status: "active" | "archived";
  retailer: { id: number; name: string; slug: string; status: string };
  offer_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AdminObservationDto {
  id: number;
  offer_id: number;
  observation_cycle_id: number;
  cycle_date: string;
  observed_at: string;
  availability_status: "available" | "unavailable";
  listed_item_price: number | null;
  book_status_at_observation: string;
  offer_status_at_observation: string;
  retailer_status_at_observation: string;
  merchant_status_at_observation: string;
  merchant_retailer_consistent_at_observation: boolean;
  destination_status_at_observation: string;
}

export interface AdminOfferDto {
  id: number;
  book_id: number;
  book_title: string;
  retailer_platform_id: number;
  retailer_name: string;
  merchant_id: number;
  merchant_name: string;
  external_offer_title: string;
  affiliate_destination_url: string | null;
  destination_status: "valid" | "missing" | "invalid";
  status: "pending_review" | "active" | "unavailable" | "inactive" | "removed_invalid";
  latest_observation: { observed_at: string; availability_status: string; listed_item_price: number | null } | null;
  eligibility_review: { purchasable: boolean; reasons: string[] };
  observations?: AdminObservationDto[];
  created_at: string;
  updated_at: string;
}

export interface AdminDashboardSummaryCardDto {
  key: string;
  label: string;
  value: number;
}

export interface AdminDashboardDto {
  window: {
    label: string;
    timezone: string;
    days: number;
    start: string;
    end: string;
  };
  summary_cards: AdminDashboardSummaryCardDto[];
  affiliate_redirects: {
    total: number;
    by_book: { book_id: number; book_title: string; archived: boolean; redirect_count: number }[];
    by_retailer: { retailer_platform_id: number; retailer_name: string; archived: boolean; redirect_count: number }[];
  };
  email_engagement: {
    total: number;
    by_book_and_alert_type: { book_id: number; book_title: string; archived: boolean; alert_type: PriceAlertType; click_count: number }[];
  };
  redirect_failures: {
    total: number;
    by_reason: { failure_reason: string; failure_count: number }[];
    by_offer: { offer_id: number; book_id: number; book_title: string; book_archived: boolean; offer_title: string; offer_status: string; failure_count: number }[];
  };
  alerts: {
    status_counts: { status: PriceAlertStatus; count: number }[];
    evaluable_count: number;
    email_suppressed_active_count: number;
    email_sent_count: number;
    email_failed_count: number;
  };
  price_changes: {
    items: {
      book_id: number;
      book_title: string;
      archived: boolean;
      latest_price: number | null;
      previous_price: number | null;
      change_amount: number | null;
      latest_observed_at: string | null;
      previous_observed_at: string | null;
      status: "comparable" | "not_enough_data";
    }[];
  };
  audit: {
    mutation_count: number;
    recent_entries: {
      id: number;
      admin_user_id: number | null;
      actor_email: string;
      action_type: string;
      entity_type: string;
      entity_id: string;
      summary: string;
      created_at: string;
    }[];
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
  display_label?: string | null;
  display_description?: string | null;
  display_order?: number;
  value?: string;
  label?: string;
}

export interface CategoryFilterDto {
  id: number;
  name: string;
  slug: string;
  display_label: string | null;
  display_description: string | null;
  display_order: number;
}

export interface FiltersResponse {
  categories: CategoryFilterDto[];
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

export async function requestEmailCode(email: string): Promise<{ email: string; resent_after_seconds: number }> {
  return apiRequest("/api/auth/email-code/request", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ email }),
  });
}

export async function verifyEmailCode(email: string, code: string): Promise<{ user: CurrentUserDto; session_expires_at: string }> {
  return apiRequest("/api/auth/email-code/verify", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ email, code }),
  });
}

export async function fetchCurrentUser(): Promise<AuthStateDto> {
  return apiRequest("/api/auth/me", { credentials: "include" });
}

export async function logoutCurrentUser(): Promise<AuthStateDto> {
  return apiRequest("/api/auth/logout", { method: "POST", credentials: "include" });
}

export async function fetchWishlist(): Promise<WishlistListResponse> {
  return apiRequest("/api/user/wishlist", { credentials: "include" });
}

export async function fetchWishlistStatus(bookId: number): Promise<WishlistStatusDto> {
  return apiRequest(`/api/user/wishlist/books/${bookId}`, { credentials: "include" });
}

export async function addWishlistBook(bookId: number): Promise<WishlistStatusDto> {
  return apiRequest(`/api/user/wishlist/books/${bookId}`, { method: "POST", credentials: "include" });
}

export async function removeWishlistBook(bookId: number): Promise<WishlistStatusDto> {
  return apiRequest(`/api/user/wishlist/books/${bookId}`, { method: "DELETE", credentials: "include" });
}

export async function fetchPriceAlerts(): Promise<PriceAlertListResponse> {
  return apiRequest("/api/user/alerts", { credentials: "include" });
}

export async function fetchPriceAlert(alertId: number): Promise<PriceAlertDto> {
  return apiRequest(`/api/user/alerts/${alertId}`, { credentials: "include" });
}

export async function createPriceAlert(payload: { book_id: number; alert_type: PriceAlertType; target_price?: number }): Promise<PriceAlertDto> {
  return apiRequest("/api/user/alerts", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export async function updatePriceAlertTarget(alertId: number, targetPrice: number): Promise<PriceAlertDto> {
  return apiRequest(`/api/user/alerts/${alertId}`, {
    method: "PATCH",
    credentials: "include",
    body: JSON.stringify({ target_price: targetPrice }),
  });
}

export async function pausePriceAlert(alertId: number): Promise<PriceAlertDto> {
  return alertAction(alertId, "pause");
}

export async function reactivatePriceAlert(alertId: number): Promise<PriceAlertDto> {
  return alertAction(alertId, "reactivate");
}

export async function renewPriceAlert(alertId: number): Promise<PriceAlertDto> {
  return alertAction(alertId, "renew");
}

export async function restartPriceAlertTracking(alertId: number): Promise<PriceAlertDto> {
  return alertAction(alertId, "restart-tracking");
}

export async function disablePriceAlert(alertId: number): Promise<PriceAlertDto> {
  return alertAction(alertId, "disable");
}

export async function fetchAlertPreferences(): Promise<AlertPreferenceDto> {
  return apiRequest("/api/user/alert-preferences", { credentials: "include" });
}

export async function updateAlertPreferences(alertEmailsEnabled: boolean): Promise<AlertPreferenceDto> {
  return apiRequest("/api/user/alert-preferences", {
    method: "PATCH",
    credentials: "include",
    body: JSON.stringify({ alert_emails_enabled: alertEmailsEnabled }),
  });
}

export async function fetchAdminUsers(params = new URLSearchParams()): Promise<{ items: AdminUserDto[] }> {
  const query = params.toString();
  return apiRequest(`/api/admin/users${query ? `?${query}` : ""}`, { credentials: "include" });
}

export async function deactivateAdminUser(userId: number): Promise<AdminUserDto> {
  return apiRequest(`/api/admin/users/${userId}/deactivate`, { method: "POST", credentials: "include" });
}

export async function reactivateAdminUser(userId: number): Promise<AdminUserDto> {
  return apiRequest(`/api/admin/users/${userId}/reactivate`, { method: "POST", credentials: "include" });
}

export async function fetchAdminAlerts(): Promise<{ items: AdminAlertDto[] }> {
  return apiRequest("/api/admin/alerts", { credentials: "include" });
}

export async function disableAdminAlert(alertId: number): Promise<AdminAlertDto> {
  return apiRequest(`/api/admin/alerts/${alertId}/disable`, { method: "POST", credentials: "include" });
}

export async function fetchAdminAuditLogs(): Promise<{ items: AdminAuditLogDto[] }> {
  return apiRequest("/api/admin/audit", { credentials: "include" });
}

export async function fetchAdminDashboard(): Promise<AdminDashboardDto> {
  return apiRequest("/api/admin/dashboard", { credentials: "include" });
}

export async function fetchAdminCategories(): Promise<{ items: AdminCategoryDto[] }> {
  return apiRequest("/api/admin/categories", { credentials: "include" });
}

export async function createAdminCategory(payload: Partial<AdminCategoryDto>): Promise<AdminCategoryDto> {
  return apiRequest("/api/admin/categories", { method: "POST", credentials: "include", body: JSON.stringify(payload) });
}

export async function updateAdminCategory(id: number, payload: Partial<AdminCategoryDto>): Promise<AdminCategoryDto> {
  return apiRequest(`/api/admin/categories/${id}`, { method: "PATCH", credentials: "include", body: JSON.stringify(payload) });
}

export async function archiveAdminCategory(id: number): Promise<AdminCategoryDto> {
  return apiRequest(`/api/admin/categories/${id}/archive`, { method: "POST", credentials: "include" });
}

export async function restoreAdminCategory(id: number): Promise<AdminCategoryDto> {
  return apiRequest(`/api/admin/categories/${id}/restore`, { method: "POST", credentials: "include" });
}

export async function fetchAdminBooks(): Promise<{ items: AdminBookDto[] }> {
  return apiRequest("/api/admin/books", { credentials: "include" });
}

export async function createAdminBook(payload: Partial<AdminBookDto>): Promise<AdminBookDto> {
  return apiRequest("/api/admin/books", { method: "POST", credentials: "include", body: JSON.stringify(payload) });
}

export async function updateAdminBook(id: number, payload: Partial<AdminBookDto>): Promise<AdminBookDto> {
  return apiRequest(`/api/admin/books/${id}`, { method: "PATCH", credentials: "include", body: JSON.stringify(payload) });
}

export async function archiveAdminBook(id: number): Promise<AdminBookDto> {
  return apiRequest(`/api/admin/books/${id}/archive`, { method: "POST", credentials: "include" });
}

export async function restoreAdminBook(id: number): Promise<AdminBookDto> {
  return apiRequest(`/api/admin/books/${id}/restore`, { method: "POST", credentials: "include" });
}

export async function fetchAdminRetailers(): Promise<{ items: AdminRetailerDto[] }> {
  return apiRequest("/api/admin/retailers", { credentials: "include" });
}

export async function createAdminRetailer(payload: Partial<AdminRetailerDto>): Promise<AdminRetailerDto> {
  return apiRequest("/api/admin/retailers", { method: "POST", credentials: "include", body: JSON.stringify(payload) });
}

export async function updateAdminRetailer(id: number, payload: Partial<AdminRetailerDto>): Promise<AdminRetailerDto> {
  return apiRequest(`/api/admin/retailers/${id}`, { method: "PATCH", credentials: "include", body: JSON.stringify(payload) });
}

export async function archiveAdminRetailer(id: number): Promise<AdminRetailerDto> {
  return apiRequest(`/api/admin/retailers/${id}/archive`, { method: "POST", credentials: "include" });
}

export async function restoreAdminRetailer(id: number): Promise<AdminRetailerDto> {
  return apiRequest(`/api/admin/retailers/${id}/restore`, { method: "POST", credentials: "include" });
}

export async function fetchAdminMerchants(): Promise<{ items: AdminMerchantDto[] }> {
  return apiRequest("/api/admin/merchants", { credentials: "include" });
}

export async function createAdminMerchant(payload: Partial<AdminMerchantDto>): Promise<AdminMerchantDto> {
  return apiRequest("/api/admin/merchants", { method: "POST", credentials: "include", body: JSON.stringify(payload) });
}

export async function updateAdminMerchant(id: number, payload: Partial<AdminMerchantDto>): Promise<AdminMerchantDto> {
  return apiRequest(`/api/admin/merchants/${id}`, { method: "PATCH", credentials: "include", body: JSON.stringify(payload) });
}

export async function archiveAdminMerchant(id: number): Promise<AdminMerchantDto> {
  return apiRequest(`/api/admin/merchants/${id}/archive`, { method: "POST", credentials: "include" });
}

export async function restoreAdminMerchant(id: number): Promise<AdminMerchantDto> {
  return apiRequest(`/api/admin/merchants/${id}/restore`, { method: "POST", credentials: "include" });
}

export async function fetchAdminOffers(): Promise<{ items: AdminOfferDto[] }> {
  return apiRequest("/api/admin/offers", { credentials: "include" });
}

export async function fetchAdminOffer(id: number): Promise<AdminOfferDto> {
  return apiRequest(`/api/admin/offers/${id}`, { credentials: "include" });
}

export async function createAdminOffer(payload: Partial<AdminOfferDto>): Promise<AdminOfferDto> {
  return apiRequest("/api/admin/offers", { method: "POST", credentials: "include", body: JSON.stringify(payload) });
}

export async function updateAdminOffer(id: number, payload: Partial<AdminOfferDto>): Promise<AdminOfferDto> {
  return apiRequest(`/api/admin/offers/${id}`, { method: "PATCH", credentials: "include", body: JSON.stringify(payload) });
}

export async function addAdminOfferObservation(id: number, payload: { cycle_date?: string; observed_at?: string; availability_status: string; listed_item_price?: number | null }): Promise<AdminOfferDto> {
  return apiRequest(`/api/admin/offers/${id}/observations`, { method: "POST", credentials: "include", body: JSON.stringify(payload) });
}

function alertAction(alertId: number, action: "pause" | "reactivate" | "renew" | "restart-tracking" | "disable"): Promise<PriceAlertDto> {
  return apiRequest(`/api/user/alerts/${alertId}/${action}`, { method: "POST", credentials: "include" });
}

async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
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

export function formatDateTime(value: string): string {
  const [date, time = ""] = value.split(" ");
  const formattedDate = formatDate(date);
  const formattedTime = time.slice(0, 5);
  return formattedTime ? `${formattedDate} ${formattedTime}` : formattedDate;
}

export function apiErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Không thể tải dữ liệu. Vui lòng thử lại sau.";
}

export function coverFallback(title: string): string {
  return title.slice(0, 2).toUpperCase();
}
