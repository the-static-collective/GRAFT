# GRAFT
**The Static Collective — public-source nursery and graft station**

> A source can donate an organ without surrendering its history.
> A branch is a place to examine it, not a declaration that it is ready to ship.

GRAFT receives **reviewed, clean-history source cuts** from independent projects. Each source gets its **own branch**, where its executable code can remain independent. The `main` branch is only the public directory, rules, and return paths.

## The first four branches

| Donor project | GRAFT branch | State | Source |
|---|---|---|---|
| Jubilee Campfire | [`graft/circle`](../../tree/graft/circle) | STAGING / HOLD | [circle (private origin)](https://github.com/the-static-collective/circle) |
| Household participation | [`graft/gramfork`](../../tree/graft/gramfork) | STAGING / HOLD | [gramfork (private origin)](https://github.com/the-static-collective/gramfork) |
| Collaborative music | [`graft/groove-rooms`](../../tree/graft/groove-rooms) | STAGING / HOLD | [groove-rooms (private origin)](https://github.com/the-static-collective/groove-rooms) |
| Living creative workspace | [`graft/idea-grove`](../../tree/graft/idea-grove) | STAGING / HOLD | [idea-grove (private origin)](https://github.com/the-static-collective/idea-grove) |

**These branches are not published-source releases yet.** They initially carry only safety/status manifests; no private application source is imported automatically.

## A branch is an independent application

At `graft/<donor>`, a reviewed import can place the donor's **standalone project files at the branch root**. Its build/test/deploy path stays its own. **Do not merge application branches into `main`**; that would combine unrelated project files. Main remains the index and review contracts.

This design differs from a monorepo: most source on nondefault branches is less discoverable, GitHub branch visibility is public, and a branch has **no confidentiality boundary**. Anyone may read commits on this public repository. Only safe materials may cross.

## Import ceremony

1. **Identify** origin repo, exact source ref and SHA, intended scope, source owner, license and provenance.
2. **Select** an exact clean source tree. Do not import original private Git history, credentials, stored records, or unconsented third-party materials.
3. **Check** history, environment/config, private/test fixtures, scripts, licenses, dependency risk, backend privilege boundaries, built assets and real-person references. Rotate any active leaked credentials **before** open release.
4. **Verify** source build/tests and independent authorization/denial paths in a disposable environment. Record exact evidence and unknowns; do not substitute documentation for execution.
5. **Import** reviewed files from the selected source cut into a donor branch as **new clean GRAFT commits**, without copying private source history. A donor branch need not share a build with another.
6. **Mark** the import as CANDIDATE / VERIFIED / PUBLIC-SOURCE-RELEASE with an attributable human publication decision. `COMMITTED != TESTED != LICENSED != DEPLOYED`.
7. **Return** a source receipt to its original project and link the branch from this index.

Do not conflate source public visibility with live backend permission, data export, consent, licensing or deployment.

## GRAFT laws

```text
DONOR != CONSUMED
IMPORT != MERGE
BRANCH != SECURITY BOUNDARY
SOURCE REVIEW != RUNTIME PROOF
PUBLIC SOURCE != PUBLIC DATA
PROPOSAL != ADMISSION
ORIGINAL HISTORY != CLEAN PUBLIC IMPORT
```

The original private projects remain their own sources of truth. GRAFT makes an independently inspectable, publishable **descendant**, not a covert transfer of personal history or authority. 

## Status as of 2026-10-22

- This is a **public index + prepublication staging surface**, not a production integration.
- No original private repository has had its visibility changed.
- The first four donor reviews are partial. No source code is declared safe to publish based solely on the initial sweep.
- `circle` has a private [sanitization proposal](https://github.com/the-static-collective/circle/pull/1), but its original Git history still contains old demo-account text. A clean-history import is required.
- `gramfork`, `groove-rooms`, `idea-grove` have tracked `.env` files carrying project IDs, URLs and publishable-style Supabase keys. These are not evidence of secret service-role exposure, but complete-history and backend review still remain.

The larger family of private donor projects can enter later as **separate reviewed branches**, rather than exposing all private material in one bulk push.

See the [living Git wiki proposal](https://github.com/the-static-collective/What-is-the-static-collective-/pull/100) for the broader ecology. 
