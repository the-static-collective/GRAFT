# Architecture

Black Star is a provenance-first witness instrument, not an adjudicator.

## Two version axes

- **Software version** — SemVer for code/API evolution. Current: `0.4.0`.
- **Archive snapshot** — numbered epistemic/archive states. Current imported state: Snapshot 54.

A code refactor does not create a new evidentiary snapshot. A new archive snapshot is justified only when source topology, authority grammar, or the archive's lawful claims materially change.

## Storage boundary

```text
Git repository
  installable machine
  schemas + tests
  derived receipts
  lineage
  source indexes / hashes / Drive IDs
          |
          | explicit source references
          v
WITNESS Drive
  raw/private source bytes
  mutable source-document history
  large media
  sealed executable releases
```

## Package organs

### `blackstar.ghostcut`
Historical knowledge horizons, artifact-level discovery order, activation/no-retcon receipts, observer deltas.

### `blackstar.sources`
Compact Git index validation, sealed-registry validation, optional byte verification.

### `blackstar.media`
Media/source contact receipts, primary-to-derivative artifact lineage, timecoded observations, proxy-transform receipts, and later interpretive attachments.

This organ establishes when content contact occurred and how analysis artifacts descend from a carrier. It enforces `CONTACT != DISCOVERY`, `DERIVED VIEW != INDEPENDENT WITNESS`, `PROXY != ORIGINAL`, and `LATER CONTEXT != SOURCE CONTENT`.

### `blackstar.anti_narc`
Claim-envelope category gates, lineage/echo auditing, epistemic-promotion receipts, mirror tests, event/authority renderers.

Its job is to catch category errors. It is not a diagnosis or truth engine.

### `blackstar.situation`
Situation Decoder seed validation, structural rendering, and lexical candidate-window discovery.

Candidate windows are review queues only.

### `blackstar.phone`
Offline source-preserving call/SMS XML ingestion. Raw XML is copied unchanged into a local store, SHA-256 receipted, normalized into SQLite, and rendered with pseudonymous numbers. Later-context notes remain separate.

### `blackstar.chatarchive`
Private local ingestion of large ChatGPT export ZIPs into a normalized SQLite/FTS conversation graph. It hashes the export, inventories archive members, streams conversation JSON, preserves parent/child branch topology, extracts source-addressable message text and references, and maintains deterministic signals separately from heuristic review tags.

This organ enforces `EXPORT != RAW PLATFORM STATE`, `NORMALIZED MESSAGE != EXPORT TOKEN`, `MESSAGE NODE != DISPLAY POSITION`, `BRANCH SIBLING != SUBSEQUENT MESSAGE`, `TAG != EVENT`, and `HEURISTIC TAG != FACT`.

### `blackstar.childfirst`
Child-first life records: plans vs occurrences, account/source separation, parallel perspectives, child-safe memory packets, and hard rejection of parent/custody/truth scoring.

The child-first layer treats adult conflict as a privacy boundary rather than scrapbook material.

### `blackstar.paths`
Locates the repository without hard-coded machine paths.

### `blackstar.cli`
Stable command surface over the organs.

## Authority boundary

Black Star can establish:

- file/hash identity;
- source class;
- chronology of availability and later content contact;
- whether a derived media artifact descends from a primary carrier;
- whether a media proxy preserves its original authority boundary;
- whether later context was attached without rewriting the source;
- whether a claim promotion carries a receipt;
- whether multiple documents share one knowledge lineage;
- whether later information trespasses into an earlier observer cut.

It cannot automatically establish:

- that every statement inside a source is true;
- motive;
- diagnosis;
- legal liability;
- a disputed event merely because an institutional record repeats it.

**INTEGRITY != ADJUDICATION.**
