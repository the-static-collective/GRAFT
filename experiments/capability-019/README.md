# CAPABILITY-019 — COMPOSE THE MISSING ALGORITHM

**A real, bounded algorithm-construction experiment, not a generated description of one.**

CAPABILITY-018 showed that all **72** old 017 programs lacked the necessary *derived Unicode count*, and selected a built-in `Intl.Segmenter` grapheme counter from five known candidate primitives.

019 asks for something more: a *compound, stateful, reversible operation* absent from the original local method library. The actual prior 017 source programs and 018 source primitives are executed as controls (**72 + 5 = 77**, none returns a typed ordered run-list). Jubilee specifies only the behavior and tests:

```text
aaabbaa       → [["a",3],["b",2],["a",2]]
👩‍💻👩‍💻a       → [["👩‍💻",2],["a",1]]
Aa            → [["A",1],["a",1]]
```

The new generated operation must encode **consecutive identical Unicode grapheme clusters** into ordered pairs and reconstruct the original text exactly, including accents, case, emoji joiners and whitespace.

## GRAFT truly constructs a complete program

`experiments/capability-019/program.mjs` has a **generic stateful reducer interpreter**, not a handcoded complete RLE algorithm. The public spec supplies five independent operator families:

| Stage | Candidate mechanisms |
|---|---|
| Tokenize input | UTF-16 units / Unicode codepoints / grapheme clusters |
| Compare the previous run and incoming token | case-insensitive / exact |
| If equal | append new run / increment previous run |
| If different | increment previous run / append new run |
| Emission | lengths only / reversible [token,count] pairs |

There are exactly **48 complete programs**. `synthesize.mjs` actively constructs them as **typed JSON ASTs** and runs each candidate against public examples, then requests one independent developmental counterexample *after proposing the apparently successful candidate*. It adds the case and searches again until a candidate passes or the finite budget is exhausted.

In this constructed domain, correctness is determined by an independently written Jubilee interpreter and eight final-only Unicode cases. GRAFT doesn't run or even import the heldout cases during search. Both the generated AST and failed intermediate proposals are preserved in an inert JSON artifact.

The **generic reducer template is hand-written**. The search chooses transition policy, segmentation and emission; it does **not** autonomously invent arbitrary control flow, general software algorithms, a new Unicode library or a historically new RLE algorithm. This is a new capability relative to the existing 017+018 local program library.

## A deliberately fallible native MOTIF hint

This matters to the earlier question about whether **wrong answers can be useful**.

`native_priority.py` imports the **actual original MOTIF-003** `analyze_first_moves` / `select_first_move` at source commit `66d27cfbd077b2c91d0d86d66e320206d88d8f95`, checking the Git-blob digest `db25da0d50a9c8e2cd87aa576a22f969405737cf`.

Its hand-authored affordance graph intentionally prizes codepoint analysis before grapheme analysis because that branch offers more imagined adjacent follow-on activities. **Codepoint segmentation is wrong for grapheme-level RLE on joined emoji.**

The native result orders actual GRAFT candidate enumeration. The independent developer oracle must discover and correct this mistake. This prevents calling a hand-written perfect-first-choice structural hint evidence of predictive intelligence.

A **classical exhaustive CEGIS baseline** receives the identical 48-program grammar, public examples, developer feedback and bounds; it can discover the same program and retain its failures. A type-aware classical heuristic might match or beat the native ranking. This experiment cannot establish superiority over all classical synthesis.

## Expected diagnostic failures

Public examples `a` and `ab` can be satisfied even when adjacent identical tokens are not combined, when casefolding destroys distinctions, or when codepoint segmentation splits a joined emoji.

The separate Jubilee development challenger reveals counterexamples only after a candidate is offered:

1. `aa` must encode to `[["a",2]]`, not two independent runs.
2. `Aa` must preserve two distinct case-sensitive runs.
3. `👩‍💻👩‍💻` must encode as two **identical whole grapheme units** in one run.
4. `aaba` must maintain ordered local runs rather than global frequency grouping.

The final evaluator additionally checks eight independently authored inputs: repeated runs, case, ZWJ emoji, combining accents and precomposed characters, flags, whitespace, skin-tone modifiers and alternating patterns.

The public GitHub source of heldout cases is accessible to any reader. The separation is a reproducible **process boundary**, not cryptographically secret examples.

## Actual cross-repository source execution

```text
Jubilee 019 public behavior requirement (no complete correct program)
                  |
        original native MOTIF-003
        (fallible priority only)
                  |
       GRAFT 019 48-program generator
       /                              \
MOTIF-ordered CEGIS           classical exhaustive CEGIS
       \                              /
          independent development counterexamples
                  |
          frozen typed JSON ASTs + error history
                  |
        JUBILEE'S OWN reducer interpreter
        8 final-only case tests and 77 old-program control
                  |
        if passed: an UNKNOWN human-curator operator
        in the original source-owned CONCORD-014
```

The GRAFT CI checks out the exact Jubilee source at `9b886abaa8bdce5879031da24406b42c4bcd43e4` and the original source-pinned MOTIF, performs the actual local search, independently evaluates the frozen method in Jubilee and uploads only inert JSON evidence.

### Run (Node 22+, Python 3.10+)

With the exact source checkouts:

```sh
MOTIF_SOURCE_ROOT=motif-source python3 experiments/capability-019/native_priority.py > /tmp/motif-019-priority.json

node jubilee-source/labs/penny-puddle-019/export.mjs > /tmp/jubilee-019-public.json

JUBILEE_SOURCE_ROOT=jubilee-source node experiments/capability-019/cross.mjs \
  --request /tmp/jubilee-019-public.json \
  --priority /tmp/motif-019-priority.json \
  --out /tmp/a-fresh-new-graft-019-folder

node jubilee-source/labs/penny-puddle-019/verify-output.mjs \
  --request /tmp/jubilee-019-public.json \
  --kit /tmp/a-fresh-new-graft-019-folder
```

The output path must not exist. No arbitrary user code is executed. No model is fine-tuned or original MOTIF repo changed. A typed AST with eight passing synthetic tests is **not** general proof of program safety or global Unicode conformance.

Any new CONCORD-014 route is still an **unaccepted hypothetical human arrangement**, not a right to use someone's property, a landlord agreement, a debt waiver or a real payment. All actual social, financial, legal, physical and production authority remains zero.

**Principle:** *A useful mistake eliminates an incorrect possible algorithm. An independently passing candidate demonstrates only the bounded behavior actually tested.*
