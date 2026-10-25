# GRAFT · ATTEND-001 — JAR;VIS × Free Graph × CANNON × planZ

**Source-grounded, read-only local JAR;VIS routing** built on the already verified Black Star → MEMENTO → GRAFT → Free Graph bridge. This is an experimental **six-native-head** composition, not a deployed Ask JAR;VIS site.

Run the [source-attendant CLI](src/attend.mjs) with a question and pinned checkouts. It:

1. Gets a native Free Graph reconstruction packet.
2. Imports the **original JAR;VIS** Jar and doors, but does not treat its fictional fixtures as real users.
3. Imports **original planZ** PhaseLift board checks and returns only attributable, time-bounded *review candidates*.
4. Imports **original CANNON** Canon Field verifier. Without externally selected trust pins, canon state stays UNKNOWN, not falsely EMPTY.
5. Reports a bounded next step with **HOLD**, no authorization, no network calls, and no side effects.

Optional exact-pinned original planZ **Garden, Common Table/Waseca and Abundent Field proposal shards** add relevant grocery, Coalition, music and community-facing idea doors, all marked draft/not canon and historically dated. No personal source text is copied into GRAFT.\n\nSee [ATTEND-001 contract](docs/ATTEND-001.md) for exact pins, commands, native boundaries and next work.

---

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

## Inspect the result visually, offline

Open [`explorer/index.html`](explorer/index.html) in your browser and select the JSON file emitted by the CLI:

```bash
node src/free-graph.mjs --cut fixtures/early-cut.json --world same-room-a0 \
 --blackstar-root donors/black-star --memento-root donors/memento \
 --freegraph-root donors/free-graph > graph.json
```

The bundled no-dependency explorer draws the **actual explicit edges** and allows node-by-node traversal, search, a bounded/full projection switch, and a detail panel showing source/edge authority. It does **not** fetch remote data, keep an account or independently revalidate the content hashes; the native kernel and CI perform the validation. It is **local browser UI**, not a publicly hosted Abundent deployment.
