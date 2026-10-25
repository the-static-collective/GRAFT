# GRAFT × Black Star — original executable witness organs

**State: ORIGINAL CODE IMPORTED / REVIEW.** This public branch contains **53 selected original donor files** copied as file contents from the private Black Star repository at pinned commit `235f584f825eced13e70934a98554c3d2d9a13ad`, with fresh GRAFT commits and **no original Git ancestry**. The private donor's raw historical records, source-registry, archive snapshots, personal and child-related witness cases and credential material were deliberately not transferred.

## What is native, not a reimplementation

- Entire `src/blackstar/` original Python 3.11+ package: Ghost Cut, Anti-Narc, Media Contact, Situation Decoder, Child-First, Phone Witness, Chat Archive, CLI, source validation and supporting utilities.
- Original `pyproject.toml`, launcher and software version identifiers.
- Original `examples/synthetic/` specimen data; **six original unit-test files**, and selected reference docs.
- One separate **GRAFT-authored** test `tests/test_graft_native_ghostcut.py` verifying the original Ghost Cut module against safe, invented fixture events.

The earlier `src/blackstar_graft.py` and `test/test_blackstar_graft.py` are still independently authored **GRAFT synthetic prototypes**, *not* the imported original modules.

## Run native code

```bash
python -m pip install -e .
python -m unittest discover -s tests -v
blackstar status
blackstar validate-contact examples/synthetic/media/contact-receipt.json
```

Native full-repository `blackstar --root . selftest` and source-registry checks intentionally remain out of scope here: they expect private historical `derived/` and `source-registry/` files not published on this branch. Other functionality can operate on user-supplied data in **private local directories**.

The selected contents were scanned for common credential signatures before publication; no matches. That is not a whole-private-history secrets scan, and no active keys should be committed to GRAFT. **Code publication is not permission to publish third parties' private records.** Historical facts and participant accounts must remain separately sourced and gated.

No open-source redistribution license is inferred simply by making the files public. See `GRAFT_DONOR.md` for exact provenance and review scope.
