---
name: Karma
description: Late-night Colombian fast food and asados, ordered direct by WhatsApp.
colors:
  karma-red: "oklch(0.624 0.254 25.9)"
  karma-red-fill: "oklch(0.594 0.242 25.9)"
  karma-red-type: "oklch(0.64 0.244 25.9)"
  bone-cream: "oklch(0.909 0.088 105.2)"
  verdict-black: "oklch(0.159 0 0)"
  slab: "oklch(0.218 0 0)"
  ash: "oklch(0.26 0 0)"
  smoke: "oklch(0.68 0 0)"
  bone-white: "oklch(1 0 0)"
  hairline: "oklch(1 0 0 / 16%)"
typography:
  display:
    fontFamily: "Anton, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 1.875rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Anton, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
  title:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "0.006em"
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.3
  stamp:
    fontFamily: "Anton, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.35em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.karma-red-fill}"
    textColor: "{colors.bone-white}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 2rem"
    height: "3rem"
  button-primary-hover:
    backgroundColor: "{colors.karma-red}"
    textColor: "{colors.bone-white}"
  button-secondary:
    backgroundColor: "{colors.bone-cream}"
    textColor: "{colors.verdict-black}"
    rounded: "{rounded.md}"
    padding: "0 2rem"
    height: "3rem"
  button-icon:
    backgroundColor: "{colors.slab}"
    textColor: "{colors.bone-white}"
    rounded: "{rounded.full}"
    height: "44px"
    width: "44px"
  category-pill:
    backgroundColor: "{colors.karma-red-fill}"
    textColor: "{colors.bone-white}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  category-pill-inactive:
    backgroundColor: "transparent"
    textColor: "{colors.smoke}"
  product-card:
    backgroundColor: "{colors.slab}"
    textColor: "{colors.bone-white}"
    rounded: "{rounded.2xl}"
    padding: "12px"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.bone-white}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  badge-discount:
    backgroundColor: "{colors.karma-red-fill}"
    textColor: "{colors.bone-white}"
    rounded: "{rounded.full}"
    padding: "2px 6px"
---

# Design System: Karma

## Overview

**Creative North Star: "The Midnight Verdict"**

Karma is named for a reckoning, and the interface treats it that way. The tagline is an
accusation with a reward attached — *Sabes lo que hiciste. Te lo mereces hoy.* — and the
whole system is built to deliver that line without blinking: near-black ground, one
saturated red that behaves like a sentence being handed down, and an engraved fox in
sunglasses who has already decided. Nothing here apologizes or softens. This is a menu
you open at 11pm knowing exactly why.

The execution is **graphic and poster-like** rather than software-like. Components read as
printed shapes — solid fills, fully-round pills, uppercase Anton set tight — closer to
apparel graphics or a gig poster than to app chrome. Surfaces are flat and stacked by
tone, not by shadow. Where light does appear it is red and it *emits*: the glow under a
product card or the cart button is the object burning, not the object floating.

The one restraint in the system is cream. It is the only warm thing on the page, and it
appears where the interface is handing something over — the add-to-cart button, the cart
count, the focus ring. Its scarcity is currently more severe than it needs to be, and the
system is being pushed to use it more (see **The Cream Rule**).

**Key Characteristics:**
- Near-black ground (`verdict-black`) with tonal layering, never neutral drop shadows
- One hue of red doing three separate, non-interchangeable jobs
- Anton in uppercase for every heading; Barlow carries all reading
- Fully-round pills for anything you touch; 16px sheets for anything that contains
- Red light as emission, never as elevation
- Nothing in the ordering path smaller than 44×44px

## Colors

A three-value world — red, cream, black — where the red is the voice, the black is the
room, and the cream is the only kindness.

### Primary
- **Karma Red** (`karma-red`): The identity red, and the brightest of the three. Reserved
  for atmosphere and emission — the radial washes behind the page, the halo shadows, the
  gradient on primary CTAs, the loader's pulse ring. This is the red you feel rather than
  read.
- **Karma Red Fill** (`karma-red-fill`): The working red. Every solid interactive fill —
  primary buttons, the active category pill, the discount badge, admin tabs. Sits a hair
  below the identity red in lightness so white text on it clears 4.5:1; the difference is
  invisible to the eye and load-bearing for legibility.
- **Karma Red Type** (`karma-red-type`): Red *as text* on dark ground — prices, headings,
  inline errors, the privacy-policy h1. Slightly lighter again, because the identity red
  fails against the card surface when set as type.

### Secondary
- **Bone Cream** (`bone-cream`): The single warm value. Carries the add-to-cart button,
  the cart count badge, and the focus ring on every control. Against the red fill it is
  the only pairing in the system with real warmth-to-heat contrast.

### Neutral
- **Verdict Black** (`verdict-black`): The page. Not pure black — a measurable step above
  it, so the card surface has somewhere to sit.
- **Slab** (`slab`): Cards, popovers, dialogs, the admin header. The first tonal step up.
- **Ash** (`ash`): Recessed wells — the quantity stepper track, muted panels, inactive
  admin tabs. The second step up.
- **Smoke** (`smoke`): Secondary text, inactive pill labels, helper copy, list markers.
- **Bone White** (`bone-white`): Primary text and every label sitting on a red fill.
- **Hairline** (`hairline`): Borders and dividers. White at low alpha rather than a grey,
  so it reads consistently over both the page and the card.

### Named Rules

**The Three Reds Rule.** One hue (25.9°), three jobs, never interchangeable. `karma-red`
emits, `karma-red-fill` fills, `karma-red-type` is read. Substituting any one for another
either breaks WCAG AA or kills the brand accuracy — the three exist precisely because no
single value can do all three jobs. If you need a red and don't know which, you need
`karma-red-fill`.

**The Cream Rule.** Cream is never a background and never a large region. It marks the
moment the interface hands something to the customer — *add this*, *this is yours*, *you
are here*. Its power is scarcity, but the current implementation under-spends it: cream
should be reaching more of the confirmation and success moments than it does today.
Expand it into those, not into surfaces.

**The No Grey Text Rule.** Secondary text is `smoke`, a true neutral, because the surfaces
underneath are true neutrals. Do not tint secondary text toward the red to "warm it up" —
on this ground it reads as a failed link, not as brand.

## Typography

**Display Font:** Anton (with `system-ui, sans-serif`)
**Body Font:** Barlow (with `system-ui, sans-serif`), weights 400/500/600/700

**Character:** Anton is a single-weight condensed grotesque that only knows how to shout;
Barlow is a neutral, slightly squared workhorse that never competes with it. The pairing
is deliberately unbalanced — one voice declares, the other explains — which is why every
Anton setting is uppercase and every Barlow setting is sentence case. There is no middle
register, and adding one would dilute both.

### Hierarchy
- **Display** (700, fluid 1.5→1.875rem, 1.1, +0.02em, uppercase): The catalog's opening
  line and page-level titles. One or two lines, never a paragraph.
- **Headline** (700, 1.25rem, 1.2, +0.02em, uppercase): Dialog and sheet titles — product
  detail, checkout, promo popups, "Estamos cerrados".
- **Title** (600, 1rem, 1.25): Product names in the grid and cart rows. Barlow, not Anton —
  product names are read, not proclaimed.
- **Body** (400, 1rem, 1.75, +0.006em): All reading copy. Constrained to ~65ch on the
  legal surface. The generous leading and the fractional positive tracking are
  compensation for light-on-dark: white type on near-black blooms optically and sets
  tighter than it measures.
- **Label** (700, 0.75rem, 1.3): Field labels, status pills, price breakdown rows, helper
  text. Small, dense, high-weight.
- **Stamp** (400, 0.6875rem, +0.35em, uppercase): A signature treatment, currently used
  once — "CARGANDO" beneath the loader. Extreme letterspaced Anton at small size. Reserve
  it for moments of waiting or ceremony; it stops being a signature if it appears twice
  on one screen.

### Named Rules

**The Anton Shouts, Barlow Explains Rule.** Anton is uppercase, always, and never carries
more than two lines at mobile width. The moment a heading needs a third line it is not a
heading — cut it or demote it to Title.

**The Tabular Money Rule.** Any figure that appears in a vertical stack — cart line items,
the price breakdown, totals — is set with `tabular-nums`. Proportional digits make columns
of pesos wobble, and this product's whole credibility rests on the number being right.

## Layout

A single centred column at `max-w-5xl` (64rem) with `1rem` gutters carries the catalog and
the admin panel alike; reading surfaces drop to `34rem` (~65 characters) because the app
container is nearly a third too wide for continuous prose.

The product grid is **two columns on phones, three from `md` (768px)** — deliberately not
one, because a single column turns a fifteen-item menu into a scroll marathon and hides
the range. Gutters step from `12px` to `16px` at `sm`. Card imagery is a locked square, so
the grid's rhythm holds regardless of what the owner uploads.

The header is sticky, translucent (`bg-background/85`) with a `blur(12px)` backdrop, and
carries a horizontally scrollable category bar with its scrollbar hidden. The cart summary
is a fixed pill floating above the content, offset by `env(safe-area-inset-bottom)` so it
clears the iOS home indicator; the page reserves `8rem` plus that inset at its foot so the
bar never covers the last row.

Breakpoints are Tailwind's defaults and only `sm` (640px) and `md` (768px) are actually
used. The system is phone-first in the truest sense: the desktop view is the phone view
with more columns, not a different composition.

## Elevation & Depth

**This system has no shadows in the conventional sense.** Depth is tonal: `verdict-black`
for the page, `slab` for anything raised, `ash` for anything recessed, with a `hairline`
border marking the seam. Three tones and one border line do all the structural work.

What looks like shadow is light. The two glow tokens are red, offset downward, and heavily
blurred — they describe an object that is *emitting*, not an object casting a shadow onto
a surface below it. This is why they are brand-coloured rather than black, and why they
belong on the things that are meant to feel hot: the primary cart button, product cards,
the active category pill.

### Shadow Vocabulary
- **Card glow** (`0 4px 20px -2px` at 30% `karma-red`): Product cards, the cart FAB, the
  add button. The default emission.
- **Soft glow** (`0 2px 10px -2px` at 20% `karma-red`): The sliding category indicator and
  admin cards. Half the intensity for elements that are supporting rather than primary.

### Named Rules

**The Light, Not Lift Rule.** The red glow means an object is emitting, never that it is
floating. It therefore never appears on a surface that is merely *above* another surface —
dialogs, sheets and popovers get tone and a hairline border, not glow. If you find
yourself adding glow to communicate stacking order, use a tonal step instead.

**The Three Tones Rule.** There are exactly three surface tones. A fourth means the
information architecture is too deep, not that the palette is too small.

## Shapes

Two silhouettes, and nothing between them.

**Anything you touch is a pill.** Fully round (`9999px`): category pills, quantity
steppers, the cart FAB, the add button, status chips, the discount badge, payment-method
chips. At 44×44 a fully-round control reads as a physical button rather than a region of a
form.

**Anything that contains is a sheet.** Product cards are `16px`; dialogs, sheets and admin
panels are `8–12px`; buttons and inputs are `6px`. The radius shrinks as the element gets
more utilitarian.

Borders are a single hairline of white at 16% — never a heavier rule, never a coloured
left-border accent. Product imagery is clipped to a square by its container rather than
cropped in the asset, so an owner uploading any aspect ratio still produces a regular grid.

### Named Rules

**The Pill or the Sheet Rule.** Fully round, or 16px and under. A `24px` radius on an
interactive element is neither, and reads as a mistake in both directions.

## Components

### Buttons
- **Shape:** Subtly rounded (`6px`), full-width in every ordering context.
- **Primary:** The brand gradient (135°, `karma-red` into a darkened stop) with `bone-white`
  label at `3rem` tall, `2rem` horizontal padding. Used for every commit action — add to
  cart, send by WhatsApp, save.
- **Secondary:** Solid `bone-cream` with `verdict-black` label. The add-to-cart circle on
  each product card is this treatment in pill form.
- **Ghost / Outline:** Transparent with a hairline border, `smoke` label. Cancel and
  dismiss only.
- **Hover / Focus:** Hover lifts opacity or scales `1.05–1.1`; focus draws a `2px`
  `bone-cream` outline at `2px` offset. Controls clipped by an ancestor use a `-3px` inset
  offset instead so the ring is not cut away.
- **Disabled:** 50% opacity, pointer events off.

### Chips
- **Category pill:** Label-scale Barlow at 600, `8px 16px`, fully round. Inactive is
  transparent with a `smoke` label; the active state is *not* a background on the pill
  itself but a separate sliding indicator beneath it (see below).
- **Status chip:** `11px` bold in a 20%-alpha wash of its semantic colour with a
  30%-alpha border — green for open, red for closed, yellow for scheduled.

### Cards / Containers
- **Corner Style:** `16px` — the most generous radius in the system.
- **Background:** `slab`, with a `hairline` border at 60% alpha.
- **Shadow Strategy:** Card glow (see Elevation & Depth).
- **Internal Padding:** `12px`, with `48px` reserved at the foot so the floating add button
  never collides with the price.
- **Hover:** Rises `2px` and the image scales `1.05` behind a clipped corner.

### Inputs / Fields
- **Style:** Transparent fill, hairline border, `6px` radius, `44px` tall.
- **Type size:** `1rem` on mobile, dropping to `0.875rem` from `md` — the 16px floor is
  deliberate, since iOS Safari force-zooms any focused input below it.
- **Focus:** `2px` `bone-cream` outline at `2px` offset. Caret is `karma-red-type`.
- **Error:** `aria-invalid` plus a `karma-red-type` message directly beneath the field,
  naming both the problem and the fix.

### Navigation
- **Category bar:** Horizontally scrollable, scrollbar hidden, sticky under the header.
  Selection is carried by a sliding pill indicator, not by restyling the pills.
- **Mobile treatment:** Identical. There is no separate mobile navigation because there is
  no desktop navigation to collapse.

### Sliding Category Indicator (signature)
A `karma-red-fill` pill that sits *behind* the category labels and animates between them,
`220ms` on `cubic-bezier(0.16, 1, 0.3, 1)`. Position moves via `translate3d` on the
compositor; width transitions directly, because `scaleX` would distort the end caps of a
fully-round pill into ellipses mid-flight. It re-measures on resize, on category change,
and on `document.fonts.ready` — Anton loads asynchronously and changes every label's width
underneath an indicator that has already been drawn.

### Loading Screen (signature)
The mark fills with colour from bottom to top over `1.6s` via an animating `clip-path`, a
greyscale copy beneath showing the unfilled state, behind a slow red pulse ring — a glass
filling. Under `prefers-reduced-motion` the vertical sweep is replaced by an opacity pulse
so the screen still reads as *working* rather than *stuck*.

## Do's and Don'ts

### Do:
- **Do** pick the red by job, not by eye: `karma-red-fill` behind white text,
  `karma-red-type` for red text on dark, `karma-red` for glow and gradient.
- **Do** set every stacked figure in `tabular-nums`.
- **Do** keep all ordering-path controls at 44×44 or larger, including on desktop — the
  admin runs on an iPad, which is a touch surface.
- **Do** give reduced-motion an intentional substitute that preserves the meaning, the way
  the loader swaps its sweep for a pulse. A blanket `0.01ms` kill is a bug.
- **Do** use `-3px` inset focus offset for any control whose ancestor clips with
  `overflow: hidden`; an outward ring is silently erased there.
- **Do** hold prose to ~65ch and let the app container stay at 64rem.

### Don't:
- **Don't** put the red glow on dialogs, sheets or popovers. They are above, not hot.
- **Don't** introduce a fourth surface tone, a heavier border, or a coloured left-border
  accent.
- **Don't** set Anton in sentence case, or let a heading run past two lines on a phone.
- **Don't** let cream become a background or fill a large region — expand its reach into
  confirmation moments, not its area.
- **Don't** animate the category indicator with `scaleX`; it deforms the pill's end caps.
- **Don't** add a `dark:` variant. This is a single-theme system by choice — there is no
  light mode, and the `dark` custom variant left in the stylesheet is vestigial.
- **Don't** reach for a shadow to express stacking. Use a tonal step.
