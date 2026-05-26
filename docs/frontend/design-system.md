# DealSach Frontend Website Design

## 1. Overview

This document defines the DealSach e-commerce and price tracking comparison website.

The website uses React, TypeScript, Vite, Tailwind CSS, Lucide icons, Recharts, Be Vietnam Pro, hard black borders, emerald brand color, sharp cards, Vietnamese copy, product cards, a homepage carousel, price-drop sections, popular deal sections, and a book detail page.

## 2. Product Definition

DealSach is a Vietnamese-first book discovery, price comparison, wishlist, and price alert platform. The site helps users find books, compare last observed listed item prices from external retailers, view price history, save books, create alerts, and leave DealSach through validated affiliate Buy links.

DealSach must never imply that it sells books directly.

Core public disclosure:

> Giá tham khảo được ghi nhận gần đây, vui lòng kiểm tra lại tại nơi bán trước khi mua.

The disclosure must appear near price and Buy areas, not only in the footer.

## 3. UX Direction

The interface should feel familiar to Vietnamese e-commerce users while staying cleaner and more comparison-focused than a marketplace. Use a dense but organized layout: strong search, quick category scanning, visible price, visible offer count, clear seller status, and direct book detail navigation.

The brand style is Neubrutalist:

- Sharp 0px radius components.
- 2px to 4px black borders.
- 4px and 8px hard black shadows.
- Deep emerald primary surfaces.
- Red discount/action emphasis.
- Bone white and warm off-white backgrounds.
- Be Vietnam Pro for all Vietnamese UI text.

Use e-commerce conventions such as prominent search, comparison cards, accessible focus, visible CTAs, no hidden pricing, debounced search, no-results suggestions, and trend history charts without replacing the DealSach brand system.

## 4. Design Tokens

Use this palette as the canonical token set.

| Token | Value | Usage |
| --- | --- | --- |
| `primary` | `#003527` | Logo, primary buttons, highest emphasis |
| `primaryContainer` | `#064e3b` | Hero/banner variant, strong section surfaces |
| `primaryFixed` | `#b0f0d6` | Best-price highlight, success/eligible emphasis |
| `secondary` | `#ba1a1a` | Discount, price-drop, failure/destructive emphasis |
| `surface` | `#fcf9f8` | Page background |
| `surfaceLow` | `#f6f3f2` | Large panels |
| `surfaceContainer` | `#f0eded` | Image placeholders and muted blocks |
| `surfaceVariant` | `#e5e2e1` | Disabled/unavailable blocks |
| `boneWhite` | `#ECE9E2` | Secondary buttons, chips |
| `black` | `#000000` | Borders and hard shadows |

Typography:

- Family: `Be Vietnam Pro`.
- Hero: 40-64px desktop, 32px mobile, weight 800.
- Page headings: 24-40px, weight 700-800.
- Body: 15-16px, weight 400-500, line-height 1.6.
- Labels: 10-14px, weight 700-800, uppercase only for short labels.

Interaction:

- Buttons depress by translating `4px 4px` and removing the hard shadow.
- Hover and focus transitions should stay short: 80-200ms.
- Keyboard focus must be visible with border/shadow change.
- Respect `prefers-reduced-motion`.

## 5. Technical Stack

Use this stack:

- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React icons
- Recharts for price history and Admin reports
- Existing shadcn/Radix UI primitives where useful for dialogs, accordions, selects, drawers, tooltips, tabs, switches, and forms

Implementation conventions:

- Keep shared visual tokens and CSS tokens centralized.
- Use typed props and data models instead of loose object shapes.
- Use `useDeferredValue` or debounced input state for search and filter fields.
- Use `Intl.NumberFormat("vi-VN")` or the existing `fmt` helper for whole-number VND.
- All date display must use `Asia/Ho_Chi_Minh`, `DD/MM/YYYY`, and `DD/MM/YYYY HH:mm` where exact timestamps are allowed.

## 6. Information Architecture

Public routes:

| Route | Purpose |
| --- | --- |
| `/` | Homepage with search, featured books, recent price drops, popular clicked deals |
| `/search` | Search, filters, sorting, pagination |
| `/book/:id` | Book detail, offers, price history, wishlist, alert creation |
| `/redirect-error` | Vietnamese failed/unsafe redirect explanation |
| `/auth` | Email login/register entry |
| `/auth/verify` | One-time code verification |

Registered user routes:

| Route | Purpose |
| --- | --- |
| `/wishlist` | Saved books |
| `/alerts` | Price alert list and status management |
| `/alerts/:id` | Alert detail and history |
| `/account` | Email preferences, alert email suppression, logout |
| `/email-link/:token` | Email deal-link landing before Buy |

Admin routes:

| Route | Purpose |
| --- | --- |
| `/admin` | Last 7 days dashboard |
| `/admin/books` | Book management |
| `/admin/categories` | Category management |
| `/admin/retailers` | Retailer platform management and allowed domains |
| `/admin/merchants` | Merchant management |
| `/admin/books/:id/offers` | Offer management under a book |
| `/admin/users` | User status and alert activity |
| `/admin/alerts` | Alert review and disable actions |
| `/admin/reports` | Affiliate, email, redirect failure, and price change reports |
| `/admin/audit` | Admin mutation history |

Do not add cart, checkout, payment, shipping, order, review, rating, or comment routes.

## 7. Global Layout

### Header

The header is the primary discovery tool.

Required structure:

- DealSach logo at left.
- Large search input centered and visually dominant.
- Category chips below search on desktop and horizontally scrollable on mobile.
- Wishlist, alerts, account, and Admin access as icon buttons where allowed.
- Mobile menu with compact account and navigation actions.

Search behavior:

- Placeholder: `Tìm sách theo tên, tác giả, ISBN...`
- Submit navigates to `/search?q=...`.
- Debounced autocomplete may show title, author, ISBN, and category suggestions.
- Guest users should only see login prompts after attempting wishlist or alert actions.

### Footer

The footer must repeat that DealSach compares prices and redirects to external sellers. It must not imply checkout, payment, delivery, returns, or order support.

Include:

- Discovery links.
- Account links.
- Help/FAQ.
- Disclosure and policy links.
- External-seller reminder.

## 8. Homepage

Homepage goal: immediate book discovery and quick price-comparison confidence.

Section order:

1. Hero/search banner
2. Admin-curated featured books
3. Recent price drops
4. Popular clicked deals
5. Category shelves
6. How DealSach works
7. Disclosure/footer transition

Hero content:

- Headline should clearly say DealSach compares book prices.
- Copy must say users buy from external sellers.
- Primary action: search.
- Secondary action: browse current price drops.

Featured books:

- Use book cards in carousel or grid.
- Show cover, category, title, author, lowest eligible price, original/reference price when available, and offer count.

Recent price drops:

- Rank by largest absolute VND drop in the last 7 days.
- Show price-drop amount prominently.
- Empty state: `Chưa có sách giảm giá đủ điều kiện trong 7 ngày gần đây.`

Popular clicked deals:

- Rank by successful Affiliate Redirect count in the last 7 days.
- Show redirect count and top retailer platform when available.
- Empty state: `Chưa có ưu đãi phổ biến trong 7 ngày gần đây.`

## 9. Book Card Component

Book cards must work across homepage, search, wishlist, price drops, and related books.

Required fields:

- Cover image or placeholder.
- Title.
- Author.
- Primary category.
- Offer count, not retailer count.
- Lowest observed available price only when there is a currently eligible offer.
- One status indicator when no eligible price exists.

No-price status priority:

1. `Chưa có liên kết mua hợp lệ`
2. `Tạm hết hàng`
3. `Giá tham khảo cũ`
4. `Chưa có ưu đãi`

Actions:

- Entire card links to `/book/:id`.
- Wishlist action appears for registered users.
- Guests see a login prompt when they attempt wishlist or alert actions.
- Recent price-drop cards show VND drop.
- Popular deal cards show Affiliate Redirect count and top retailer.

Accessibility:

- Use descriptive cover alt text: `Bìa sách {title}`.
- Keep buttons separate from card navigation with `stopPropagation`.
- Use visible focus style on card and internal actions.

## 10. Search Results

Search must support:

- Title.
- Author.
- Publisher.
- Category.
- ISBN.
- Case-insensitive input.
- Vietnamese accented and unaccented input.
- Partial matching.
- ISBN search ignoring hyphens and spaces.

Not supported:

- Typo-tolerant search.
- Token-order-insensitive search.

Default empty search ordering:

1. Featured books.
2. Recent price drops.
3. Popular clicked deals.
4. Remaining Active books by title ascending.

Ranking for non-empty search:

1. Exact ISBN match.
2. Exact title match.
3. Title prefix match.
4. Title partial match.
5. Author match.
6. Publisher match.
7. Category match.
8. Book title ascending, then creation order ascending.

Results layout:

- 12 books per public page.
- Desktop: filter sidebar plus results grid.
- Mobile: filter drawer, sort row, then 2-column compact cards where possible.
- Empty state: `Không tìm thấy sách phù hợp. Thử tìm theo tên tác giả, ISBN hoặc chọn danh mục khác.`

Filters:

- Category.
- Author.
- Publisher.
- Retailer platform.
- Availability.
- Price range.

Availability filter labels:

- `Tất cả sách đang hoạt động`
- `Có ưu đãi hiện tại`
- `Có giá tham khảo cũ`
- `Tạm hết hàng`
- `Chưa có liên kết mua hợp lệ`
- `Chưa có ưu đãi được theo dõi`

Do not add a broad overlapping `No available offer` filter.

Price range filtering:

- Use only the book's lowest observed available price from currently eligible offers.
- Exclude books without currently eligible offers.
- Do not count stale or unavailable prices.

## 11. Book Detail Page

The book detail page must provide a complete comparison-focused detail view.

Top area:

- Breadcrumb.
- Cover image or placeholder.
- Title.
- Author.
- Publisher.
- Category.
- ISBN.
- Description.
- Lowest observed available price when an eligible offer exists.
- Wishlist action.
- Create alert action.
- Required price disclaimer.

Offer sections:

1. `Nơi bán có thể mua`
2. `Tạm hết hàng`
3. `Giá tham khảo cũ`
4. `Chưa có liên kết mua hợp lệ`

Purchasable offer row:

- Retailer platform.
- Merchant.
- Last observed listed item price.
- Optional reference/original price display only if it is mock data.
- Best-price label when tied or lowest.
- Affiliate disclosure.
- Buy action with external-link icon.

Unavailable offer row:

- No Buy button.
- Show last available price if it exists.
- Visually distinguish with muted background or dashed border.

Stale offer row:

- No Buy button.
- Label as old reference price.
- Do not show exact last checked time publicly.

Missing valid seller link row:

- No Buy button.
- Message: `Chưa có liên kết mua hợp lệ`.

Price history:

- Use Recharts line or area chart.
- Data means lowest observation-time-eligible price per day.
- Historical points remain visible even if current offer status changes later.
- Add a compact table fallback below the chart for accessibility and mobile scanning.

## 12. Buy Flow

Buy is available to guests and registered users.

Flow:

1. User clicks Buy on an eligible purchasable offer.
2. UI records or requests a Buy Attempt.
3. Backend validates destination.
4. Valid destination creates Affiliate Redirect and sends user to external seller.
5. Invalid, missing, or unsafe destination creates Redirect Failure and routes to a Vietnamese error page.

Buy UI copy:

- Button: `Đến nơi bán`
- Disclosure: `Bạn sẽ rời DealSach để mua sách tại nhà bán bên ngoài.`

Redirect error page:

- Title: `Không thể mở liên kết mua`
- Body: `Liên kết nơi bán hiện chưa hợp lệ hoặc không an toàn. DealSach đã ghi nhận lỗi này để quản trị viên kiểm tra.`
- Actions: return to book detail, search another book.

Do not create carts, checkout sessions, payments, orders, shipping steps, or order support screens.

## 13. Authentication

Email-first authentication screens:

`/auth`:

- Email input.
- Neutral response that does not reveal whether the email exists.
- Submit button: `Tiếp tục`.

`/auth/verify`:

- One-time verification code input.
- Show code expiry: 10 minutes.
- Resend cooldown: 60 seconds.
- Clear Vietnamese messages for invalid, expired, reused, or over-attempted codes.

Use `inputmode="numeric"` for numeric code inputs. Error messages must use `role="alert"` or `aria-live`.

## 14. Registered User Area

### Wishlist

The wishlist page shows saved books with the same book card rules. Archived books remain visible with an archived label, but cannot be newly added.

States:

- Empty: `Bạn chưa lưu sách nào.`
- Archived book label: `Sách đã lưu trữ`
- Remove action: icon button with tooltip.

### Alerts

Alert creation from book detail:

- Target-price alert with whole-number VND input greater than 0.
- New-lowest-price alert with no target price.
- Duplicate non-terminal alerts show the existing alert instead of creating another.

Alert list:

- Group or filter by Active, Paused, Auto-paused, Expired, Disabled.
- Active: update, pause, disable.
- Paused: update, reactivate, disable.
- Auto-paused: reactivate, disable.
- Expired: renew or create new alert.
- Disabled: history only.

Account settings:

- Basic account info.
- Disable all alert emails.
- Show email suppression as an account-level state without changing individual alert statuses.
- Logout.

## 15. Admin Experience

Admin pages should use a practical management layout optimized for desktop and tablet. Minimum admin viewport is 768px.

Admin design:

- Persistent left navigation on desktop.
- Top search/filter row per list page.
- Dense tables, 20 records per page.
- Status chips for Active, Archived, Pending Review, Unavailable, Inactive, Removed / Invalid, Disabled, Expired, and Auto-paused.
- Exact last checked times are allowed on Admin offer pages.
- Mutation forms must state status, dependency, and history implications before archive, restore, deactivate, or disable actions.

Admin dashboard:

- Default reporting window: last 7 days.
- No custom date ranges.
- Cards for key counts.
- Recharts line/bar charts for trends and grouped comparison.
- Tables for exact entity names and archived labels.

Dashboard metrics:

- Affiliate Redirect counts.
- Affiliate Redirects by book.
- Affiliate Redirects by retailer platform.
- Email Deal Link Clicks separately.
- Redirect Failures separately.
- Active Alert Status Count.
- Evaluable Alerts Count.
- Email-Suppressed Active Alerts.
- Auto-paused Alerts.
- Expired Alerts.
- Email Sent Count.
- Email Failed Count.
- Book-level price change summaries.

## 16. Responsive Rules

Public pages:

- Minimum width: 360px.
- No horizontal page scrolling except intentionally scrollable tables/charts.
- Search, filters, book cards, offer sections, wishlist actions, and alert actions must remain usable.

Admin pages:

- Minimum width: 768px.
- Tables may use horizontal scrolling when columns are necessary.

Breakpoints:

- Mobile: 360-767px.
- Tablet: 768-1023px.
- Desktop: 1024-1366px.
- Wide: 1366px and above, with content max width around the current `1200px`.

## 17. Component Inventory

Core shared components:

- `AppShell`
- `Header`
- `Footer`
- `SearchBox`
- `CategoryChip`
- `BookCard`
- `BookGrid`
- `BookCarousel`
- `DealBannerCarousel`
- `PriceBadge`
- `StatusBadge`
- `OfferSection`
- `OfferRow`
- `PriceHistoryChart`
- `WishlistButton`
- `AlertButton`
- `AuthEmailForm`
- `VerificationCodeForm`
- `FilterDrawer`
- `Pagination`
- `EmptyState`
- `AdminShell`
- `AdminDataTable`
- `AdminStatusChip`
- `AdminMetricCard`

Prefer Lucide icons for search, heart, bell, user, shield/admin, external link, alert, history, filter, sort, and table actions.

## 18. Content Rules

All public user-facing copy should be Vietnamese-first.

Required copy patterns:

- Price disclaimer: `Giá tham khảo được ghi nhận gần đây, vui lòng kiểm tra lại tại nơi bán trước khi mua.`
- External seller disclosure: `Bạn sẽ rời DealSach để mua sách tại nhà bán bên ngoài.`
- No direct sale footer: `DealSach không bán sách trực tiếp, không xử lý thanh toán, giao hàng, đổi trả hoặc hỗ trợ đơn hàng.`
- Empty search: `Không tìm thấy sách phù hợp.`
- No featured data: `Chưa có sách nổi bật để hiển thị.`
- No price drops: `Chưa có sách giảm giá đủ điều kiện trong 7 ngày gần đây.`
- No popular deals: `Chưa có ưu đãi phổ biến trong 7 ngày gần đây.`

Do not use visible text explaining implementation details, keyboard shortcuts, component behavior, or design-system rationale inside the app.

## 19. Accessibility And Quality Checklist

Before accepting a frontend implementation:

- Public pages work at 360px, 768px, 1024px, and 1366px.
- No text overlaps or overflows buttons/cards.
- All clickable elements have pointer cursor and visible focus.
- Images have meaningful alt text or a real placeholder.
- Search and form errors are announced with `role="alert"` or `aria-live`.
- Numeric VND inputs use numeric keyboard hints.
- Search/filter inputs are debounced or deferred.
- Charts have labels and table fallback.
- Public pages do not show exact last checked timestamps.
- Admin offer pages do show exact last checked timestamps.
- Buy buttons only appear for eligible purchasable offers.
- Stale, unavailable, and missing-link offers never show active Buy buttons.
- No cart, checkout, payment, shipping, order, review, rating, or comment UI exists.
