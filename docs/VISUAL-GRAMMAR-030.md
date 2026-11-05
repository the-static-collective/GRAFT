# GRAFT-030 — Visual Transition Grammar (Experimental)

**IMAGE-IN → OBSERVE MOVEMENT → SYNTHESIZE IMAGE OPERATOR.**

This **new source-owning GRAFT branch** creates runnable JavaScript for a bounded image transformation not representable by GRAFT-029's guarded **addition-only** operator.

Input: a content-digested, source-owned `motif.visual-gap.v0` showing two small palette raster frames where an object **moves**. Old red pixels must disappear while new red pixels appear, and the obstacle layer stays fixed. Merely adding facts cannot produce this transition while conserving the object's area.

GRAFT-030 synthesizes **three executable mode variants** from an audited closed template:
- `copy` preserves old red pixels, thus fails proper relocation;
- `recolor` fails object-color and shape conservation;
- `move` atomically removes the old location and inserts the shifted 2×2 object, while preserving stationary obstacles and refusing collisions/bounds violations.

Native original GRAFT code evaluates these against separate synthetic **training**, **selection**, and **negative** image-frame examples, preserving rejected variants and a byte-identical source for the sole admissible candidate. A distinct CANNON source-owner reviewer will test an untouched additional image pool and check classical parity.

**Limits:** Finite human-authored grammar; 3..16 rows and columns; `R` as one rigid 2×2 object, `#` as obstacle, `.` as empty. One cardinal-grid step at a time. This is **not** natural-image object recognition, a vision-language model, general animation, inventing optics, or semantic understanding of photographs. No API, photos, credentials or user assets are contacted. Generated source is inert until separately executed in a held, offline local research runner.

This is deliberately compatible with MOTIF-006's **real PNG image-in** frontend, which decodes a tightly constrained PNG into the exact same source-verified raster symbols. MOTIF can use the generated operator to simulate hypothetical future images and compare them to a desired target image.

Tests: `node --test test/visual-grammar-030.test.mjs`. No automatic merges, deployment or admission.
