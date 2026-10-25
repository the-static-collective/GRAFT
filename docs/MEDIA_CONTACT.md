# Media Contact Membrane

Black Star treats large audio/video carriers as evidence sources whose **existence**, **byte contact**, **derived analysis**, and **later interpretation** have different birthdays and different authority.

## Core laws

**CONTACT != DISCOVERY.**

A source may be known to the archive before an observer has contacted its bytes or content.

**DERIVED VIEW != INDEPENDENT WITNESS.**

A transcript, frame extraction, proxy, scene analysis, summary, or annotation derived from one carrier may improve access to that carrier. It does not create a new independent witness.

**PROXY != ORIGINAL.**

A transformed media file can be useful for analysis while the original carrier remains the authority for source identity and fidelity.

**LATER CONTEXT != SOURCE CONTENT.**

Later clarification may attach to an exact timecoded span without rewriting what the original carrier contained.

**TIMECODED OBSERVATION != CAUSAL VERDICT.**

A timecoded visual or audible observation can establish what is present in the carrier. It does not automatically establish who caused it, when the underlying event occurred, or whether an interpretation is true.

## Native records

### Contact receipt

Records the transition from source discovery to actual byte/content contact.

Required boundaries include source reference, discovery time, contact time, SHA-256, size, source class, and contact scope.

### Artifact lineage

Records a primary carrier and its derivative views.

Typical edges:

```text
primary video
  ├─ transcript
  ├─ frame extracts
  ├─ analysis proxy
  │    └─ scene analysis
  └─ human summary
```

All descendants remain descendants unless a genuinely independent carrier enters the archive.

### Media observations

NDJSON timecoded observations distinguish:

- `direct_record`
- `original_utterance`
- `speaker_claim`
- `interpretation`

This prevents a visible condition, a recorded statement, and the speaker's causal interpretation from collapsing into one proposition.

### Proxy receipt

Records a transformation used to make a large carrier analyzable while preserving the original as authority. Duration drift is mechanically checked against an explicit tolerance.

Black Star does not require FFmpeg or another media tool as a runtime dependency. It validates the transformation receipt produced by whatever tool was used.

### Interpretive attachment

Attaches later context to a timecoded span with its own discovery and relation birthday.

This is the correct home for later lexical clarifications, object identification, corrections, and remembered context. The attachment may change a descendant interpretation; it may not rewrite the ancestor carrier.

## Event packets

Event packets now have a validator as well as a renderer. Source facts require receipts; attributable claims remain claims; corroborated statuses require independent evidence receipts; interpretations cannot become corroborated merely by being repeated.

## Storage boundary

Raw/private audio and video stay in the WITNESS vault.

Git may hold:

- source IDs and hashes;
- contact receipts;
- transformation receipts;
- derivative lineage;
- timecoded observation indexes;
- event packets;
- validation fixtures built from synthetic data.

Git does not become the media vault.
