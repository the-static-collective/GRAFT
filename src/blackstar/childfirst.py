from __future__ import annotations

from collections import defaultdict
from typing import Any

from .models import ValidationResult
from .timeutil import parse_timestamp

ACCOUNT_KINDS = {
    "observation",
    "direct_statement",
    "recollection",
    "interpretation",
    "allegation",
    "administrative_record",
}
OCCURRENCE_STATUS = {"planned", "observed", "reported", "unknown"}
CAPTURE_MODES = {
    "contemporaneous",
    "near_contemporaneous",
    "retrospective",
    "imported_historical",
}
AUDIENCES = {
    "private_archive",
    "co_parent",
    "professional",
    "child_future",
    "scrapbook",
}
FORBIDDEN_SCORE_KEYS = {
    "parent_score",
    "fitness_score",
    "custody_score",
    "truth_score",
    "risk_score",
    "credibility_score",
    "best_parent",
    "legal_significance_score",
}


def _find_forbidden_keys(value: Any, path: str = "$") -> list[str]:
    found: list[str] = []
    if isinstance(value, dict):
        for key, child in value.items():
            if key in FORBIDDEN_SCORE_KEYS:
                found.append(f"{path}.{key}")
            found.extend(_find_forbidden_keys(child, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(_find_forbidden_keys(child, f"{path}[{index}]"))
    return found


def validate_record(record: dict[str, Any]) -> ValidationResult:
    errors: list[str] = []
    warnings: list[str] = []

    for key in (
        "record_id",
        "child_ref",
        "captured_at",
        "capture_mode",
        "occurrence_status",
        "accounts",
        "carriers",
        "privacy",
    ):
        if key not in record:
            errors.append(f"missing required field {key}")

    for path in _find_forbidden_keys(record):
        errors.append(
            f"{path}: child-first records do not allow automated parent/custody/"
            "truth/fitness scoring"
        )

    if errors:
        return ValidationResult.from_messages(errors, warnings)

    try:
        parse_timestamp(record["captured_at"], label="captured_at")
    except Exception as exc:
        errors.append(str(exc))

    if record["capture_mode"] not in CAPTURE_MODES:
        errors.append(f"invalid capture_mode {record['capture_mode']!r}")
    if record["occurrence_status"] not in OCCURRENCE_STATUS:
        errors.append(f"invalid occurrence_status {record['occurrence_status']!r}")

    if record["occurrence_status"] == "planned" and record.get("confirmed_occurred") is True:
        errors.append(
            "planned != occurred: use a descendant record or change occurrence_status "
            "with an explicit receipt"
        )

    carriers = record["carriers"]
    if not isinstance(carriers, list):
        errors.append("carriers must be a list")
        carriers = []
    carrier_refs: set[str] = set()
    for index, carrier in enumerate(carriers):
        if not isinstance(carrier, dict):
            errors.append(f"carriers[{index}] must be an object")
            continue
        source_ref = carrier.get("source_ref")
        if not source_ref:
            errors.append(f"carriers[{index}]: missing source_ref")
        else:
            carrier_refs.add(str(source_ref))
        if not carrier.get("kind"):
            errors.append(f"carriers[{index}]: missing kind")

    accounts = record["accounts"]
    if not isinstance(accounts, list):
        errors.append("accounts must be a list")
        accounts = []

    seen_accounts: set[str] = set()
    for index, account in enumerate(accounts):
        if not isinstance(account, dict):
            errors.append(f"accounts[{index}] must be an object")
            continue
        prefix = f"accounts[{index}]"
        for key in (
            "account_id",
            "author_ref",
            "account_kind",
            "recorded_at",
            "text",
            "source_refs",
            "audiences",
            "adult_conflict",
            "memory_eligible",
        ):
            if key not in account:
                errors.append(f"{prefix}: missing {key}")

        account_id = account.get("account_id")
        if account_id in seen_accounts:
            errors.append(f"{prefix}: duplicate account_id {account_id}")
        if account_id:
            seen_accounts.add(str(account_id))

        if account.get("account_kind") not in ACCOUNT_KINDS:
            errors.append(
                f"{prefix}: invalid account_kind {account.get('account_kind')!r}"
            )

        try:
            parse_timestamp(account.get("recorded_at"), label=f"{prefix}.recorded_at")
        except Exception as exc:
            errors.append(str(exc))

        source_refs = account.get("source_refs")
        if not isinstance(source_refs, list) or not source_refs:
            errors.append(f"{prefix}: source_refs must be a non-empty list")
        elif carrier_refs:
            missing = [
                ref for ref in source_refs
                if ref not in carrier_refs and not str(ref).startswith("self:")
            ]
            if missing:
                warnings.append(
                    f"{prefix}: source_refs not present in record carriers: {missing}"
                )

        audiences = account.get("audiences")
        if not isinstance(audiences, list) or not audiences:
            errors.append(f"{prefix}: audiences must be a non-empty list")
        else:
            bad = [a for a in audiences if a not in AUDIENCES]
            if bad:
                errors.append(f"{prefix}: invalid audiences {bad}")

        kind = account.get("account_kind")
        if kind == "direct_statement":
            if not account.get("speaker_ref"):
                errors.append(f"{prefix}: direct_statement requires speaker_ref")
            if account.get("quote_mode") not in {"exact", "paraphrase"}:
                errors.append(
                    f"{prefix}: direct_statement requires quote_mode exact|paraphrase"
                )

        adult_conflict = account.get("adult_conflict") is True
        memory_eligible = account.get("memory_eligible") is True
        if memory_eligible and adult_conflict:
            errors.append(
                f"{prefix}: adult-conflict material cannot be memory_eligible"
            )
        if memory_eligible and kind in {
            "allegation",
            "administrative_record",
        }:
            errors.append(
                f"{prefix}: {kind} cannot be memory_eligible"
            )
        if "scrapbook" in (audiences or []) and not memory_eligible:
            warnings.append(
                f"{prefix}: scrapbook audience present but memory_eligible is false"
            )

        assertions = account.get("assertions", [])
        if assertions is not None and not isinstance(assertions, list):
            errors.append(f"{prefix}: assertions must be a list")
        elif isinstance(assertions, list):
            for assertion_index, assertion in enumerate(assertions):
                if not isinstance(assertion, dict):
                    errors.append(
                        f"{prefix}.assertions[{assertion_index}] must be an object"
                    )
                    continue
                if "key" not in assertion or "value" not in assertion:
                    errors.append(
                        f"{prefix}.assertions[{assertion_index}] requires key and value"
                    )

    privacy = record["privacy"]
    if not isinstance(privacy, dict):
        errors.append("privacy must be an object")
    else:
        if privacy.get("child_future_access") not in {
            "allowed",
            "withheld_pending_review",
            "not_applicable",
        }:
            errors.append(
                "privacy.child_future_access must be "
                "allowed|withheld_pending_review|not_applicable"
            )

    if not accounts:
        warnings.append(
            "record has no accounts; source presence alone is not a claim"
        )

    return ValidationResult.from_messages(
        errors,
        warnings,
        details={
            "record_id": record.get("record_id"),
            "accounts": len(accounts),
            "carriers": len(carriers),
            "law": "CHILD != EVIDENCE OBJECT",
        },
    )


def perspective_matrix(record: dict[str, Any]) -> dict[str, Any]:
    by_key: dict[str, dict[str, list[Any]]] = defaultdict(lambda: defaultdict(list))
    account_kinds: dict[str, str] = {}

    for account in record.get("accounts", []):
        observer = str(account.get("author_ref", "(unknown)"))
        account_kinds[str(account.get("account_id", ""))] = str(
            account.get("account_kind", "")
        )
        for assertion in account.get("assertions", []) or []:
            key = str(assertion.get("key"))
            by_key[key][observer].append(assertion.get("value"))

    matrix = []
    for key, observer_values in sorted(by_key.items()):
        normalized = {
            repr(value)
            for values in observer_values.values()
            for value in values
        }
        if len(observer_values) == 1:
            status = "single-perspective"
        elif len(normalized) == 1:
            status = "aligned"
        else:
            status = "divergent"
        matrix.append(
            {
                "key": key,
                "status": status,
                "perspectives": dict(sorted(observer_values.items())),
            }
        )

    return {
        "record_id": record.get("record_id"),
        "child_ref": record.get("child_ref"),
        "assertions": matrix,
        "law": (
            "DIVERGENT ACCOUNTS MAY COEXIST; DIFFERENCE != VERDICT"
        ),
    }


def memory_packet(record: dict[str, Any]) -> dict[str, Any]:
    safe_accounts = []
    provenance = []

    for account in record.get("accounts", []):
        if account.get("adult_conflict") is True:
            continue
        if account.get("memory_eligible") is not True:
            continue
        if "scrapbook" not in (account.get("audiences") or []):
            continue
        if account.get("account_kind") not in {
            "observation",
            "direct_statement",
            "recollection",
            "interpretation",
        }:
            continue

        safe_accounts.append(
            {
                "account_id": account.get("account_id"),
                "account_kind": account.get("account_kind"),
                "text": account.get("text"),
                "speaker_ref": account.get("speaker_ref"),
                "quote_mode": account.get("quote_mode"),
            }
        )
        provenance.append(
            {
                "account_id": account.get("account_id"),
                "author_ref": account.get("author_ref"),
                "recorded_at": account.get("recorded_at"),
                "source_refs": account.get("source_refs", []),
            }
        )

    return {
        "record_id": record.get("record_id"),
        "child_ref": record.get("child_ref"),
        "memory_title": record.get("memory_title"),
        "event_window": record.get("event_window"),
        "accounts": safe_accounts,
        "provenance_appendix": provenance,
        "excluded_adult_conflict": True,
        "law": (
            "MEMORY RENDERING != SOURCE; CHILD-FACING OUTPUT != ADULT-CONFLICT DOSSIER"
        ),
    }
