# RECONSTRUCTION × FREE GRAPH — lawful graph handoff v1

**Status:** selected original runtimes, reproducible CLI, machine-validated packet, no owner gate.

The interface consumes only `graft.reconstruction-receipt/v1` produced by RECONSTRUCTION-001, after native Black Star and MEMENTO execution. It rejects any upstream authority or side-effect escalation. A pinned `ec0ad8743c5faac3f3675760bbafcbcb1df846c1` Free Graph checkout provides the **original** hashing, validation and bounded neighbors algorithms.

## Mapping

- Source: digest-only original cut, MEMENTO context projection, and GRAFT reconstruction receipt. The original cut is testimony, not established fact; other two are runtime receipts.
- Node: one world address per MEMENTO world, one machine receipt, one unresolved owner-gate question.
- Relation: an explicit `connects` for each named MEMENTO edge. Native status `proposed` stays proposed; `fog` becomes unresolved; `admitted` becomes observed *in the source world only*, never `locally-adopted` in GRAFT; `refused` remains refused if supplied. Each retains `admission:none` in its extensions. No `constitutes` edge is synthesized.
- Source addressing: original pinned donor SHA, digest-only cut identity, and a bounded non-personal coordinate. No source passages or caller file paths.
- Task World Cut: **unresolved**, omitted owning head/human gate. Valid for `seed`/`re-enter` only.
- Output: `graft.free-graph-reconstruction/v1` wraps the *native validated and hashed* `free-graph.packet/v0` and an independently hashed bounded neighborhood packet.
- Known epistemic limit: this graph visualizes **explicit MEMENTO adjacency** and the original receipt. It does **not** infer chronological ancestry, reconstruct missing events or establish a valid descendant link between two independent project states.

## Proof obligations

1. Exact SHA checks for all three original code roots; fail closed if mismatched.
2. Black Star invalid future cut → no graph.
3. Missing MEMENTO world → no graph.
4. Free Graph schema validation and content addressing happen using Free Graph's own code.
5. Depth 0/1 difference demonstrates bounded traversal.
6. Every link has `authority:none`; proposed statuses remain proposed.
7. Source material stays pointer-only/redacted, and no write or admission is performed.

## Next

A separate explicit ancestry-assertion receipt could enable cross-cut timeline journeys without inventing lineage: only when a real source reports an ancestor relation and owner-local gate permits its publication. No automatic age-based `descends-from` edge is acceptable.
