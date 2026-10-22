# GRAFT donor · Jubilee Campfire

**Branch:** `graft/circle`  
**PUBLIC source contents imported:** **NONE**  
**State:** STAGING / HOLD  
**Origin:** `the-static-collective/circle` (currently private at review time)  
**Reference:** `release/public-source-candidate-001` (source candidate only, not admitted)  
**Review date:** 2026-10-22

## Why this donor matters

Community offers → pledges → confirmed participation receipts.

## Observed evidence (bounded)

- Private source proposal removes fixed demo login UI and documentation; the ORIGINAL private Git commit still contains the fixed demo password text.
- No `.env` in inspected main tree; includes executable migration and SQL authority test suite.
- No repo license observed; no demonstrated real two-user backend test.

## Conditions before source code crosses

1. Confirm any formerly reachable sample accounts are disabled or rotated.
2. Audit complete source/history and scrub test-person identifiers.
3. Run disposable SQL authority + actual 2-user tests, select license, import exact reviewed tree with fresh history.

## Transfer contract

This is a **public branch** of the GRAFT repository. Everything committed here is publicly visible. The source original stays private and authoritative until its owner decides otherwise. When gates are met, copy only independently reviewed, sanitized **file contents** at an exact source SHA into this branch as a new GRAFT commit. Never push/replay the donor's private commit history. Document chosen code/content rights, security scan, test receipts, and known gaps in a new commit.

`BRANCH != SAFE`; `CAPABILITY != DEPLOYMENT`; `RECEIVED != ADMITTED`.

See GRAFT [main](https://github.com/the-static-collective/GRAFT) for the full protocol.
