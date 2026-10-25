# GRAFT / RECONSTRUCTION-001

**Runnable, source-pinned adapter: original Black Star → original MEMENTO → GRAFT proposal receipt.**

This is a **third independent application branch**. It does not merge donor application branches into GRAFT `main`; it checks out two original-code branches as read-only separate tools and runs their **native code**. No network service, database, private archive or account is needed.

## What actually happens

1. **Black Star**: original Python `blackstar validate-cut` checks that a candidate observer cut obeys its knowledge horizon, required explicit fields, and source-contact boundaries. A failure stops the chain.
2. **MEMENTO**: original Node `compile-context-pack.mjs` retrieves world context. This can include **proposed**, explicitly unadmitted relations; GRAFT does not silently upgrade them.
3. **GRAFT**: wraps the two native receipts into an attributable, content-hash-addressed **PROPOSE_ONLY** handoff. No original source text, personal narrative, keys, file paths, or raw carrier bytes are included in the receipt.

`VALID CUT != VERIFIED EVENT`  
`RETRIEVED RELATION != ADMITTED RELATION`  
`PROPOSED HANDOFF != MEMENTO LEDGER WRITE`

## Reproduce locally

Requires Node.js 20+, Python 3.11+, and Git. Check out two sibling branches of **the same public GRAFT repo** to separate directories, **at the fixed commits below**:

- `graft/black-star` at `08f42f769f9590d78b85c8d84358e1791d5bd318`
- `graft/MEMENTO` at `22a5714f25c7be59bac37b3ab691c28c1f036845`

Example, from this branch root (assuming those two checkouts are under `donors/`):

```bash
node src/reconstruct.mjs \
  --cut fixtures/early-cut.json \
  --world same-room-a0 --depth 1 \
  --blackstar-root donors/black-star \
  --memento-root donors/memento \
  --python python3

GRAFT_BLACKSTAR_ROOT=donors/black-star \
GRAFT_MEMENTO_ROOT=donors/memento \
node --test test/*.test.mjs
```

CI automatically checks out the exact donor commits and tests a successful native integration, an invalid future-dated cut, an absent world, wrong checkout provenance, and determinism.

## What isn't done

This **does not** implement MEMENTO's human ADMIT/REFUSE/FOG gate, publish an event finding, save a world, write a source card, or ship a community-facing web app. That requires a separately authorized write pathway. Raw inputs remain caller-local. Consult [contract](docs/RECONSTRUCTION-CONTRACT.md).

## Source references

[Black Star original code](https://github.com/the-static-collective/GRAFT/tree/graft/black-star) · [MEMENTO original code](https://github.com/the-static-collective/GRAFT/tree/graft/MEMENTO) · [GRAFT index](https://github.com/the-static-collective/GRAFT).
