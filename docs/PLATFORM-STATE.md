# Platform State Map — Owner Audit
Adversarial multi-agent audit of the PRE-EXISTING platform (the white-label
funnel is documented separately). Classifies every page, API route, and AI
flow by what a paying user actually gets today. Generated from a fleet of
mapper + security/correctness probe agents; security findings were fixed in
the same change that added this map (see below).

## Headline
- **15 real**, **18 partial**, **21 mock**, **7 placeholder**, **28 broken** (of 89 surfaces).
- The marketing/roadmap pages claim "all AI tools fully functional"; the code does not support that claim. Most `src/ai/flows/*` are wired but several throw or return simulated data, and many tool pages render hardcoded arrays.

## Security findings — FIXED in this change
| Severity | Surface | Was | Now |
|---|---|---|---|
| CRITICAL | `POST /api/run` | Unauthenticated dispatch of ~50 AI flows (PII/cost/DoS) | Requires verified token + 60 runs/10min/user |
| CRITICAL | `src/services/database.ts` | `'use server'` exposed `saveUserData` etc. as public Server Actions callable with any uid | `server-only` module; onboarding routes through authed `/api/user/profile` |
| MEDIUM | `POST /api/flows/manage` | Admin flow-deploy surface, no auth | Gated by `ENTRESTATE_ADMIN_EMAILS` |
| LOW | `POST /api/events` | Trusted `uid` from request body | uid derived from verified token |

## Still open (cost/DoS, not fixed here)
- `GET /api/projects/scan` loads the entire `projects_catalog` then slices in-process — should push `.limit()`/filter into the query. Unauthenticated.

## BROKEN (28)
- `/api/chat (referenced but missing)` — The AI assistant chat UI POSTs into a 404 — every message a user sends to the assistant fails.
- `src/ai/flows/content/ai-brand-creator.ts` — Brand creator tool errors on every run with a model-resolution failure.
- `src/ai/flows/content/edit-pdf.ts` — PDF editor AI tool 500s on every run.
- `src/ai/flows/content/generate-landing-page.ts` — Landing page tool crashes; even fixed, output uses stock placeholder imagery, not project assets.
- `src/ai/flows/content/generate-social-post.ts` — Social post generation is unreachable from any tool ID; would crash on missing model even if wired.
- `src/ai/flows/content/rebrand-brochure.ts` — Rebranding tool fails at the first text-generation step; the working image step is never reached.
- `src/ai/flows/content/translate-brochure.ts` — Brochure translation 500s on every run.
- `src/ai/flows/content/ugc-script-writer.ts` — UGC script writer 500s on every run.
- `src/ai/flows/listing-crm/generate-listing.ts` — Core listing-description generator throws 'Must supply a model' on every use.
- `src/ai/flows/listing-crm/generate-payment-plan.ts` — Payment plan tool 500s on every run.
- `src/ai/flows/market-intelligence/generate-keyword-plan.ts` — Keyword planner 500s on every run.
- `src/ai/flows/market-intelligence/generate-market-report.ts` — Market report tool 500s; even fixed, reports contain unverified invented figures.
- `src/ai/flows/market-intelligence/generate-multi-offer.ts` — Multi-offer builder errors on every run with model-resolution failure.
- `src/ai/flows/market-intelligence/match-investors.ts` — Investor matching 500s on every run.
- `src/ai/flows/meta-pilot/generate-ad-from-brochure.ts` — Three separately-marketed tools are one identical text flow that 500s; no actual image/logo generation.
- `src/ai/flows/meta-pilot/instagram-content-creator.ts` — Clicking that prompt-library card fails with 'Tool with id "instagram-content-creator" not found'.
- `src/ai/flows/meta-pilot/manage-social-page.ts` — Instagram admin tool 500s; could never actually manage a page.
- `src/ai/flows/meta-pilot/meta-auto-pilot.ts` — The flagship 'auto-pilot' fails at step 2; even if fixed, it ends in a mock 'campaign-not-published' result.
- `src/ai/flows/meta-pilot/suggest-targeting-options.ts` — Audience creator 500s on every run.
- `src/ai/flows/sales/commission-calculator.ts` — Commission calculator 500s on every run.
- `src/ai/flows/sales/deals-smart-planner.ts` — Deals planner 500s on every run from both entry points.
- `src/ai/flows/sales/rewrite-sales-message.ts` — Message rewriter 500s on every run.
- `src/ai/flows/utility/lease-reviewer.ts` — Lease reviewer errors on every run with model-resolution failure.
- `src/ai/flows/utility/smart-input-router.ts` — The central command-bar intent router fails, breaking the primary 'type anything' workspace UX.
- `src/ai/genkit.ts` — Nearly every text-based AI tool (listing generator, translator, payment planner, targeting, sales tools, etc.) errors out with a 500 the moment a user runs it.
- `src/api/ (run/route.ts, user/projects/route.ts, user/knowledge/route.ts, user/knowledge-upload-url/route.ts)` — None at runtime (dead code), but developers editing these files see no effect — a maintenance trap. Should be deleted.
- `src/app/me/assistant/page.tsx (/me/assistant)` — The 'AI Command Center' chat fails on every single message with a canned turbulence error — the page's core feature does not function at all.
- `src/app/me/community/page.tsx (/me/community)` — Community board is permanently empty and every 'Publish Request' fails with an error toast; the AI intro generator pastes the same canned paragraph for everyone.

## MOCK (21)
- `src/app/api/flows/manage/route.ts` — Any UI built on this shows fake success: flows are never actually listed, deployed, or updated. Unauthenticated, so it is also harmless-but-noisy dead surface.
- `src/ai/flows/developer-backend/scan-for-alloydb.ts` — Tool would present entirely fictional database scan results; currently it just 500s.
- `src/ai/flows/developer-backend/sync-bayut-listing.ts` — User clicks 'sync to Bayut' and gets an error (or false success) — nothing is ever published to Bayut.
- `src/ai/flows/developer-backend/sync-property-finder-listing.ts` — Property Finder sync never reaches Property Finder; listings are not syndicated despite UI suggesting they are.
- `src/ai/flows/listing-crm/get-crm-memory.ts` — CRM assistant would hallucinate client history rather than recall real CRM data; currently 500s.
- `src/ai/flows/listing-crm/investigate-lead.ts` — If it ran, agents would receive fabricated 'intelligence' about real leads — actively dangerous output; today it 500s.
- `src/ai/flows/listing-crm/manage-whatsapp-campaign.ts` — Users believe WhatsApp campaigns are sent; no message ever leaves the system.
- `src/ai/flows/market-intelligence/deal-analyzer.ts` — Investment analysis would be based on numerically fabricated market values — financially misleading; currently 500s.
- `src/ai/flows/market-intelligence/get-market-trends.ts` — Trend reports would cite invented DLD/Bayut statistics presented as real; currently 500s.
- `src/ai/flows/meta-pilot/create-meta-campaign.ts` — Users who 'launch' a campaign get a plan document; no ads are ever created on Meta.
- `src/ai/flows/utility/chatbot-creator.ts` — This is the one tool that 'succeeds' — but it always returns the same static demo chatbot regardless of input; the embedded bot cannot actually chat.
- `src/app/me/clients/page.tsx (/me/clients)` — A paying user sees four fake clients they never created, cannot add a real one, and every action button is dead.
- `src/app/me/community/roadmap/page.tsx (/me/community/roadmap)` — User sees a static roadmap including a false 'all AI tools fully functional' completed item.
- `src/app/me/directory/page.tsx (/me/directory)` — User gets a static phonebook with fake agents, and connection requests go nowhere despite a 'Posted to the community!' confirmation.
- `src/app/me/flows/page.tsx (/me/flows)` — User builds an automation, is told it is 'live and will run 24/7', but it is lost on page refresh and never executes.
- `src/app/me/settings/page.tsx (/me/settings)` — User is told account/appearance/integrations were 'saved' or 'connected' when nothing was; billing page shows an invented subscription and card.
- `src/app/me/tool/bayut-sync/page.tsx (/me/tool/bayut-sync)` — 'Pull from Bayut' always returns the same fabricated listing with a fake quality score; 'Push' plays a fake 4-step progress animation and then fails (missing key / placeholder endpoint).
- `src/app/me/tool/listing-manager/page.tsx (/me/tool/listing-manager)` — The 'central listing hub' produces the same templated fake listing for any project, and 'asset verification' and 'admin requests' are staged — nothing touches a backend.
- `src/app/me/tool/listing-performance/page.tsx (/me/tool/listing-performance)` — User sees invented analytics for listings they don't own, and applying the 'AI suggestion' claims portal updates that never happen.
- `src/app/me/tool/property-finder-sync/page.tsx (/me/tool/property-finder-sync)` — Same as Bayut pilot: fabricated pulled listing and a push that animates progress then errors — no real portal sync occurs.
- `src/app/me/tool/vm-creator/page.tsx (/me/tool/vm-creator)` — User is told a Google Cloud VM is running at 34.68.123.145 every time; no VM is ever created.

## PLACEHOLDER (7)
- `src/api/run/route.ts` — No direct user impact (unreachable), but it invites edits to the wrong file and confuses audits.
- `src/ai/dev.ts` — No direct user impact, but developers cannot test any flow in the Genkit dev UI, which is how these bugs went unnoticed.
- `src/ai/flows/market-intelligence/market-reports.ts` — None (dead code) — but it confuses maintenance since two market-report flows coexist.
- `src/ai/flows/meta-pilot/create-email-campaign.ts` — Email campaign feature is unreachable from any UI.
- `src/ai/flows/meta-pilot/generate-social-post.ts` — None (dead code); duplicate maintenance hazard.
- `src/ai/flows/video/generate-tiktok-video.ts` — TikTok video feature is unreachable dead code.
- `src/app/me/community/documentation/page.tsx (/me/community/documentation)` — User looking for documentation gets an explicit coming-soon message and nothing else.

## PARTIAL (18)
- `src/ai/flows (simulated-data flows behind /api/run)` — Market reports, deal analyses, CRM memory, and DB scans look authoritative but are AI-invented numbers, not sourced data — a paying user could make investment decisions on hallucinated comps. Portal sync and PayPal lookups cannot work against production systems.
- `src/app/api/run/route.ts` — Tool executions run real LLM calls and return real generated content, but nothing is saved per-user (no uid), usage is unmetered/unbilled, and anyone can drain the Gemini quota anonymously. Several dashboard tools ('listing-manager', 'projects-finder', 'vm-creator', etc.) return error stubs.
- `src/app/api/user/knowledge/route.ts` — Files list and 'delete' appear to work, but deleted files silently remain in Cloud Storage: storage costs accrue and the file stays downloadable at its public storage.googleapis.com URL.
- `src/ai/flows/content/generate-story.ts` — Works only if the Gemini API key is configured and Veo quota exists; long Veo render likely exceeds serverless request timeout.
- `src/ai/flows/developer-backend/get-paypal-transaction.ts` — Real production PayPal transactions can never be found; only sandbox test data works.
- `src/ai/flows/video/edit-youtube-video.ts` — Users expecting to edit their YouTube video instead get an unrelated generated clip, and only if Veo 3 preview access exists.
- `src/ai/flows/video/generate-reel.ts` — Reel and aerial-view tools produce generic Veo output unrelated to the user's actual project assets, and only with API key/quota; aerial-view is not aerial-specific at all.
- `src/ai/flows/video/generate-video-presenter.ts` — Only works with API key + Veo access; likely times out in a serverless request; no audio/video muxing of the separate TTS and video outputs.
- `src/app/api/run/route.ts` — The dispatcher itself works, but most flows it dispatches to fail; three imported flows are unreachable; anyone can invoke paid AI flows unauthenticated.
- `src/app/me/brand/page.tsx (/me/brand)` — Saving brand and uploading/deleting files really persists; clicking 'Train AI' shows a fake progress and 'Training Complete!' toast, but no training/indexing ever happens, so the assistant never learns from the files.
- `src/app/me/discover/page.tsx (/me/discover)` — Basic keyword search and saving projects works; the two 'AI' tabs show the same three fabricated insights for every query, presented as live intelligence.
- `src/app/me/leads/page.tsx (/me/leads)` — Real CRM pipeline: leads (incl. voice-page leads) load and manual creation persists; but users cannot delete, email, or open a lead — those menu items silently do nothing.
- `src/app/me/marketing/page.tsx (/me/marketing, Marketplace)` — Browsing/search works and adding apps updates the workspace, but the installed-apps list is lost when switching browsers/devices despite the login requirement.
- `src/app/me/tool/creative-execution-terminal/page.tsx` — User gets genuine AI-generated ad copy and design, but the free-form 'task definition' is an illusion — only the first quoted string matters and only one hardcoded flow ever runs.
- `src/app/me/tool/deal-analyzer/page.tsx (/me/tool/deal-analyzer)` — User receives a real LLM-written investment analysis, but the underlying 'fetched market data' (Est. Value / Rent / Expenses) is deterministic pseudo-data, not market data — the numbers are meaningless for real decisions.
- `src/app/me/tool/meta-auto-pilot/page.tsx (/me/tool/meta-auto-pilot)` — A real AI campaign *plan* is generated, but despite the 'create and launch a complete Meta ad campaign' promise, nothing is published to Meta, progress bars are staged, and the final plan can't even be viewed.
- `src/app/me/tool/projects-finder/page.tsx (/me/tool/projects-finder)` — Market search and personal library genuinely work; the 'AI screening' request silently discards the submission after a success toast.
- `src/app/me/tool/prompt-library/page.tsx (/me/tool/prompt-library)` — Prompt browsing/search works; two of the four filter controls do nothing when changed.

## REAL (15)
- `src/app/api/events/route.ts` — Analytics events are genuinely logged. But anyone on the internet can spam the collection or spoof events under any uid, polluting analytics and running up Firestore write costs.
- `src/app/api/leads/route.ts` — Lead list and manual lead creation work end-to-end for authenticated users; data persists per user in Firestore.
- `src/app/api/projects/scan/route.ts` — Catalog search returns real data today. Cost/latency scale linearly with catalog size on every keystroke-search; at thousands of docs this becomes slow and expensive, and it is an unauthenticated full-catalog dump endpoint.
- `src/app/api/projects/suggest/route.ts` — Users get real catalog projects as suggestions, but 'suggestions' are just the first N docs in query order — not newest, not ranked. Also fetches every project in the country per request.
- `src/app/api/user/knowledge-upload-url/route.ts` — Knowledge-base uploads genuinely work (signed URL + metadata record). A user could register a bogus fileUrl for themselves, but cannot write to another user's storage path.
- `src/app/api/user/profile/route.ts` — Profile read/save persists to Firestore. Side effects: any profile save marks onboarding complete, and the user can merge arbitrary keys onto their own user doc (dangerous if plan/role/entitlement fields live there).
- `src/app/api/user/projects/route.ts` — Saving/removing tracked projects works and persists. A user can write arbitrary fields into their own project docs (schema pollution, not a cross-user leak).
- `src/lib/api-helpers.ts + src/lib/firebaseAdmin.ts` — Authentication, where used, is legitimate — no header-trusting shortcuts. Misconfigured server creds produce raw 500s instead of the intended 'Firebase Admin is not initialized' message.
- `src/app/me/community/academy/page.tsx (/me/community/academy)` — Redirects correctly to the public academy page.
- `src/app/me/page.tsx (/me)` — Works as intended: logged-in users land on /me/workspace, others go to /login.
- `src/app/me/sitemap/page.tsx (/me/sitemap)` — Redirects correctly.
- `src/app/me/solutions/page.tsx + [slug]/page.tsx (/me/solutions)` — Redirects correctly to public solutions pages.
- `src/app/me/tool/[toolId]/page.tsx (generic tool runner)` — Generic AI tools genuinely run server-side Genkit flows and return generated output (landing page live preview, JSON, etc.).
- `src/app/me/tool/deals-smart-planner/page.tsx (/me/tool/deals-smart-planner)` — Interactive AI deal-planning genuinely generates each next step from the LLM based on user answers.
- `src/app/me/workspace/page.tsx (/me/workspace)` — Dashboard shows the user's real saved projects; the apps grid resets on a new device/browser because it lives only in localStorage.

## Remediation progress (this change)

- **`/me/assistant` + global chat were BROKEN** — both POSTed to `/api/chat`,
  which did not exist; every message errored. Built a real, authenticated,
  rate-limited `/api/chat` backed by a new grounded assistant flow
  (`src/ai/flows/utility/assistant-chat-flow.ts`) that answers in the platform
  voice and routes intent to real tools by id.
- **Honesty fixes** (stopped the UI lying to paying users):
  - `/me/flows` no longer claims a built flow is "live and will run"; it says
    the builder saves a draft and execution is coming.
  - `/me/community/roadmap` removed the false "all AI tools fully functional"
    completed item; replaced with the shipped AI Voice Landing Pages.
  - `/me/clients` now carries a "sample data" banner (`PreviewBanner`).

## Owner's remediation priority
1. **Truth in UI first** — replace mock pages (`/me/clients`, `/me/directory`, `/me/flows`, roadmap) with either real data or an honest "coming soon", so the product stops overpromising to paying users.
2. **The broken assistant** — `/me/assistant` and `global-chat` POST to `/api/chat`, which does not exist; every message errors. Either build `/api/chat` or point them at `/api/run` (now authenticated).
3. **Flows that throw** — triage `src/ai/flows/*` marked broken; each is a tool a user can invoke and get an error from.
4. **Dead duplicate tree** — `src/api/` (outside `src/app/`) is unreferenced dead code shadowing the real routes; delete to avoid confusion.
