# RECONSTRUCTION-001 — typed, read-only native handoff

**Owner:** `graft/reconstruction-001`. **State:** Native execution and CI demonstration; no admitted memory writes.

## Interface

Input: locally present Black Star Ghost Cut JSON, pinned Black Star runtime root, pinned MEMENTO runtime root, MEMENTO addressed world ID, traversal depth 0..3.

Native calls:
```text
python3 -m blackstar --json validate-cut CUT
node scripts/compile-context-pack.mjs --world WORLD --depth DEPTH --root MEMENTO_ROOT
```

Runtime ref verification: each checkout's `git rev-parse HEAD` must match the exact expected SHA. If tools are missing, inputs are malformed, native validation fails, an unfamiliar edge authority appears, or source ancestry drifts: **refuse, no proposal receipt**. Calls use argv arrays (no shell interpretation), 20-second bounded execution and bounded output buffers.

Output: `graft.reconstruction-receipt/v1` with original runtime commits, SHA256 of original cut bytes, a small validation summary, addressed world IDs and edge statuses, and a non-authoritative candidate handoff.

No raw input, source statement, message text, contact identity, secret, absolute file path or private donor Git history is copied into the receipt. Actual user-authored IDs and source-provided world titles may still be sensitive; keep real-world runs local and do not automatically publish their receipts.

## Authority gates

- The original Black Star cut validates **source availability and chronology**, not occurrence truth.
- The original MEMENTO compiler may include **proposed** relation edges. All retrieved edges are stamped `admission:none`, and GRAFT preserves their original status.
- A GRAFT receipt is **not** a MEMENTO crossing decision or ledger entry. `proposal.gate` stays `NOT_INVOKED` and `local_write` stays `NOT_PERFORMED`.
- This adapter never executes MEMENTO's world saver, UNDERSTORY writer, or 3rdi ingestion.
- A consuming product must obtain its own explicit human authority and persistence path. Nothing here authorizes publication of real-world source records.

## Coverage / limits

CI demonstrates both native tool invocation paths, deterministic output and four negative/authority controls using synthetic fixtures. It does not prove all possible input corpora are safe or provide a real-world evidence adjudication mechanism.

Source updates require a review of upstream changes and a new pinned donor commit, followed by a new CI run; checking out the latest branch head cannot silently replace audited code.
