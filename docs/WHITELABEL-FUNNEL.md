# White-Label AI-Call Funnel

The demo-led sales funnel for the Entrestate white-label OS: an ad click lands
in a live conversation with an AI seller, and by the end of the call the
prospect is looking at **their own branded system**, provisioned during the
conversation.

```
Ad (Instagram/TikTok, ?lang=ar for Arabic) 
  → /pitch                 one button, in-browser voice or text call
  → seller agent           collects company name + website
  → POST /api/whitelabel/provision
       scrape site → extract brand (Gemini) → create tenant → seed listings
  → /pitch morphs          page re-themes into the prospect's brand, live
  → /demo/[slug]           their system, live for 7 days
  → /pricing?claim=[slug]  claim converts the demo into the account
```

## Pieces

| Piece | Path |
|---|---|
| Tenant model | `Tenant`, `TenantBrand`, `TenantListing` in `src/types.ts` |
| Tenant service (Firestore `tenants`) | `src/services/tenants.ts` |
| Brand scraper (no headless browser) | `src/lib/whitelabel/scrape.ts` |
| Demo seed inventory | `src/lib/whitelabel/seed-listings.ts` |
| Brand-extraction flow (Genkit + Gemini 2.5 Flash) | `src/ai/flows/whitelabel/extract-brand.ts` |
| Seller agent flow (en/ar, action-driven) | `src/ai/flows/whitelabel/seller-agent.ts` |
| Shared Zod schemas | `src/ai/flows/whitelabel/schemas.ts` |
| Provision API (public, synchronous) | `POST /api/whitelabel/provision` |
| Tenant read API | `GET /api/whitelabel/tenant/[slug]` |
| Agent turn API | `POST /api/whitelabel/agent` |
| Landing experience | `src/app/pitch/` |
| Branded demo system | `src/app/demo/[slug]/` |

## How the call works

The seller agent is stateless: the client sends the transcript plus a small
state object each turn and executes the returned `action`:

- `provision` — the agent has both company name and website; the client fires
  the provision API in the background while the conversation continues.
- `reveal` — the tenant is live; the page has morphed and the agent narrates.
- `close` — invite to claim; the mic is not re-opened after this turn.

Voice is the browser's Web Speech API (`SpeechRecognition` + `speechSynthesis`,
`ar-SA`/`en-US`). Chrome/Edge/Safari get full voice; everywhere else falls back
to text seamlessly. Swapping in a hosted voice stack (Vapi/Retell/Gemini Live)
later only replaces the I/O layer — the agent flow and its action contract stay.

## Language strategy

One language per campaign. `?lang=ar` runs the entire call, provisioning
tagline, and demo UI in Arabic (RTL). Add a locale by extending the `COPY`
table in `pitch-client.tsx`, the locale enums in `schemas.ts`/`types.ts`, and
the agent prompt's locale rule — the flows are already locale-parameterized.

## Guardrails

- Demo tenants expire after 7 days (`expiresAt`, enforced on read).
- The scraper refuses non-public hosts (SSRF guard) and never runs scripts.
- Prospect listings are only shown when genuinely found — the extraction
  prompt forbids inventing listings; seeds are labeled "demo".
- The funnel and its data live entirely in this repo/Firestore. No Freehold
  data, branding, or infrastructure is involved anywhere.

## Runtime requirements

`GEMINI_API_KEY` (Genkit googleAI plugin) and Firebase Admin credentials
(Firestore) — the same env this app already needs. No new services.

## Not built yet (next)

- Stripe checkout behind `/pricing?claim=[slug]` (today it lands on pricing).
- Wildcard subdomains (`[slug].entrestate.com`) backed by the same tenant doc.
- Hosted voice (Vapi/Retell or Gemini Live) for phone-quality Arabic.
- Rate limiting on the public provision endpoint before paid traffic.
- The deep OS modules behind the demo shell — CRM, WhatsApp, ads — porting in
  from the platform blueprint (see ORE `docs/entrestate/WHITELABEL-BLUEPRINT.md`).
