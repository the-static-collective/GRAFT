# GRAFT-027 — Capability Gardener

This experimental research branch follows GRAFT-026, the source-owned adapter compiler.

## Experiment and mechanism
Original ALEX-026 discovers an immutable Git-blob-pinned public OpenAPI candidate. GRAFT-027 does something beyond the GRAFT-026 *fixed output keys*: it derives a **bounded family of NEW executable JSON numeric extraction programs** from distinct, initially unknown field paths in example responses. Each candidate includes its precise selector, generated JavaScript, source checksum and claimed constraints.

It trains candidates on separately labeled synthetic fixtures, then evaluates on previously unused **holdout** fixtures and explicit invalid/failure responses. It reports a ranked leaderboard with individual failures, preserves unsuccessful variants and only recommends a source-review candidate if every test passes. It **never installs the winning candidate** and does not equate fixture success with the real API being correct.

The original ALEX-026 vendor code, ALEX-025 provider router and GRAFT-026 adapter entry are still integrity-checked by original SHA hashes.

## Boundary challenge / "hackstab eskimmolation"
| Challenged frontier | What ran | Honest boundary |
| --- | --- | --- |
| New adapter invention | Multiple distinct executable JSON extractors were synthesized from unfamiliar nested response fields; withheld data removed misleading alternatives. | This is a finite numeric JSON-path grammar, **not arbitrary program synthesis**. |
| Open-ended browsing | Unknown API declarations and declared hosts were treated as evidence only. No user-supplied or source-advertised arbitrary HTTP host is contacted. | General unrestricted browsing **not demonstrated**; deliberate SSRF/redirect/credential overrides are refused. |
| Third-party live connections | In an explicitly approved CI integration run, the real public Open-Meteo API was queried once with a fixed published Berlin example. The response was format-checked and hashed, with the receipt saved as an Actions artifact. | This is a **real live third-party read**, not autonomous integration of an arbitrary discovered provider. Terms and attribution still apply; no customer API key or user coordinates. |

## Reproduce
Node 22 or later:
```sh
node --test test/capability-gardener-027.test.mjs test/live-pilot-027.test.mjs
```

The separate GitHub Actions live-pilot step uses `probePublicExample({approvedPublicPilot:true})`; the default call makes **zero** external requests. Its HTTP request is hard-pinned to `https://api.open-meteo.com/v1/forecast` with fixed example latitude/longitude and one temperature variable; it forbids redirects, credentials, arbitrary hosts and extra query arguments. The result is a public, non-commercial pilot only.

Open-Meteo documents its API at https://open-meteo.com/en/docs; its site publishes licensing and attribution conditions at https://open-meteo.com/.

No production merge, source-owner admission, scheduled operation, source writes, private sources or live contact with a newly discovered provider.
