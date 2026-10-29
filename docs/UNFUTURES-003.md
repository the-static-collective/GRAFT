# UNFUTURES-003 — The Generative Economy

**State:** experimental and synthetic-only. Stacked on UNFUTURES-002, which is stacked on UNFUTURES-001. Not deployed, not field validated, not CANNON canon.

> A recipe is not production. A proposed capability is not stock. A report is not confirmation.

## Purpose

UNFUTURES-001 matches finite needs and offers. UNFUTURES-002 detects closed reciprocal resource circuits. UNFUTURES-003 introduces a bounded **recursive composition planner**, allowing one hypothetical output to serve as a typed input to another proposed production recipe.

~~~text
AVAILABLE FINITE STOCK
   + typed recipe (multi-input; explicit quantities, units, town)
   + fictional steward and separate reviewer
       |
       v
PROPOSED OUTPUT LOT (source recipe / lineage retained)
       |
       v
ANOTHER RECIPE (bounded depth and finite stock)
       |
       v
NEW PROPOSED CAPABILITY
       |
       v
GOAL PROPOSAL → unanimous fictional consent
       |
       v
STEP REPORT → INDEPENDENT REVIEWER CONFIRMATION
       |
       v
GOAL PROVIDER REPORT → RECIPIENT CONFIRMATION
~~~

The planner enumerates bounded production sequences, each recipe at most once, with exact town/resource/unit consumption and lot provenance. Infeasible recipes are ignored. It refuses impossible free-input recipes, self-feeding transformations and unseeded circular assumptions. Resource allocations are finite and do not clone shared stock. A synthetic approval never turns a claim into field-verified inventory.

The selection policy ranks weighted goal coverage, then number of goals, then fewer recipes, fewer input allocations, and lexical order. Exact typed allocations use a deterministic greedy source selection. This is a heuristic, **not an optimal economic or fairness theorem**. The planner raises a bounded-search error rather than quietly returning a supposedly complete result when maxNodes is exceeded.

## Reproduce locally

Requires Node.js 22+, no external dependencies, wallets, accounts, tokens or API keys.

~~~bash
node --test unfutures/engine.test.mjs unfutures/reactor.test.mjs unfutures/generator.test.mjs
node unfutures/generator-demo.mjs summary
node unfutures/generator-demo.mjs board > proposed.json
node unfutures/generator-demo.mjs completed-board > simulated.json
node unfutures/generator-demo.mjs shadow
~~~

Open the local unfutures/generator-board.html viewer and import the generated board JSON; or download the offline bundle created by GitHub Actions. The viewer never changes any state except its own local visualization.

## Fixed fictional Waseca specimen

Eleven raw offer lots: produce, kitchen shifts, volunteers, a van, a roster, firewood, insulation, tools, shelter, a battery, and pots.

Eight fictional recipes cover packing meal boxes, creating a delivery-route capability, composing a Nourish Kids capacity, assembling a winter heat-readiness kit, creating a winter support capacity, and alternative competing routes.

Three weighted goals:

| Goal | Fictional priority | Proposal result |
| --- | ---: | --- |
| Nourish Kids route capacity | 3 | Feasible via 3 proposed recipes |
| Winter support-day capacity | 2 | Feasible via 2 proposed recipes |
| Common Table event capacity | 1 | Unmet under the selected resource allocation |

Baseline: **0/3 goals** directly fulfilled. Generative composition: **2/3 goals** have feasible proposed recipes and **5 recipe steps**. A meal route and a shelter cannot simultaneously be claimed for every competing alternative; no stock is created by bookkeeping.

**Real work completed: zero.** No food has been cooked, no volunteer or kitchen enrolled, no children's information processed, no service carried out.

## Explicit simulated authority protocol

All fictional inventory owners, stewards, reviewers and recipient roles must independently consent for the plan to become COMMITTED. Any NO is terminal refusal. A participant can withdraw before work reports, but not bypass human dispute review afterward. Every step waits for its prerequisites, then requires a steward report and separate reviewer confirmation. Every goal requires provider reporting and distinct recipient confirmation. Only completion of all selected steps and goals produces synthetic CONFIRMED.

The in-memory journal records events, sequence, SHA-256 event chain and full plan-definition fingerprint. These do **not** authenticate actors, provide durable or unalterable history, establish actual proof of performance or authorize physical action.

## Real code-to-code crossing: 003 × 002

The shadowOffersForReactor adapter exports proposed results as typed records bearing status **UNVERIFIED_PROPOSED_OUTPUT** and admission **HOLD**. A synthetic what-if scenario feeds one such output into UNFUTURES-002 cycle scanning, showing an additional *potential* reciprocal circuit. This is an executable interface test, **not an admission of new actual inventory** and not a production API.

UNFUTURES-003 imports only the 001 serializer and 002 cycle scanner. No writes occur to Garden, BananaSpork, reLATTE, JAR;VIS, Reality 2.0 or CANNON.

## Unresolved frontiers

- Physical feasibility and actual yields, economic costs, externalities, labor and health/safety credentials are not proved by recipe shape.
- Model is town-local. Shipping, vehicle loading, schedules, fuel, safe storage, perishability and actual access would need independently sourced constraints.
- Every recipe runs once. Multiple batches, reusable equipment, time reservations and actual custody are not modeled.
- The greedy goal prioritization can create inequity or opportunity loss; alternative policies and explicit human review are essential.
- There is no authenticated consent, durable independent witness, dispute resolution, recipient data protection, revocation after physical work, or financial settlement.
- In any eventual child-focused pilot, work through a consenting adult organization and never publish children's identities, locations or private circumstances.
- A real Garden or JAR;VIS input/output requires separately authorized, privacy-filtered adapters; **no synthetic output becomes live stock by import**.

**GRAFT nursery law:** tests are evidence of a bounded execution, not universal truth, owner selection, deployment authorization or a real institutional partnership.
