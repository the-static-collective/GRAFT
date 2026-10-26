# BANANAGRAM POCKET 001

The July 2026 idea with a usable browser doorway: **need / offering back (optional) / if this succeeds**, then optional **Trace, Tension, First Yes, Fruit/Seed/Compost**, and an independent explicitly reviewed proposal-only crossing. The app has **no storage, authentication, telemetry, model, send button, AI inference, or mutable community backend**. It cannot record a delivery or accept an institutional pledge.

## Run locally

From the root of the GRAFT checkout (Node for tests, Python for static serving):

\`\`\`sh
python3 -m http.server 8000
# Open http://localhost:8000/reentry/jubilee-banana/pocket/
node --test reentry/jubilee-banana/tests/*.test.mjs
node reentry/jubilee-banana/pocket/build-edge.mjs
\`\`\`

A page refresh discards all entries. **Private JSON download** is an explicit user action; the downloaded file can contain personal notes typed by its author and should not be publicly shared. The separate **reviewed redaction** flow will not copy private traces or tensions automatically and requires three deliberate checkboxes. The optional outgoing JSON remains an inert proposal with eight explicit false authority claims, never a message or community request.

The browser interface uses source modules directly: \`pocket/app.mjs\` → \`gram/portable-gram.mjs\` → \`bridge/gram-reentry.mjs\` → \`bridge/participation-bridge.mjs\`. Do not hand-edit generated \`edge/assets.ts\`.

## Deploy public, still local-only in effect

\`pocket/build-edge.mjs\` packages the **same checked-in original source** into \`pocket/edge/assets.ts\` and rewrites module paths to same-origin \`?asset=\` module URLs. \`pocket/edge/index.ts\` serves only HTTP GET/HEAD with strict CSP and no state. A browser request for the HTML or JavaScript does not include the entered text. The browser never POSTs field text anywhere. Supabase/Vercel still observe ordinary page request metadata, so do not claim anonymous traffic.

Function deployment target (when deliberately released): Supabase \`banana-pocket\`, JWT verification **off only because no mutations/read of private data exist**. Intended Garden friendly redirect \`/gram\`. The deployment is not required for local tests.

## Important remaining limits

- No saved workspace: users must knowingly download the private Gram before closing.
- A source is only a *local proposal*, never Jubilee shared truth. No automated export to Campfire, LemonPRESS, First Yes server, or Telegram.
- A generic regular expression for contact details is defensive but not a guarantee of perfect redaction. Human review is essential.
- No public searchable profiles, ranking, debt, money, provider enrollment, delegated institutional authority, or confirmed aid.
- Test on two actual mobile browsers and check screenreader/keyboard behavior before claiming field readiness.
- A \`proposeGramCrossing\` is **not** acceptance by any target domain.
