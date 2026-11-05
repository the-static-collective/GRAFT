# GRAFT-028 — The Memory of Failure

An explicitly recorded, structurally searchable and *actually executable* research memory over GRAFT-027's bounded capability experiments.

## Mechanics

- `captureExperience({source_packet,cases,approvedSyntheticCapture:true})` accepts an original ALEX-026 source-bound proposal and labeled **synthetic** training, holdout and negative fixtures. It reruns the actual GRAFT-027 source-owned `cultivate` machine and captures the complete observed evaluation, failed variants, surviving candidates, source blob and a content digest. Without explicit capture approval it refuses.
- `fingerprint(cases)` produces an inspectable structural signature: nested JSON field paths and types, target terms and test coverage. This is a finite deterministic similarity measure, **not an embedding model, a learned latent state or an identity match**.
- `recallSimilar(records,newCases)` ranks genuinely overlapping structural cases. It returns both **historical failures and successes** as candidate lessons, with source hashes and explicit non-authority flags. Dissimilar cases return **NO_CLOSE_STRUCTURAL_PRECEDENT**.
- `replayExperience(record)` **executes the original GRAFT-027 evaluator again** on saved labeled fixtures and requires exact evaluation output. A rehashed but altered test case cannot silently claim its old outcome.
- All generated code remains held research; no installation, remote requests, private records, unexplained source permissions or production admission.

## Reproducibility and security

Source-owner dependencies (original ALEX-026/025, GRAFT-026, GRAFT-027) are imported unchanged. `verifyExperience` checks source-owner receipt, evaluation digest, structure, record digest, output authority, fixture provenance and size. Evidence is synthetic only; email, secret-like keys and obvious tokens are refused.

Content SHA-256 is an integrity/checksum mechanism, **not a cryptographic signature of a trusted witness**. A person who can rewrite a file can recalculate a checksum. Exact replay gives a stronger *internal consistency* check, not authenticity of real-world material.

GRAFT is the **source owner for the record/retrieval/replay algorithm**. Persistence is deliberately delegated to MOTIF-028 and the JAR;VIS local desk, which explicitly control disk writing and access permissions.

```sh
node --test test/experience-memory-028.test.mjs
```

The seven new tests include authentic replay, contradictory withheld observations, structural separation of unrelated examples, rehashed-record replay failure, absence of automatic authorization, required capture consent and no obvious private-data capture.

**Limit:** only the declared finite JSON numeric-path research world. Historical failure can suggest a discriminating question; it cannot establish that a novel problem has the same cause. No memory-triggered autonomous deployment.
