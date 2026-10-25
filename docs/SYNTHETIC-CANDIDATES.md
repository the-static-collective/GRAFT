> **Historical stage only — superseded 2026-10-25.** The two GRAFT branches now ALSO contain selected real original code with CI verification. Read [NATIVE-SOURCE-IMPORTS.md](NATIVE-SOURCE-IMPORTS.md) for current state. The material below describes the earlier synthetic-only stage and must not be treated as the current complete branch inventory.\n\n# Two candidate transplants: MEMENTO × Black Star

**Date:** 2026-10-25  
**State:** public **synthetic-only kernels**, original private donor source **not** published. Do not conflate this demonstration with a full code transfer or release.

## The handoff we can safely try

```text
Black Star candidate: validate observer knowledge horizon
    |  only synthetic carrier IDs and attributable cut metadata
    v
MEMENTO candidate: propose a review crossing
    |  explicit ADMIT / REFUSE / FOG review receipt (no write)
    v
MEMENTO context pack: retrieve receipted neighboring worlds
    |  admission:none; no source-to-canon shortcut
    v
Human local reviewer: may accept, refuse, or keep fog
```

No automatic chain of authority is established by this diagram. Black Star's validation is not a verdict; MEMENTO's review receipt is not a committed ledger decision. `PASS != ADMISSION`, `CONTEXT != CANON`, `DELTA != RETROACTIVE KNOWLEDGE`. These are separate organs, not two copies of one memory system.

## What is actually running

- `graft/MEMENTO`: `src/membrane.mjs` implements a pure crossing reviewer, bounded world graph context pack, and activation projection. Tests: **4/4 locally passing** with Node's built-in runner.
- `graft/black-star`: `src/blackstar_graft.py` implements cut validation, observer delta and activation chronology checks. Tests: **6/6 locally passing** with Python unittest.
- Both branches are independently runnable, require no external network, do not read environment variables, and contain no donor data. Neither performs filesystem mutations, contacts a service, or self-grants downstream authority.

The local tests were run on 2026-10-25 using hand-authored synthetic fixtures. No GitHub Actions CI run, independent security audit, or deployed endpoint has been established. The original application sources remain private and independently governed.

## Current publication boundary

1. Preserve each donor's own identity, ownership and semantics; these candidates are newly authored demonstrations, **not literal imports**.
2. Do not copy private history, archive snapshots, source indexes, testimony, child-related material, communication transcripts, people or case information, keys, URLs carrying tokens, or credential-bearing configs into GRAFT.
3. Keep exact inspected donor ref and date, along with the public descendant commit and test result, so another reviewer can reproduce the boundary.
4. For **actual original-source extraction**, require independent full-history audit, rights/licensing check, clean Git commits, dependency tests, and explicit human release approval. Current state remains **HOLD**.
5. Promote to a consumer only by an explicit, typed adapter mapping and a consuming project's independent gate. Avoid wiring private repositories to public deployments without a new review.

## Next bounded check

A third fixture-only compatibility test can pass a Black Star `observer_delta` summary as a *referenced* proposal input to MEMENTO's `reviewCrossing` and assert **no automatic `ADMIT`**. It must avoid importing private structures or copying the Black Star cut as a story-canon fact.

Machine-readable pointer: [candidate-registry.json](../candidate-registry.json). Every original donor release still requires its own subsequent approval.
