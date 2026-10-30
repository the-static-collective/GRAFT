# UNFUTURES-006 — Dogram × Scarcity and Rounding

**State:** experimental, synthetic only, not deployed, not CANNON canon, no actual allocation.
**Stack:** UNFUTURES-001 → 002 → 003 → 004 → 005 → 006, each on a separate draft Git branch.

> SAME TOTAL DOES NOT IMPLY SAME DISTRIBUTION. EXACT MATH DOES NOT CHOOSE FAIRNESS.

## The executable crossing

UNFUTURES-006 incorporates two **original, internal Dogram research functions**. It does not duplicate their mathematics in JavaScript. CI checks out the original Dogram repository at exact Git SHA 551b5f9df18f17ec69b452ddcdff01718e0ff771 and calls:

- dogram.budget_rounding_residual.receipt_integer_budget — exact rational targets, indivisible integer allocation, signed rounding residues, totals, and explicit policy identity.
- dogram.anti_collapse_reachability.analyze_collapse — which distinct distributions become indistinguishable when only an aggregate total is shown.

Unlike the four original *public* Dogram operators exercised in UNFUTURES-005, these two are separately identified **internal research kernels**. Their research outputs are retained with source hashes and are **not relabeled as public dogram.receipt/v0 receipts**.

## Fixed fictional scarcity example

Three fictional community program buckets compete for seven indivisible hypothetical supply kits. The names come from recurring project themes and imply no real partnership, children served or actual inventory. Priorities are frozen editorial choices: Nourish Kids weight 5, Winter Support weight 4, Community Table weight 1. These numbers are not empirical measurements of human need, value, urgency or consent.

Each ideal target is the exact fraction: budget × weight / 10.

At budget seven, exact targets are Nourish 7/2, Winter 14/5 and Table 7/10.

| Dogram allocation rule | Nourish | Winter | Table | Total |
| --- | ---: | ---: | ---: | ---: |
| Largest fractional remainder | 3 | 3 | 1 | 7 |
| Declared order remainder | 4 | 3 | 0 | 7 |

The exact signed residuals are −1/2, +1/5, +3/10 for the first rule and +1/2, +1/5, −7/10 for the second. Each family sums exactly to zero.

The eight native experiments compare both rules at budgets **7, 8, 9 and 10**. Under the declared-order rule, Table receives zero at budgets 7, 8 and 9. Under largest remainder it receives one kit at each of those budgets. The policies coincide at budget 10 with 5, 4 and 1.

**Important mathematical surprise:** the declared-order rule can deviate by a full unit from one category's exact target. At budget 8, Nourish receives 5 units against its exact target 4, so the residual is +1. We retained this observed native behavior rather than imposing a false universal bound of less than one unit.

## The anti-collapse result

Dogram's original internal information-loss instrument sees **three distinguishable policy-pairs** that vanish if the eight records are reduced to allocated totals only: one pair each at budgets 7, 8 and 9. At budget 10 the distributions coincide, so no distinction is falsely invented.

This is an exact result about the declared data projections. It does not establish which distribution is equitable or why a program might legitimately need different quantities.

Native hostile controls also reject an information-adding pseudo-collapse, Boolean-as-integer weighting, empty weights, and negative budgets. Every native allocation conserves the total, retains exact rational residues and names its decision rule.

## Run

Requires Node.js 22+, Python 3.12+ and original public Dogram source. No credentials, external accounts, cloud AI, wallets or real participant data.

~~~bash
node --test unfutures/engine.test.mjs unfutures/reactor.test.mjs unfutures/generator.test.mjs unfutures/imagination.test.mjs unfutures/experiment.test.mjs unfutures/allocation.test.mjs
node unfutures/allocation-demo.mjs specimens > allocation-input.json
node unfutures/allocation-demo.mjs summary

git clone https://github.com/the-static-collective/Dogram.git vendor_dogram
git -C vendor_dogram checkout 551b5f9df18f17ec69b452ddcdff01718e0ff771
test "$(git -C vendor_dogram rev-parse HEAD)" = "551b5f9df18f17ec69b452ddcdff01718e0ff771"
PYTHONPATH=vendor_dogram UNFUTURES_DOGRAM_PIN=551b5f9df18f17ec69b452ddcdff01718e0ff771 python3 unfutures/verify_dogram_allocation.py allocation-input.json native-report.json
node unfutures/allocation-review.mjs native-report.json > held-review-candidate.json
~~~

CI runs the real Dogram mathematics, source pin checks, negative controls and unit tests, and packages a read-only HTML viewer plus exact research results. Open unfutures/allocation-board.html locally and optionally import the native report.

## Source authority boundary

The emitted GRAFT-owned JAR;VIS-style review candidate is HOLD, **not** a native JAR;VIS assignment, Garden promise or actual inventory ledger. No group has authorized a physical distribution. Affected programs and independent stewards would need to verify actual stock, eligibility, consent, minimum obligations and a documented appeals process before selecting any policy.

**Allocation conservation is a mathematical property; distribution justice is a separate human and institutional question.** Passing CI does not make the model a community authority.
