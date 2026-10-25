# GRAFT → JAR;VIS Public Commons Feed 001

**State: PUBLIC-SOURCE CANDIDATE FEED FOR REVIEW.** A GRAFT branch is *not* canon and a proposed feed entry is *not* admitted for production distribution.

`commons-feed.json` is a compact, machine-readable publication candidate index of selected public GRAFT experiments. It is not an executable code transplant, live private repository mirror, partner roster, activity log, or proof of community work.

## First source-pinned review set

Five public-document summaries describe:
- the allowlisted LIVE-SCOUT-002 public GitHub research loop (fresh per run, bounded snapshot);
- LIVE-WORK-002's **local** printable grocery-kit files (real files, fictional field scenario);
- ATTEND-001's **historical** source-pinned JAR;VIS, planZ, CANNON and Free Graph reader;
- the original Free Graph reconstruction and read-only graph packet;
- the Black Star + MEMENTO provenance-only reconstruction seam.

Each entry points to a specific public GitHub doc path and exact commit. Its documented status and limited effects are attached to the individual source, not automatically inherited from other GRAFT branches or current main.

## Publication and update lifecycle

1. **DISCOVER:** GRAFT's live scout can find a source lead. A new lead is uninspected, not publishable.
2. **OBSERVE:** record an exact source repository/ref/commit, time, content hash, and test/build receipt where present. This is not proof the underlying system currently operates.
3. **PROPOSE:** draft a concise public-safe entry in a GRAFT feature branch; label `publication=PUBLIC_SUMMARY_PROPOSED_FOR_REVIEW`.
4. **REVIEW:** source owner verifies factual bounds, secrets/license/IP, privacy, consent, runtime-vs-proposal language, and suitability to republish. Main is a publication channel only, never canon.
5. **APPROVE:** after an independent affirmative editorial decision, change the entry to `publication=PUBLIC_SUMMARY_APPROVED` and merge it to **GRAFT main**. Any rejected or revoked entry must not have approved publication state.
6. **DISTRIBUTE:** the JAR consumer reads only the GRAFT main approved feed (with caching and explicit source hash), and includes approved public-safe descriptions in a later response. Protected PREVIEW may deliberately read this candidate branch for test and display conspicuous `STAGED_FOR_REVIEW`.
7. **CORRECT/REVOKE:** remove or supersede the approved main entry via reviewed commit. Downstream consumers must not preserve the superseded entry as current content beyond their bounded cache. Hashes record what was read; they do not certify truth.
8. **RETURN:** if an eventual real-world work outcome is confirmed, publish its distinct permissioned receipt rather than changing the state of a source summary as though that proved a task completed.

## Safety / limits

- GRAFT remains public; *no private code*, private README, contact list, addresses, real-client notes, keys, casework, healthcare, financial account data or unconsented source material.
- A `sourceCommit` is a source timestamp in Git, not proof of owner canon or a person's agreement.
- Automated discovery never sets `PUBLIC_SUMMARY_APPROVED` and never merges a branch. The human publication gate is separate from text or model selection.
- No network request to GRAFT may cause human contact, project execution, cash movement, donation, volunteer assignment, permission expansion or Git writes.
- The first GRAFT publication source is deliberately a **small, source-verified set**. Full-tree automatic sync, embeddings, live graph service and partner notifications are beyond this release.

## Automated discovery without automatic publication

The new `scripts/commons-review-queue.mjs` compares the public `candidate-registry.json`'s known adapter source commits to this proposed feed. When an adapter is new or its documented source SHA changes, it produces a small `graft/commons-review-queue-v1` JSON of editorial candidates, each explicitly `REVIEW_PENDING`. It does not harvest donors or write approved feed content.

`.github/workflows/commons-review.yml` schedules a daily read-only comparison and also runs on relevant reviewed main commits. It uploads an expiring **public-safe** review artifact (not a PR, release, push, model training event or publication). Editors make the actual source review and approved GRAFT-main commit separately. Scheduled GitHub Actions run only once the workflow is on the default branch.
