from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ValidationResult:
    ok: bool
    errors: tuple[str, ...] = ()
    warnings: tuple[str, ...] = ()
    details: dict[str, Any] | None = None

    @classmethod
    def from_messages(
        cls,
        errors: list[str],
        warnings: list[str] | None = None,
        *,
        details: dict[str, Any] | None = None,
    ) -> "ValidationResult":
        return cls(not errors, tuple(errors), tuple(warnings or []), details)


@dataclass(frozen=True)
class Carrier:
    carrier_id: str
    source_ref: str
    discovered_at: str
    contact: bool
