# BANANAGRAM PORTABLE-001 — the question with handles

**State:** source-level local proposal grammar on the GRAFT re-entry PR. Runnable under Node.js; no Telegram delivery, no live Garden wiring, no household member authentication, no backend, no canonical receipt, no public posting.

## What was flattened in our later summaries

The **July 27** BananaGram grammar asked three precise questions:

1. **Needs:** What would be useful?
2. **Offering back:** What, if anything, might I contribute? **Optional—never repayment.**
3. **If this succeeds... what becomes possible next?** The conditional future capacity, not a reward balance.

By July 29, NanaSpork / Garden presented **Seed / Trace / Tension / Harvest / BananaGram** separately. **BananaGram is a portable envelope**, not necessarily a Seed. It can carry references to a need, an offer, a trace, an unresolved tension, or something harvested. The Garden's three human-facing questions were:

- How did this become what it is?
- What remains unresolved?
- Where can someone participate next?

The social graph was **not meant to be a database of everybody you know**. The original name *Forest View* described demonstrated and hypothesized **community capacities**. A connection is not a relationship claim or a permission grant; it is a possible path somebody may inspect, explain, and decline.

## We restored a separate home for tensions

Imagine a food shelf may lose milk-grant support. One person says the grant is ending. Someone else thinks the purchasing category may remain open. Until verified with the actual buyer, these are not two facts to average and not a story of disaster to publicize.

The Gram carries both as an **open TENSION**. The person who owns the purchasing decision can answer, decline assistance or defer.

A `TRACE` is what somebody reports seeing or hearing, with its source classification. It is not automatically an independently witnessed occurrence.

## Two relation grammars, two jobs

Old BananaGram relation vocabulary:

`makes_possible` · `learned_from` · `grafted_into` · `left_behind` · `composted_into` · `harvested_by`.

These are deliberately *local candidate relationships*. The newer Free Graph's five portable predicates are independently defined. The new code **never silently promotes** a BananaGram relationship into Free Graph.

## The missing tiny cycle

```text
a person describes a question, need, or offer
  → PORTABLE GRAM [needs / offering back / if it succeeds]
  → TRACE(s) / TENSION(s) / proposed nearby paths
  → someone selects a bounded FIRST YES
  → separate human / steward permission before actual action
  → human return of FRUIT / SEED / COMPOST
  → authenticated domain receipt only if there really is one
  → separately reviewed redaction for GRAFT / LemonPRESS / Next Table
```

**The Returning Gram is not a social score or a contact acquisition record.** It permits one useful truth to survive a failed attempt: there is no gap, the buyer declined, the source is already optimal, somebody changed their mind, the question is still unresolved.

The other huge old distinction is that a *conversation* is a temporary surface. A Gram is a proposed persistent object. A Jubilee event is an **authorized consequence**, not something you create by saving an interesting conversation.

## Try it

```bash
node --test reentry/jubilee-banana/tests/*.test.mjs
node reentry/jubilee-banana/examples/vanishing-carton.mjs
```

All example people, quantities and actions are illustrative only. This source currently produces a **private console card**. It has no email, SMS, Telegram, group membership, data import, publish, webhook or money effect.

### Prototype guards

- A Gram is permanently labelled `LOCAL_PROPOSAL` and scoped to `this-device`.
- Every appended trace, tension, or relation makes a new copy and revision; prior snapshots are not silently overwritten.
- A relation can only be a **local candidate**, never Free Graph admission.
- First Yes requires explicit human *selection* but still cannot assert steward permission or action execution.
- Fruit is a self-report only; seed has no selection or crossing authority; compost carries negative knowledge.
- Returns are tied to **the exact source revision**, not just a name. Stale returns fail.
- The separate GRAFT `participation-bridge.mjs` still requires a specifically reviewed/consented, redacted, public-safe text before any *proposal-only* crossing. This Gram never exports itself as a whole.

## The field test this suggests

Start with one food-access question and find **one willing source steward**. Ask permission. Then make one specific helpful artifact and return it for review. Nothing qualifies as a confirmed delivery, organizational endorsement, or public result simply because the code runs.

The first meaningful success is not twenty-four participants or a perfect graph.

**It's a question making it to the right willing person, and a truthful answer making it back.**
