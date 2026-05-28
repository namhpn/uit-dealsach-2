## Front-End Requirements

### UI/UX Direction

DealSach shall use a Vietnamese e-commerce interface style that feels familiar to shoppers on platforms such as Tiki, Shopee, Lazada, and Fahasa.

DealSach shall combine that Vietnamese e-commerce familiarity with eBay-inspired UI/UX: cleaner layouts, stronger search focus, clearer product scanning, simpler detail pages, and reduced decision friction.

The interface shall feel like a shopping discovery platform, but it shall never imply that DealSach sells books directly.

The UI shall prioritize fast book discovery, price comparison, trust signals, and clear external-seller redirection.

The design shall be dense enough for Vietnamese e-commerce users, but it shall remain structured, scannable, and easy to use on mobile.

The UI shall avoid unnecessary clutter, redundant actions, confusing menus, and excessive dashboard-like complexity on public pages.

---

### Global Interface Requirements

All public user-facing content shall be written primarily in Vietnamese.

All prices shall be displayed in Vietnamese Dong as whole-number values.

Dates shall display as `DD/MM/YYYY`.

Times shall use the 24-hour format.

Date-time values shall display as `DD/MM/YYYY HH:mm`.

All date and time behavior shall use `Asia/Ho_Chi_Minh`.

Public pages shall describe prices as reference prices, not real-time guaranteed prices.

The required public price disclaimer shall appear near price and Buy areas: “Giá tham khảo được ghi nhận gần đây, vui lòng kiểm tra lại tại nơi bán trước khi mua.”

Public pages shall not show exact last-checked timestamps.

Admin pages shall show exact last-checked timestamps for offers.

---

### Header Requirements

The header shall place search as the primary action.

The search input shall be large, prominent, and available on key public pages.

The header shall include clear access to account, wishlist, alert management, and admin access when applicable.

Guest users shall see login prompts only when they attempt registered-user actions.

The navigation shall expose major discovery paths without overwhelming users.

Category navigation shall be easy to scan and optimized for Vietnamese book shoppers.

The header shall remain usable on mobile screens without horizontal scrolling.

---

### Homepage Requirements

The homepage shall immediately communicate that DealSach helps users compare book prices and go to external sellers.

The homepage shall include a prominent search entry point.

The homepage shall show Admin-curated featured books first.

The homepage shall show recent price drops as book cards.

The homepage shall show popular clicked deals as book cards.

Recent price drops shall rank by the largest absolute VND drop within the last 7 days.

Popular clicked deals shall rank by successful Affiliate Redirect count within the last 7 days.

Popular clicked deal cards shall show the total Affiliate Redirect count for the last 7 days.

Popular clicked deal cards shall show the top retailer platform when available.

Homepage sections with no qualifying data shall show clear Vietnamese empty-state messages.

The homepage shall support quick scanning through strong book imagery, price visibility, offer count, and status labels.

---

### Book Card Requirements

Each book card shall show a cover image or a default placeholder.

Each book card shall show the book title, author, primary category, and offer count.

Each book card shall show the lowest observed available price only when the book has a currently eligible offer.

Each book card shall show offer count, not retailer count.

Each book card shall link to the book detail page.

Each book card shall show wishlist and alert actions only for registered users, or prompt login for guests.

Recent price-drop cards shall show the price-drop amount.

When no eligible price exists, the card shall show exactly one status indicator.

The no-price status priority shall be `Chưa có liên kết mua hợp lệ`, then `Tạm hết hàng`, then `Giá tham khảo cũ`, then `Chưa có ưu đãi`.

---

### Search and Results Requirements

Users shall be able to search books using Vietnamese keywords.

Search shall support title, author, publisher, category, and ISBN.

Search shall be case-insensitive.

Search shall support both accented and unaccented Vietnamese input.

Search shall support partial matching.

ISBN search shall ignore hyphens and spaces.

Archived books shall not appear in public search results.

An empty search shall return the default discovery listing.

The default discovery listing shall show featured books first, recent price drops second, popular clicked deals third, and remaining Active books by title ascending.

Search ranking shall prioritize exact ISBN match, exact title match, title prefix match, title partial match, author match, publisher match, category match, then fallback order.

Fallback order shall sort by book title ascending, then creation order ascending.

Public search results shall use 12 books per page.

Empty search results shall show a clear Vietnamese message with suggested next actions.

Typo-tolerant search shall not be implemented.

Token-order-insensitive search shall not be implemented.

---

### Filter Requirements

The search results page shall provide filters for category, author, publisher, retailer platform, availability, and price range.

The availability filter shall include `Tất cả sách đang hoạt động`, `Có ưu đãi hiện tại`, `Có giá tham khảo cũ`, `Tạm hết hàng`, `Chưa có liên kết mua hợp lệ`, and `Chưa có ưu đãi được theo dõi`.

The interface shall not provide a broad overlapping “No available offer” filter.

Price range filtering shall use only the book’s lowest observed available price from currently eligible offers.

Books without currently eligible offers shall be excluded from price range results.

Stale prices and unavailable prices shall not count for price range filtering.

---

### Book Detail Page Requirements

Each Active public book shall have a detail page.

The book detail page shall show title, author, publisher, category, ISBN, cover image, and description when available.

The book detail page shall show the lowest observed available price based only on currently eligible offers.

The book detail page shall group offers into purchasable, unavailable, stale reference, and missing valid seller link sections.

Purchasable offers shall show the last observed listed item price and a Buy action.

Unavailable offers shall be visually distinguished and shall not show a Buy action.

Unavailable offers shall show the last available price when it exists.

Stale Active offers shall appear in a stale reference section and shall not show a Buy action.

Fresh available Active offers with invalid or missing affiliate destinations shall appear in a `Chưa có liên kết mua hợp lệ` section and shall not show a Buy action.

Affiliate disclosure shall appear near Buy actions.

The detail page shall show book-level price history using the lowest observation-time-eligible price per day.

Historical price records shall remain visible even if an offer later becomes stale, unavailable, inactive, removed, archived, or hidden.

Registered users shall be able to add the book to a wishlist from the detail page.

Registered users shall be able to create price alerts from the detail page.

---

### Buy Flow Requirements

Each eligible purchasable offer shall provide a Buy action.

Guest users and registered users shall both be able to click Buy.

Clicking Buy shall record a Buy Attempt.

A successful validated destination shall produce an Affiliate Redirect.

An invalid, missing, or unsafe destination shall show a Vietnamese error page and shall not redirect the user.

Redirect Failures shall never be presented as successful affiliate clicks.

Buy actions shall not create carts, checkout sessions, payments, orders, or shipping flows.

The UI shall clearly show that the user is leaving DealSach for an external seller.

---

### Authentication Requirements

Users shall register or log in through email verification.

The login/register screen shall ask for an email address.

The verification screen shall ask for a one-time verification code.

The UI shall show that verification codes expire after 10 minutes.

The UI shall prevent requesting another code until the 60-second cooldown ends.

The UI shall show clear Vietnamese messages for invalid, expired, reused, or over-attempted codes.

The login/register response shall remain neutral and shall not reveal whether an email already exists.

Successful verification shall log the user in.

Users shall be able to manually log out.

Deactivated users shall be blocked from login.

---

### Wishlist Requirements

Registered users shall be able to add books to a wishlist.

Registered users shall be able to remove books from a wishlist.

Registered users shall be able to view their wishlist.

A book shall appear only once in a user’s wishlist.

Adding the same book again shall behave as a no-op.

Archived books shall not be newly added to a wishlist.

A wishlisted book that later becomes archived shall remain visible and marked as archived.

If an archived book is restored, the archived label shall disappear from existing wishlist entries.

Guest users shall be prompted to log in before using wishlist actions.

---

### Price Alert Requirements

Registered users shall be able to create target-price alerts.

Registered users shall be able to create new-lowest-price alerts.

Target-price alerts shall require a whole-number VND target price greater than 0.

New-lowest-price alerts shall not require a target price.

The alert UI shall prevent duplicate non-terminal alerts according to alert type and target price.

When a duplicate alert exists, the UI shall show or return the existing alert instead of creating a new one.

Active alerts shall allow update, pause, and disable actions.

Paused alerts shall allow update, reactivate, and disable actions.

Auto-paused alerts shall allow reactivate and disable actions only.

Expired alerts shall allow renewal or creation of a new alert.

Disabled alerts shall allow history viewing only.

Disabled alerts shall not be reactivated.

New-lowest restart tracking shall be available only for Active or Paused alerts.

Users shall be able to disable all alert emails from account settings.

Disabling all alert emails shall not change individual alert statuses.

Alert emails shall link to DealSach, not directly to an external seller.

Users shall need to click Buy separately before leaving DealSach for an external seller.

Alert disable links shall show Vietnamese confirmation, error, or no-op messages.

---

### Account Settings Requirements

Registered users shall be able to manage basic account information.

Registered users shall be able to disable all alert emails.

Account-level alert email suppression shall be clearly shown without changing individual alert statuses.

The account area shall avoid excessive navigation depth.

The account area shall prioritize wishlist, alerts, email preferences, and logout.

---

### Admin Interface Requirements

Only Admin users shall access Admin pages and Admin actions.

Admin pages shall use a practical management layout optimized for 768px minimum width and desktop use.

Admin list pages shall use 20 records per page.

Admin users shall be able to manage books, categories, offers, retailer platforms, merchants, users, alerts, reports, and audit records.

Admin users shall be able to create, view, update, archive, and restore books where allowed.

Admin users shall be able to mark books as featured.

Admin users shall be able to create, view, update, archive, and restore categories.

Admin users shall be able to create offers under books, update offers, set offer status, review eligibility, and identify missing destinations.

Admin users shall be able to manage retailer approved destination domains.

Admin users shall be able to create, update, archive, and restore merchants.

Admin users shall be able to view users, deactivate users, and reactivate users.

Admin users shall be able to view alert activity and disable problematic alerts.

Admin users shall be able to review audit history for Admin mutations.

Admin read-only views shall not be audited.

Admin mutation screens shall clearly show status, dependency, and history implications before destructive or state-changing actions.

---

### Admin Dashboard Requirements

The Admin dashboard shall show tables and charts.

The dashboard reporting window shall default to the last 7 days.

The dashboard shall not provide custom date ranges.

The dashboard shall show Affiliate Redirect counts.

The dashboard shall show Affiliate Redirects grouped by book.

The dashboard shall show Affiliate Redirects grouped by retailer platform.

The dashboard shall show Email Deal Link Clicks separately from Affiliate Redirects.

The dashboard shall show Redirect Failures separately from Affiliate Redirects.

The dashboard shall show Active Alert Status Count.

The dashboard shall show Evaluable Alerts Count.

The dashboard shall show Email-Suppressed Active Alerts.

The dashboard shall show Auto-paused Alerts.

The dashboard shall show Expired Alerts.

The dashboard shall show Email Sent Count.

The dashboard shall show Email Failed Count.

The dashboard shall show book-level price change summaries.

Dashboard reports shall group by entity identifier.

Dashboard reports shall display the current entity name.

Archived entities shall be marked as archived.

Historical events shall remain counted after archive, rename, or invalidation.

---

### Footer Requirements

The footer shall provide clear access to help, disclosure, account links, policy links, and platform information.

The footer shall be comprehensive enough for Vietnamese e-commerce expectations but shall remain organized and easy to scan.

The footer shall repeat that DealSach compares prices and redirects users to external sellers.

The footer shall not imply that DealSach handles checkout, payment, delivery, returns, or order support.

---

### Responsive Requirements

Public pages shall support a minimum viewport width of 360px.

Admin pages shall support a minimum viewport width of 768px.

Desktop layouts shall support 1366px width.

Public pages shall not require horizontal scrolling at 360px except for intentionally scrollable tables or charts.

Book cards, filters, search, offer sections, wishlist actions, and alert actions shall remain usable on mobile.

---

### Explicit Front-End Exclusions

The front end shall not include a shopping cart.

The front end shall not include checkout.

The front end shall not include online payment.

The front end shall not include order management.

The front end shall not include shipping management.

The front end shall not include booking.

The front end shall not include in-app purchase transactions.

The front end shall not include user comments.

The front end shall not include user reviews.

The front end shall not include user ratings.

The front end shall not present real-time price guarantees.

The front end shall not compare shipping fees.

The front end shall not calculate vouchers, coupons, flash-sale prices, member-only prices, or conditional discounts.

The front end shall not support multi-category book assignment.

The front end shall not support hierarchical categories.

The front end shall not support custom dashboard date ranges.

The front end shall not support Admin restoration of Disabled alerts.
