# GRAFT
**The Static Collective — public-source nursery and graft station**

> A source can donate an organ without surrendering its history.
> A branch is a place to examine it, not a declaration that it is ready to ship.

GRAFT receives **reviewed, clean-history source cuts** from independent projects. Each source gets its **own branch**, where its executable code can remain independent. The `main` branch is only the public directory, rules, and return paths.

## Two runnable synthetic donor kernels (2026-10-25)

MEMENTO and Black Star have moved beyond empty intake manifests: **new, standalone synthetic-only demonstrations** now live in their respective GRAFT branches. **No original private donor code, original Git ancestry, source evidence, or private content was imported.** These are testable, bounded candidates, **not releases of either original donor**.

| Candidate | Runnable seam | Local fixture test | Gate |
|---|---|---|---|
| [MEMENTO membrane](https://github.com/the-static-collective/GRAFT/tree/graft/MEMENTO) | Crossing review (ADMIT / REFUSE / FOG); receipted context retrieval; no-retcon activation | `node --test test/*.test.mjs` — 4/4 passed locally on 2026-10-25 | **PUBLIC SYNTHETIC CANDIDATE / HOLD** |
| [Black Star Ghost Cut](https://github.com/the-static-collective/GRAFT/tree/graft/black-star) | Historical knowledge horizon; observer delta; activation birthday | `python -m unittest discover -s test -v` — 6/6 passed locally on 2026-10-25 | **PUBLIC SYNTHETIC CANDIDATE / HOLD** |

See [candidate review and interoperability rules](docs/SYNTHETIC-CANDIDATES.md). Tests witnessed in a disposable local workspace; no public CI or real-world field trial is claimed.

## First-wave publication candidates (4 of 17)

| Donor project | GRAFT branch | State | Source |
|---|---|---|---|
| Jubilee Campfire | [`graft/circle`](https://github.com/the-static-collective/GRAFT/tree/graft/circle) | STAGING / HOLD | [circle (private origin)](https://github.com/the-static-collective/circle) |
| Household participation | [`graft/gramfork`](https://github.com/the-static-collective/GRAFT/tree/graft/gramfork) | STAGING / HOLD | [gramfork (private origin)](https://github.com/the-static-collective/gramfork) |
| Collaborative music | [`graft/groove-rooms`](https://github.com/the-static-collective/GRAFT/tree/graft/groove-rooms) | STAGING / HOLD | [groove-rooms (private origin)](https://github.com/the-static-collective/groove-rooms) |
| Living creative workspace | [`graft/idea-grove`](https://github.com/the-static-collective/GRAFT/tree/graft/idea-grove) | STAGING / HOLD | [idea-grove (private origin)](https://github.com/the-static-collective/idea-grove) |

## All 17 private-donor intake slots registered (2026-10-22)

The original private inventory has **17 entries**. Four are first-wave reviews above, and **the other 13 now have their own public GRAFT branch manifest**:

| Donor | Branch | Status | Origin |
|---|---|---|---|
| garden-whisperer | [`graft/garden-whisperer`](https://github.com/the-static-collective/GRAFT/tree/graft/garden-whisperer) | REGISTERED / HOLD | [original (private)](https://github.com/the-static-collective/garden-whisperer) |
| JubileeV.1 | [`graft/JubileeV.1`](https://github.com/the-static-collective/GRAFT/tree/graft/JubileeV.1) | REGISTERED / HOLD | [original (private)](https://github.com/the-static-collective/JubileeV.1) |
| autodisco-video-receipt | [`graft/autodisco-video-receipt`](https://github.com/the-static-collective/GRAFT/tree/graft/autodisco-video-receipt) | REGISTERED / HOLD | [original (private)](https://github.com/the-static-collective/autodisco-video-receipt) |
| RRS | [`graft/RRS`](https://github.com/the-static-collective/GRAFT/tree/graft/RRS) | REGISTERED / HOLD | [original (private)](https://github.com/the-static-collective/RRS) |
| RRS-1- | [`graft/RRS-1-`](https://github.com/the-static-collective/GRAFT/tree/graft/RRS-1-) | REGISTERED / HOLD | [original (private)](https://github.com/the-static-collective/RRS-1-) |
| formation-trace | [`graft/formation-trace`](https://github.com/the-static-collective/GRAFT/tree/graft/formation-trace) | REGISTERED / HOLD | [original (private)](https://github.com/the-static-collective/formation-trace) |
| Corpus-OS-Local-Intake-Implementation | [`graft/Corpus-OS-Local-Intake-Implementation`](https://github.com/the-static-collective/GRAFT/tree/graft/Corpus-OS-Local-Intake-Implementation) | REGISTERED / HOLD | [original (private)](https://github.com/the-static-collective/Corpus-OS-Local-Intake-Implementation) |
| fork-EXCLAIM | [`graft/fork-EXCLAIM`](https://github.com/the-static-collective/GRAFT/tree/graft/fork-EXCLAIM) | REGISTERED / HOLD | [original (private)](https://github.com/the-static-collective/fork-EXCLAIM) |
| jubilee-workspace | [`graft/jubilee-workspace`](https://github.com/the-static-collective/GRAFT/tree/graft/jubilee-workspace) | REGISTERED / HOLD | [original (private)](https://github.com/the-static-collective/jubilee-workspace) |
| DerekDerrikDark | [`graft/DerekDerrikDark`](https://github.com/the-static-collective/GRAFT/tree/graft/DerekDerrikDark) | REGISTERED / HOLD | [original (private)](https://github.com/the-static-collective/DerekDerrikDark) |
| MEMENTO | [`graft/MEMENTO`](https://github.com/the-static-collective/GRAFT/tree/graft/MEMENTO) | SYNTHETIC KERNEL / HOLD | [original (private)](https://github.com/the-static-collective/MEMENTO) |
| King-sCup | [`graft/King-sCup`](https://github.com/the-static-collective/GRAFT/tree/graft/King-sCup) | REGISTERED / HOLD | [original (private)](https://github.com/the-static-collective/King-sCup) |
| black-star | [`graft/black-star`](https://github.com/the-static-collective/GRAFT/tree/graft/black-star) | SYNTHETIC KERNEL / HOLD | [original (private)](https://github.com/the-static-collective/black-star) |

**Intake-only branches contain manifests, not imported original applications.** MEMENTO and black-star additionally contain newly authored synthetic-only demonstration modules and tests—still no original donor source or private history. Source import into GRAFT is instantly public, and every actual donor-source transplant remains separately gated. One observed donor (`autodisco-video-receipt`) had an empty original Git repository during intake.

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

## Status (original intake 2026-10-22; updated 2026-10-25)

- This is a **public index + prepublication staging surface**, not a production integration.
- No original private repository has had its visibility changed.
- The first four donor reviews are partial. No source code is declared safe to publish based solely on the initial sweep.
- `circle` has a private [sanitization proposal](https://github.com/the-static-collective/circle/pull/1), but its original Git history still contains old demo-account text. A clean-history import is required.
- `gramfork`, `groove-rooms`, `idea-grove` have tracked `.env` files carrying project IDs, URLs and publishable-style Supabase keys. These are not evidence of secret service-role exposure, but complete-history and backend review still remain.

The larger family of private donor projects can enter later as **separate reviewed branches**, rather than exposing all private material in one bulk push.

See the [living Git wiki proposal](https://github.com/the-static-collective/What-is-the-static-collective-/pull/100) for the broader ecology. 
