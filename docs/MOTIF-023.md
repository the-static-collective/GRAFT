# GRAFT-023 — Composable execution from observed source gaps

Source-owner candidate compiler `src/motif023-compiler.mjs` imports **original planZ-023** code at exact Git blob `d0480b0e1089bcc8d731e0b7fd23141fe5adbbc0` and original planZ-021 finite Dijkstra at `22d75c26039e5783b59cf71be02982428603128c`, verifying both before compilation. The input is an ALEX-023 **actually fetched** verified-public GitHub source packet and a planZ-023 classical plan **replayed and checked** against that packet.

The composer generates **new executable ES module source** using the *verified plan's actual mode and chosen classical actions*. It only emits fixed audited program fragments plus checked finite plan metadata; user text, external HTML and source excerpts are **never injected as executable code**.

`executeCandidate` recreates expected source deterministically, verifies its exact content SHA-256, loads only this closed-template ES module in a local Node test run and calls its `execute(packet,plan)`. It produces an attributable observation about actual candidate source locations, visible gaps and unverified origins. This observation can be handed to planZ for a **new** classical inquiry plan.

Demonstrated modes: LINEAGE (original source custody), COMPOSITION (bounded code-owner review), REFERENCE (independent reference checks). Each returns different investigation questions. Missing source, forged plans and mutated emitted programs produce HOLD.

No external effects, source-owner admission, model-based arbitrary synthesis, private repository search, actual original human identity checks, installation or production deployment. A compiled executable research candidate is **not** a self-authorized production plugin.

Reproduce: `node --test test/motif023.test.mjs`.
