# UNFUTURES-004 — Economic Imagination Engine

**STATUS: BOUNDED, SYNTHETIC-ONLY EXPERIMENT. NOT LIVE. NOT CANON.**

> A hypothetical recipe is not an available resource. A question is not permission. A better counterfactual is not a better real world.

Stack: UNFUTURES-001 (resource matching) → 002 (closed reciprocal cycles) → 003 (recipe-composed capabilities) → **004 (hypothesis testing and bounded recursive inquiry)**.

## What actually runs

The new engine uses **two hand-authored editorial hypotheses**, not an autonomous language-model worker. It identifies a bottleneck for an unmet goal, constructs a candidate transformation, and evaluates **four separately labelled worlds**:

1. Neither new recipe nor additional resource.
2. New recipe alone.
3. Assumed new resource alone.
4. New recipe **and** assumed extra resource.

The same exact typed/resource-conserving 003 compiler runs in every case. That is a real code-level integration, not a speculative spreadsheet. No code is run against a real community database, account, treasury, or device. The hypothesis catalog is an explicit source-owned set of fixture assumptions; no idea is promoted from a question or model suggestion into executable instructions.

The source editor signs nothing and the names of participants are fictional aliases.

## Reproduce

Node.js 22+, no npm install, network, credentials, cloud app, wallet or API key:

~~~bash
node --test unfutures/engine.test.mjs unfutures/reactor.test.mjs unfutures/generator.test.mjs unfutures/imagination.test.mjs
node unfutures/imagination-demo.mjs summary
node unfutures/imagination-demo.mjs lab > lab.json
node unfutures/imagination-demo.mjs inquiry > questions.json
node unfutures/imagination-demo.mjs attention > attention-candidate.json
node unfutures/imagination-demo.mjs review-simulation > review.json
~~~

Open **unfutures/imagination-board.html** offline; import the generated lab JSON. GitHub Actions packages this viewer, the full four-world data, the question loop, the attention packet and the synthetic review transcript. Opening the board never writes or commits anything.

## Fixed fictional Waseca case

Under 003's fixture, two of three goals are constructible only as *unverified proposed capabilities*: Nourish Kids route capacity and winter support-day capacity. Common Table event capacity remains unmet.

We test two invented recipes for that third goal:

| Hypothesis | New recipe alone | Extra resource alone | Both combined |
| --- | --- | --- | --- |
| Portable community pop-up recipe + **assumed** additional volunteer shift | 2/3 | 2/3 | **3/3 hypothetical plans** |
| Alternative reusing scarce shelter and route | 2/3 | 2/3 | 2/3 |

The pop-up hypothesis consumes existing pots and battery equipment, and explicitly assumes a **new, currently noncommitted volunteer shift**. One cannot silently assume the additional person exists, that equipment is safe/appropriate, that food handling is permitted, or that the yield is valid. The held evidence checklist names volunteer consent, safe food handling, site access/power, and recipient demand. The alternative route proposal shows no new coverage and exposes conflicts involving previously allocated shelter and route capability.

The **3/3 figure is only a counterfactual from synthetic quantities and asserted production rules**. It is not an actual uplift, verified service, available volunteer or economic valuation. We do not rank, score or treat real people's worth as a tradable commodity.

## Question machine (bounded inquiry, not recursive self-authorization)

The inquiry renderer produces a bounded two-round workup:

- Round one asks whether each editorial idea is feasible.
- Round two asks what would falsify the proposal, and which previously committed goods would be displaced.

It emits at most three bounded rounds and repeats no identical question IDs. Further advancement needs fresh evidence. It cannot author an unlimited succession of new recipes, change user goals, or hatch an execution agent by itself.

## Reviewer decision contract

A distinct fictional reviewer can record one decision for each editorial hypothesis:

- REQUEST_EVIDENCE → NEEDS_EVIDENCE;
- REJECT → REJECTED;
- ACCEPT_FOR_SYNTHETIC_TEST → SYNTHETIC_TEST_ONLY.

No decision can authorize a real-world trial or incorporate a capability into live inventory. SHA-256-linked event replay checks the chosen in-memory transcript and hypothesis fingerprint; this is **not a cryptographic identity signature**, third-party witness, tamper-proof archive, or human identity check. Reviews are simulated.

## planZ and JAR;VIS crossing: read-only candidate packet

The engine creates a **planz.attention-candidate.unfutures-004/v0** *experimental* export containing synthetic plan questions, source fingerprints, explicit evidence gaps and proposed human review gates. It also emits JAR;VIS-style attention questions.

This is a **GRAFT-owned JSON proposal**. It is NOT the real planZ public attention-v1 contract or JAR;VIS operator intake. No native planZ update, JAR;VIS task, GitHub issue, notification or project permission is created. It will require adapters and explicit source-owner approval.

The original projects' authority boundaries remain unchanged. COMPOSE != ACCEPT, ASK != DISPATCH, TESTED != CANON.

## Next falsifiable frontiers

1. Replace hand-authored hypotheses with opt-in source-reviewed contributions or a strictly bounded model *suggestion* interface. A language model must not invent witnessed facts.
2. Test whether generated hypotheses are measurably more useful than an unaided operator, using predeclared criteria, failure cases and held-out tasks.
3. Simulate timing, costs, perishability, human capacity, reuse-vs-consumption, physical hazards, independent reviewer eligibility and other external constraints.
4. Compare resource-allocation policies. Goal-priority numbers are hypothetical scenario parameters, not a measure of human worth.
5. Preserve counterevidence and failed tests; do not optimize for a target metric by manufacturing supportive assumptions.
6. Develop authentic privacy-preserving, receiver-owned consent/receipt adapters before any authorized limited field pilot; avoid child-related private data.
7. Keep physical consequences, legal obligations and economic payments completely out of the synthetic experiment until reviewed in their own contexts.

**Provenance:** clean-room experimental GRAFT implementation. Nothing here enrolls partners, constitutes a real prediction exchange, issues a currency, authorizes labor or confirms community delivery. Passing CI demonstrates only bounded software behavior on the supplied fixture.
