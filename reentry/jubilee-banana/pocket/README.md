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

## Forest View 001 — Free Graph seed → next voluntary invitation (deployed)

[Public Pocket](https://garden.abundent.org/gram) now has a **Step 06: Forest View**. This is **in addition** to (not a replacement for) the private Seven-Day Table seat return.

Flow:
- Human prepares the separately reviewed, redacted `PROPOSE_ONLY` question in Step 05.
- Human may separately write a **public-safe author-report fruit** and **public-safe possible-next-question seed**. Neither text is copied from the private Gram, Trace, Tension, household history or existing unsent Table seat.
- Two additional controls separately require human review and explicit graph-export consent; no packet is produced without both.
- `forest/forest-projection.mjs` builds one **content-addressed native `free-graph.packet/v0`** with real SHA-256 source/node/link/packet IDs, one portable `conversation-witness` source of authority `none`, `unresolved` task-world cut, optional proposed author-report testimony and a proposed next question. Only `connects` links are used, with local qualifiers; **never `constitutes`**, `tests`, or `bears-on` on this unverified evidence.
- The diagram lives in browser memory. The user can explicitly download the reviewed packet, but **GRAFT/Free Graph remote history is NOT modified** by a page visit.
- If the user included a next seed, they may prepare a **new, editable native Seventh Table `v:1` invitation** with a fresh ID and empty host, parent and participant lineage. This uses the existing `https://abundent.org/tables/#invite=...` format. It is not sent, it does not create the table, it does not import personal identities or imply consent from existing participants.
- Any edit to the original Gram or a reviewed field invalidates and disables the previously prepared downstream packet and invitation.

**Runtime:** `banana-pocket` v3 ACTIVE, same static GET/HEAD Edge function with new same-origin `?asset=forest`. No new API endpoints, database writes, auth permissions, visitor tracking code, automatic messages or cross-site resource calls.

**Proof:** `tests/forest-projection.test.mjs` uses Node.js WebCrypto + independent SHA-256 checks on canonical IDs and refusal gates; `tests/pocket-forest-flow.test.mjs` simulates the full reviewed UI-to-invitation path. The branch workflow builds a fictional packet and runs the **native Free Graph Python validator** on it as an explicit CI stage. The run must pass before claiming validator acceptance. The public page and code modules were fetched live after deployment, but Android field-browser and real recipient acceptance remain unverified.

**Crucial distinction:** This stage preserves a human's *report of fruit*. It does **not** create an independent human-witness record, a confirmed delivery or an owning-world receipt. Converting a report into verified consequence belongs to a separate lawful human/owner gate, never to this public graph maker.

## FIELD-RETURN-001 · witness requests without counterfeit confirmation (stage 07)

**Goal:** Complete a whole *question → return* workflow while preserving NanaSpork's real authority boundary. The Garden Pocket now includes **Step 07: What would make this real?**, a local field request and conservative review interface. It is based on the source contracts [BananaSpork FIELD-SPECIMEN-001](https://github.com/the-static-collective/BananaSpork/blob/main/docs/field-specimen-001.md), [RETURN-OF-THE-HELP-SLIP-001](https://github.com/the-static-collective/BananaSpork/blob/main/docs/return-of-help-slip-001.md), and `src/domain/help-slip/pour.ts`.

**Human-friendly workflow:**

- After a reviewed Forest proposal, author writes the *exact question to ask the steward*, what independent observation could establish the claimed event, and what must remain unresolved. A separate opt-in produces a **downloadable unsent request**, never an email, Telegram message, Supabase row, or task assignment.
- A steward's reported response can be `not-asked`, `accepted-to-review`, `declined`, or `no-need`. Declined and no-need are valid terminal answers. No obligation or automatic re-invitation follows.
- The local optional claim inspector distinguishes **helper-reported units** from **source-record-claimed confirmed units**. A delivery report cannot reduce residual.
- If a requirement was poured into two Campfires, **one physical occurrence claimed by both may count only once**; distinct occurrence references can add within the claimed snapshot; absent/conflicting refs force the conservative *max-per-link* lower bound, with **exactness=false and residual unknown**.
- Even a well-formed owner receipt *reference* and a current-status checkbox cannot verify an actual physical delivery in Pocket. Every result says `ownerReceiptReviewed=false` and `physicalProvisionVerified=false`. The owner-current authoritative confirmation belongs to authenticated NanaSpork/Campfire and actual recipient, not the public static webpage.
- The author can explicitly download the request and private claim review as local JSON. Neither document enters Free Graph automatically; the reviewed Free Graph packet continues to represent only proposed or self-reported history.

**Negative laws:** `MESSAGE != WITNESS`, `REPORT != CONFIRMATION`, `RECORD ID != PHYSICAL OCCURRENCE ID`, `TWO CAMPFIRE LINKS != TWO SOURCE REQUIREMENTS`, `SHARED PORTION CONFIRMED != SOURCE REQUEST CONFIRMED`, `A SELF-ENTERED NUMBER != A VERIFIED DELIVERY`.

**Test coverage:** `tests/field-return.test.mjs` exercises duplicate occurrence deduplication, genuine distinct occurrence aggregation, mismatched occurrence fallback, helper report/refusal, safe public return and no promotion. `tests/pocket-field-flow.test.mjs` simulates the new UI from reviewed Gram → Forest → question for the steward → claimed delivery inspection. The standard re-entry workflow runs the native Free Graph validator too.

**Remains genuinely open:** intentionally selected BananaSpork live project, two distinct authenticated accounts, member vs hostile nonmember RLS, source-backed `fulfillment.reported` and `fulfillment.confirmed`, physical recipient confirmation, durable rehydration, and public-safe owner-approved learning. No demo can certify those field observations, and no owner service-role keys should be injected into Pocket.
