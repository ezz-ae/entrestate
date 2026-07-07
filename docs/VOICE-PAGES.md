# AI Voice Landing Pages — the self-serve ad product

The first sellable SKU (catalog #1), fully creatable from a user's Entrestate
account: a landing page whose destination IS a live AI voice conversation
about one listing, with the canvas personalizing on the spot. The user points
their ad at the page URL; captured buyers land in their CRM.

## User journey

1. **Create** — `/me/voice-pages` ("Voice Pages" in the workspace nav):
   listing details + call language (en/ar) + brand, prefilled from the Brand Kit.
2. **Publish** — page goes live at `/v/[slug]`; copy the ad URL.
3. **Advertise** — the URL is the ad destination (Meta/Google/TikTok).
4. **Convert** — the buyer talks (voice or text) to the page's AI advisor;
   the agent answers ONLY from the listing facts, steers the canvas
   (`focus`: overview/price/payment/location/contact scroll + highlight),
   and earns name + phone.
5. **Lead** — captured server-side into `users/{uid}/leads` with
   `source: 'voice-page'`, visible in `/me/leads`; `leadCount` shows in the studio.
6. **Own domain** — save a domain on the page; DNS CNAME to the app host plus
   registering the domain with hosting (SSL) makes the page serve at `/` of
   that domain via `src/middleware.ts` host rewriting (`/v/~<host>`).

## Pieces

| Piece | Path |
|---|---|
| Model | `VoicePage`, `VoicePageListing` in `src/types.ts` |
| Service (Firestore `voicePages`) | `src/services/voice-pages.ts` |
| Buyer agent flow | `src/ai/flows/whitelabel/buyer-agent.ts` (+ `schemas.ts`) |
| Owner CRUD APIs | `GET/POST /api/voice-pages`, `PATCH/DELETE /api/voice-pages/[id]` |
| Public conversation API | `POST /api/voice-pages/agent` (loads page server-side; persists leads) |
| Public page | `src/app/v/[slug]/` |
| Studio | `src/app/me/voice-pages/page.tsx` |
| Custom-domain routing | `src/middleware.ts` |

## Guardrails

- The client never supplies listing facts to the agent — the API loads the
  page by slug server-side, so a visitor cannot puppet the brand's agent.
- The agent may state only the listing facts; anything else becomes a
  callback reason (which is the lead-capture moment by design).
- Lead PII is persisted server-side and not echoed back in the API response.
- Public lookups only ever return `published` pages; CRUD is owner-checked.

## Analytics & metering (shipped)

- Per-page funnel counters: `views` → `calls` → `leadCount`, plus `turnCount`
  (AI turns served). Beacon: `POST /api/voice-pages/track` (public,
  best-effort, published pages only); turns metered server-side in the agent
  API into `users/{uid}/usage/{YYYY-MM}.voiceTurns`
  (`GET /api/voice-pages/usage` shows the month in the studio header).
- The studio "New page" form can prefill from a market project
  (`GET /api/voice-pages/projects?q=` prefix search over `projects_catalog`).

## Audit fixes (shipped)

Adversarial multi-agent audit of this surface; confirmed defects fixed:

- **CRITICAL** Firestore rejected `undefined` field values, crashing tenant
  provisioning and voice-page creation for any unset optional field. Enabled
  `ignoreUndefinedProperties` at init (`firebaseAdmin.ts`) — fixes the whole class.
- **HIGH** TTS-cancel fired `onend` → reopened the mic while the next reply was
  speaking, so the agent transcribed its own voice and looped (billed turns).
  Utterance handlers are now detached before any cancel (both /pitch and /v).
- **HIGH** Buyer mic input is ignored while a turn is in flight (no more
  concurrent turns erasing each other's messages); both clients clean up mic +
  TTS on unmount.
- **MEDIUM** Public tenant endpoint no longer returns the claimer's phone.
- **MEDIUM** Voice-page PATCH restricted to status/locale/customDomain — the
  free-form brand/listing maps could wipe required fields.
- **MEDIUM** Custom domains are now uniqueness-checked (takeover guard).
- **HIGH** Seller-agent history capped (per-message 2000 chars, 60 turns).

## Known-open (tracked, not yet fixed)

- Rate-limit keys use the leftmost `X-Forwarded-For` hop, spoofable depending on
  the host; harden once the production proxy's trusted header is known.
- `rateLimits` docs accumulate; add a scheduled purge or Firestore TTL policy
  (needs `resetAt` as a Timestamp).
- Slug reservation is check-then-write (no transaction); low collision odds at
  current volume, but should move into a transaction before scale.
- Locale toggle mid-call doesn't rebind the running recognition loop.

## Rate limits & quotas (shipped)

All public endpoints are limited via a Firestore fixed-window limiter
(`src/lib/whitelabel/rate-limit.ts`, fails open). Env-tunable knobs:

| Env var | Default | Guards |
|---|---|---|
| `WL_PROVISION_IP_HOURLY` | 6 | /pitch tenant provisioning per IP/hour |
| `WL_SELLER_TURNS_IP_10MIN` | 40 | seller-agent turns per IP/10 min |
| `WL_BUYER_TURNS_IP_10MIN` | 60 | buyer-agent turns per IP/10 min |
| `WL_BUYER_TURNS_PAGE_DAILY` | 1000 | turns per voice page per day |
| `WL_STYLES_IP_HOURLY` | 10 | /styles generations per IP/hour |
| `WL_TRACK_IP_10MIN` | 120 | analytics beacons per IP/10 min |
| `WL_OWNER_TURNS_MONTHLY` | 0 (off) | owner's monthly turn quota — set per tier |

When the owner quota is hit the buyer agent politely degrades to the page's
contact details; the pricing tiers plug in by setting `WL_OWNER_TURNS_MONTHLY`
per plan (or replacing the env lookup with a per-user plan lookup).

## Revenue capture & brand sites (shipped)

- `/pricing?claim=[tenantSlug]` shows the claim banner: the prospect's demo,
  a name/phone/email form → `POST /api/whitelabel/claim` stores the intent in
  `claims` (status `new`) and flips the tenant to `claimed` (expiry stops).
- Every provisioned /pitch demo is logged to `pitchSessions` — claimed or
  not, it's a sales lead for Entrestate's own pipeline.
- `/b/[brandSlug]` — a brand's public mini-site: all its published voice
  pages under one shareable URL (link shown in the studio header).

## Next

- Per-plan quota lookup (replace the global env with the user's tier).
- Ops view for `claims` + `pitchSessions` (today: read via Firestore console).
- Swap browser speech for the hosted voice stack when the kloom source lands.
- Automated domain provisioning via the hosting API (today: DNS instructions).
