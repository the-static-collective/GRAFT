# GRAFT × MOTIF × JUBILEE 020 — WHEN A DIFFERENT MEMORY STRUCTURE IS NECESSARY

**Research question:** When existing intermediate memory cannot represent the dependency being investigated, can source-owned experimental machinery select a different data structure and demonstrate that it solves the task?

019's completed reversible grapheme run-length encoder is a sequential reducer. It has no parser result containing a validity decision and correct matching indices for nested, *typed* bracket pairs. The 020 public specification requests exactly that. All 48 previous 019 programs are executed as an **old library output-type control**; none emits the required nested pair-witness object.

## Real executable architectural search

The program is a bounded source-owned five-stage typed AST:

| Decision | Alternatives |
| --- | --- |
| Pending memory | last-opening register, separate counters per bracket type, or a generic LIFO array |
| Closing type validation | any closer, exact type |
| End of input | accept outstanding openings, require empty pending memory |
| Error handling | ignore unmatched bracket, permanently reject |
| Evidence | validity only, or complete ordered opening/closing index witnesses |

Exactly **48 complete programs**. The public source does not supply a complete correct program. A generic token scanner and the three memory organizations are **hand-written**. The syntheses select combinations of these components; they do not invent stacks or general control flow.

The development challenger is source-owned by Jubilee and responds only AFTER a candidate is proposed. The public examples are simple, flat pairs; they do not distinguish a register or two counters from a LIFO stack. Later examples disclose failures in nested structures, crossing types, unclosed openers, invalid prefixes or malformed closers. Each rejected candidate and exact counterexample is retained.

The companion Jubilee receiving verifier separately implements the same candidate grammar without importing GRAFT's parser. It checks original public outputs, exact hashes, all failed developmental proposals and **10 manually authored heldout cases** after freezing the selected program. The heldout GitHub source is public, so this is a process boundary, not cryptographic secrecy.

## An intentionally unreliable MOTIF heuristic

The original native MOTIF-003 `analyze_first_moves()` and `select_first_move()` are source-blob checked and actually executed from original commit `66d27cfbd077b2c91d0d86d66e320206d88d8f95` (blob `db25da0d50a9c8e2cd87aa576a22f969405737cf`). Their hand-authored structural graph gives **per-type counters** more immediately reachable toy affordances than a generic LIFO list.

But separate counters **cannot correctly distinguish** `([])` from the crossed nesting of `([)]` while preserving matched pair witnesses. Native MOTIF is thus deliberately encouraged toward an insufficient representation. Independent counterexamples, not trust in MOTIF's initial idea, must refute that hypothesis.

For fairness, there are TWO classical controls:

1. A complete classical CEGIS enumerator on exactly the same 48 programs, initial cases, counterexample oracle and budget, ordered without native MOTIF.
2. A directly authored **conventional classical stack parser** that can solve the domain in one pass, without learning or search. This direct parser is an especially important stronger baseline: rediscovering a stack does not make the generator a better parser than normal computer science.

After program freeze, a further exhaustive battery checks all **5,461 strings** of lengths 0–6 from the four bracket symbols `()[]`. Both GRAFT's program interpreter and Jubilee's independently authored interpreter must agree with the direct classical reference parser on every one. This is a bounded exhaustive test of a small alphabet, not a proof of correctness for all possible inputs or arbitrary nesting lengths.

## Reproducible implementation crossing

```text
Jubilee-020 original pinned public behavior specification
        ↓
Original source-verified native MOTIF-003 ranks representation hypotheses
        ↓
GRAFT 020 program constructor (48 typed combinations)
        ├─ native-affordance-ordered CEGIS
        └─ equal-footing classical exhaustive CEGIS
        ↓
one source-owned Jubilee developmental counterexample after proposal
        ↓
freeze candidate and all earlier failed program traces
        ↓
Jubilee's independent interpreter and 10 final-only cases
        ↓
post-freeze 5,461-string reference-parser stress experiment
        ↓
candidate SOFTWARE METHOD — proposal-only, no deployment or real-world rights
```

Exact Jubilee source pin: `50838b8ea7ddcf857df86a7963b6fa61b5f626c6`.

## Critical departure from earlier Jubilee experiments

**We do NOT turn an abstract bracket parser into an imaginary landlord agreement.** There is no demonstrated relationship between this parser and the fictional rent-satisfaction puzzle. The receiving code reports **zero economic opportunities**, reserving a verified algorithm candidate for future usefulness review.

No real people or private data, credits, actual service, property rights, title, legal discharge, money, landlord assent, production deployment or source model edits are involved.

A source code repo, test digest or favorable result cannot grant the right to use someone else's assets or labor.

## Run (Node 22+, Python 3.10+)

With exact original source checkouts, from the GRAFT branch:

```sh
MOTIF_SOURCE_ROOT=motif-source python3 experiments/capability-020/native_priority.py > /tmp/motif-020.json
node jubilee-source/labs/penny-puddle-020/export.mjs > /tmp/jubilee-020-public.json
JUBILEE_SOURCE_ROOT=jubilee-source node experiments/capability-020/cross.mjs \
  --request /tmp/jubilee-020-public.json \
  --priority /tmp/motif-020.json \
  --out /tmp/new-020-result-directory
node jubilee-source/labs/penny-puddle-020/verify-output.mjs \
  --request /tmp/jubilee-020-public.json \
  --kit /tmp/new-020-result-directory
```

GitHub Actions executes the full chain and archives the frozen typed JSON program, counterspecimens and native search evidence. The output directory must not already exist; the writer refuses to overwrite other work.

**What is actually demonstrated:** choosing between known, distinctly organized intermediate memories from a finite grammar and correcting poor first choices through evidence. NOT an originally invented stack, new parsing mathematics, unrestricted self-modifying software, historically new memory architecture or a superiority claim over standard classical parsing.
