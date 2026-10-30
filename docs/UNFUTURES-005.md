# UNFUTURES-005 — Dogram × Experimental Economy

**Executable scope: SYNTHETIC ONLY. Neither a financial instrument nor an actual human experiment.**
**Stack:** GRAFT draft 001 → 002 → 003 → 004 → **005**. Each branch retains its own authority and review boundary.

> DO THE MATH. SHOW THE DELTA. KEEP THE RECEIPT. DO NOT DECIDE WHAT IT MEANS.

## The native mathematical crossing

UNFUTURES-004's bounded Economic Imagination Engine has two editorial hypotheses about a fictional Waseca cooperation scenario. UNFUTURES-005 packages exact counterfactual data as **genuine Dogram v0 specimens**, checks out original Dogram Python at the exact source revision **551b5f9df18f17ec69b452ddcdff01718e0ff771**, and executes the original native operator functions using Python 3.12 in GitHub Actions.

The Dogram operators are not reimplemented in JavaScript. The source repository is checked out separately, at a pinned commit, and not copied into GRAFT as a new authority. The runner verifies the Git HEAD against the pinned SHA, requires each specimen's typed source fingerprint and scope, calls Dogram's own engine, checks the output values and provenance, and saves the **native Dogram receipts** with SHA-256 identities. There is no live field data or remote service call in the computation.

## Four counterfactual worlds, two independent ideas

For each hypothesis, UNFUTURES-004 generates a four-arm comparison. We declare two binary axes: **new method** and **additional assumed capacity**. The measured scalar is the *number of goals covered by proposed combinations* in the fixed synthetic planner.

| Arm | New recipe? | Assumed additional volunteer? | Proposed goals |
| --- | --- | --- | ---: |
| 00 | No | No | 2 |
| 10 | Yes | No | 2 |
| 01 | No | Yes | 2 |
| 11 | Yes | Yes | **3** |

Dogram's original rectangle@1 computes the exact two-axis mixed difference:

~~~text
Δ_AB = Y11 - Y10 - Y01 + Y00
     = 3   - 2   - 2   + 2
     = +1
~~~

The same native operator on the **declared priority-sum** (5, 5, 5, 6) produces another exact +1. The second, resource-competing alternative is a **negative control**: 2, 2, 2, 2 → mixed difference **0**. The control remains visible even though it fails to improve the declared metric.

This exact finite difference is not an experimental causal effect estimate from actual participants. Because all four arms are computed from an assumed planner and proposed recipe yields, the result identifies a **model interaction** conditioned on those premises. It does not establish a volunteer exists, that a meal can be prepared safely, or that a community project would succeed.

## Four original Dogram operators

UNFUTURES-005 uses all four publicly supported Dogram operators:

- **rectangle@1**: exact numerical two-axis interaction for goal coverage and priority, plus a zero-change negative control.
- **delta@1**: ordered comparison between baseline and combined-case typed traces. The first different coordinate is goal count; priority sum is also compared.
- **ablate@1**: remove an explicitly declared *volunteer gate* node from a small SERIAL dependency graph and measure the lost recipe-to-goal reachability, retaining an unaffected path control.
- **reach@1**: add an explicitly declared missing gate edge and compare before/after shortest-path reachability.

Dogram's graph tests operate on a *serialized explanatory graph*; reachability is not an AND semantics theorem or a causal assertion about real volunteer coordination. Separate recipe constraints are enforced by the source 003 planner. Every native receipt remains a calculation, not an admission of factual support or authority.

The native verifier also submits an intentionally malformed mixed opaque-and-numeric rectangle and requires Dogram to REFUSE with its native **MIXED_VALUE_MODES** code.

## Reproduce the exact runnable proof

Requires Node.js 22+, Python 3.12+, the publicly accessible original Dogram repo, and no paid dependencies, cloud AI provider, personal accounts, crypto assets or market connections.

~~~sh
node --test unfutures/engine.test.mjs unfutures/reactor.test.mjs unfutures/generator.test.mjs unfutures/imagination.test.mjs unfutures/experiment.test.mjs

node unfutures/experiment-demo.mjs specimens > experiment-specimens.json
node unfutures/experiment-demo.mjs summary
node unfutures/experiment-demo.mjs trial

# First check out the EXACT pinned Dogram source, not a moving branch:
git clone https://github.com/the-static-collective/Dogram.git vendor_dogram
git -C vendor_dogram checkout 551b5f9df18f17ec69b452ddcdff01718e0ff771
test "$(git -C vendor_dogram rev-parse HEAD)" = "551b5f9df18f17ec69b452ddcdff01718e0ff771"

PYTHONPATH=vendor_dogram UNFUTURES_DOGRAM_PIN=551b5f9df18f17ec69b452ddcdff01718e0ff771 \
 python3 unfutures/verify_dogram.py experiment-specimens.json dogram-native-receipts.json
~~~

GitHub Actions automates these steps and packages an offline HTML viewer with the specimen, summary, original Dogram receipts and read-only JAR;VIS-style operator-review candidate. Open **unfutures/experiment-board.html** and locally import dogram-native-receipts.json to inspect the original calculation results.

## Experimental economy / Work That Inherits proposal

The code produces a held **jarvis.work-candidate.unfutures-005/v0** record that asks an adult organization to review the possibility of a tiny reversible pop-up Common Table. The packet explicitly requires: voluntary adult participation, external safety review, a separate reviewer, site access, no private child data and no implied partner enrollment.

It is **not** JAR;VIS's actual native Work That Inherits intake. No user, organization, farmer, kitchen, food shelf or volunteer has agreed to it; no task has been dispatched; no recipient reported or confirmed work. Its imaginary specimen does not produce a usable resource or field evidence.

A future authentic pilot would first need an explicitly authorized organization, practical safety and insurance review, genuine verified inputs, real consent and receiver-owned acknowledgement, bounded resource use, and independent reporting of negative outcomes as well as positive ones.

## Current invariant

~~~text
Dogram native receipt = one reproducible calculation about declared inputs.
Dogram result != truth about the world.
Synthetic interaction != empirically estimated causal effect.
Graph reachability != actual capability or history.
Possible recipe != produced service.
Work proposal != voluntary human commitment.
Human review != consent from an entire community.
Passing CI != source-owner CANNON admission.
~~~

The GRAFT cut is an experiment; the source owners retain local authority. No merge, deployment, partner communication, transaction or crypto integration is performed.
