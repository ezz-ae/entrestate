# Entrestate Product Catalog — One Platform, Sellable Cuts

Strategy: the white-label OS is ONE platform; every sellable "system" below is
an entitlement cut of it, not a separate codebase. Entitlements live where they
already live today: the tenant registry (`api.client_configs`: tier +
allow-lists) and the Service Card model. A tenant's tier decides which cards
light up. Upgrading = flipping entitlements, never migrating.

Every product is sold the same way: its own focused ad + its own `/pitch`-style
AI-call landing page, one language per campaign (AR → RU → UR), demo built live
during the call.

## The wedge (sell first)

### 1. AI Voice Landing Pages — "your page talks to the buyer"
A real-estate landing page where an AI voice agent calls the visitor **in the
page** and personalizes the canvas on the spot (project, budget, language).
- **Engine:** already shipped — `/pitch` + seller-agent + morph (this repo).
  Repackage per-tenant, per-listing: agent prompt = the listing's data.
- **Why first:** market-first, demos itself, cheapest to ship, and every buyer
  is a warm upgrade path into everything below.
- **Pricing shape:** per page/month + AI minutes. Entry SKU.

## Inventory & web

### 2. Listing-to-Landing — full market as your site
Every market project becomes a listing + conversion landing page under the
client's domain/brand. Backed by the market catalog + `api.listings_feed`
(live in Neon; ORE's landing-page engine is the reference implementation).
- **Ship:** data feed + branded page renderer per tenant. Medium lift.

### 3. From-Site Multi-Styles — SHIPPED
Free tool at `/styles`: paste a site URL → four art directions (faithful,
dark-luxury, minimal-light, bold-modern) rendered as live mini-site previews,
each CTA'ing into /pitch. Flow: `whitelabel/multi-styles.ts`;
API: `POST /api/whitelabel/styles`.

## Demand generation

### 4. Meta Real-Estate AI Ads Manager
Campaigns, creatives from brochures, Instagram content — meta-pilot flows
exist in this repo; ORE has the Meta account client + ad image upload.

### 5. Google AI Ads Machine
Keyword plans (flow exists), RSA generation + marketing expert agent (exist in
ORE, port over). Sell 4+5 separately, price as a bundle.

## Leads & operations

### 6. Smart CRM
Leads, pipeline, AI prioritization/coaching. Partial in both repos; the leads
API here is still mock — this is a real build. Sells best attached to 4/5/7,
not alone.

### 7. AI Lead Distribution + Quality Measurement
Routing engine: score every lead (source, intent, response history), route to
the right agent, measure agent response quality, feed scores back into ad
spend. New build on top of 6.

### 8. Brokerage Lead Ad-Points System
Internal lead marketplace: brokerage funds ad spend, agents spend points to
receive leads; quality scores (from 7) set point prices. Requires billing +
7 first. Ship last — highest stickiness once live.

### 9. The Full Server (white-label OS)
Everything above under one brand + domain — the top tier, sold by the
AI call that builds it live (docs/WHITELABEL-FUNNEL.md).

## Suggested ladder

| Tier | Contents | Anchor |
|---|---|---|
| Voice Pages | 1 (+3, live at /styles) | entry, self-serve |
| Growth | 1 + 2 + (4 or 5) | most campaigns land here |
| Brokerage | + 6 + 7 + both ads managers | team seat pricing |
| OS / Empire | everything incl. 8, own domain | the full-server sale |

Sequencing: 1 → 3 → 2 → 4/5 → 6 → 7 → 8, with 9 (the OS) sold from day one to
whoever asks — its demo funnel already works.

Rule unchanged: none of this touches Freehold's system, data, or brand.
