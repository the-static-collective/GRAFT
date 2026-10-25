# GRAFT × MEMENTO — original memory runtime subset

**State: ORIGINAL CODE IMPORTED / REVIEW.** This public GRAFT branch now contains **21 selected original files** copied byte-for-byte at the file-content level from the private MEMENTO donor at pinned commit `70ceaad8fd7a87e5b5f753f8f345693aec7570a0`. The original repo remains private. This is a **new clean-history transplant**, not the original repository's Git history.

## Native executable organs
- `scripts/lib/understory.mjs` — native observer-local residue validation.
- `scripts/lib/historical-imaginations.mjs` — original world and relation-edge validation.
- `scripts/record-understory.mjs` and `scripts/ingest-3rdi-handoff.mjs` — original recording/handoff CLI.
- `scripts/save-historical-imagination.mjs` and `scripts/compile-context-pack.mjs` — original world saver and bounded context retrieval.
- `test/`, `understory/`, `historical-imaginations/` — selected original tests and **donor-marked synthetic specimen records** for these organs.

The earlier `src/membrane.mjs` / `test/membrane.test.mjs` remain separate **GRAFT synthetic prototypes**. They do not replace the original source; note the native context compiler deliberately shows proposed edges with `admission: none`, unlike the narrower synthetic prototype.

## Run
```bash
node --version  # v20+
npm test
node scripts/compile-context-pack.mjs --world same-room-a0 --depth 1
```

There are no API calls or credentials necessary for these tests. Only these selected executable paths and fixtures were transferred; no private witness material, personal source-cards, authored chapters, crossings/ledger, telemetry destinations, .env files or Git ancestry were imported.

Scanned selected files for common token and private key signatures; no matches. This is **not** a substitute for full historical secret review. This is public original **code**, not an automatic permission to publish all source material or connect a production environment.
