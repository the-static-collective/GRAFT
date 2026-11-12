# CAPABILITY-019 — CONSTRUCT THE MISSING METHOD FROM ONE GATE

**MOTIF × GRAFT × Jubilee — executable, source-pinned Boolean synthesis experiment.**

A stricter experiment than the earlier 018 Unicode case: the desired *complete function* does not appear as a finished method or a built-in library call. The primitive vocabulary contains **only NAND**, and a two-input disagreement detector must be synthesized as a typed circuit AST. This reconstructs a **well-known XOR circuit**; it does not invent a historically new primitive, new scientific algorithm, or evidence of unconstrained recursive self-improvement.

## Missing-method test

The publicly supplied Jubilee problem includes two binary examples only: `00→0`, `01→1`. The correct behavior is stated in words: output one iff two independent binary input bits differ. The builder is **not** supplied a complete NAND XOR circuit. It can choose gates from previously available wires, using NAND as its sole operation; a canonical program must end in its last gate output, with a maximum of four gates.

The source-owned Jubilee independent interpreter **actually enumerates every 1-, 2-, and 3-gate canonical NAND circuit**: 3 + 18 + 180 = **201 circuits**, zero solve the required complete truth table. This is a precise minimality result inside the defined restricted grammar, not general Boolean impossibility.

GRAFT `nand.mjs` independently enumerates and executes every candidate circuit on the currently known cases. `synthesize.mjs` uses classic counterexample-guided inductive synthesis (CEGIS): select the shortest candidate satisfying known evidence, show it to Jubilee's *separate developmental oracle*, retain its failure, add the newly exposed input/output row, and search again.

The developmental challenger adds `10→1` and then `11→0` after failed proposals. Both original and corrected candidate circuits stay in the audit record; no earlier answer is retroactively called correct.

## Actual native original MOTIF-003

The original source-pinned `analyze_first_moves()` / `select_first_move()` functions operate on the **actual NAND truth functions** of two-input wires.

The three possible first gates `NAND(a,a)`, `NAND(a,b)`, and `NAND(b,b)` unlock different numbers of **distinct two-input-dependent truth functions after one additional NAND**. We calculate these exactly rather than assigning arbitrary numerical opportunity scores:

| First gate | Distinct subsequent functions depending on both inputs |
|---|---:|
| NAND(a,a) | 2 |
| NAND(a,b) | **4** |
| NAND(b,b) | 2 |

Native MOTIF therefore puts `NAND(a,b)` first. That ACTUAL priority orders GRAFT's subsequent circuit enumeration. All other constraints, feedback, program grammar, and budget are identical to the **strong classical shortest-first enumerator**.

This is an explicitly authored structural heuristic. A classical semantics-aware or type-aware heuristic given the same two-step truth-function metric could tie it. No claim of general superiority follows from faster search on this narrow test.

Original source: `the-static-collective/MOTIF` pinned SHA `66d27cfbd077b2c91d0d86d66e320206d88d8f95`; original `experiments/003/affordance.py` Git blob SHA `db25da0d50a9c8e2cd87aa576a22f969405737cf`.

## Independently test **reusability**, not memorization

Once the GRAFT generator freezes its 4-gate two-input NAND circuit, Jubilee's own interpreter checks its entire truth table.

Then comes a genuinely different **final-only interface**: reuse the derived two-input operator **twice** to calculate odd parity of **three independent inputs**. The two-input synthesis never sees 3-input training cases. The final-only suite examines all eight possible 3-input combinations. An additional check verifies input-swap symmetry.

This is a meaningful demonstration of **a reusable derived method** constructed from a smaller source vocabulary. It is not proof of historically new Boolean algebra. The heldout source is publicly readable; process separation is not cryptographic withholding against malicious reviewers.

## Actual code and evidence

- `nand.mjs`: separate GRAFT typed NAND circuit AST enumerator and deterministic interpreter.
- `synthesize.mjs`: bounded CEGIS search, both source-consistent strategies, retained attempted circuits, exact reported candidate counts.
- `native_motif_priority.py`: source-blob-verified original MOTIF-003 operating on actual truth-table reachability, not imaginary social interactions.
- `cross.mjs`: imports original source-owned Jubilee public problem and development oracle from an exact commit, invokes both searches, outputs a **JSON-only** frozen circuit transcript.
- `test/nand.test.mjs`: real independent proof replay, falsifying counterexamples, 201-circuit lower bound, strict circuit typing, eight final transfer cases and fraud/authority checks.
- `.github/workflows/graft-capability-019.yml`: source-pins original Jubilee and MOTIF, executes the complete cross, tests final-only transfer, and stores only inert JSON evidence for review.

Jubilee source pinned at `0860e1febe4e7740e3612a3c3caf193c0dd14210`. Original main branches, MOTIF runtime, app deployments, CANNON and operational systems remain untouched.

### Run locally (Node.js 22+, Python 3.10+)

With the source-pinned Jubilee and original MOTIF source checkouts:

```sh
MOTIF_SOURCE_ROOT=motif-source python3 experiments/capability-019/native_motif_priority.py > /tmp/motif-gate-order.json
node jubilee-source/labs/penny-puddle-019/export.mjs > /tmp/jubilee-019-public.json

JUBILEE_SOURCE_ROOT=jubilee-source node experiments/capability-019/cross.mjs \
  --request /tmp/jubilee-019-public.json \
  --priority /tmp/motif-gate-order.json \
  --out /tmp/new-unused-graft-019-output

node jubilee-source/labs/penny-puddle-019/verify-output.mjs \
  --request /tmp/jubilee-019-public.json \
  --kit /tmp/new-unused-graft-019-output
```

The output directory must not already exist. No generated JavaScript or HTML executes, no network access or credential is used by the experiment, and no code is auto-admitted to production.

## Boundaries

The target is a well-established XOR method; the novelty is **new to our constrained method catalog**, and the reusable three-input parity proof. A different domain-specific classical heuristic could match the native first-gate ranking. The reported search counts are independently recomputed; they reflect the chosen enumeration order on one small Boolean task, not real-world economic outcomes or general AI intelligence.

**No gold/rent solution is implied by a NAND logic circuit.** This intentionally does **not** insert an unrelated hypothetical creditor exchange into the Jubilee ECONOMY. Real money, work, consent, property rights, debt discharge, contacts, deployments and verified human benefit are all zero.

**Research rule:** If a tool library lacks the answer, generate from underlying primitives, keep falsifying counterexamples, and prove transfer to an untrained task. Do not confuse a derived textbook circuit with historically unprecedented invention.
