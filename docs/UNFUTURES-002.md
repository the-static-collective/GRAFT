# UNFUTURES-002 — Reciprocity Reactor × Reality 2.0

**Status: experimental, synthetic-only, not deployed, not CANNON canon.**

> Make complementary possibilities visible before asking anyone to commit.

This branch is stacked upon UNFUTURES-001. It does not trade predictions, cryptocurrencies, speculative tokens, paid services, or real supplies.

## Reproduce

Requires Node.js 22+; no dependency installation or credentials.

~~~sh
node --test unfutures/engine.test.mjs unfutures/reactor.test.mjs
node unfutures/reactor-demo.mjs
node unfutures/reactor-demo.mjs --board > proposed-quests.json
node unfutures/reactor-demo.mjs --completed-board > simulated-quests.json
~~~

Open unfutures/quest-board.html locally and choose the generated JSON. The offline HTML viewer can also show an embedded fictional sample, select circuits, and inspect proposed routes. It never accepts a real commitment, modifies a ledger, or contacts a server. CI packages the HTML plus proposed and simulated board files as an artifact.

## How it works

A directed leg requires an exact typed material requirement (resource, unit, positive integer quantity), a source offer with sufficient finite stock, and an explicit source-town transport trip reaching the destination. Local-only offers are not exported. No incomplete chain is called a cycle.

The bounded deterministic scanner discovers directed simple cycles of 2–5 towns (up to 8 if configured). It rejects repeated towns, duplicate receiving needs, material or transport overuse, and mismatched resource units. It chooses a need-disjoint, capacity-constrained set: longer cycles first and stable lexical tie-breakers. Unselected or incomplete proposals consume no resources. All selected capacity accounting is TENTATIVE_ONLY, never a real reserve.

### The fixed fictional world

Five towns, five material needs, five material offers and five transport offers:

~~~text
Waseca [grain] ------> Mankato
    ^                     |
    |                     | [solar]
 [timber]                 |
    |                     v
Waldorf <-----------------+

New-Ulm [fuel] ------> Owatonna
   ^                      |
   +-------- [tools] -----+
~~~

| Fictional measurement | Result |
| --- | ---: |
| Candidate cycles | 2 |
| Selected cycles | 2 |
| Cycle sizes | 3 and 2 towns |
| Needs included in complete proposals | 5 of 5 |
| Symbolic material allocations | 5 |
| Symbolic transport allocations | 5 |
| Real deliveries, consents, or payments | **0** |

A scanner limited to bilateral reciprocity would only identify the New-Ulm/Owatonna pair; the three-town cycle exposes three additional *proposed* relationships. This is a property of the constructed fixture, not a real-world impact claim.

## Multi-party agreement and replay

Each discovered cycle begins on **HOLD**.

1. All distinct requesters, providers and transport stewards must individually provide synthetic CONSENT YES to enter COMMITTED. One NO is a terminal REFUSED.
2. An actor may WITHDRAW before any work report and enter CANCELLED. After work is reported, a real dispute would require human attention; the specimen refuses automatic withdrawal.
3. Each leg's provider may separately REPORT an event. It remains unconfirmed and the cycle is IN_PROGRESS.
4. That leg's distinct recipient may CONFIRM the report. Only when every leg has a receipt does the synthetic cycle enter CONFIRMED.
5. The in-memory journal uses a SHA-256 hash chain and fingerprints the full cycle definition. Replay rejects broken sequence, modified history, altered plan definitions, premature actions and duplicated events.

None of the actor strings authenticates a human. The ledger is not signed, durable, independently witnessed, or tamper-proof. A replacement journal and hash head can be forged; synthetic reports and confirmations do not prove actual delivery.

Refusal/cancellation can be reflected by explicitly excluding a cycle and requesting a fresh proposal computation. This is not automatic appointment of replacements, not a money settlement, and not a real resource lock.

## Reality 2.0 game-window handoff

The pure game projection yields schema **reality2.unfutures-quest-board/v0** with a circuit card, towns, exact directed legs and symbolic transport, pending approvals, reports and recipient confirmations, and a machine-distinguishable fictional status.

The HTML viewer is **offline and read-only**. It never fabricates approval receipts or makes real projects appear verified. The board is an exploratory game window, not the live Reality 2.0 runtime or a production participant service. It has no token minting, currency, points, trading, gambling, social-score ranking or universal reputation.

## Project-owned boundaries (future work, NOT connected)

- **UNFUTURES-001:** source-owned stable byte serialization is a genuine code-level dependency. The earlier material-and-volunteer bundle planner is not modified.
- **Garden/BananaSpork:** a separate consented, privacy-filtered need/offer adapter is required. No writes to an authoritative Garden database.
- **reLATTE:** could independently supply owner-local signing, receipt/admission and replay boundaries. This prototype does not import its runtime.
- **JAR;VIS:** can propose plans for explicit human stewardship, but cannot fabricate a real volunteer, consent or reviewer.
- **CANNON:** owner-selected evidence is separate from passing tests or merging Git branches.
- **Reality 2.0:** independent owner review would be needed before adapting this schema to any real game runtime.

## Limits

Only a single material requirement per need is modeled; compound service bundles, production capacity and multiple suppliers are future extensions. Transport is represented as one generic trip without geography, time, load, fuel, safety, access, weather, law, or cost. Longer-cycle-first greedy selection is not a socially optimal or necessarily fair allocation policy. Real execution would need revocation, independent verification, audit, privacy, eligibility, dispute resolution, authenticated participants and physical custody proofs.

The simulator establishes no legal agreement, actual market infrastructure or counterfactual improvement in any real community.

**Provenance:** clean-room GRAFT experiment referencing only the UNFUTURES-001 stable serializer. Other repos retain all authority and ownership. CI success is not a public deployment or owner admission.
