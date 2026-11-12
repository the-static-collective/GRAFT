# GRAFT × MOTIF × JUBILEE — CAPABILITY-018: THE MISSING PRIMITIVE

**A falsifiable vocabulary-expansion experiment.** The earlier Jubilee/GRAFT 017 experiment composed 72 different complete programs from five fixed stages. All could render text but NONE could calculate a caption-dependent Unicode grapheme count. This 018 experiment executes all 72 original complete programs and independently verifies that they cannot emit the requested dynamic data-graphemes attribute. This proves an expressivity gap ONLY in that finite old language, not in general computing.

## The new capability under investigation

Use the existing, correctly escaped, original GRAFT-017 document renderer as a base and add a new typed operation:

    caption → segment input → count segments → attach data-graphemes=N to its card

The actual GRAFT source implements **five testable hypotheses**: constant-one, UTF-16 code-unit count, Unicode code-point count, whitespace-token count, and Intl.Segmenter grapheme count. Each hypothesis is implemented using existing JavaScript operations; no new Unicode algorithm or arbitrary new programming language is invented. This is a new operator relative to the old 017 restricted grammar.

Two public one-character captions let wrong implementations look correct. A separately owned Jubilee developmental challenger reveals a specific failed case AFTER each method is proposed: ab has two graphemes, while a combining-accent sequence has one despite occupying multiple UTF-16 units/code points. The classical exhaustive search retains two failed proposals, adds each counterexample and eventually reaches the built-in Intl.Segmenter method. The MOTIF-ordered search may choose that method earlier based on an explicitly HAND-AUTHORED affordance graph.

## Native MOTIF actually executes

The original source-pinned MOTIF-003 analyze_first_moves and select_first_move functions run on a five-branch graph of operator types. The graph gives the grapheme-aware choice more hypothetical follow-on capabilities. The resulting method priority is written as JSON and passed into the real GRAFT synthesis search. The GRAFT code does not merely print a prewritten priority label.

Native MOTIF exact source commit: 66d27cfbd077b2c91d0d86d66e320206d88d8f95. Blob digest for original 003 module: db25da0d50a9c8e2cd87aa576a22f969405737cf. An equally informed classical type-aware heuristic could match this ordering. This is not evidence of superiority over classical algorithms.

## Strong controls and independent evaluation

- **Old grammar impossibility:** GRAFT actually re-executes 72 old source-owned programs; Jubilee independently does so, and both find no existing data-derived attribute.
- **Classical complete search:** identical five candidates, public examples, feedback oracle and bounds; uses exhaustive fixed ordering, remembers counterexamples.
- **Native-ordered search:** same candidates and constraints, but branch ordering from actual original MOTIF-003.
- **Final independent verdict:** GRAFT freezes descriptors and SHA-256 output digests into INERT JSON. Jubilee independently compiles each chosen descriptor, checks counterexample history and evaluates FIVE final-only Unicode cases: ZWJ family emoji, national flags, skin tone, combining accents, and five-caption boundaries.
- **Real economic boundary:** one new conditional operator can be added to the original source-owned CONCORD-014 model. The human curator, rights owner and landlord still must consent. No actual work, payment, rent discharge, verified value, right or ownership occurs.

The source of the held-out cases is public on GitHub. The GRAFT search process does NOT import or receive those cases until the final verification step. This is procedural test separation, NOT secret tests immune to malicious authors. The lexical scanner is only a deliberately bounded demonstration, not comprehensive HTML security or Unicode conformance certification.

## Reproduce locally (Node.js 22+, Python 3.10+)

With the exact Jubilee research source pinned to commit dbf352e67829dc27ce5b97bd35b50dd61403f946 and MOTIF source pinned to the commit above:

    MOTIF_SOURCE_ROOT=motif-source python3 experiments/capability-018/native_motif_priority.py > /tmp/motif-018-priority.json
    node jubilee-source/labs/penny-puddle-018/export.mjs > /tmp/jubilee-018-spec.json
    JUBILEE_SOURCE_ROOT=jubilee-source node experiments/capability-018/cross.mjs --request /tmp/jubilee-018-spec.json --priority /tmp/motif-018-priority.json --out /tmp/brand-new-graft-018-output
    node jubilee-source/labs/penny-puddle-018/verify-output.mjs --request /tmp/jubilee-018-spec.json --kit /tmp/brand-new-graft-018-output

The output directory must not exist. Only a JSON file is written; no unsafe HTML files are served or executed, and no service is deployed. The GitHub workflow performs the full pinned cross and uploads the evidence as a reviewable inert artifact.

## What would count as a deeper 019 breakthrough?

Do not call an existing Intl.Segmenter a historically novel invented primitive. The important result is a method for distinguishing **missing vocabulary** from **bad program composition** and closing a demonstrated gap through an independently tested operator. The next discriminating test would require genuinely *constructing* a primitive behavior from smaller mechanisms in the absence of a ready existing implementation, with stronger classical controls, independent unseen-by-process tests, reproducible complexity measurements and honest failure cases.

**Research law:** absence of an operator is an explicit hypothesis about the current language. The proof applies only to that language. All other possibilities remain open.