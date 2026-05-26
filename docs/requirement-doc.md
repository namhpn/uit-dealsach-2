# Requirement Document

## DealSach — Vietnamese Book Price Tracker and Affiliate Deal Platform

**Document language:** English
**Product language:** Vietnamese-first

---

# 1. Project Overview

DealSach is a Vietnamese-first book price tracker and affiliate deal platform. The system helps users discover books, compare listed item prices from multiple Vietnamese retailer platforms and merchants, view book-level price history, save books to a wishlist, and receive email alerts when selected price conditions are met.

DealSach does not sell books directly. It records user interaction and redirects users to external seller destinations through affiliate Buy links.

For the project scope, DealSach uses mock data and Admin-managed records to demonstrate price observations, offer availability, alert behavior, dashboard reports, redirect failures, audit records, and historical price scenarios.

---

# 2. Product Objectives

DealSach shall:

1. Help Vietnamese users discover books.
2. Compare listed item prices from multiple tracked offers.
3. Display prices as last observed reference prices, not real-time guarantees.
4. Preserve historical price observations.
5. Allow users to register and log in through email verification.
6. Allow registered users to manage wishlists.
7. Allow registered users to create and manage price alerts.
8. Send alert emails under deterministic alert rules.
9. Record email deal-link engagement separately from affiliate redirects.
10. Record successful affiliate redirects and redirect failures separately.
11. Provide Admin management for books, categories, offers, retailers, merchants, users, alerts, dashboard reports, and audit records.
12. Provide Vietnamese-first public pages, emails, validation messages, and disclosures.

---

# 3. Scope

## 3.1 In Scope

DealSach shall include:

| Area           | Included Requirements                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Discovery      | Homepage, featured books, recent price drops, popular clicked deals                               |
| Search         | Search, filters, sorting, pagination                                                              |
| Book pages     | Book cards, book detail pages, book-level price history                                           |
| Offer tracking | Retailers, merchants, offers, mock price observations                                             |
| Affiliate flow | Buy Attempt, Affiliate Redirect, Redirect Failure                                                 |
| User account   | Email verification, session, logout, account status                                               |
| User features  | Wishlist, price alerts, alert email suppression                                                   |
| Admin          | CRUD-style management, reports, audit trail                                                       |
| UX             | Vietnamese-first UI, messages, email content, disclosure                                          |
| Mock/demo data | Sufficient scenarios for price drops, alerts, stale prices, unavailable offers, redirect failures |

## 3.2 Out of Scope

DealSach shall not include:

* Shopping cart.
* Checkout.
* Online payment.
* Order management.
* Shipping management.
* Booking.
* In-app purchase transactions.
* User comments.
* User reviews.
* User ratings.
* Real-time price guarantee.
* Shipping fee comparison.
* Voucher, coupon, flash-sale, or member-only discount calculation.
* Typo-tolerant search.
* Token-order-insensitive search.
* Multi-category books.
* Hierarchical categories.
* Custom dashboard date ranges.
* Admin restoration of disabled alerts.
* Provider-level email delivery tracking such as bounce, defer, or delivery receipt tracking.
* Real external price integration beyond the mock/demo scope.

---

# 4. Target Users

| User Type       | Description                                                                          |
| --------------- | ------------------------------------------------------------------------------------ |
| Guest User      | A visitor who has not verified an account session.                                   |
| Registered User | A user who has verified email ownership and can use personalized features.           |
| Admin User      | An authorized restricted user who manages platform data, users, alerts, and reports. |

---

# 5. Key Concepts

| Concept                         | Definition                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Book                            | The central item users search, view, compare, save, and track.                                                              |
| Book Card                       | A compact book display used on homepage, search, and discovery sections.                                                    |
| Category                        | Admin-managed book classification. Each book has exactly one primary category.                                              |
| Retailer Platform               | A source platform where book offers appear, such as Tiki, Shopee, Lazada, Fahasa, or similar Vietnamese e-commerce sources. |
| Merchant / Seller               | A seller operating under one retailer platform.                                                                             |
| Offer / Listing                 | A tracked external listing for one book from one merchant on one retailer platform.                                         |
| Price Observation               | A recorded listed item price, availability status, and observation time for an offer.                                       |
| Observation Cycle               | One dated batch of price observations. Alert evaluation runs after an observation cycle is processed.                       |
| Last Observed Price             | The latest valid listed item price recorded for an offer.                                                                   |
| Last Available Price            | The most recent observation with available status before the latest unavailable observation.                                |
| Fresh Price                     | A price observation recorded within the last 48 hours for that offer.                                                       |
| Stale Price                     | A price observation older than 48 hours for that offer.                                                                     |
| Eligible Offer                  | An offer satisfying all rules required for current comparison, price filtering, and alert evaluation.                       |
| Evaluable Alert                 | An alert satisfying all rules required for alert evaluation and email-sending consideration.                                |
| Observation-Time Eligible Price | A historical observation that was valid, available, and associated with public Active entities at the time of observation.  |
| Wishlist                        | A registered user’s saved list of books.                                                                                    |
| Price Alert                     | A user-created rule for receiving price notification emails.                                                                |
| Email Deal Link Click           | A click from an alert email that lands on DealSach and records engagement. It is not an affiliate click.                    |
| Buy Attempt                     | A user clicks Buy on DealSach.                                                                                              |
| Affiliate Redirect              | DealSach validates the destination and issues the external redirect. This counts as an affiliate click.                     |
| Redirect Failure                | A Buy Attempt is blocked because the destination is missing, invalid, or unsafe.                                            |

---

# 6. Time, Currency, and Formatting Rules

| ID     | Requirement                                                                                                            |
| ------ | ---------------------------------------------------------------------------------------------------------------------- |
| TF-001 | All date, time, expiry, freshness, daily grouping, recent windows, and dashboard periods shall use `Asia/Ho_Chi_Minh`. |
| TF-002 | Dates shall display as `DD/MM/YYYY`.                                                                                   |
| TF-003 | Time shall use 24-hour format.                                                                                         |
| TF-004 | Date-time values shall display as `DD/MM/YYYY HH:mm`.                                                                  |
| TF-005 | Prices shall be Vietnamese Dong whole numbers.                                                                         |
| TF-006 | Price values shall be greater than 0.                                                                                  |
| TF-007 | Decimal price values shall not be used.                                                                                |
| TF-008 | Currency display shall use Vietnamese Dong formatting.                                                                 |

---

# 7. Business Rules

| ID     | Rule                                                                                                                                                                             |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-001 | DealSach is not the direct seller of books.                                                                                                                                      |
| BR-002 | DealSach does not process carts, checkouts, payments, orders, or shipping.                                                                                                       |
| BR-003 | DealSach compares listed item prices only.                                                                                                                                       |
| BR-004 | Shipping fees, platform vouchers, shop vouchers, member-only prices, conditional discounts, and flash-sale conditions are excluded.                                              |
| BR-005 | Prices shown publicly are reference prices based on last observed data, not guaranteed real-time prices.                                                                         |
| BR-006 | DealSach shall use mock price observations for project demonstration.                                                                                                            |
| BR-007 | A book may have multiple tracked offers.                                                                                                                                         |
| BR-008 | An offer belongs to one book, one retailer platform, and one merchant.                                                                                                           |
| BR-009 | A merchant belongs to one retailer platform.                                                                                                                                     |
| BR-010 | An offer’s retailer platform must match the retailer platform associated with its merchant.                                                                                      |
| BR-011 | An offer may have many price observations.                                                                                                                                       |
| BR-012 | The latest valid observation determines an offer’s last observed price.                                                                                                          |
| BR-013 | Unavailable offers shall display last available price when a last available price exists.                                                                                        |
| BR-014 | Unavailable offers shall not be treated as purchasable.                                                                                                                          |
| BR-015 | Stale prices may be displayed in the stale reference section but shall not be used for current comparison, lowest price calculation, price range filtering, or alert evaluation. |
| BR-016 | Entities with dependent history shall be archived, deactivated, hidden, or status-changed instead of hard-deleted.                                                               |
| BR-017 | Affiliate disclosure shall be displayed near Buy actions.                                                                                                                        |
| BR-018 | Public pages shall not show exact last checked time.                                                                                                                             |
| BR-019 | Admin pages shall show exact last checked time for offers.                                                                                                                       |
| BR-020 | Public pages shall include Vietnamese copy clarifying that displayed prices are reference prices and should be checked at the seller before purchase.                            |

Required public copy:

> “Giá tham khảo được ghi nhận gần đây, vui lòng kiểm tra lại tại nơi bán trước khi mua.”

---

# 8. Entity Lifecycle Models

## 8.1 Allowed Entity Statuses

| Entity            | Allowed Statuses                                                               |
| ----------------- | ------------------------------------------------------------------------------ |
| Book              | Active, Archived                                                               |
| Category          | Active, Archived                                                               |
| Retailer Platform | Active, Archived                                                               |
| Merchant          | Active, Archived                                                               |
| User              | Active, Deactivated                                                            |
| Offer             | Pending Review, Active / Purchasable, Unavailable, Inactive, Removed / Invalid |
| Alert             | Active, Paused, Auto-paused, Expired, Disabled                                 |

## 8.2 Archive and Deactivation Effects

| Entity / Status Change  | Required Effect                                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Book archived           | Hidden publicly; cannot be newly wishlisted; existing wishlist entries show archived; Active alerts for the book become Paused; other alert statuses remain unchanged. |
| Book restored           | Becomes public again if its category is Active; wishlist archived label disappears; related alerts remain Paused until user reactivates them.                          |
| Category archived       | Hidden from public filters; existing Active books in that category remain public; Admin must assign an Active category when creating new books.                        |
| Category restored       | Reappears in public filters; books remain governed by their own status.                                                                                                |
| Retailer archived       | Hidden publicly; related merchants and offers stop public display and alert evaluation.                                                                                |
| Retailer restored       | Related merchants and offers do not automatically become public unless their own statuses are valid.                                                                   |
| Merchant archived       | Hidden publicly; related offers stop public display and alert evaluation.                                                                                              |
| Merchant restored       | Related offers do not automatically become public unless offer status and retailer status are valid.                                                                   |
| Offer inactive          | Hidden publicly; retained for history and reports.                                                                                                                     |
| Offer removed / invalid | Hidden publicly; retained for Admin history and reports.                                                                                                               |
| User deactivated        | Login disabled; Active alerts become Disabled; historical records retained.                                                                                            |

---

# 9. Offer Status and Observation Availability Rules

## 9.1 Offer Status Model

| Status               | Public Behavior                                                | Alert / Comparison Behavior | Meaning                                                         |
| -------------------- | -------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------- |
| Pending Review       | Hidden                                                         | Excluded                    | Offer exists but is not approved for public display.            |
| Active / Purchasable | Display depends on latest observation and destination validity | Included only if eligible   | Offer is public and potentially purchasable.                    |
| Unavailable          | Visible in unavailable section, no Buy button                  | Excluded                    | Offer is temporarily unavailable by Admin status.               |
| Inactive             | Hidden                                                         | Excluded                    | Offer is intentionally hidden but retained for history.         |
| Removed / Invalid    | Hidden                                                         | Excluded                    | Offer is no longer usable but retained for history and reports. |

## 9.2 Source-of-Truth Rules

| Case                                                                         | Public Display                                                      | Alert / Comparison |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------ |
| Offer Active, latest observation available, fresh, valid destination         | Purchasable section with Buy button                                 | Included           |
| Offer Active, latest observation unavailable                                 | Unavailable section, no Buy button                                  | Excluded           |
| Offer Active, latest observation stale                                       | Stale reference section, no Buy button                              | Excluded           |
| Offer Active, latest observation available but affiliate destination invalid | “Chưa có liên kết mua hợp lệ” section, no Buy button                | Excluded           |
| Offer Unavailable, latest observation available                              | Unavailable section until Admin changes offer status back to Active | Excluded           |
| Offer Inactive or Removed / Invalid                                          | Hidden publicly                                                     | Excluded           |

Core rule:

> Admin-controlled offer status is the publishing gate. Latest observation availability determines price and availability display only when the offer status is Active.

---

# 10. Mock Data, Observation, and Price Freshness

## 10.1 Mock Data Sufficiency

| ID     | Requirement                                                           |
| ------ | --------------------------------------------------------------------- |
| PD-001 | The system shall use mock price observations for demonstration.       |
| PD-002 | Mock data shall include at least 12 books.                            |
| PD-003 | Mock data shall include at least 4 retailer platforms.                |
| PD-004 | Mock data shall include at least 8 merchants.                         |
| PD-005 | Mock data shall include at least 2 offers per book on average.        |
| PD-006 | At least 6 books shall have 14 days of price observations.            |
| PD-007 | At least 3 of those books shall include multi-retailer price history. |
| PD-008 | At least 2 of those books shall include tied lowest-price scenarios.  |
| PD-009 | Mock data shall include at least 3 price-drop scenarios.              |
| PD-010 | Mock data shall include at least 2 unavailable-offer scenarios.       |
| PD-011 | Mock data shall include at least 2 stale-price scenarios.             |
| PD-012 | Mock data shall include at least 2 alert-trigger scenarios.           |
| PD-013 | Mock data shall include at least 2 redirect-failure scenarios.        |

## 10.2 Observation Cycle Rules

| ID     | Requirement                                                                         |
| ------ | ----------------------------------------------------------------------------------- |
| PD-014 | Price observations shall be processed in observation cycles.                        |
| PD-015 | One observation cycle shall represent one dated batch of mock price observations.   |
| PD-016 | Alert evaluation shall run after an observation cycle is processed.                 |
| PD-017 | Observation-derived dashboard data shall update after observation cycle processing. |
| PD-018 | Admin shall not require a manual Run Daily Observation action.                      |

## 10.3 Observation-Time State Capture

Each price observation shall store enough observation-time state to support historical charts.

| ID     | Requirement                                                                       |
| ------ | --------------------------------------------------------------------------------- |
| PD-019 | Each observation shall capture book status at observation time.                   |
| PD-020 | Each observation shall capture offer status at observation time.                  |
| PD-021 | Each observation shall capture retailer status at observation time.               |
| PD-022 | Each observation shall capture merchant status at observation time.               |
| PD-023 | Each observation shall capture merchant-retailer consistency at observation time. |
| PD-024 | Each observation shall capture destination validity at observation time.          |
| PD-025 | Each observation shall capture observation availability status.                   |
| PD-026 | Each observation shall capture listed item price.                                 |
| PD-027 | Each observation shall capture observation time.                                  |
| PD-028 | Each observation shall capture observation cycle.                                 |

Admin corrections are forward-looking. Historical observations shall keep their captured observation-time facts and shall not be retroactively rewritten by ordinary Admin edits.

## 10.4 Freshness Rules

| ID     | Requirement                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------- |
| PD-029 | Price freshness shall be calculated per offer.                                                            |
| PD-030 | A price observation is fresh if observed within the last 48 hours.                                        |
| PD-031 | A price observation is stale if older than 48 hours.                                                      |
| PD-032 | Fresh eligible observations may be used for current comparison and alert evaluation.                      |
| PD-033 | Stale observations may display only as old reference prices.                                              |
| PD-034 | Stale observations shall not trigger alerts.                                                              |
| PD-035 | Stale observations shall not determine the lowest observed available price.                               |
| PD-036 | If no fresh eligible offer exists for a book, the book shall not produce price alert notifications.       |
| PD-037 | Freshness shall be used only for current comparison and alert evaluation, not historical chart inclusion. |

## 10.5 Public and Admin Price Display

| ID     | Requirement                                                                                                                 |
| ------ | --------------------------------------------------------------------------------------------------------------------------- |
| PD-038 | Public pages shall display last observed listed item prices without implying real-time accuracy.                            |
| PD-039 | Public pages shall show Vietnamese freshness/disclaimer copy.                                                               |
| PD-040 | Public pages shall not show exact observation timestamps.                                                                   |
| PD-041 | Admin pages shall show exact last checked time for offers.                                                                  |
| PD-042 | Active offers with stale latest observations shall remain visible on public book detail pages in a stale reference section. |
| PD-043 | Stale Active offers shall not show an active Buy button.                                                                    |
| PD-044 | Stale Active offers shall not participate in lowest observed available price.                                               |
| PD-045 | Unavailable offers shall display last available price if a last available price exists.                                     |

## 10.6 Last Available Price Rules

| ID     | Requirement                                                                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PD-046 | Last Available Price shall mean the most recent observation with available status before the latest unavailable observation.                                       |
| PD-047 | If an unavailable observation includes a price, that price shall not be treated as a purchasable price.                                                            |
| PD-048 | When an offer becomes available again, the normal last observed available price shall update.                                                                      |
| PD-049 | If the offer later becomes unavailable again, Last Available Price shall be recalculated from the most recent available observation before that unavailable state. |

---

# 11. Eligible Offer and Evaluable Alert Definitions

## 11.1 Eligible Offer

An offer is eligible for current price comparison, price range filtering, and alert evaluation only when all conditions are true.

| ID     | Eligibility Condition                                     |
| ------ | --------------------------------------------------------- |
| EO-001 | The associated book is Active.                            |
| EO-002 | The offer status is Active / Purchasable.                 |
| EO-003 | The latest observation is fresh.                          |
| EO-004 | The latest observation indicates the offer is available.  |
| EO-005 | The latest observation has a valid listed item price.     |
| EO-006 | The offer has a valid maintained affiliate destination.   |
| EO-007 | The offer’s merchant-retailer relationship is consistent. |
| EO-008 | The associated retailer platform is Active.               |
| EO-009 | The associated merchant is Active.                        |

## 11.2 Evaluable Alert

An alert is evaluable only when all conditions are true.

| ID     | Evaluable Alert Condition                                             |
| ------ | --------------------------------------------------------------------- |
| EA-001 | Alert status is Active.                                               |
| EA-002 | Owning user is Active.                                                |
| EA-003 | Account-level alert emails are enabled.                               |
| EA-004 | Related book is Active.                                               |
| EA-005 | Alert is not expired.                                                 |
| EA-006 | Target-price alert has a valid target price.                          |
| EA-007 | New-lowest alert has a baseline or pending baseline.                  |
| EA-008 | At least one eligible offer exists when a price comparison is needed. |

Email-suppressed Active alerts are counted as Active Alert Status Count and Email-Suppressed Active Alerts, but not as Evaluable Alerts.

---

# 12. Historical Price Eligibility

| ID     | Requirement                                                                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HP-001 | Public book-level price history shall use observation-time eligibility, not current offer eligibility.                                                  |
| HP-002 | Historical price charts shall include observations that were valid, available, and associated with public Active entities at the time of observation.   |
| HP-003 | Historical chart records shall not disappear merely because an offer later becomes stale, unavailable, inactive, invalid, removed, archived, or hidden. |
| HP-004 | Historical charts shall use stored observation-time facts, not current entity state.                                                                    |
| HP-005 | Current comparison, price range filtering, and alert evaluation shall use current eligible-offer rules.                                                 |
| HP-006 | Book-level price history shall show the lowest observation-time-eligible price per day.                                                                 |
| HP-007 | If no observation-time-eligible price exists for a day, that day shall be marked unavailable or omitted consistently.                                   |

---

# 13. Book and Offer Matching Rules

| ID     | Requirement                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------- |
| BM-001 | Each tracked offer shall be associated with one book.                                                                     |
| BM-002 | ISBN shall be used for matching when available.                                                                           |
| BM-003 | If ISBN is unavailable or insufficient, title, author, and publisher shall be considered.                                 |
| BM-004 | Edition, format, and language compatibility shall be considered before matching an offer to a book.                       |
| BM-005 | Ambiguous offers shall require Admin review before being treated as valid matches.                                        |
| BM-006 | Combo sets shall not be matched to a single book unless explicitly intended.                                              |
| BM-007 | Ebooks shall not be matched to physical books unless explicitly intended.                                                 |
| BM-008 | Used books shall not be matched to new books unless explicitly marked and intended.                                       |
| BM-009 | Imported-language editions shall not be matched to Vietnamese editions unless intentionally linked as related editions.   |
| BM-010 | Different ISBNs, formats, languages, or materially different editions shall normally be treated as separate book records. |
| BM-011 | Admin users may intentionally link related editions for navigation or display purposes.                                   |

---

# 14. User Roles and Permissions

## 14.1 Guest User

Guest Users shall be able to:

* View homepage.
* Search books.
* Filter, sort, and paginate book results.
* View book cards.
* View book detail pages.
* View tracked offers.
* View book-level price history.
* Click Buy on valid purchasable offers.
* Register or log in through email verification.

Guest Users shall not be able to:

* Add books to wishlist.
* Create price alerts.
* Manage account preferences.

## 14.2 Registered User

Registered Users shall be able to:

* Perform all Guest User actions.
* Add books to wishlist.
* Remove books from wishlist.
* View wishlist.
* Create price alerts.
* View alert status and alert history.
* Update eligible alerts.
* Pause eligible alerts.
* Reactivate eligible alerts.
* Disable individual alerts.
* Disable all alert emails through account preference.
* Log out.
* Manage basic account information.

## 14.3 Admin User

Admin Users shall be able to:

* Perform Admin-authorized management actions.
* Manage books.
* Manage categories.
* Manage offers under books.
* Manage retailer platforms.
* Manage merchants.
* View users.
* Deactivate user accounts.
* Reactivate deactivated user accounts.
* View user alert activity.
* Disable problematic alerts.
* View dashboard reports.
* Review affiliate redirect activity.
* Review email activity.
* Review price change activity.
* Review audit activity for Admin changes.

---

# 15. Functional Requirements

## 15.1 Homepage

| ID     | Requirement                                                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| FR-001 | The system shall provide a Vietnamese homepage for DealSach.                                                                       |
| FR-002 | The homepage shall include a prominent book search entry point.                                                                    |
| FR-003 | The homepage shall prioritize Admin-curated featured books.                                                                        |
| FR-004 | Featured books shall be displayed as book cards.                                                                                   |
| FR-005 | The homepage shall include recent price drops.                                                                                     |
| FR-006 | Recent price drops shall be displayed as book cards.                                                                               |
| FR-007 | Recent price drops shall include books whose book-level lowest eligible price dropped within the last 7 days.                      |
| FR-008 | Recent price drops shall rank by largest absolute VND drop.                                                                        |
| FR-009 | The homepage shall include popular clicked deals.                                                                                  |
| FR-010 | Popular clicked deals shall be displayed as book cards.                                                                            |
| FR-011 | Popular clicked deals shall rank books by successful Affiliate Redirects within the last 7 days.                                   |
| FR-012 | Popular clicked deal cards shall show total Affiliate Redirect count within the last 7 days.                                       |
| FR-013 | Popular clicked deal cards shall show the top retailer platform by Affiliate Redirect count within the last 7 days when available. |
| FR-014 | Homepage sections with no qualifying data shall show a Vietnamese empty-state message.                                             |
| FR-015 | The homepage shall clearly communicate that DealSach compares prices and redirects users to external sellers.                      |

## 15.2 Price Drop Calculation

| ID     | Requirement                                                                                                                               |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| FR-016 | Recent price drops shall use book-level lowest eligible price.                                                                            |
| FR-017 | A book with no previous eligible price shall not be counted as a price drop.                                                              |
| FR-018 | If multiple drops occur within 7 days, the largest single observation-cycle drop shall be used.                                           |
| FR-019 | Ties in drop amount shall sort by most recent drop first, then book title ascending.                                                      |
| FR-020 | If the previous cycle is unavailable, comparison shall use the most recent earlier cycle with an eligible price.                          |
| FR-021 | A drop caused only by the previous lowest offer becoming ineligible shall not count unless an eligible observed price actually decreased. |

## 15.3 Book Card Requirements

| ID     | Requirement                                                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| FR-022 | Book cards shall show cover image or placeholder.                                                                             |
| FR-023 | Book cards shall show title.                                                                                                  |
| FR-024 | Book cards shall show author.                                                                                                 |
| FR-025 | Book cards shall show primary category.                                                                                       |
| FR-026 | Book cards shall show lowest observed available price when the book has an eligible offer.                                    |
| FR-027 | Book cards shall show exactly one status indicator when no eligible price exists.                                             |
| FR-028 | Book card status priority shall be: `Chưa có liên kết mua hợp lệ`, `Tạm hết hàng`, `Giá tham khảo cũ`, then `Chưa có ưu đãi`. |
| FR-029 | Book cards in recent price drop sections shall show price drop amount.                                                        |
| FR-030 | Book cards shall show offer count.                                                                                            |
| FR-031 | Book cards shall link to the book detail page.                                                                                |
| FR-032 | Wishlist and alert actions shall appear only for registered users or prompt login.                                            |

## 15.4 Search, Filter, Sort, and Pagination

| ID     | Requirement                                                                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-033 | Users shall be able to search books using Vietnamese keywords.                                                                                                                  |
| FR-034 | Search shall support title, author, publisher, category, and ISBN.                                                                                                              |
| FR-035 | Search shall be case-insensitive.                                                                                                                                               |
| FR-036 | Search shall support Vietnamese accented and unaccented input.                                                                                                                  |
| FR-037 | Partial matching is required.                                                                                                                                                   |
| FR-038 | ISBN search shall ignore hyphens and spaces.                                                                                                                                    |
| FR-039 | Archived books shall be excluded from public search.                                                                                                                            |
| FR-040 | Empty search shall return the default discovery listing.                                                                                                                        |
| FR-041 | Default discovery listing shall show featured books first, recent price drops next, popular clicked deals next, and remaining Active books by title ascending.                  |
| FR-042 | Search ranking order shall be exact ISBN match, exact title match, title prefix match, title partial match, author match, publisher match, category match, then fallback order. |
| FR-043 | Fallback order shall be book title ascending, then creation order ascending.                                                                                                    |
| FR-044 | Typo tolerance is out of scope.                                                                                                                                                 |
| FR-045 | Token-order-insensitive matching is out of scope.                                                                                                                               |
| FR-046 | Public search results shall use a default page size of 12 books.                                                                                                                |
| FR-047 | Admin lists shall use a default page size of 20 records.                                                                                                                        |
| FR-048 | Empty search results shall show a clear Vietnamese message and suggested next actions.                                                                                          |

## 15.5 Availability Filters

| Filter Value              | Meaning                                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| All active books          | All non-archived books.                                                                                                             |
| Available now             | Books with at least one currently eligible offer.                                                                                   |
| Has stale reference price | Books with no eligible offer and at least one stale Active offer.                                                                   |
| Temporarily unavailable   | Books with no eligible offer and at least one Active offer whose latest observation is unavailable.                                 |
| Missing valid seller link | Books with no eligible offer and at least one Active offer with fresh available price but invalid or missing affiliate destination. |
| No tracked offer          | Active books with no tracked offers.                                                                                                |

| ID     | Requirement                                                                                                |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| FR-049 | The broad overlapping “No available offer” filter shall not be a selectable filter.                        |
| FR-050 | Users shall be able to filter by category.                                                                 |
| FR-051 | Users shall be able to filter by author.                                                                   |
| FR-052 | Users shall be able to filter by publisher.                                                                |
| FR-053 | Users shall be able to filter by retailer platform.                                                        |
| FR-054 | Users shall be able to filter by availability using the defined availability buckets.                      |
| FR-055 | Users shall be able to filter by price range.                                                              |
| FR-056 | Price range filtering shall use the book’s lowest observed available price from currently eligible offers. |
| FR-057 | Books with no currently eligible offers shall be excluded from price range results.                        |
| FR-058 | Stale and unavailable prices shall not count for price range filtering.                                    |

## 15.6 Category Management

| ID     | Requirement                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------------- |
| FR-059 | Categories shall be Admin-managed reference data.                                                     |
| FR-060 | Each book shall have exactly one primary category.                                                    |
| FR-061 | Multi-category support is out of scope.                                                               |
| FR-062 | Hierarchical category support is out of scope.                                                        |
| FR-063 | Users shall be able to search and filter by category.                                                 |
| FR-064 | Admin Users shall be able to create, view, update, archive, and restore categories.                   |
| FR-065 | Categories with dependent books shall not be hard-deleted.                                            |
| FR-066 | Archived categories shall be hidden from public filters.                                              |
| FR-067 | Books already assigned to an archived category shall remain public only if the book itself is Active. |
| FR-068 | Admin must assign an Active category when creating new books.                                         |

## 15.7 Book Detail Page

| ID     | Requirement                                                                                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-069 | The system shall provide a detail page for each public Active book.                                                                                               |
| FR-070 | The book detail page shall show title, author, publisher, category, ISBN, cover image, and description where available.                                           |
| FR-071 | The book detail page shall show tracked public offers grouped into purchasable, unavailable, stale reference, and missing valid seller link sections.             |
| FR-072 | The book detail page shall show the last observed listed item price for each eligible offer.                                                                      |
| FR-073 | The book detail page shall show the lowest observed available price based only on currently eligible offers.                                                      |
| FR-074 | The book detail page shall show book-level price history.                                                                                                         |
| FR-075 | Book-level price history shall mean the lowest observation-time-eligible price per day.                                                                           |
| FR-076 | Unavailable offers shall be visibly distinguished from purchasable offers.                                                                                        |
| FR-077 | Unavailable offers shall display last available price when it exists.                                                                                             |
| FR-078 | Stale Active offers shall appear in the stale reference section without an active Buy button.                                                                     |
| FR-079 | Active offers with available fresh price but invalid or missing affiliate destination shall appear in “Chưa có liên kết mua hợp lệ” section without a Buy button. |
| FR-080 | Affiliate disclosure shall appear near Buy actions.                                                                                                               |
| FR-081 | Registered Users shall be able to add the book to wishlist from the detail page.                                                                                  |
| FR-082 | Registered Users shall be able to create price alerts from the detail page.                                                                                       |

## 15.8 Book Images

| ID     | Requirement                                                                             |
| ------ | --------------------------------------------------------------------------------------- |
| FR-083 | Books may have cover images.                                                            |
| FR-084 | A cover image is recommended but not required to create a book.                         |
| FR-085 | If a book has no cover image, the system shall show a default placeholder.              |
| FR-086 | If a cover image is broken or unavailable, the system shall show a default placeholder. |

## 15.9 Affiliate Buy Flow and Redirect Safety

| ID     | Requirement                                                                                                                |
| ------ | -------------------------------------------------------------------------------------------------------------------------- |
| FR-087 | Each eligible purchasable offer shall provide a Buy action.                                                                |
| FR-088 | The Buy action shall be available to Guest Users and Registered Users.                                                     |
| FR-089 | When a user selects Buy, the system shall record a Buy Attempt.                                                            |
| FR-090 | A successful Affiliate Redirect shall be counted when DealSach validates the destination and issues the external redirect. |
| FR-091 | A successful Affiliate Redirect shall count as an affiliate click.                                                         |
| FR-092 | If the destination is missing, invalid, or unsafe, the system shall record a Redirect Failure.                             |
| FR-093 | Redirect Failures shall not count as affiliate clicks.                                                                     |
| FR-094 | Affiliate destinations shall be maintained by Admin Users.                                                                 |
| FR-095 | Valid destinations must use `https://`.                                                                                    |
| FR-096 | Destination domain matching shall use exact domain or approved subdomain.                                                  |
| FR-097 | Affiliate redirector domains are allowed only when explicitly listed under the retailer platform’s approved domain list.   |
| FR-098 | Missing or invalid destinations shall show a Vietnamese error page and shall not redirect.                                 |
| FR-099 | Unsafe or arbitrary redirect destinations shall be rejected.                                                               |
| FR-100 | Buy actions shall not create carts, orders, payments, or checkout sessions.                                                |

## 15.10 Click Tracking Semantics

| Event                 | Meaning                                                      | Counts as Affiliate Click |
| --------------------- | ------------------------------------------------------------ | ------------------------- |
| Buy Attempt           | User clicked Buy.                                            | No                        |
| Affiliate Redirect    | Destination was valid and DealSach issued external redirect. | Yes                       |
| Redirect Failure      | User clicked Buy but redirect was blocked or invalid.        | No                        |
| Email Deal Link Click | User clicked email link and landed on DealSach.              | No                        |

| ID     | Requirement                                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------------- |
| FR-101 | Buy Attempt, Affiliate Redirect, Redirect Failure, and Email Deal Link Click shall be recorded as separate event types. |
| FR-102 | Dashboard affiliate click metrics shall count Affiliate Redirect events only.                                           |
| FR-103 | Redirect Failures shall be reported separately from Affiliate Redirects.                                                |
| FR-104 | Email Deal Link Clicks shall be reported separately from Affiliate Redirects.                                           |

---

# 16. Account and Verification Requirements

## 16.1 Email Verification

| ID     | Requirement                                                                                   |
| ------ | --------------------------------------------------------------------------------------------- |
| AV-001 | Users shall be able to register or log in using email verification.                           |
| AV-002 | The system shall send a one-time verification code to the user’s email address.               |
| AV-003 | Verification codes shall expire after 10 minutes.                                             |
| AV-004 | Users shall be able to request a new verification code after a 60-second cooldown.            |
| AV-005 | A verification code shall allow no more than 5 failed attempts.                               |
| AV-006 | Maximum verification-code requests shall be 5 per email per hour.                             |
| AV-007 | Maximum verification-code requests shall be 10 per email per day.                             |
| AV-008 | Requesting a new verification code shall invalidate previous unused codes for that email.     |
| AV-009 | Successful verification shall invalidate all other active codes for that email.               |
| AV-010 | A used code cannot be used again.                                                             |
| AV-011 | Attempt counters apply to the active code.                                                    |
| AV-012 | Failed attempts across regenerated codes count toward per-email request and abuse controls.   |
| AV-013 | Login/register flow shall show the same neutral message whether the email is new or existing. |
| AV-014 | Users shall verify email ownership before receiving price alert emails.                       |

## 16.2 Session and Logout

| ID     | Requirement                                                                  |
| ------ | ---------------------------------------------------------------------------- |
| AV-015 | Successful verification shall log the user in.                               |
| AV-016 | Users shall be able to manually log out.                                     |
| AV-017 | A user session shall last up to 7 days unless logged out or deactivated.     |
| AV-018 | The same user may have multiple active sessions across devices.              |
| AV-019 | Admin sessions shall use the same session rules as Registered User sessions. |
| AV-020 | Deactivated users’ existing sessions shall be invalidated.                   |
| AV-021 | Deactivated users shall be blocked from future login.                        |

## 16.3 Link Token Safety

| ID     | Requirement                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------- |
| AV-022 | Alert disable links shall expire after 30 days.                                                           |
| AV-023 | Alert disable links shall be single-use.                                                                  |
| AV-024 | Alert disable links shall affect only one alert.                                                          |
| AV-025 | Expired or invalid links shall show a Vietnamese error message.                                           |
| AV-026 | Disable links shall be single-purpose and shall not provide access to account data.                       |
| AV-027 | If the alert is already Disabled, using the link again shall show a Vietnamese no-op confirmation.        |
| AV-028 | Once an alert is Disabled, existing disable links for that alert become invalid for future state changes. |
| AV-029 | Alert disable link usage shall be logged as an alert event.                                               |

## 16.4 User Account Deactivation and Reactivation

| ID     | Requirement                                                                                |
| ------ | ------------------------------------------------------------------------------------------ |
| AV-030 | User account deactivation shall prevent future login.                                      |
| AV-031 | Active alerts shall become Disabled when the owning user account is deactivated.           |
| AV-032 | Deactivated users shall not receive alert emails.                                          |
| AV-033 | Historical wishlist, alert, click, and report records shall remain.                        |
| AV-034 | Re-registration with the same email shall be blocked unless Admin reactivates the account. |
| AV-035 | Admin reactivation of deactivated users is allowed.                                        |
| AV-036 | Reactivated users shall not automatically reactivate old alerts.                           |

---

# 17. Wishlist Requirements

| ID     | Requirement                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| WL-001 | Registered Users shall be able to add books to a wishlist.                                                    |
| WL-002 | Registered Users shall be able to remove books from a wishlist.                                               |
| WL-003 | Registered Users shall be able to view their wishlist.                                                        |
| WL-004 | A user may wishlist a book only once.                                                                         |
| WL-005 | Adding the same book to wishlist again shall be treated as a no-op.                                           |
| WL-006 | Archived books shall not be newly added to wishlist.                                                          |
| WL-007 | If a wishlisted book later becomes archived, it shall remain in the wishlist and be marked archived.          |
| WL-008 | If an archived book is restored to Active, the archived label shall disappear from existing wishlist entries. |
| WL-009 | Guest Users shall be asked to log in before using wishlist features.                                          |

---

# 18. Price Alert Requirements

## 18.1 Alert Types

DealSach shall support:

1. Target Price Alert.
2. New-Lowest-Price Alert.

## 18.2 Target-Price Alert

| ID     | Requirement                                                                                                                                  |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| AL-001 | Registered Users shall be able to create a target-price alert for a book.                                                                    |
| AL-002 | A target-price alert shall include a user-defined target price.                                                                              |
| AL-003 | Target prices shall be VND whole numbers greater than 0.                                                                                     |
| AL-004 | Target-price alerts shall evaluate the lowest observed available price across currently eligible offers for the book.                        |
| AL-005 | If the eligible price is already at or below the target at creation, no email shall be sent.                                                 |
| AL-006 | If the eligible price is already at or below the target at creation, the current eligible price shall become the comparison price.           |
| AL-007 | Future notification shall occur only when a later eligible price is lower than that comparison price.                                        |
| AL-008 | If the eligible price is above target at creation, notification shall occur when a later eligible price first reaches or falls below target. |
| AL-009 | After the first notification, later notifications shall occur only when a later eligible price is lower than the last notified price.        |
| AL-010 | No repeated notification shall be sent if the price remains unchanged or merely remains below target.                                        |
| AL-011 | If no eligible price exists at creation, the alert shall wait for the next eligible price to establish its comparison price.                 |

## 18.3 New-Lowest-Price Alert

| ID     | Requirement                                                                                                                                                                            |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AL-012 | Registered Users shall be able to create a new-lowest-price alert without entering a target price.                                                                                     |
| AL-013 | If an eligible price exists at creation, the alert shall use the lowest observed available price known at alert creation as its baseline.                                              |
| AL-014 | If no eligible price exists at creation, the alert shall be created with pending baseline condition.                                                                                   |
| AL-015 | When an alert has pending baseline condition, the first future eligible price shall set the baseline without sending a notification.                                                   |
| AL-016 | A new-lowest-price alert shall trigger only when a later eligible price is lower than the baseline or lower than the last notified price.                                              |
| AL-017 | A new-lowest-price alert shall not trigger immediately simply because the book is already at its historical low when the alert is created.                                             |
| AL-018 | If multiple offers reach the same lowest price during the same observation cycle, the alert shall produce one notification event for that book, not duplicate notifications per offer. |

## 18.4 Duplicate Alert Rules

For duplicate prevention, Active, Paused, and Auto-paused alerts count as existing alerts. Expired and Disabled alerts do not block creation of a new alert.

| ID     | Requirement                                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------------------------- |
| AL-019 | A user may have at most one non-terminal target-price alert for the same book and same target price.             |
| AL-020 | A user may have multiple target-price alerts for the same book when target prices differ.                        |
| AL-021 | A user may have at most one non-terminal new-lowest-price alert per book.                                        |
| AL-022 | A user may have both a target-price alert and a new-lowest-price alert for the same book.                        |
| AL-023 | Creating a duplicate non-terminal alert shall return or show the existing alert instead of creating a duplicate. |
| AL-024 | Expired and Disabled alerts shall not block creation of a new alert.                                             |

## 18.5 Alert Update Permissions

| Alert Status | Allowed User Actions                                             |
| ------------ | ---------------------------------------------------------------- |
| Active       | Update, pause, disable.                                          |
| Paused       | Update, reactivate, disable.                                     |
| Auto-paused  | Reactivate, disable. No normal update until reactivated.         |
| Expired      | Renew or create new alert. No normal update.                     |
| Disabled     | View history only. Cannot reactivate. User may create new alert. |

For new-lowest alerts, “restart tracking” is a distinct action available only when the alert is Active or Paused.

## 18.6 Target-Price Alert Update

| ID     | Requirement                                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------------------------- |
| AL-025 | When a user changes the target price, the system shall validate duplicate alert rules using the new target price. |
| AL-026 | Notification count shall reset to 0.                                                                              |
| AL-027 | Last notified price shall be cleared.                                                                             |
| AL-028 | Current eligible price shall become the new comparison price.                                                     |
| AL-029 | If no eligible price exists, the alert shall wait for the next eligible price.                                    |
| AL-030 | Updating the target price shall not send an immediate email.                                                      |

## 18.7 New-Lowest Alert Update

Allowed updates are pause/reactivate, disable, renew, and restart tracking.

| ID     | Requirement                                                                    |
| ------ | ------------------------------------------------------------------------------ |
| AL-031 | Restart tracking shall reset notification count to 0.                          |
| AL-032 | Restart tracking shall set current eligible price as the new baseline.         |
| AL-033 | If no eligible price exists during restart tracking, baseline becomes pending. |
| AL-034 | Restart tracking shall not send an immediate email.                            |

## 18.8 Alert Status and State Transitions

| Status      | Meaning                                                                    |
| ----------- | -------------------------------------------------------------------------- |
| Active      | Eligible for evaluation when account, book, and offer conditions allow it. |
| Paused      | Temporarily stopped by user, system, or archive effect.                    |
| Auto-paused | Stopped after reaching notification limit.                                 |
| Expired     | Stopped after 90 days without renewal.                                     |
| Disabled    | Disabled by user, Admin action, or account deactivation.                   |

| Transition                                         | Rule                                                           |
| -------------------------------------------------- | -------------------------------------------------------------- |
| Active → Paused                                    | Allowed by user action or book archive effect.                 |
| Paused → Active                                    | Allowed by user action when the book and account are eligible. |
| Active → Auto-paused                               | Occurs after 3 successful alert emails.                        |
| Auto-paused → Active                               | Allowed by user reactivation; notification count resets to 0.  |
| Active / Paused / Auto-paused → Expired            | Occurs after 90 days without renewal.                          |
| Expired → Active                                   | Allowed by renewal; expiry resets to 90 days from renewal.     |
| Active / Paused / Auto-paused / Expired → Disabled | Allowed by user or Admin action.                               |
| Disabled → Active                                  | Out of scope. Disabled alerts cannot be reactivated.           |

## 18.9 Book Archive Effect on Alerts

| Existing Alert Status | Result When Book Is Archived |
| --------------------- | ---------------------------- |
| Active                | Becomes Paused               |
| Paused                | Remains Paused               |
| Auto-paused           | Remains Auto-paused          |
| Expired               | Remains Expired              |
| Disabled              | Remains Disabled             |

## 18.10 Alert Expiry

| Alert Status | Expiry Behavior                 |
| ------------ | ------------------------------- |
| Active       | Expires after 90 days           |
| Paused       | Expires after 90 days           |
| Auto-paused  | Expires after 90 days           |
| Disabled     | Does not need expiry processing |
| Expired      | Already expired                 |

## 18.11 Account-Level Alert Email Suppression

| ID     | Requirement                                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------------------------- |
| AL-035 | Registered Users shall be able to disable all alert emails from account settings.                                 |
| AL-036 | Disabling all alert emails shall be treated as an account-level notification preference.                          |
| AL-037 | Disabling all alert emails shall not change individual alert statuses.                                            |
| AL-038 | If account-level alert emails are disabled, alerts shall not be evaluated for email sending.                      |
| AL-039 | If account-level alert emails are disabled, no Triggered event shall be recorded for suppressed email conditions. |
| AL-040 | If account-level alert emails are disabled, notification count shall not increase.                                |
| AL-041 | If account-level alert emails are disabled, last notified price shall not update.                                 |
| AL-042 | When the user re-enables alert emails, alerts shall resume from the next future observation cycle.                |
| AL-043 | Old suppressed conditions shall not send retroactively.                                                           |

## 18.12 Trigger Event and Email Sending Rules

| ID     | Requirement                                                                                                                            |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| AL-044 | A Triggered event shall be recorded only when an alert condition passes evaluation and the system is allowed to attempt email sending. |
| AL-045 | If email sending fails, the Triggered event shall remain recorded.                                                                     |
| AL-046 | If email sending fails, last notified price shall not update.                                                                          |
| AL-047 | If email sending fails, notification count shall not increase.                                                                         |
| AL-048 | Future same-price conditions may trigger again only if no successful notification was previously recorded for that condition.          |

## 18.13 Alert Email Requirements

| ID     | Requirement                                                                                                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AL-049 | The system shall send email notifications for triggered price alerts when the user is eligible to receive alert emails.                                                       |
| AL-050 | Alert emails shall be written in Vietnamese.                                                                                                                                  |
| AL-051 | Target-price alert emails shall include observed price, target price, last notified price if available, and previous lowest eligible price before the triggering observation. |
| AL-052 | New-lowest-price alert emails shall include observed price, previous baseline or previous lowest eligible price, VND drop amount, and percentage drop.                        |
| AL-053 | Alert emails shall include book title.                                                                                                                                        |
| AL-054 | If multiple offers tie for the same lowest triggering price in one observation cycle, one email shall be sent.                                                                |
| AL-055 | Tie-case emails shall show the tied lowest price.                                                                                                                             |
| AL-056 | Tie-case emails shall list up to 3 tied retailer/merchant options.                                                                                                            |
| AL-057 | Tie-case emails shall link to the DealSach book detail page, not a specific external seller.                                                                                  |
| AL-058 | Alert emails shall include a deal link that opens the DealSach book detail page or offer section.                                                                             |
| AL-059 | Email deal links shall not automatically redirect to the external affiliate destination.                                                                                      |
| AL-060 | The user must click Buy separately to continue to an external seller.                                                                                                         |
| AL-061 | Email deal links shall record Email Deal Link Click events.                                                                                                                   |
| AL-062 | Email deal links shall not disable alerts.                                                                                                                                    |
| AL-063 | Alert emails shall include a separate disable-alert link.                                                                                                                     |
| AL-064 | The disable-alert link shall disable only that specific alert.                                                                                                                |
| AL-065 | Alert emails shall include affiliate disclosure.                                                                                                                              |

## 18.14 Failed Email Behavior

| ID     | Requirement                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------ |
| AL-066 | Only successfully submitted alert emails shall count toward the 3-notification limit.                  |
| AL-067 | Failed email attempts shall be recorded.                                                               |
| AL-068 | A failed email shall not update the last notified price.                                               |
| AL-069 | A failed email shall retry once immediately within the same alert-processing cycle.                    |
| AL-070 | If retry also fails, two failed attempts shall be counted.                                             |
| AL-071 | Provider timeout shall count as failed.                                                                |
| AL-072 | If an alert becomes expired, disabled, paused, or auto-paused before retry, retry shall be suppressed. |

---

# 19. Admin Requirements

## 19.1 Admin Account and Authorization

| ID     | Requirement                                                            |
| ------ | ---------------------------------------------------------------------- |
| AD-001 | Admin accounts shall be restricted user accounts with Admin role.      |
| AD-002 | The first Admin account shall be created during system setup.          |
| AD-003 | Admin Users shall use the same email verification flow as other users. |
| AD-004 | The system shall support one Admin role for the project scope.         |
| AD-005 | Only Admin Users shall access Admin functions.                         |
| AD-006 | Non-admin users shall not access Admin pages or actions.               |
| AD-007 | Last active Admin cannot be deactivated.                               |
| AD-008 | Admin Users cannot deactivate their own account.                       |
| AD-009 | Admin role removal is out of scope.                                    |
| AD-010 | Deactivated Admin Users shall remain visible in audit history.         |

## 19.2 Admin Alert Deactivation

| ID     | Requirement                                                             |
| ------ | ----------------------------------------------------------------------- |
| AD-011 | Admin “deactivate alert” action shall set the alert status to Disabled. |
| AD-012 | Admin-deactivated alerts shall stop future evaluation.                  |
| AD-013 | Admin-deactivated alerts shall stop future emails.                      |
| AD-014 | Admin-deactivated alerts shall preserve alert history.                  |
| AD-015 | Admin-deactivated alerts shall not be deleted.                          |

## 19.3 Admin Audit Trail

| ID     | Requirement                                                                                                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AD-016 | Admin actions that modify books, offers, retailers, merchants, affiliate destinations, categories, user accounts, Admin accounts, or statuses shall be recorded in an audit trail. |
| AD-017 | Each Admin mutation audit record shall include Admin actor.                                                                                                                        |
| AD-018 | Each Admin mutation audit record shall include action type.                                                                                                                        |
| AD-019 | Each Admin mutation audit record shall include entity type.                                                                                                                        |
| AD-020 | Each Admin mutation audit record shall include entity identifier.                                                                                                                  |
| AD-021 | Each Admin mutation audit record shall include timestamp in Vietnam time.                                                                                                          |
| AD-022 | Each Admin mutation audit record shall include summary of changed fields.                                                                                                          |
| AD-023 | Each Admin mutation audit record shall include before/after values for non-sensitive fields.                                                                                       |
| AD-024 | Sensitive values shall be masked in audit records.                                                                                                                                 |
| AD-025 | Audit records shall be retained for the project lifetime.                                                                                                                          |
| AD-026 | Read-only Admin views shall not be audited.                                                                                                                                        |
| AD-027 | User deactivation and user reactivation shall be audited.                                                                                                                          |
| AD-028 | Admin account deactivation attempts shall be audited.                                                                                                                              |
| AD-029 | Failed attempt to deactivate the last active Admin shall be audited.                                                                                                               |
| AD-030 | Failed attempt by an Admin to deactivate their own account shall be audited.                                                                                                       |

## 19.4 Sensitive Fields in Audit Logs

The following fields shall be masked in audit records:

| ID     | Sensitive Field                                           |
| ------ | --------------------------------------------------------- |
| SF-001 | Verification codes or verification-related secret values. |
| SF-002 | Alert disable tokens.                                     |
| SF-003 | Email-link tokens.                                        |
| SF-004 | Affiliate tracking parameters.                            |
| SF-005 | Full affiliate URLs beyond domain and path summary.       |
| SF-006 | Internal secret or configuration values.                  |

User email may be shown to Admin but shall be treated as personal data in reports and audit displays.

## 19.5 Admin Management Areas

| Area               | Required Admin Capabilities                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Books              | Create, view, update, archive, restore, search, filter, mark as featured                      |
| Categories         | Create, view, update, archive, restore                                                        |
| Offers             | Create under book, view, update, set status, review eligibility, identify missing destination |
| Retailer Platforms | Create, view, update, archive, restore, manage approved destination domains                   |
| Merchants          | Create, view, update, archive, restore, associate with retailer                               |
| Users              | View, deactivate, reactivate                                                                  |
| Alerts             | View alert activity, disable problematic alerts                                               |
| Reports            | View dashboard tables and charts                                                              |
| Audit              | Review Admin mutation audit history                                                           |

---

# 20. Dashboard Requirements

## 20.1 Dashboard Update Timing

| Event Type                                          | Dashboard Update Timing                    |
| --------------------------------------------------- | ------------------------------------------ |
| Observation-derived metrics                         | Updated after observation cycle processing |
| Alert metrics                                       | Updated after alert evaluation processing  |
| Buy Attempt / Affiliate Redirect / Redirect Failure | Reflected after event is recorded          |
| Email Deal Link Click                               | Reflected after event is recorded          |
| Admin audit metrics                                 | Reflected after event is recorded          |
| User/account events                                 | Reflected after event is recorded          |

Dashboard reports shall use recorded events. Historical events remain counted even if the related book, retailer, merchant, or offer is later archived, renamed, or invalidated.

## 20.2 Dashboard Grouping Rules

| ID     | Requirement                                                                    |
| ------ | ------------------------------------------------------------------------------ |
| DR-001 | Dashboard reports shall group by entity identifier.                            |
| DR-002 | Dashboard reports shall display the current entity name.                       |
| DR-003 | Archived entities shall be marked as archived in dashboard display.            |
| DR-004 | Historical events shall remain counted after archive, rename, or invalidation. |

## 20.3 Dashboard Metrics

| ID     | Requirement                                                                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| DR-005 | Dashboard shall display tables and charts.                                                                                                            |
| DR-006 | Downloadable and printable report export are not required.                                                                                            |
| DR-007 | The dashboard reporting window shall default to the last 7 days.                                                                                      |
| DR-008 | Custom dashboard date ranges are out of scope.                                                                                                        |
| DR-009 | Dashboard shall show Affiliate Redirect counts.                                                                                                       |
| DR-010 | Dashboard shall show Affiliate Redirects grouped by book.                                                                                             |
| DR-011 | Dashboard shall show Affiliate Redirects grouped by retailer platform.                                                                                |
| DR-012 | Dashboard shall show Email Deal Link Clicks separately from Affiliate Redirects.                                                                      |
| DR-013 | Dashboard shall show Redirect Failures separately from Affiliate Redirects.                                                                           |
| DR-014 | Dashboard shall show Active Alert Status Count.                                                                                                       |
| DR-015 | Dashboard shall show Evaluable Alerts Count.                                                                                                          |
| DR-016 | Dashboard shall show Email-Suppressed Active Alerts.                                                                                                  |
| DR-017 | Dashboard shall show Auto-paused Alerts.                                                                                                              |
| DR-018 | Dashboard shall show Expired Alerts.                                                                                                                  |
| DR-019 | Dashboard shall show Email Sent Count.                                                                                                                |
| DR-020 | Dashboard shall show Email Failed Count.                                                                                                              |
| DR-021 | Dashboard shall show book-level Price Change Summary.                                                                                                 |
| DR-022 | Book-level Price Change Summary shall mean latest book-level lowest eligible observed price minus previous book-level lowest eligible observed price. |
| DR-023 | Offer-level price change dashboard summary is out of scope.                                                                                           |

---

# 21. Input Validation Requirements

| Field                 | Requirement                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| Email                 | Must be valid email format and normalized consistently for login.                                          |
| Search query          | Trimmed; empty query returns default discovery listing; excessive length rejected with Vietnamese message. |
| Book title            | Required for book creation.                                                                                |
| Author                | Required for book creation.                                                                                |
| ISBN                  | Optional; if provided, hyphens/spaces are ignored for matching.                                            |
| Category              | Must be an Active category when creating or updating a book.                                               |
| Merchant              | Must belong to selected retailer platform.                                                                 |
| Affiliate destination | Must use `https://` and match approved domain rules.                                                       |
| Target price          | Whole VND number greater than 0.                                                                           |
| Category name         | Must not be empty.                                                                                         |
| Retailer name         | Must not be empty.                                                                                         |
| Merchant name         | Must not be empty.                                                                                         |

---

# 22. Non-Functional Requirements

## 22.1 Vietnamese-First Usability

| ID      | Requirement                                                                                               |
| ------- | --------------------------------------------------------------------------------------------------------- |
| NFR-001 | The system shall use Vietnamese as the primary user-facing language.                                      |
| NFR-002 | User-facing validation, errors, guidance messages, emails, and core pages shall be written in Vietnamese. |
| NFR-003 | Currency values shall be displayed in Vietnamese Dong.                                                    |
| NFR-004 | Dates and times shall use the required Vietnam-time display format.                                       |
| NFR-005 | Book examples and display content shall be suitable for Vietnamese audiences.                             |
| NFR-006 | Affiliate disclosure shall be written in Vietnamese and placed near Buy actions.                          |

## 22.2 Responsiveness

| ID      | Requirement                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------ |
| NFR-007 | Public pages shall support a minimum width of 360px.                                                               |
| NFR-008 | Admin pages shall support a minimum width of 768px.                                                                |
| NFR-009 | Desktop layout shall support 1366px width.                                                                         |
| NFR-010 | Public pages shall not require horizontal scrolling at 360px except for intentionally scrollable tables or charts. |

## 22.3 Reliability and Data Consistency

| ID      | Requirement                                                                                                                        |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| NFR-011 | The system shall handle invalid input gracefully.                                                                                  |
| NFR-012 | The system shall provide clear Vietnamese feedback when an action succeeds or fails.                                               |
| NFR-013 | The system shall preserve historical price observations.                                                                           |
| NFR-014 | The system shall preserve click records, alert history, wishlist records, and report integrity.                                    |
| NFR-015 | The system shall prevent duplicate alert emails for unchanged alert conditions.                                                    |
| NFR-016 | The system shall prevent duplicate wishlist entries for the same user and book.                                                    |
| NFR-017 | The system shall apply the centralized eligible-offer definition consistently across comparison, filtering, alerts, and reporting. |
| NFR-018 | The system shall apply observation-time eligibility consistently for historical price charts.                                      |

## 22.4 Security and Privacy

| ID      | Requirement                                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| NFR-019 | Users shall verify email ownership before receiving alert emails.                                                                    |
| NFR-020 | Users shall be able to disable individual alerts.                                                                                    |
| NFR-021 | Users shall be able to disable all alert emails.                                                                                     |
| NFR-022 | The system shall store only user information necessary for account access, wishlist, alerts, notifications, and reporting integrity. |
| NFR-023 | Alert and wishlist data shall be private to the owning user and authorized Admin Users.                                              |
| NFR-024 | Admin functions shall be restricted to authorized Admin Users.                                                                       |
| NFR-025 | Redirects shall only use maintained affiliate destinations.                                                                          |
| NFR-026 | Email verification and alert-disable links shall be protected from unauthorized misuse.                                              |
| NFR-027 | Admin changes to important business records shall be auditable.                                                                      |

## 22.5 Mock-Scope Boundary

| ID      | Requirement                                                                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NFR-028 | Observation cycles, price history, alerts, dashboard, and audit behavior are required only insofar as they are demonstrated through mock data and Admin-managed records. |
| NFR-029 | The project shall not require real external retailer integration.                                                                                                        |
| NFR-030 | The system shall remain structured so future real integrations could be added without changing the core user-facing product concept.                                     |

---

# 23. Main Workflows

## 23.1 Guest Book Discovery Workflow

1. Guest User opens DealSach.
2. System displays search, featured books, recent price drops, and popular clicked deals.
3. Guest User searches for a book or uses default discovery listing.
4. System displays paginated results.
5. Guest User filters or sorts results.
6. Guest User opens a book detail page.
7. System displays tracked offers grouped by purchasable, unavailable, stale reference, and missing valid seller link sections.
8. Guest User clicks Buy on an eligible offer.
9. System records Buy Attempt.
10. System validates affiliate destination.
11. System records Affiliate Redirect if valid.
12. System redirects externally.
13. System records Redirect Failure and shows Vietnamese error page if invalid.

## 23.2 Email Verification Workflow

1. User enters email address.
2. System sends verification code.
3. User enters verification code.
4. System validates the active code within time and attempt limits.
5. System invalidates other active codes for that email.
6. System creates or opens the user account.
7. System logs the user in.

## 23.3 Wishlist Workflow

1. Registered User opens a book detail page.
2. User adds book to wishlist.
3. System saves the book if it is not already in the wishlist.
4. User later views or removes the book.
5. If book becomes archived, it remains in wishlist as archived.
6. If book is restored, archived label disappears.

## 23.4 Target Price Alert Workflow

1. Registered User creates target-price alert.
2. System validates target price and duplicate rules.
3. System establishes comparison price according to creation-time price condition.
4. System evaluates future observation cycles.
5. System records Triggered event only when alert condition passes and email sending is allowed.
6. System sends email and records Email Sent when successful.
7. System updates last notified price and notification count only after successful email submission.
8. Alert becomes Auto-paused after 3 successful notifications or Expired after 90 days.

## 23.5 New-Lowest-Price Alert Workflow

1. Registered User creates new-lowest-price alert.
2. System validates duplicate rules.
3. System records current eligible price as baseline if one exists.
4. System creates pending baseline condition if no eligible price exists.
5. First future eligible price sets pending baseline without notification.
6. Later eligible price below baseline or last notified price triggers notification.
7. Alert becomes Auto-paused after 3 successful notifications or Expired after 90 days.

## 23.6 Alert Update Workflow

1. Registered User opens alert management.
2. User performs allowed action based on alert status.
3. System applies alert-type update rules.
4. System validates duplicate rules where applicable.
5. System resets notification count where required.
6. System does not send immediate email solely because of the update.
7. Alert resumes evaluation from the next applicable observation cycle.

## 23.7 Admin Reporting Workflow

1. Admin User opens dashboard.
2. System shows Affiliate Redirect metrics.
3. System shows Email Deal Link Click metrics separately.
4. System shows Redirect Failure metrics separately.
5. System shows alert status and evaluability metrics.
6. System shows email sent and failed metrics.
7. System shows book-level price change summaries.
8. System displays archived entities with archived label where applicable.

---

# 24. Acceptance Criteria

## 24.1 Availability Filters and Book Cards

| ID     | Acceptance Criterion                                                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-001 | Availability filter includes All active books, Available now, Has stale reference price, Temporarily unavailable, Missing valid seller link, and No tracked offer. |
| AC-002 | Broad overlapping “No available offer” filter is not selectable.                                                                                                   |
| AC-003 | Book cards show offer count, not retailer count.                                                                                                                   |
| AC-004 | Book cards show exactly one no-price status indicator using the defined priority order.                                                                            |
| AC-005 | Popular clicked deal cards show total Affiliate Redirect count for the last 7 days.                                                                                |
| AC-006 | Popular clicked deal cards show top retailer platform when available.                                                                                              |

## 24.2 Session and Verification

| ID     | Acceptance Criterion                                                       |
| ------ | -------------------------------------------------------------------------- |
| AC-007 | Successful email verification logs the user in.                            |
| AC-008 | User can manually log out.                                                 |
| AC-009 | User session lasts up to 7 days unless logged out or deactivated.          |
| AC-010 | Same user can have multiple active sessions.                               |
| AC-011 | Deactivated user sessions are invalidated.                                 |
| AC-012 | Verification-code requests are limited to 5 per hour per email.            |
| AC-013 | Verification-code requests are limited to 10 per day per email.            |
| AC-014 | Requesting a new code invalidates previous unused codes.                   |
| AC-015 | Successful verification invalidates all other active codes for that email. |
| AC-016 | Used code cannot be used again.                                            |
| AC-017 | Login/register response is enumeration-safe.                               |

## 24.3 Alert Updates and Admin Alert Deactivation

| ID     | Acceptance Criterion                                                                     |
| ------ | ---------------------------------------------------------------------------------------- |
| AC-018 | Active alerts allow update, pause, and disable.                                          |
| AC-019 | Paused alerts allow update, reactivate, and disable.                                     |
| AC-020 | Auto-paused alerts allow reactivate and disable, but no normal update until reactivated. |
| AC-021 | Expired alerts allow renew or create new alert, but no normal update.                    |
| AC-022 | Disabled alerts allow view history only and cannot be reactivated.                       |
| AC-023 | New-lowest restart tracking is available only for Active or Paused alerts.               |
| AC-024 | Admin alert deactivation sets alert status to Disabled.                                  |
| AC-025 | Admin-disabled alerts stop future evaluation and emails while preserving history.        |

## 24.4 Price Drop and Dashboard Grouping

| ID     | Acceptance Criterion                                                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| AC-026 | Book with no previous eligible price is not counted as price drop.                                                                 |
| AC-027 | Multiple drops in 7 days use largest single observation-cycle drop.                                                                |
| AC-028 | Price-drop ties sort by most recent drop first, then book title ascending.                                                         |
| AC-029 | Previous unavailable cycle compares against most recent earlier eligible price.                                                    |
| AC-030 | Drop caused only by previous lowest offer becoming ineligible is not counted unless an eligible observed price actually decreased. |
| AC-031 | Dashboard groups by entity identifier.                                                                                             |
| AC-032 | Dashboard displays current entity name.                                                                                            |
| AC-033 | Archived entities are marked as archived.                                                                                          |
| AC-034 | Historical events remain counted after archive, rename, or invalidation.                                                           |

## 24.5 Link Tokens and Audit

| ID     | Acceptance Criterion                                                                                                                                                                    |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-035 | Alert disable links are single-use.                                                                                                                                                     |
| AC-036 | Reusing a disable link for an already Disabled alert shows Vietnamese no-op confirmation.                                                                                               |
| AC-037 | Existing disable links for Disabled alerts cannot change state again.                                                                                                                   |
| AC-038 | Alert disable link usage is logged as an alert event.                                                                                                                                   |
| AC-039 | Audit logs mask verification codes, alert disable tokens, email-link tokens, affiliate tracking parameters, full affiliate URLs beyond domain/path summary, and internal secret values. |
| AC-040 | User and Admin account mutations are audited.                                                                                                                                           |

## 24.6 Mock-Scope Boundary

| ID     | Acceptance Criterion                                                      |
| ------ | ------------------------------------------------------------------------- |
| AC-041 | Observation cycles are demonstrated through mock data.                    |
| AC-042 | Price history is demonstrated through mock data.                          |
| AC-043 | Alert behavior is demonstrated through mock data.                         |
| AC-044 | Dashboard metrics are demonstrated through mock data and recorded events. |
| AC-045 | Audit behavior is demonstrated through Admin-managed records.             |
| AC-046 | Real external retailer integration is not required.                       |

---

# 25. Requirement Traceability

| Goal                                       | Supporting Sections       |
| ------------------------------------------ | ------------------------- |
| Help users discover books                  | Sections 15.1–15.5        |
| Define book cards and homepage discovery   | Sections 15.1–15.3        |
| Support categories                         | Section 15.6              |
| Display book details and offers            | Sections 9, 10, 15.7      |
| Handle price quality and historical charts | Sections 10–12            |
| Drive affiliate traffic safely             | Sections 15.9–15.10       |
| Support account access                     | Section 16                |
| Support wishlist                           | Section 17                |
| Support price alerts                       | Section 18                |
| Support Admin management                   | Section 19                |
| Support dashboard reporting                | Section 20                |
| Maintain Vietnamese-first UX               | Sections 6, 7, 22         |
| Maintain mock-scope clarity                | Sections 10.1, 22.5, 24.6 |
| Define testable completion                 | Section 24                |
