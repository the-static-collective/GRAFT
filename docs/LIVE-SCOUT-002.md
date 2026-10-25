# LIVE-SCOUT-002 — current public project scout

This small source-reader is separate from the frozen historical reconstruction. It rechecks the **current** public Git references for the named branches on each run and retrieves source Markdown content **by the freshly observed exact Git SHA**, not by a mutable branch name. It records source links, content digests, observed time, topic-scored headings, and whether a tracked branch has moved since an earlier snapshot.

It also lists up to 100 branch names per allowlisted repo and attempts source inspection of up to two dynamically relevant **new** branches. Unknown branches are *leads* until verified; a branch or passing CI is never a CANNON selection.

API calls restricted to `api.github.com/repos/the-static-collective/{GRAFT,JAR-VIS,planZ,CANNON,webZ,free-graph}/...` through fixed route constructors. Read-only GET, no arbitrary URL fetch, no executable instructions from retrieved text, no Git writes, 11-second per-call timeout, bounded documents. An ephemeral `GITHUB_TOKEN` may be provided in the environment for API rate limits; it is never stored in results or source.

**Limit:** public GitHub artifacts alone cannot tell what happened at a meeting, whether the church approved a plan, or whether software was deployed to Abundent. This is not a general search engine. Missing access produces explicit `errors` and partial coverage. New real-world reports require an independently attributed, revocable intake path.

Use this as the read surface for LIVE-WORK-002.
