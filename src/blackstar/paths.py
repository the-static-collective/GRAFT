from __future__ import annotations

import os
from pathlib import Path


MARKERS = (
    Path("source-registry/v45-index.json"),
    Path("derived/ghost-cut/discovery-ledger.ndjson"),
)


def is_blackstar_home(path: Path) -> bool:
    return all((path / marker).exists() for marker in MARKERS)


def find_home(explicit: str | Path | None = None) -> Path | None:
    if explicit:
        candidate = Path(explicit).expanduser().resolve()
        return candidate if is_blackstar_home(candidate) else None

    env = os.getenv("BLACKSTAR_HOME")
    if env:
        candidate = Path(env).expanduser().resolve()
        if is_blackstar_home(candidate):
            return candidate

    current = Path.cwd().resolve()
    for candidate in (current, *current.parents):
        if is_blackstar_home(candidate):
            return candidate
    return None
