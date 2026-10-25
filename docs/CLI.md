# CLI

Install locally:

```bash
python -m pip install -e .
```

Global options:

- `--json` — machine-readable validator output where supported.
- `--root PATH` — repository home; otherwise use `BLACKSTAR_HOME` or auto-detect from the current directory.

## Core

```bash
blackstar status
blackstar --root . selftest
blackstar validate-cut cut.json
blackstar validate-activation receipt.json
blackstar audit-discovery ledger.ndjson
blackstar delta old-cut.json new-cut.json
```

## Source boundary

```bash
blackstar --root . sources
blackstar --root . source-check
blackstar --root . source-check --vault /path/to/black-star-witness
```

Vault verification checks registered paths, size, and SHA-256. It does not adjudicate source content.

## Media contact

```bash
blackstar validate-contact contact-receipt.json
blackstar validate-artifact-lineage artifact-lineage.json
blackstar validate-media-observations observations.ndjson
blackstar validate-proxy proxy-receipt.json
blackstar validate-attachment interpretive-attachment.json
```

These validators preserve the birthday of content contact, derivative lineage, timecoded observation layers, proxy transformations, and later context without treating derivative analysis as independent corroboration.

## Anti-Narc category gates

```bash
blackstar lint-claims claims.ndjson
blackstar trace-lineage lineage.json
blackstar audit-status status-deltas.ndjson
blackstar mirror-lint mirrors.ndjson
blackstar validate-event event-packet.json
blackstar render-event event-packet.json
blackstar render-authority authority-map.json
```

## Situation Decoder

```bash
blackstar validate-decoder derived/situation-decoder
blackstar decoder-candidates messages.ndjson --identifier CONTACT_KEY
blackstar render-decoder derived/situation-decoder
```

`decoder-candidates` uses lexical tags to surface review windows. It must not be described as an abuse, motive, truth, or diagnosis classifier.

## Phone Witness

```bash
blackstar phone-ingest calls.xml sms.xml --store ./private-phone-store
blackstar phone-summary --store ./private-phone-store
blackstar phone-import-notes annotations.json --store ./private-phone-store
```

The store is local/private and contains copied source XML, SQLite state, source register, month-coverage report, and a pseudonymized HTML timeline.

## Chat Archive Ingest

```bash
blackstar chatgpt ingest export.zip --store ./private-chat-store --hash-members
blackstar chatgpt status --store ./private-chat-store
blackstar chatgpt verify --store ./private-chat-store
blackstar chatgpt search "exact phrase" --store ./private-chat-store --from 2026-02-08 --to 2026-02-10 --context 2
blackstar chatgpt conversations --store ./private-chat-store --from 2026-02-01 --to 2026-02-28
blackstar chatgpt bomb-run recovery-plan.json --store ./private-chat-store
```

The importer hashes and inventories the source ZIP, streams conversation JSON, preserves branch topology, builds local SQLite/FTS search state, extracts deterministic signals, and surfaces heuristic review tags without promoting them into event claims. See [Chat Archive Ingest](CHAT_ARCHIVE.md).

## Child-First Protection

```bash
blackstar child-validate child-life-record.json
blackstar child-perspectives child-life-record.json
blackstar child-memory child-life-record.json
```

`child-perspectives` reports aligned, divergent, and single-perspective structured assertions without deciding which account is true.

`child-memory` emits only explicitly memory-eligible, non-adult-conflict material and carries a provenance appendix.
