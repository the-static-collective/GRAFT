# CAPABILITY-017 — THE UNWRITTEN METHOD

Actual bounded compositional program synthesis with a source-pinned native MOTIF-003 branch-ordering heuristic, a strong classical exhaustive baseline, on-demand counterexample-guided repairs, and independent Jubilee final-only testing.

## What was implemented

Five typed primitive slots—HTML escaping (3 alternatives), card structure (3), document shell (2), print support (2), and data-card indices (2)—compose 72 possible complete programs. The generator is not given any complete correct program and never executes arbitrary JavaScript, eval, or untrusted binaries. A program is a small typed JSON AST interpreted by GRAFT and independently interpreted by Jubilee.

Two ordinary public stories do not expose raw interpolation. The independently authored development challenger responds to a proposed program with a test containing potentially dangerous-looking, fictional HTML strings. Failed candidates and their counterexamples remain in the trace, followed by a new search. Four final-only cases cover Unicode/RTL, nested hostile markup, one-card and five-card extremes. They are evaluated only after freezing the AST. The repositories are public: the test source is not cryptographically hidden, only process-separated from the builder.

## Three honest baselines

1. Actual source-owned GRAFT-016 whole-method catalog: run all three existing rendering methods. None fulfills the new 017 indexed-and-accessibly-labeled-card requirement. This is a limited retrieval baseline, not a claim that no packages already exist.
2. Classical exhaustive enumeration of all 72 programs with the SAME public examples, counterexamples, objectives and budget. A strong classical approach can learn the same method.
3. Native MOTIF-003's original analyze_first_moves and select_first_move on a small, hand-authored typed-affordance graph. It prioritizes the escaping primitive that exposes more safe next operations; that priority genuinely orders the GRAFT program search. It does not learn a general language model or invent software primitives.

Native MOTIF source commit: 66d27cfbd077b2c91d0d86d66e320206d88d8f95; original affordance module Git blob: db25da0d50a9c8e2cd87aa576a22f969405737cf.
Jubilee exact pinned source commit: 53a03e6734dd9a4d08692b79e6bdb9e8f5e9e729.

## Proof crossing

Jubilee public specification → pinned native MOTIF heuristic → GRAFT 017 typed AST generator and classical exhaustive control → developer counterexample feedback → frozen program JSON (no executable file) → Jubilee separate interpreter, source checks and four final-only examples → existing CONCORD-014 proposes one new CONDITIONAL route with unasked curator and landlord.

Everything involves fictional stories and voluntary hypothetical interests. No real image permissions, addresses, people, financial records, contact messages, creditor agreements, payments, services, loan, rent discharge, automated deployment, GRAFT production admission, or legal authority is involved.

GitHub Actions tests the actual cross, then stores the inert JSON evidence as a build artifact. For local reproduction see the corresponding workflow commands and Jubilee labs/penny-puddle-017/README.md. Requires Node.js 22+ and Python 3.10+.

Limits: the source operator grammar, safety tests and native affordance graph are intentionally tiny and hand-written. This is classical program synthesis on a fixed domain, not arbitrary code invention, historically novel mathematics or a demonstrated advantage over an equally type-aware classical system.

Research rule: Generate from components, retain wrong attempts as counterexamples, evaluate unseen-by-process cases after freeze, and never treat successful local code as consent or economic completion.