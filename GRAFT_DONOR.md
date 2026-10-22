# GRAFT donor · Groove Rooms

**Branch:** `graft/groove-rooms`  
**PUBLIC source contents imported:** **NONE**  
**State:** STAGING / HOLD  
**Origin:** `the-static-collective/groove-rooms` (currently private at review time)  
**Reference:** `main` (source candidate only, not admitted)  
**Review date:** 2026-10-22

## Why this donor matters

Collaborative studio/room and append-only receipts; Suno CAPTURE-001 remains a distinct open PR.

## Observed evidence (bounded)

- `.env` is tracked with Supabase project ID, URL and publishable-style keys.
- CAPTURE-001 PR reports protected-silence migration committed but absent in observed live DB at development time.
- Branch status and CI tests are not an accepted release proof.

## Conditions before source code crosses

1. Review remote integrations, environment/history and studio member data.
2. Test authorization, migrations, room scopes and Suno capture in disposable environment.
3. Choose rights/licensing; import only source-cleared reviewed ref, no actual audio or participant data.

## Transfer contract

This is a **public branch** of the GRAFT repository. Everything committed here is publicly visible. The source original stays private and authoritative until its owner decides otherwise. When gates are met, copy only independently reviewed, sanitized **file contents** at an exact source SHA into this branch as a new GRAFT commit. Never push/replay the donor's private commit history. Document chosen code/content rights, security scan, test receipts, and known gaps in a new commit.

`BRANCH != SAFE`; `CAPABILITY != DEPLOYMENT`; `RECEIVED != ADMITTED`.

See GRAFT [main](https://github.com/the-static-collective/GRAFT) for the full protocol.
