# WEAVES → WE'VES 001
**2026-10-26 · GRAFT independent experiment · proposal-only, local/offline**

> A weave is a set of attributable possibilities.
> A **we've** is a capacity or act that people *actually* have together.
> Connection is not consent; possibility is not commitment; a report is not an independently established outcome.

## What this branch does today

A **small runnable standard-library Python composer** creates a public-safe, content-addressed, recursively nestable weave map. A weave can take **other weaves** as inputs; people may make new weaves from the published maps without taking over the source projects. A separate **we've candidate** points at one proposed next useful human action.

It also rejects tampered hashes, nonexistent/forward inputs, duplicate same-input "participation," private-marked packets, forged permissions, forced claims of verified delivery, and silent upgrade of proposed relations into adoption. It does not connect to accounts, run tasks, publish invitations, or send requests.

The included example contains **15 public project references**, **five local weaves**, **one weave-of-weaves**, and **one proposed we've candidate**. The graph is a *new suggested composition*, not evidence that its relationships are implemented, approved, deployed, or adopted.

Run locally:

~~~sh
python3 weves.py demo > weave-map.json
python3 weves.py validate weave-map.json
python3 weves.py trace weave-map.json
python3 weves.py reweave weave-map.json \
  --title "Our new weave" \
  --source-title "My public community tool" \
  --source-url "https://example.org/public/tool" \
  --source-role "new voluntary contribution" \
  --next-act "Ask a local adult steward to review one optional paper invitation" \
  > our-weave.json
python3 weves.py validate our-weave.json
python3 -m unittest -v test_weves.py
~~~

Requires Python 3.9+ only. The demo and reweave commands write JSON to stdout. The reweave command preserves existing content-addressed nodes, references the prior source weave, adds the new public source, and emits a new PROPOSE_ONLY candidate; it does not contact the source owner. Validation checks **packet structure**, not provenance accuracy, privacy safety, identity, consent, or field delivery. This branch makes no network calls.

## The five initial weaves

| Proposed weave | Source doors | Proposed role | What is **not** asserted |
| --- | --- | --- | --- |
| **Witness & reconstruct** | [Black Star reviewed GRAFT subset](https://github.com/the-static-collective/GRAFT/tree/graft/black-star) → [MEMENTO reviewed subset](https://github.com/the-static-collective/GRAFT/tree/graft/MEMENTO) → [Free Graph](https://github.com/the-static-collective/free-graph) → [GRAFT](https://github.com/the-static-collective/GRAFT) | source-backed reconstruction and independently held receipts | no private original data, no universal current state |
| **Find & steward** | [JAR;VIS](https://github.com/the-static-collective/JAR-VIS) → [BananaSpork](https://github.com/the-static-collective/BananaSpork) → [Jubilee Engine VM](https://github.com/the-static-collective/Jubilee-Engine-VM) | attention → unsent work card → separate volunteer decision → possible return | no auto-matching, reciprocal duty, delegated guardian authority |
| **Invite & return** | [webZ](https://github.com/the-static-collective/webZ) → [LemonPRESS](https://github.com/the-static-collective/lemonPRESS) | reviewable public invitation and return route | no actual sent notice, partner endorsement or official organizational voice |
| **Create & publish** | [Haunted Toaster](https://github.com/the-static-collective/the-haunted-toaster) → [Haunted Blender](https://github.com/the-static-collective/the-haunted-blender) → [static-live](https://github.com/the-static-collective/static-live) | songs/media as optional participation artifacts | no claim of joined runtimes or public broadcast |
| **Route useful resources** | [GHoT](https://github.com/the-static-collective/GHoT) → [reLATTE](https://github.com/the-static-collective/reLATTE) → [MSyoU](https://github.com/the-static-collective/MSyoU) | voluntary hardware/energy/service offers and bounded execution | no permission to spend power, run someone else's machine or enroll a campus |

Each row is independently ownable and removable. The **sixth weave** relates the five; it doesn't flatten them into one product, one legal entity, one database, or one common authority.

## The distinction that makes the name honest

~~~text
PARTICULAR (project / instrument / evidence pointer)
    + another distinct PARTICULAR
      = WEAVE (proposed relation; no new permissions)

WEAVE + WEAVE + one more relevant PARTICULAR
      = WEAVE OF WEAVES (attributable, recursive, reusable)

WEAVE + voluntary local steward + concrete possible act
      = WE'VE CANDIDATE (PROPOSE_ONLY)

WE'VE CANDIDATE + separately consenting people + safe action
      + independently inspectable, appropriately private confirmation
      = POSSIBLE REAL-WORLD "WE'VE" (outside this program;
        local humans evaluate; never declared automatically)

reviewed public-safe RETURN → new PARTICULAR in someone else's WEAVE
~~~

A delivered act cannot manufacture a new volunteer. Help never creates debt. The weave may fork without recruiting anyone whose original source was linked. Participants can say no, stop, or unweave *future participation* without falsifying history.

## Reuse contract: others can weave our weaves

1. **Point, don't copy by default.** Take immutable packet hashes and public pointers; preserve original owners. A reference to a private source must not expose or duplicate its content.
2. **Keep local choice.** A source project's upstream admission cannot be inherited by a downstream weave. A connection does not establish consent or authority.
3. **Add a new relation.** In a forked graph, add a new weave with explicit typed relations and new content hash. Do not rewrite an older packet; carry both.
4. **Separate action from recognition.** A candidate may become a field undertaking only after local stewardship, appropriate safeguard review and task-specific volunteer consent. A return packet is a **reported return**, not proof-by-JSON.
5. **Preserve disagreement and failed branches.** Refusal, UNKNOWN, HOLD and disagreement are information, not errors to erase. No centralized social reputation, points or compulsory reciprocity.
6. **Publish only appropriate cuts.** No survivor narratives, child information, case identifiers, addresses, private case/source pointers, tokens, contact data, raw need/message databases, or partner claims without separate permission.

This proof-of-shape is **not** a sufficiently robust content-safety scanner. Human public-release review remains mandatory even when validation succeeds.

## First honest we've we can pursue

**One voluntarily selected, paper-first community-help act, independently confirmed by the people who actually participated.** It may start with a non-sensitive, generalized need such as delivering groceries; it does **not** require access to any survivor case or an existing institution's membership list.

The path:

~~~text
public-safe need class → human steward review → optional invitation
→ independently consenting offer → bounded act → recipient may confirm
→ optional non-identifying return after separate review
→ new weave from that public-safe return
~~~

If the act isn't independently confirmed, record **unknown**; do not record "we've done it." If a recipient doesn't want to become a helper, they owe nothing. If a helper declines, the relation simply remains unactivated.

## Relation to existing real work

This is **not a replacement** for the prior live experiment chains. It gives their individual return packets a possible explicit *cross-weave composition surface*. These existing branches remain independent:

- [GRAFT HYPERCROSS-001](https://github.com/the-static-collective/GRAFT/pull/3): cross-project research/print/return specimen.
- [GRAFT HYPERCROSS-002](https://github.com/the-static-collective/GRAFT/pull/4): experimental Morse / Radio House return.
- [GRAFT HYPERCROSS-003](https://github.com/the-static-collective/GRAFT/pull/5): proposed reviewed human invitation from prior artifacts.
- [GRAFT CRATER-CROSS-001 issue](https://github.com/the-static-collective/GRAFT/issues/6): seven-day, opt-in field preflight and one independently confirmed human-care act.
- [BananaSpork PR #21](https://github.com/the-static-collective/BananaSpork/pull/21): optional *independent* future stewardship seed, never beneficiary debt.

**GRAFT main is an index; donor/application branches are not to be merged into main.** This independent branch is an experimental instrument for proposing cross-weaves, not global canon and not a replacement owner database.

## Acceptance ladder

- **Done in source:** recursive deterministic addresses, structural validation, synthetic non-personal crosswalk, unit tests.
- **Verified in CI:** GitHub Actions run [40385573035](https://github.com/the-static-collective/GRAFT/actions/runs/40385573035) passed the unit tests and demo generation/validation/trace at commit 5c42300. Subsequent commit adds a downloadable public demo artifact; check that newer head independently before claiming it passed.
- **Still to prove:** independent human reading of its output, external reweaving from a copied public packet, hostile privacy review and practical handoff usability.
- **Not claimed:** service deployment; user sign-ups; ongoing moderation; real volunteer contact; physical help delivered; partnership; authority transfer.

**Next proof:** let a person start with one of these five weaves, add an independently owned instrument, produce a forked packet offline, and bring back one reviewed output. That is the first *reweave*, not merely another diagram.
