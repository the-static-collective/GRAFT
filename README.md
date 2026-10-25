# GRAFT × RECONSTRUCTION × FREE GRAPH · 001

The working historical reconstruction now has a **navigable, content-addressed Free Graph projection** built from **three pinned original runtimes**.

```text
Black Star original cut validation
     ↓  knowledge horizon; NOT event verdict
MEMENTO original world context
     ↓  retrieved relation statuses; admission:none
GRAFT RECONSTRUCTION-001 receipt
     ↓  digest-only, PROPOSE_ONLY
Free Graph original v0 kernel (hash / validate / neighbors)
     ↓  immutable packet + bounded neighborhood, authority:none
A later owning-world decision may consider it; none is made here.
```

**This branch retains the earlier reconstruction adapter**, and adds `src/free-graph.mjs` plus `src/graph_worker.py` to produce actual `free-graph.packet/v0` records. The code invokes original `fg_ops.rehash_packet`, `validate_packet`, and `neighbors` from [Free Graph](https://github.com/the-static-collective/free-graph), rather than inventing a new incompatible graph format.

## Current capabilities

- Walk from a reconstructed world to historically connected worlds at depth 0–3.
- See a **proposed** MEMENTO relation as proposed, not as truth or adopted canon.
- Follow a reconstruction receipt to its unresolved owner-gate question.
- Preserve original source digests, exact code lineage and omitted doors.
- Export a valid content-hashed Free Graph packet from synthetic or locally supplied cuts.
- Refuse future knowledge, missing worlds, unpinned code, invalid authority and malformed requests.

Run locally with three checked-out runtimes:

```sh
node src/free-graph.mjs \
  --cut fixtures/early-cut.json \
  --world same-room-a0 --depth 1 --graph-depth 2 \
  --blackstar-root donors/black-star \
  --memento-root donors/memento \
  --freegraph-root donors/free-graph
```

**Pinned donor refs:** Black Star `08f42f769f9590d78b85c8d84358e1791d5bd318`; MEMENTO `22a5714f25c7be59bac37b3ab691c28c1f036845`; Free Graph `ec0ad8743c5faac3f3675760bbafcbcb1df846c1`.

CI checks out all three exact code refs and exercises both the earlier reconstruction tests and new graph tests.

## Authority and publication boundary

The emitted packet deliberately has `task_world_cut.status=unresolved`, modes `re-enter`/`seed`, and no `constitutes` edges. That is because a reconstructable historical relation **is not an owner-current decision**. This is a CLI/JSON navigation substrate, **not yet an interactive website, a local community deployment or a stored shared graph**.

Raw user inputs do not enter GitHub. Sources are digest-only redacted by default, and no keys are imported. A real-world output file should be treated as locally held information until reviewed; node IDs and source digests can be sensitive even when source text is withheld.
