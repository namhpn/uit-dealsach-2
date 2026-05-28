# DealSach Tickets

## Status Legend

- Not Started
- In Progress
- Blocked
- Done
- Superseded

## Ticket Index

| ID | Title | Status | Depends On | Area |
|---|---|---|---|---|
| T0000 | Capture repo baseline state | Done | None | Process |
| T0001 | Dockerized Developer Tooling Baseline | Done | T0000 | Tools |
| T0002 | Core Domain Schema, Mock Data, and Frontend Hygiene Baseline | Done | T0001 | Backend / Database / Mock data / Frontend dependencies |
| T0003 | Public Catalog Read APIs and Offer Eligibility | Done | T0002 | Backend/API |
| T0004 | Public Catalog Frontend and Affiliate Buy Flow | Done | T0003 | Frontend / Backend API / Database |
| T0005 | Restore Public Frontend Design with API Data | Done | T0004 | Frontend / Public UI |
| T0006 | Close T0005 Review Gaps and Docker Verification Blocker | Done | T0005 | Public frontend / demo data / Dev tooling |
| T0007 | Backend Email Verification and Session Foundation | Done | T0006 | Backend auth |
| T0008 | Authenticated Wishlist APIs and Frontend Integration | Done | T0007 | Backend/API / Frontend auth / Wishlist |
| T0009 | Price Alert Domain and Authenticated Management APIs | Done | T0008 | Backend/API / Alerts |
| T0010 | Frontend Price Alert Management Integration | Done | T0007, T0008, T0009 | Frontend |
| T0011 | Alert Notification Engine and Account Settings | Done | T0007, T0009, T0010 | Full-stack |
| T0012 | Admin Foundation, Audit Trail, Users, and Alerts | Done | T0007, T0009, T0011 | Full-stack |
| T0013 | Admin Catalog Management | Done | T0002, T0003, T0004, T0012 | Full-stack |
| T0014 | Admin Dashboard Reports | Done | T0004, T0011, T0012, T0013 | Full-stack |
| T0015 | Project README and Usage Guide | Done | T0014 | Documentation |
| T0016 | Local Dev CORS and Known-Issue Cleanup | In Progress | T0015 | Backend / Frontend / Docker / Demo data |
