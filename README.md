# GRAFT × MEMENTO — synthetic memory membrane

**State: PUBLIC SYNTHETIC KERNEL CANDIDATE / HOLD.** This branch contains new, narrowly authored, fixture-only code inspired by the private donor's public-safe architectural contracts. It is **not** a copy of MEMENTO's application, tests, memory archive, or Git history. No source testimony, private worlds, original chapters, credentials, or real-person data were imported.

This tiny zero-dependency Node.js (20+) membrane demonstrates three transferable organs:

1. `reviewCrossing` keeps source, proposal and ADMIT/REFUSE/FOG decisions separate. An `ADMIT` review receipt still performs **no** local write.
2. `compileContextPack` traverses explicit, decision-receipted world edges, returning `admission: none` for every retrieved item.
3. `resurface` creates a descendant activation referencing an old trace, without rewriting it.

Run: `node --test test/*.test.mjs`. Example from a Node ESM caller:

```js
import { reviewCrossing } from './src/membrane.mjs';
const receipt = reviewCrossing({
  proposal: { id: 'synthetic-proposal', source_refs: ['synthetic/card-1'] },
  decision: { id: 'synthetic-hold', route: 'FOG' },
});
console.log(receipt); // review_only; local_write: not_performed
```

See [GRAFT_DONOR.md](GRAFT_DONOR.md) for source ref, boundaries and release gate. The private donor remains authoritative about its actual behavior. Passing these tests is **not** an audit of the donor, an admission of source truth, a human publication decision for the donor, or a deployment.
