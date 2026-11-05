# GRAFT-MOTIF-021 — Classical-plan-driven executable source-custody candidate

This branch implements a real **cross-repository ALEX → planZ → GRAFT** public-source research pipeline, with no granted deployment or unrestricted code-generation authority.

**Original input custody:**
- ALEX pinned public research packet: `the-static-collective/ALEX.2` commit `c697ce69...`, Git blob `71485bd8327bb1bf320d00e0e6e1cee3449365b6`.
- planZ original finite **classical uniform-cost STRIPS planner**: exact-copy code Git blob `22d75c26039e5783b59cf71be02982428603128c` from its independently owned branch.
- planZ generated optimal held plan: Git blob `ce8d9c2c67ccaedb748c50580e5a056f761c354b`, seven steps, declared planning cost 9.

GRAFT's `src/motif021-composer.mjs` checks the input packet and held plan at their exact Git blob bytes. It calls the actual original planZ `validateSavedPlan` to replay and validate the shortest path. Only a fixed allowlisted recipe is compiled; source strings from search results are **never interpolated into executable JS**. The generated module `generated/motif021-source-review.mjs` is reproducible byte for byte, and the test suite rejects drift.

**Actual executable capabilities:**
- `executePublicSourceReview(packet, rawBytes, plan)`: produces a source-locus-linked candidate graph and explicit unanswered questions, with unmatched source query coverage visible.
- `executeLineageCaution(packet, rawBytes, plan)`: groups search hits by exact repository/commit/file, expressly refusing to equate distinct Git locations with independent witnesses.

Run `node --test test/motif021.test.mjs` and `node scripts/run-motif021.mjs`. The dedicated Actions workflow runs them and uploads the resulting review packet. Neither program searches the live web or rewrites historical evidence; they operate only on the pinned ALEX source packet. New real-source search requires a fresh ALEX observation and downstream review.

The compiled module has **authority:none**, **promotion:NONE**, no external network effects, no secret access and no production installation. Its returned 'claims' are classed as review candidates, not verified facts. No private source history, source-owner Git history or third-party data is imported.

This is a **runnable, tested capability candidate** under source-owner review—not an installed production capability and not a general-purpose agent or arbitrarily self-modifying compiler.
