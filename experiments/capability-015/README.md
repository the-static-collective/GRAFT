# GRAFT × JUBILEE / CAPABILITY NURSERY-015
## A missing verb is a proposal to build and test, not an automatic new right

**Branch:** `graft/jubilee-capability-nursery-015` (research branch based on existing GRAFT live-work branch).

Jubilee Treasury's CONCORD-014 composer can connect offers whose inputs and outputs match. A new hypothetical creditor option requires a token—`portable-storyboard-for:L`—for which no existing local technique has been established in the source-owned planning graph. This GRAFT branch implements and tests **one bounded new local technique**: compile a set of deliberately fictional short text captions into a printable offline HTML story card.

**This is existing ordinary HTML-generation technology**, not a new general-purpose algorithm or proof that people would accept the card as value. It is new relative to the original **missing operator in that specific planning graph**.

## Actual cross-repository implementation

The GRAFT workflow uses the exact source checkout:

```text
Jubilee Treasury / commit 51989f5fa1f608558b8019e7a109161d1d29f8bc
  labs/penny-puddle-015/capability.mjs
    └── makeGraftRequest() → jubilee.graft-capability-proposal/v1
          → GRAFT compiler.mjs (pure deterministic build)
          → GRAFT cross.mjs (explicitly requested local file writes)
              ├── offline-story-card.html
              └── capability-receipt.json
          → Jubilee verifyGraftLocalProof() independently checks both
          → Jubilee composeWithGraftProof() re-runs 014 AND/OR planner
              and reports ONE new proposed structure, still not executed
```

All data is invented. The request contains no real images, people, emails, contact lists, title evidence, license, bank information, owner claim or landlord acceptance.

The GRAFT receipt includes SHA-256 hashes of the serialized request and exact output HTML, alongside an explicitly nonauthoritative `PROPOSE_ONLY` status. Re-serializing JSON with a different field order changes the source digest by design; the tested round-trip uses the same JSON payload as passed to the local builder. The receipt is not signed, so the hash verifies integrity of these local artifacts, **not authentication of a real GRAFT operator**. The test exercises the actual source-owned exporter and verifier from the pinned Jubilee commit.

## Constructed ability

`compiler.mjs` deliberately implements a narrow contract:
- title, subtitle and at most five ≤240-character text captions;
- escapes HTML control characters, including hostile-looking syntax;
- assembles a deterministic standalone document with inline print styles;
- refuses scripts, remote images, links, browser calls, or oversized output;
- declares no title, asset rights, work, cash or creditor discharge;
- produces a byte-specific `graft.capability-local-proof/v1` receipt.

`cross.mjs` is a deliberately chosen local build action. It needs an explicit `--request` file and a `--out` directory **which must not exist yet**. The directory and its two files are created only on demand. Neither GRAFT nor Jubilee changes main, publishes the document, calls a remote site, sends a message, performs a payment, updates CANNON canon, or admits this method to production.

A passing build demonstrates only that the **software technique** exists and can operate on the synthetic fixture. The actual curator's consent, owner's right to exhibit images and landlord's specific agreement remain unknown.

## Run (Node.js 22+, no dependencies)

On the **Jubilee** source checkout:

```sh
node labs/penny-puddle-015/export-request.mjs > /tmp/request-015.json
```

On **this GRAFT** branch:

```sh
node experiments/capability-015/cross.mjs \
  --request /tmp/request-015.json \
  --out /tmp/graft-015-test-a-unique-new-directory
```

Back on the Jubilee branch:

```sh
node labs/penny-puddle-015/verify-output.mjs \
  --request /tmp/request-015.json \
  --kit /tmp/graft-015-test-a-unique-new-directory
```

For integration testing checkout the **pinned Jubilee source** under `jubilee-source` at the GRAFT repository root, then run:

```sh
JUBILEE_SOURCE_ROOT=jubilee-source node --test experiments/capability-015/test/*.test.mjs
```

The GRAFT GitHub Actions workflow runs this exact cross-repository code path, plus the explicit kit creation and independently source-owned verification.

## Ethics, consent, governance, and evidence limits

A local compilation passing is not a promised service by an artist or curator. Neither an asset's description nor a software-generated receipt creates property rights. Any future real-world exhibit requires rights and safety review, source permissions, meaningful voluntary negotiation, and independent evidence of work and outcomes.

GRAFT explicitly maintains branch isolation: clean source history, source-typed provenance, no credential import, no private donor archive, no automatic CANNON/production admission, no public website and no mutation of Jubilee Treasury's original repo. This experiment keeps those boundaries.

The next research iteration can compare **multiple independently authored techniques** for the same missing token and let MOTIF test them against transparent constraints. This branch does not invent a technique from unrestricted natural language or autonomously deploy a model.

**GRAFT nursery rule:** *A demonstrable small skill may be returned as a candidate method; its evidence must never be confused with a person's consent or permission to execute in the world.*
