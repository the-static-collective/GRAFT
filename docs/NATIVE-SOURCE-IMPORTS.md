# Original-source grafts: MEMENTO and Black Star

**2026-10-25.** The owner authorized use of original source code, while requiring keys to remain private. This triggered a native selected-file transplant on both existing GRAFT branches. This page supersedes the earlier synthetic-only release stage.

## Actual Git history/provenance
| Public branch | Original private donor source commit | GRAFT commit | Files from donor | Executed CI |
|---|---|---|---:|---|
| `graft/MEMENTO` | `70ceaad8fd7a87e5b5f753f8f345693aec7570a0` | [`22a5714f`](https://github.com/the-static-collective/GRAFT/commit/22a5714f25c7be59bac37b3ab691c28c1f036845) | 21 | [success](https://github.com/the-static-collective/GRAFT/actions/runs/40190057330) |
| `graft/black-star` | `235f584f825eced13e70934a98554c3d2d9a13ad` | [`08f42f76`](https://github.com/the-static-collective/GRAFT/commit/08f42f769f9590d78b85c8d84358e1791d5bd318) | 53 | [success, Python 3.11 & 3.12](https://github.com/the-static-collective/GRAFT/actions/runs/40190328514) |

### Native MEMENTO
The **original** source under `scripts/` provides UNDERSTORY recording and 3rdi handoff, historical world saving, and bounded context compilation, with paired original tests and synthetic world fixtures. Node 22 GitHub Actions succeeded for `node --test test/*.test.mjs` and one context compiler smoke test.

The earlier GRAFT-authored synthetic `src/membrane.mjs` is retained distinctly. Note semantic difference: original MEMENTO's context pack can carry proposed non-refused edges with `admission: none`; the older synthetic demo used a narrower rule. Do not use the demo as a substitute for original system behavior.

### Native Black Star
The **original** Python package under `src/blackstar/` is imported with Python package metadata, CLI, ghost cuts, anti-narc, source/media validation, child-first, phone witness, situation decoder and full chat archive modules. Original synthetic fixtures and six original standalone test suites are included, plus a separate *new GRAFT test* of the native Ghost Cut module. GitHub Actions passed on Python **3.11 and 3.12**, including install, compile, unit test, status and synthetic media validation.

The original donor's `test_ghostcut.py`, CLI selftest and source index checks depend on real-world derived witness records/source indexes, deliberately omitted here. The import therefore **does not claim full donor parity**, private archive migration, or production deployment.

## Privacy, provenance, and authority
- Raw witness data, `derived/`, `source-registry/`, archive history, private narratives, .env files and personal source material were **excluded** from the published cuts. User permission to share their own code does not by itself authorize sharing someone else's sensitive information.
- A basic selected-file scan for recognizable provider keys and private-key signatures found no matches. This was not a complete multi-format secret scan or an audit of the donors' entire private Git history.
- Files were copied by content into **new GRAFT commit ancestry**; neither private donor repo became public and neither private history was copied into public refs.
- Existing synthetic GRAFT prototypes remain clearly separate from native code.
- Successful tests verify only the selected subset under named runtimes, not fact truth, narrative canon, downstream authority, licensing or deployment.

## Next crossing
A proposed compatibility adapter could consume only Black Star's synthetic observer-cut **validation receipt** and hand an attributable reference to MEMENTO's own candidate/gate interface. That would require a separate contract test and no silent `ADMIT`. The present two imports **do not yet operate as an integrated service**.

Machine registry: [candidate-registry.json](../candidate-registry.json).

## Live native interoperability seam · RECONSTRUCTION-001 (2026-10-25)

The independent [`graft/reconstruction-001` branch](https://github.com/the-static-collective/GRAFT/tree/graft/reconstruction-001) composes the two native imports at **exact pinned commit SHAs**. It checks a Black Star observer cut, compiles MEMENTO historical context and produces a GRAFT read-only proposal receipt with `authority:none`. It does not open a MEMENTO ADMIT gate or persist a memory. Its [CI run passed five integration tests](https://github.com/the-static-collective/GRAFT/actions/runs/40192807313), including horizon refusal, unknown-world refusal, source checkout identity and determinism. No deployment or live data processing is claimed.

## Native Free Graph traversal: GRAFT × RECONSTRUCTION (2026-10-25)

[`graft/free-graph-reconstruction-001`](https://github.com/the-static-collective/GRAFT/tree/graft/free-graph-reconstruction-001) adds a third pinned donor, original [Free Graph](https://github.com/the-static-collective/free-graph) at `ec0ad8743c5faac3f3675760bbafcbcb1df846c1`, to the working Black Star/MEMENTO reconstruction. The adapter calls original Free Graph content hashing, contract validation and bounded `neighbors` on digest-only, non-authoritative receipts. It emits a complete `free-graph.packet/v0`, a depth-bounded neighborhood, and an unresolved owner-gate question.

[Latest CI passed](https://github.com/the-static-collective/GRAFT/actions/runs/40194055434): 5 earlier reconstruction tests, 7 new integration tests, 45 upstream Free Graph unit tests, and JavaScript syntax validation of the offline explorer. The downloadable browser explorer is packaged under `explorer/` but **no public site or hosted service** is deployed. This is historical adjacency, not a claim of causation, ancestry or the future. Original upstream repositories remain unchanged.

## ATTEND-001: JAR;VIS, planZ and CANNON added (2026-10-25)

[`graft/jarvis-cannon-planz-001`](https://github.com/the-static-collective/GRAFT/tree/graft/jarvis-cannon-planz-001) wraps the prior original Black Star/MEMENTO/Free Graph chain with original JAR;VIS source interface, original planZ PhaseLift board validator and original CANNON signed Canon Field event history projection. The current snapshot contains just three planZ PhaseLift records dated 2026-10-19; candidates are not decisions about present project state. CANNON returns UNKNOWN without independent owner pins, rather than claiming an empty canon. Explicit optional independently supplied pins permit native signature-history verification **without** deployment grants, source object verification or claimed real signer identity.

[CI success](https://github.com/the-static-collective/GRAFT/actions/runs/40194870355): 8 source-attendant tests, 12 earlier reconstruction/graph tests and 45 upstream Free Graph tests. No actual user/project private data, remote search, live Abundent website integration, action granting or write capability was used. Original repos remain unchanged.
