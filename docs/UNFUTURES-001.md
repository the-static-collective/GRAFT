# UNFUTURES-001 — The Possibility Exchange

**Status:** experimental GRAFT branch, synthetic executable specimen, NOT LIVE and NOT CANON.

> Do not bet on tomorrow. Coordinate a possibility worth making real.

## Inversion

Prediction markets price beliefs about future outcomes. This specimen tests a different object: a proposed, bounded bundle of **needs + offers + logistics + independent consent + reported and confirmed work**. It does not trade predictions, derivatives, coins, NFTs, or instruments. No crypto wallet, price feed, or brokerage service is connected.

## Reproduce

Requires Node.js 22+; no npm dependencies, credentials, network, database or wallet.

~~~bash
node --test unfutures/engine.test.mjs
node unfutures/demo.mjs
~~~

The synthetic fixture has five towns, 20 two-requirement needs (one material and one locally sourced volunteer shift), and 30 bounded offers (materials, volunteers, and transport). Every label and person is fictitious; place names do not imply real relationships or participation.

The deterministic planner attempts complete, unit-preserving plans. **An incomplete bundle has no allocation effect.** It always reserves complete local bundles first, then attempts cross-town rescue of the remaining needs, consuming explicit transport trip capacity at the *origin* and preserving local commitments. No offer is allocated beyond quantity. This specimen assumes trips can carry one material allocation; it does not model vehicle safety, distance, scheduling, fuel, weather, cargo volume, or travel permissions.

### Baseline and outcome of fixed fixture

| Synthetic metric | Local-only | Federated |
| --- | ---: | ---: |
| Fully composed proposed needs | 15 / 20 | 19 / 20 |
| Proposed bundles using cross-town transport | 0 | 4 |
| Unmatched needs | 5 | 1 |

**Net additional complete proposals: 4.** All 15 locally complete bundles remain included in the federated set. These are deterministic properties of the constructed fixture, not an empirical economic impact estimate. No community has delivered anything. The demo simulates one plan's approvals, report and recipient confirmation to test the ledger; its status is "confirmed synthetic demonstration," not verified field fulfillment.

## Acceptance boundary

~~~text
SYNTHETIC NEEDS + OFFERS (source labels, capacities)
        |
    local-first planner
        |
    federation rescue + explicit routes
        |
  PLAN — HOLD by default (no custody)
        |
  participant-scoped CONSENT: YES / NO
        |
  all YES -> COMMITTED; any NO -> REFUSED (terminal)
        |
  PROVIDER REPORT — still unverified
        |
  RECEIVER CONFIRMATION -> CONFIRMED (synthetic only)
        |
  append-only SHA-256 chained event transcript, replay checked
~~~

A signature is not truth; a receipt is not admission. The demo currently uses **unenforced actor labels** for all synthetic roles; real identity verification, signatures, reliable persistent custody, revocation, idempotent delivery, authorization and independent verification do not exist in this specimen. The hash chain detects accidental/unsanctioned changes **unless** its history is recomputed or replaced; it is not tamper-proof, externally witnessed, or cryptographically attributable to a person.

### Conservation and replays

- Distinct requirement resources and units cannot be merged into a fungible quantity.
- A complete proposal tentatively consumes fixture offer capacity. A partial plan consumes none.
- Cross-town material requires an explicit synthetic transport trip; local volunteer shifts cannot be exported.
- The owner of each used offer and transport route, and the requesting recipient, must all consent.
- A refusal remains terminal in that synthetic journal.
- A provider report is not receiver confirmation, and a receiver cannot self-report as a provider.
- Each event records sequence, predecessor hash, action and synthetic actor. Replay checks transitions and digest chaining.
- Any unapproved proposal is HOLD, not work ordered, paid, or delivered.

## What this does NOT prove

It does not prove mutually advantageous economics, lawful labor classification, nonprofit or co-op governance, price discovery, authenticated consent, actual labor, safe resource delivery, real-world counterfactual impact, funds custody or prevention of market speculation. It is deliberately not a legal instrument, exchange or smart contract.

The fixed greedy planner does not optimize a global welfare function. The local-first ordering is an explicit, reversible allocation policy that could disadvantage some participants. It must be compared with other fairness policies; otherwise the measured net gain is incomplete. For real use, offers need explicit feasibility windows, dependencies, multiple transport modes, privacy controls, accessibility, dispute handling, withdrawal and constrained escrow or ordinary settlement rules where appropriate.

## Independent organ interfaces — proposed, not wired

| Source owner | Interface we would request | Boundary |
| --- | --- | --- |
| Garden / BananaSpork | Need/offer/pledge/report/confirm envelopes | Do **not** back-write Garden's authoritative Supabase ledger from this specimen. |
| reLATTE | Signed, receiver-local crossing and disposition | Never confuse HOLD or signed bytes with admission or shared truth. |
| JAR;VIS | Propose a bundle, request a scoped human review | Attention is not authority; no autonomous stewards are invented. |
| Reciprocity Reactor | Explore cycles, reciprocal paths, non-bilateral feasible compositions | This v0 proves basic cross-town bundles, **not** a working cycle detector. |
| CANNON | Present exact branch and tests as selectable evidence | A green test does not make an owner selection or canonical release. |
| Reality 2.0 | Project fictional/completed plans into gameplay | Real-life participation must be opt-in and separately authorized. |

No vendor or third-party partner is integrated. These are typed architectural invitations, not claims that external APIs exist.

## Next hardening proof

1. Model explicit typed import/export fixtures and separately owned source adapters.
2. Add capacity holds with expiry, release on refusal, replanning and multiple allocation policies.
3. Test hostile nonmember submissions, authentication, distinct reviewer identity and revocation.
4. Move the journal to a durable owner-local store, with signatures and independent replay.
5. Conduct a **consented** micro-pilot with one real need, one offer and one verifier—without personal data on the public branch.
6. Compare baseline vs coordinated attempts using *actual* fulfillment and opportunity cost. Avoid claiming a counterfactual prevention without defensible evidence.

## Source/provenance policy

This is clean-room prototype code written for GRAFT. Its contracts are inspired by project-owned public documents, not copied runtime integrations. Source ownership stays with the source projects. The GRAFT branch is an experimental cut; no merge, deployment, public intake, partner invitation, outside broadcast or CANNON admission is performed by this code.
