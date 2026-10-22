# GRAFT donor · Gramfork

**Branch:** `graft/gramfork`  
**PUBLIC source contents imported:** **NONE**  
**State:** STAGING / HOLD  
**Origin:** `the-static-collective/gramfork` (currently private at review time)  
**Reference:** `main` (source candidate only, not admitted)  
**Review date:** 2026-10-22

## Why this donor matters

Private-circle household material needs → pledges → confirmed receipt; optional Telegram identity bridge lives on separate unmerged branches.

## Observed evidence (bounded)

- `.env` is tracked on main with Supabase project ID, URL and publishable-style keys.
- Historical `.env` addition observed; no secret service-role key evident from the inspected current `.env` variable names.
- Telegram transport branch is draft and must not be represented as production integrated.

## Conditions before source code crosses

1. Full-ref credential/data audit, environment scrub and real backend permission tests.
2. Two-account fulfillment proof and explicit source-owner release decision.
3. Bring only reviewed standalone source; keep historical commits private; license selection.

## Transfer contract

This is a **public branch** of the GRAFT repository. Everything committed here is publicly visible. The source original stays private and authoritative until its owner decides otherwise. When gates are met, copy only independently reviewed, sanitized **file contents** at an exact source SHA into this branch as a new GRAFT commit. Never push/replay the donor's private commit history. Document chosen code/content rights, security scan, test receipts, and known gaps in a new commit.

`BRANCH != SAFE`; `CAPABILITY != DEPLOYMENT`; `RECEIVED != ADMITTED`.

See GRAFT [main](https://github.com/the-static-collective/GRAFT) for the full protocol.
