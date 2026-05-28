# UML Use Cases (Text Specification)

This file describes the proposed UML use-case view in text only, aligned with current implementation.

## Actors

- Guest User
- Registered User
- Admin User

## Guest User Use Cases

- Discover books on homepage (`featured`, `recent price drops`, `popular clicked deals`).
- Search and filter public catalog.
- View book detail and grouped offer sections.
- Click Buy for eligible offers and leave DealSach through validated redirect.
- Request email verification code to start login/register flow.

## Registered User Use Cases

- Complete email-code verification and start session.
- Add/remove books in wishlist and view wishlist.
- Create and manage price alerts (`target_price`, `new_lowest_price`) with lifecycle actions.
- Manage account alert-email preference.
- Open email deal links on DealSach before optional Buy action.
- Use alert-disable link to disable an alert token flow.

## Admin User Use Cases

- Authenticate as admin and access restricted Admin routes.
- Manage categories, books, retailer platforms, merchants, offers, and mock observations.
- Manage user lifecycle states (deactivate/reactivate with safeguards).
- Review and disable problematic alerts.
- Review Admin audit logs.
- View dashboard/report metrics for redirects, failures, email engagement, alert states, and audit activity.

## Included/Related Behaviors

- Buy action always records Buy Attempt before redirect/failure outcome.
- Alert evaluation emits notification history and outbound email records.
- Admin mutations write audit logs with masked sensitive data.
