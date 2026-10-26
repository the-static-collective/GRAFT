# BANANAGRAM POCKET 001

The July 2026 idea with a usable browser doorway: **need / offering back (optional) / if this succeeds**, then optional **Trace, Tension, First Yes, Fruit/Seed/Compost**, and an independent explicitly reviewed proposal-only crossing. The app has **no storage, authentication, telemetry, model, send button, AI inference, or mutable community backend**. It cannot record a delivery or accept an institutional pledge.

## Run locally

From the root of the GRAFT checkout (Node for tests, Python for static serving):

```sh
python3 -m http.server 8000
# Open http://localhost:8000/reentry/jubilee-banana/pocket/
node --test reentry/jubilee-banana/tests/*.test.mjs
node reentry/jubilee-banana/pocket/build-edge.mjs
```

A page refresh discards all entries. **Private JSON download** is an explicit user action; the downloaded file can contain personal notes typed by its author and should not be publicly shared. The separate **reviewed redaction** flow will not copy private traces or tensions automatically and requires three deliberate checkboxes. The optional outgoing JSON remains an inert proposal with eight explicit false authority claims, never a message or community request.

The browser interface uses source modules directly: `pocket/app.mjs` → `gram/portable-gram.mjs` → `bridge/gram-reentry.mjs` → `bridge/participation-bridge.mjs`. Do not hand-edit generated `edge/assets.ts`.

## Deploy public, still local-only in effect

`pocket/build-edge.mjs` packages the **same checked-in original source** into `pocket/edge/assets.ts` and rewrites module paths to same-origin `?asset=` module URLs. `pocket/edge/index.ts` serves only HTTP GET/HEAD with strict CSP and no state. A browser request for the HTML or JavaScript does not include the entered text. The browser never POSTs field text anywhere. Supabase/Vercel still observe ordinary page request metadata, so do not claim anonymous traffic.

Function deployment target (when deliberately released): Supabase `banana-pocket`, JWT verification **off only because no mutations/read of private data exist**. Intended Garden friendly redirect `/gram`. The deployment is not required for local tests.

## Important remaining limits

- No saved workspace: users must knowingly download the private Gram before closing.
- A source is only a *local proposal*, never Jubilee shared truth. No automated export to Campfire, LemonPRESS, First Yes server, or Telegram.
- A generic regular expression for contact details is defensive but not a guarantee of perfect redaction. Human review is essential.
- No public searchable profiles, ranking, debt, money, provider enrollment, delegated institutional authority, or confirmed aid.
- Test on two actual mobile browsers and check screenreader/keyboard behavior before claiming field readiness.
- A `proposeGramCrossing` is **not** acceptance by any target domain.

## First live landing check (2026-10-25)

- Public user doorway: https://garden.abundent.org/gram (Vercel 307 redirect).
- Supabase Edge function: `banana-pocket` v1, ACTIVE, in the already-owned Garden pilot project. Static GET/HEAD only. There is no database or message handler on this endpoint.
- Public landing and all four same-origin JavaScript module URLs were fetched successfully, including rewritten relative imports. The original Seven-Day Table `/seven` still loads after the addition.
- Source-level mobile DOM ID / ESM parse checks passed. An isolated simulated-DOM walk through question → Trace → Tension → First Yes → author-reported Return → consented PROPOSE_ONLY handoff passed 7/7 direct checks. The GitHub Node test suite now includes this scenario.
- **Not yet proved**: real Android browser gesture/download usability, two-user Campfire, actual Telegram transport, sharing on behalf of a steward, JARVIS action, actual milk sourcing, or a production data-retention mechanism. CI status has not been independently confirmed.

Deployment source is the generated `pocket/edge/assets.ts` plus the narrow static `pocket/edge/index.ts`. Rebuild assets from original source after any UI changes and redeploy deliberately, rather than assuming a GitHub PR merge deploys Edge functions.

## Table return bridge 001 (live pilot, no silent submission)

The Seven-Day Table's [webZ PR #127](https://github.com/the-static-collective/webZ/pull/127) now opens `/gram` from an authenticated-by-private-link **active seat** and passes a short-lived random nonce in the new-tab hash. When opened that way, Pocket reveals an optional **Return reviewed question to my Table** button after a human explicitly authors/reviews/consents to a redacted PROPOSE_ONLY packet.

Pocket `window.opener.postMessage` sends only `{type,nonce,standing,summary}` to its exact same origin. No complete Gram, names, source traces, unresolved tensions, invite credential, institution, household data, or authority crosses. The parent Table validates exact source/nonce/origin; accepts at most the reviewed 240-character question into its unsent textarea; turns off sharing; and requires the guest's separate save. If the popup was not opened from the seat, the return button is unavailable. If blocked, raw Gram download remains an independent fallback.

**Released:** `banana-pocket` v2 ACTIVE on public `/gram`; `seven-day-table` v8 ACTIVE on public `/seven`, with backend unchanged. Child simulated opener test passed; real Android two-tab interaction, private-seat acceptance and a physical-world result remain unverified. Added dedicated Node regression `tests/pocket-window-return.test.mjs`.
