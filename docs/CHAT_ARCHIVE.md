# Chat Archive Ingest

Chat Archive Ingest turns a large ChatGPT data-export ZIP into a private, local, provenance-preserving conversation graph and search index.

It is an ingestion and retrieval organ, not an event classifier.

## Authority boundary

The source export remains authoritative over every derivative produced by this organ.

Core laws:

- `EXPORT != RAW PLATFORM STATE`
- `NORMALIZED MESSAGE != EXPORT TOKEN`
- `MESSAGE NODE != DISPLAY POSITION`
- `BRANCH SIBLING != SUBSEQUENT MESSAGE`
- `EXPORT ORDER != CONVERSATION ORDER`
- `TAG != EVENT`
- `HEURISTIC TAG != FACT`
- `DERIVED PACK != SOURCE EXPORT`
- `DERIVED VIEW != INDEPENDENT WITNESS`

A ChatGPT export is itself an exported representation of platform state. Black Star hashes it exactly but does not call it the live platform database.

## First ingest

For a thorough first pass:

```bash
blackstar chatgpt ingest ~/Downloads/chatgpt-export.zip \
  --store ~/blackstar-private/chatgpt \
  --hash-members
```

The source ZIP is not copied unless `--copy-source` is supplied:

```bash
blackstar chatgpt ingest ~/Downloads/chatgpt-export.zip \
  --store ~/blackstar-private/chatgpt \
  --copy-source \
  --hash-members
```

Use `--copy-source` only when the extra disk cost is intentional. The original ZIP is always SHA-256 hashed. Conversation JSON members are SHA-256 hashed during streaming. `--hash-members` additionally hashes every archive member, including large assets.

The importer streams top-level conversation objects from `conversations.json` or numbered `conversations-*.json` members instead of loading the full JSON corpus into memory.

## Local store

The private store contains:

- `chat-archive.sqlite3` — normalized conversation/node/message graph, FTS index, references, tags, and warnings;
- `receipts/` — exact source ZIP receipts;
- `originals/` — only when `--copy-source` was requested;
- `bomb-runs/` — derived recovery packs.

The store is private evidence-derived state and should remain outside Git.

## What is preserved

For each export Black Star preserves:

- exact source ZIP size and SHA-256;
- archive member inventory and CRC;
- conversation JSON member SHA-256;
- conversation ID/title/create/update/current-node metadata;
- mapping node IDs;
- declared parent and child edges;
- author role/name;
- message timestamps and status fields;
- model slug when present;
- extracted textual content;
- cryptographic hashes of normalized content, metadata, and raw message objects;
- source member and source index back-pointers;
- structured file/asset/URL references where exposed by the export;
- graph-integrity warnings.

Conversation branches are stored as graph edges. Black Star does not manufacture a linear transcript from sibling branches.

## First-pass tags

Two classes remain mechanically separate.

### Deterministic extraction

Current deterministic signals include:

- URLs;
- email addresses;
- explicit ISO dates;
- slash-form dates;
- written month/day strings;
- clock-time strings;
- optional exact custom terms.

These report text occurrences. They are not event claims.

### Heuristic review tags

Current lexical review queues include:

- creative/song/poetry form;
- correction or uncertainty language;
- remembered/quoted-speech language;
- legal vocabulary;
- medical vocabulary;
- relationship vocabulary;
- incident/violence vocabulary;
- ordinary-routine vocabulary.

A heuristic tag means only: *this text matched a review rule*. It does not diagnose, adjudicate, authenticate a quotation, or establish an event.

## Custom terms

Private case-specific terms should live outside Git.

Example:

```json
{
  "terms": [
    "example exact phrase",
    {"label": "project-title", "value": "Example Title"},
    {"label": "place", "value": "Example Place"}
  ]
}
```

Then ingest with:

```bash
blackstar chatgpt ingest export.zip \
  --store ~/blackstar-private/chatgpt \
  --terms ~/private/chat-terms.json
```

Custom-term matches record exact character offsets in the normalized message text. They remain deterministic retrieval signals, not corroboration.

## Status and verification

```bash
blackstar chatgpt status --store ~/blackstar-private/chatgpt
blackstar chatgpt verify --store ~/blackstar-private/chatgpt
```

`status` reports conversation/message counts, branch points, references, signals, warnings, FTS availability, and message-time bounds.

`verify` rehashes the registered ZIP path, preferring the private copied source when one exists.

## Search

```bash
blackstar chatgpt search "example phrase" \
  --store ~/blackstar-private/chatgpt \
  --from 2026-02-08 \
  --to 2026-02-10 \
  --timezone America/Chicago \
  --role user \
  --context 3
```

Search results carry conversation/node IDs, source member/index, message SHA-256, timestamp, role, title, and text.

`--context` follows graph lineage. It does not silently treat a regenerated sibling response as the next message.

Conversation metadata can be listed separately:

```bash
blackstar chatgpt conversations \
  --store ~/blackstar-private/chatgpt \
  --from 2026-01-01 \
  --to 2026-01-31
```

## Bomb runs

A bomb run is a reproducible derived recovery query, not an evidence packet.

Example plan:

```json
{
  "name": "synthetic recovery pass",
  "timezone": "America/Chicago",
  "roles": ["user", "assistant"],
  "context": 2,
  "windows": [
    {
      "id": "window-a",
      "from": "2026-02-08",
      "to": "2026-02-10",
      "terms": ["example phrase", "example object"]
    }
  ],
  "global_terms": ["exact rare phrase"],
  "global_limit": 500
}
```

Run it:

```bash
blackstar chatgpt bomb-run recovery-plan.json \
  --store ~/blackstar-private/chatgpt
```

The output directory contains:

- `messages.ndjson` — source-addressable messages within requested windows;
- `phrase-hits.ndjson` — global literal hits with branch-aware context;
- `recovery-index.json` — plan hash, counts, and boundary laws;
- `report.md` — compact human-readable index.

Bomb-run membership means that a message fell inside a requested message-time window. `MESSAGE TIME != EVENT TIME`.

## Storage and performance

The SQLite store can be substantial because full-text search indexes message text. This is intentional: the source ZIP stays immutable while retrieval becomes fast and repeatable.

For very large exports:

1. keep the store on a disk with ample free space;
2. omit `--copy-source` if the original ZIP is already safely preserved elsewhere;
3. use `--hash-members` on the first ingest when full asset-member hashing is worth the additional scan;
4. never commit the ZIP, SQLite store, or extracted private payload to Git.

Black Star's repository ignore rules already exclude ZIP and SQLite/database files.
