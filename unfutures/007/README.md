# UNFUTURES-007 — The Fairness Laboratory

> **Expose the consequences of a policy. Do not decide what people deserve.**

This is a working **offline, synthetic-only experimental branch bundle**, prepared to be stacked on UNFUTURES-006. It compares four transparent allocation objectives under hard illustrative capacity limits and provisional commitments. It does **not** allocate resources, establish fair treatment, verify community needs, enroll real participants, publish claims about real people, or grant JAR;VIS / CANNON / Garden authority.

## Status and provenance

- **Source concept:** UNFUTURES-006 / `the-static-collective/GRAFT`, intended base branch `graft/unfutures-006-dogram-allocation` (draft PR #17).
- **Dogram independent source pin:** `551b5f9df18f17ec69b452ddcdff01718e0ff771`.
- **Local Python engine:** genuinely executed and tested against 16 finite budget×policy cases. Its policy enumerator is new GRAFT-side experimental math, **not a Dogram public operator**.
- **Original Dogram:** optional original-source integration, with exact Git SHA validation, `receipt_integer_budget` crosschecks and original `analyze_collapse` verification. This checkout was **not available in the current local runtime**; the included report is explicitly marked `originalDogramWitness.status = NOT_RUN` and makes no false native-calculation claim. The supplied GitHub workflow will run it from an exact-pinned checkout.
- **GitHub publication:** the experimental branch has now been created using the connected GitHub action; the draft PR will be opened after source upload and CI verification. It remains an experimental draft and is not merged or deployed.

## Run

Requires only Python 3.12+ for the local laboratory; no dependencies or accounts.

```bash
python3 -m unittest discover -s tests -v
python3 fairness_lab.py --fixture scenario.json --output report.json
python3 build_dashboard.py
# Open index.html locally in any modern browser; no network required.
```

For the optional **original Dogram** calculation and information-loss verification, use the original repository at the *exact pin*. Python engine verifies source Git HEAD:

```bash
git clone https://github.com/the-static-collective/Dogram.git vendor_dogram
git -C vendor_dogram checkout 551b5f9df18f17ec69b452ddcdff01718e0ff771
python3 fairness_lab.py --fixture scenario.json --native-dogram vendor_dogram --output report.json
python3 build_dashboard.py
```

The provided CI workflow carries out these steps with exact-source verification and uploads the HTML and JSON result as an artifact. The workflow is included with the 007 experimental branch. Check GitHub Actions for its observed status.

## Four predeclared objectives

In the fictional scenario there are three programs (Nourish, Winter, Community Table), arbitrary priority weights **5:4:1**, hypothetical per-program capacities **4:3:2**, hypothetical *provisional*, **not actual**, commitments **4:3:0**, and budgets **7, 8, 9, 10** indistinguishable supply kits. The chosen hard first principle is maximum safe utilization under capacities, then four competing, explicit secondary lexicographic goals:

| Policy | Optimizes | Important unoptimized considerations |
| --- | --- | --- |
| `coverage_first` | Number of programs receiving >0, then editorial-weighted quantity | May underfulfill a provisional commitment |
| `max_min_first` | Minimum allocation first, then distribution balance | May break provisional commitments |
| `provisional_commitments_first` | Number of promises maintained, then aggregate shortfall, then weighted quantity | May give one program **zero** |
| `proportional_fit_first` | Minimum **exact rational** absolute deviation from editorial proportions | Weights are invented, not evidence of legitimate need |

The full feasible allocation set is exhaustively enumerated: allocation components are integers, `0 <= x_i <= cap_i`, with `sum(x) <= budget`. Among feasible candidates every policy is additionally constrained to spend `min(budget, sum(caps))` units. The tie rules are deterministic and in `fairness_lab.py`. **Maximum utilization is an explicit, contestable assumption**; the experiment does not claim every resource should always be used.

### Baseline: seven hypothetical kits

| Declared policy | Nourish | Winter | Table | Covered programs | Simulated commitment shortfall |
| --- | ---: | ---: | ---: | ---: | ---: |
| Coverage-first | 4 | 2 | 1 | 3 | 1 |
| Max-min-first | 3 | 2 | 2 | 3 | 2 |
| Provisional-commitments-first | 4 | 3 | **0** | **2** | **0** |
| Proportional-fit-first | 3 | 3 | 1 | 3 | 1 |

**Same supply, four distinct allocations.** There is no globally certified winner. A condition called a `provisional_commitment` is fictional: it isn't a legal obligation or a real person's voluntary promise. Nothing in the 5:4:1 priority vector measures fairness, need, efficiency of actual service delivery, protected-class characteristics, or human worth.

### Capacity limit: ten hypothetical kits

The sum of program capacities is only **nine**. All four policies allocate **4:3:2** and leave **one** kit unused. The conservation law is `allocated + unused = budget`, and the signed exact residuals sum to `-unused`, not necessarily zero (the original Dogram 006 unconstrained formulas always allocated their full budget).

### Important crossing back to Dogram 006

The prior pure rounding policies are still shown as **independent, unconstrained baselines**. For budgets 8, 9, and 10, some of those earlier allocations **exceed the new illustrative capacities**; 007 correctly marks them infeasible under its added constraint rather than silently importing them as usable stock.

The exact fraction targets from 006 are retained in each 007 policy result as signed residues. When the **optional native Dogram pin** is available, the original `receipt_integer_budget` checks these frozen earlier results; the original internal `analyze_collapse` independently checks the projections. The frozen expectations are never mislabeled as a new original-Dogram receipt.

### Two representation-loss counts

Across 4 budgets × 4 policy results = **16** scenarios, keeping just `(budget, distributed_total)` hides **9** distinct distribution pairs. Keeping only `distributed_total` hides **25** distinctions because it also confuses the nine-kits-available and ten-kits-available cases (in both, only nine can be allocated). The included tests calculate both counts; native Dogram's internal research analyzer verifies them when the original pinned checkout is supplied. Those counts measure lost representational differences, **not the moral magnitude** of the losses.

## Deliberate restrictions

- **No live intake, no authenticated actors, no human commitment, no payment, no volunteering assignment, no deliveries.**
- All real-world eligibility, evidence, stock/skills, legal/health/safety constraints, geographic distribution, transportation, perishability, privacy and appeals would have to be evaluated independently.
- A category's zero count is a review flag, **not** a verdict of injustice. A positive allocation does not prove adequacy.
- The HTML viewer is a static, embedded, read-only visual result, without external network connections or actions.
- JAR;VIS receives at most a manually inspectable **HOLD candidate**. No native JAR;VIS, planZ, Garden or CANNON update is present.

## Contents

`scenario.json` — frozen fixture; `fairness_lab.py` — exact exhaustive evaluator and optional original Dogram integration; `tests/` — 17 automated negative controls; `report.json` — reproducible standalone local calculation, explicitly marked `NOT_RUN` for original Dogram; `index.html` — self-contained offline interactive viewer; `held-jarvis-review.json` — non-dispatchable experimental review packet; `dashboard.template.html`, `build_dashboard.py` and `make_review_packet.py` — inspectable visual build; `.github/workflows/unfutures-007.yml` — proposed pin-verified CI workflow.

## Applying to an eventual GRAFT branch

To preserve the existing six unmerged experiments, create a new branch **from** `graft/unfutures-006-dogram-allocation` in your own checkout. Copy all bundle files except `.github/` to a new directory `unfutures/007/`; copy `.github/workflows/unfutures-007.yml` into the repository's own `.github/workflows/` directory. Do **not** replace any 001–006 sources or push this bundle to `main`. Open a **draft** PR against the 006 branch and run the included CI workflow. The connected GitHub action has created the target branch; current PR status should be checked on GitHub.