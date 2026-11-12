# GRAFT × JUBILEE × MOTIF — CAPABILITY LABORATORY-016

**Actual executable comparison of multiple implementation methods.** This is the next step after the completed 015 source-pinned local-capability loop. The code is fully synthetic, narrow and read-only until a human explicitly invokes a local JSON report writer.

## Three different implementations, not three imaginary methods

The methods are source-owned, hand-written ordinary software techniques:

| Candidate | Mechanism | Mandatory safety outcome |
|---|---|---|
| unsafe-interpolation | interpolates invented captions as raw HTML; red-team *data only* | FAIL, demonstrable injection |
| escaped-compact | escapes captions, minimal printable document | PASS |
| accessible-print | a corrected, escaped, semantic successor to the original 015 compiler | PASS, more presentational structure |

Each runs on three identical generated fixtures:
1. Ordinary invented story, identical to Jubilee's 015 local request.
2. Hostile-looking title and caption strings containing `<script>`, `<img onerror=...>`, and `<iframe src=...>`. These are inert data *only when correctly escaped*. They never run in a browser.
3. Multilingual, unusual punctuation and Unicode characters.

For each candidate/test pair, GRAFT computes the exact output HTML and runs the function a second time. Both outputs and SHA-256s are included **only as strings inside a JSON report**. The unsafe method's raw HTML is never written as a standalone executable file.

GRAFT does not grade itself as trusted. It passes all method result bytes to an **independent, exact SHA-pinned Jubilee verifier**, whose separate code replays and recomputes: actual text preservation, escaped adversarial content, no active elements or externally loading markup, deterministic repeat bytes, size budgets, *zero* real authority and measured presentational features. It records the failing candidate rather than silently hiding it.

A policy can prefer accessibility-oriented output or the smallest *safe* output under an explicit bound of actual UTF-8 output bytes. Byte count is an actual reproducible resource measurement but **is not measured energy or carbon impact**.

### Real native MOTIF-010 in the diagnostic experiment

The second cross uses the **original Python `experiments/010/scientist.py` from MOTIF** at commit `66d27cfbd077b2c91d0d86d66e320206d88d8f95`, plus the original 009 tree cartridge implementation. Before importing the Scientist, a Git blob digest independently verifies the original source `0aa7f509adc7a339455308b709dae7c05f882a74`.

GRAFT creates four **actual controlled local rendering variants** with two Boolean engineering controls:

- escaping HTML injection enabled or disabled;
- print styling enabled or disabled.

The evaluator independently checks the resulting HTML bytes. MOTIF initially sees only two deliberately confounded synthetic outcomes—both options disabled and both enabled—and constructs competing **real MOTIF-009 decision-tree cartridges**.

MOTIF's original `propose_intervention()` then chooses which untested controlled renderer configuration to test. The evaluator discloses that already-generated, actually checked result **only after the proposal**. Two such experiments distinguish the deliberately programmed conjunctive rule.

The scientist therefore actually selects *diagnostic experiments* instead of merely being mentioned in the documentation. It does **not** select or write software implementations, authenticate people, perform real-world tests, infer human value, modify its source, or autonomously reprogram GRAFT. A strong fixed classical rule that explicitly checks escaping + print requirements also perfectly distinguishes these four controlled cases.

## Real crossing and expected results

```
Jubilee Treasury 016 pinned source — supplies request, benchmark and independent verifier
   ↳ GRAFT 016 — 3 source-owned renderers × 3 test cases × 2 executions
     ↳ local method-evidence.json (only output artifact)
       ↳ original Jubilee verifier — rejects unsafe, compares two passing methods
         ↳ CONCORD-014 (original unchanged): adds one hypothetical possibility
       ↳ native MOTIF-010 Scientist — two controlled test selections
         ↳ result checked by evaluator, no external authority
```

No actual landlord interest, homeowner permission, ownership, labor, photographic license, loan, finance, payment, creditor satisfaction, public deployment, GRAFT canon admission, private source material or human beneficiary is involved. A local build proof cannot create economic obligations. The original main branches remain unchanged.

## Reproduce

Node.js 22+, Python 3.10+, zero JS dependencies. Place local source checkouts alongside each other at the documented exact refs.

```sh
# Jubilee checkout at SHA 743aea20ab54d959506b8ad51eb42a2724889a57
node jubilee-source/labs/penny-puddle-016/export.mjs > /tmp/spec-016.json

# GRAFT checkout of this research branch
node experiments/capability-016/cross.mjs --request /tmp/spec-016.json --out /tmp/new-graft-016

# Independently assess the JSON bytes
node jubilee-source/labs/penny-puddle-016/verify.mjs --request /tmp/spec-016.json --kit /tmp/new-graft-016

# Native MOTIF-010 exact source checkout
MOTIF_SOURCE_ROOT=motif-source python3 experiments/capability-016/native_motif_probe.py /tmp/new-graft-016/method-evidence.json
```

CI pins source, runs local adversarial tests and all three real methods, source-owned Jubilee verification, original native MOTIF test selection, and uploads the inert JSON evidence for inspection. The deliberately unsafe candidate must never be served as HTML or inserted into a web page.

## Limitations, next falsifier

This controlled method contest has only 3 hand-authored techniques and a fixed acceptance suite, not autonomous novel algorithm synthesis. The native Scientist identifies a programmed two-control Boolean relationship; it cannot generalize that law to arbitrary HTML or actual software safety. The actual sender is pinned by CI configuration, but the SHA-256 report digests alone are not digital signatures. Even a real local successful method remains a `PROPOSE_ONLY` candidate in Jubilee.

A more serious next test would ask the model to **propose and reject an entirely unlisted new primitive implementation** against a held-out, stronger independent suite. Strong baselines must include classical search, ordinary source-code reuse and a prior tool library; any claim of self-improvement requires an actual measured improvement on withheld tasks, not a richer demo screen.

**GRAFT nursery rule:** *Methods compete in the laboratory. Evidence travels back. Authority stays with the people.*
