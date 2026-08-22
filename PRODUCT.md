# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — the customer ordering food.** A person in Colombia, on a phone, deciding
what to eat now. They arrive from a link shared on WhatsApp or Instagram, not from
search. They have not installed anything, have no account, and will not create one.
Their job is: see what's available, build an order, and get it to the restaurant with
as few taps as possible. Most are ordering to their home address.

**Secondary — the owner maintaining the menu.** One person, working from an iPad or a
desktop computer, using `/admin`. Their job is keeping prices, availability, photos,
hours and promotions current. Admin sessions are deliberate and infrequent rather than
mid-service and one-handed, so admin does not need phone-first optimization — though it
is a touch surface, since the iPad is the common case.

## Product Purpose

Karma's digital menu and ordering front door. A customer browses the catalog, builds a
cart, enters their delivery details, and the app composes a formatted order message and
hands it to WhatsApp. Success is an order arriving in the restaurant's WhatsApp,
complete and correct, with no intermediary and no signup.

The app never processes payment. It collects the customer's declared payment method
(Efectivo, Nequi, Bancolombia, Otro) as part of the order message; money changes hands
off-platform.

## Positioning

Ordering direct instead of through a delivery marketplace. Two confirmed reasons, in
priority order:

1. **No platform commission.** Rappi and its peers take a per-order cut. Every order
   placed through this link keeps that margin with the restaurant. This is the reason
   the product exists.
2. **No install, no account, no password.** The customer taps a link and orders. Any
   step placed before "send order" is a direct cost to conversion.

Explicitly *not* claimed as the rationale (asked and declined): that customers refuse to
pay online, and that the kitchen's workflow already centers on WhatsApp. Future work
should not lean on either as justification without re-confirming.

## Operating Context

- **Locale:** Colombia. Spanish (es-CO) throughout. Prices in COP, formatted with
  `Intl.NumberFormat` and no decimals.
- **Time:** business hours are evaluated in `America/Bogota` regardless of the
  customer's device clock, so a traveling or misconfigured phone still sees the true
  open/closed state.
- **Distribution:** the link is the storefront. It is shared in WhatsApp chats and
  Instagram bios; link-preview appearance is therefore a real acquisition surface, not
  a detail.
- **Handoff:** orders leave as a `wa.me` deep link carrying a plain-text summary —
  name, itemized order with quantities and prices, address plus landmark, contact
  number, payment method, discount lines, and total.
- **Deployment:** static SPA on Cloudflare Workers at `karmaclub.food`, deployed by
  GitHub Actions on push to `master`.

## Capabilities and Constraints

**Live today**

- Catalog filtered by category; a product may belong to several categories at once.
- Cart with per-product time-limited discounts (percentage, optional expiry date).
- Promo codes: percentage or fixed amount, with optional usage cap and date window.
- Delivery fee, configurable, default 5.000 COP. Applied *after* discounts and never
  reduced by a promo code — this ordering is deliberate.
- Business hours per weekday with a live open/closed state and a "we're closed" notice.
- Promotional popups with date windows, shown once per session.
- Admin CRUD for products, categories, business config, promos and codes.
- Supabase as system of record, `localStorage` as cache and offline fallback.

**Confirmed but not built**

- **Pickup.** The business wants customers to be able to collect in person; the software
  has no pickup path at all. Today the address field is required and the delivery fee is
  unconditional, so both would need to become conditional on a fulfilment choice. Record
  as planned, not current — pickup does not happen through this app in any form yet.

**Known constraints future work inherits**

- Product photos are stored as base64 data URLs inside the database rows, so the whole
  catalog's imagery downloads before first render. Migration to object storage is open
  and unstarted.
- A single shared admin account. Credentials live in the public `config` row and the
  login check runs client-side, so the password hash is currently readable by any
  visitor — an open security issue, not a design decision.
- The privacy policy at `/politica-de-privacidad-y-uso-de-datos` is a template with 13
  unfilled `[PLACEHOLDER]` fields. It cites Ley 1581 de 2012 and Decreto 1377 de 2013
  and must be completed with real business details before the site is promoted.
- Scope is Karma alone. Despite the README describing the codebase generically as
  "pensado para restaurantes", this is not a multi-tenant template and need not stay
  business-agnostic. The configurable name/logo/WhatsApp fields are operator
  convenience, not multi-tenancy.

## Brand Commitments

- **Name:** Karma. The project began as "Los Buñuelos" and was rebranded on
  2026-06-07; no Buñuelos naming or assets should resurface.
- **Tagline:** "Sabes lo que hiciste. Te lo mereces hoy." Used as the catalog's opening
  line and in link previews.
- **Mark:** an engraved-illustration fox in sunglasses, on transparent background.
  Shipped at `public/favicon.png` (128px) and `public/apple-touch-icon.png` (180px).
- **Committed palette and faces:** brand red `#FC0025`, cream `#E9E5A0`, near-black
  `#0D0D0D`; Anton for display (uppercase), Barlow for text. Recorded here as existing
  identity facts; their systemization belongs in DESIGN.md, not this file.
- **Voice:** informal Colombian Spanish, second person singular, a little cheeky and
  knowing. Never corporate.

## Evidence on Hand

- **Real assets:** the fox mark (paths above) and `public/og-image.jpg` (1200×630),
  composed from the 180px mark over the brand wash.
- **Missing asset to be aware of:** the full-resolution original logo is *not* in the
  repository. `src/assets/logo-bunuelos.png.asset.json` is a pointer to an external
  145 KB file under the old brand name. The largest mark actually available locally is
  180px, which is why the OG image cannot currently carry a crisp large logo.
- **Photography:** none in the repository. All product photos are owner-uploaded at
  runtime and live in the database.
- **Absences that must not be invented:** there are no testimonials, reviews, ratings,
  customer counts, press mentions, awards, or benchmark claims. None exist. Future
  surfaces must not fabricate social proof of any kind.

## Product Principles

1. **Direct or nothing.** The reason this exists is to route orders around
   commission-taking marketplaces. Any change that reintroduces an intermediary between
   customer and kitchen defeats the product.
2. **Nothing before the order.** No install, no account, no login, no email capture. Every
   step added ahead of "send order" is measured as a loss, not a feature.
3. **The link is the storefront.** For most customers this URL *is* Karma — it stands in
   for a website and a delivery-app listing simultaneously. How it appears when pasted
   into a chat is part of the product, not an afterthought.
4. **Money is a conversation.** The app states the total accurately and hands off; it
   never takes payment. Its obligation is that the number the customer sees is the number
   the kitchen quotes.
5. **One operator, low ceremony.** A single person maintains the entire menu alone. Edits
   must take effect immediately and be easy to undo.

## Accessibility & Inclusion

No standard was mandated by the business. As of the 2026-08-21 audit pass the shipped
bar is **WCAG 2.1 AA**, verified by computation rather than inspection: every
foreground/background pair in the token system meets 4.5:1 for body text, all controls
in the ordering path are at least 44×44px, `prefers-reduced-motion` has an intentional
reduced alternative rather than a blanket disable, and focus is visible on every
interactive element. Treat AA as the standing floor for new work.

Spanish is the only language. There is no i18n layer and none is planned; copy may be
written directly in Spanish rather than through translation keys.
