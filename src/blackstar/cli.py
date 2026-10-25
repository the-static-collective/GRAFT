from __future__ import annotations

import argparse
import tempfile
from pathlib import Path

from . import __snapshot__, __version__
from .anti_narc import (
    audit_status_deltas,
    lint_claims,
    lint_mirrors,
    render_authority_map,
    render_event_packet,
    trace_lineage,
    validate_event_packet,
)
from .ghostcut import audit_discovery, observer_delta, validate_activation, validate_cut
from .childfirst import memory_packet, perspective_matrix, validate_record as validate_child_record
from .chatarchive import (
    bomb_run as chat_bomb_run,
    connect as chat_connect,
    ingest_export as chat_ingest_export,
    list_conversations as chat_list_conversations,
    search_messages as chat_search_messages,
    selftest as chat_selftest,
    status as chat_status,
    verify_source as chat_verify_source,
)
from .io import dump_json, load_json, load_ndjson
from .media import (
    validate_artifact_lineage,
    validate_contact_receipt,
    validate_interpretive_attachment,
    validate_media_observations,
    validate_proxy_receipt,
)
from .models import ValidationResult
from .paths import find_home
from .phone import connect as phone_connect, import_notes as phone_import_notes, ingest_one as phone_ingest_one, render as phone_render, summary as phone_summary
from .situation import candidate_windows, render_decoder_report, validate_decoder
from .sources import validate_full_registry, validate_index, verify_vault_bytes


def _emit_result(result: ValidationResult, *, json_mode: bool = False) -> int:
    payload = {
        "ok": result.ok,
        "errors": list(result.errors),
        "warnings": list(result.warnings),
        "details": result.details or {},
    }
    if json_mode:
        print(dump_json(payload))
    else:
        print("PASS" if result.ok else "FAIL")
        for message in result.errors:
            print(f"ERROR: {message}")
        for message in result.warnings:
            print(f"WARN: {message}")
        if result.details:
            print(dump_json(result.details))
    return 0 if result.ok else 1


def _home_or_error(args) -> tuple[Path | None, int]:
    home = find_home(args.root)
    if home is None:
        print(
            "Black Star repository home not found. Run inside the repo, set BLACKSTAR_HOME, "
            "or pass --root /path/to/black-star."
        )
        return None, 2
    return home, 0


def cmd_status(args) -> int:
    payload = {
        "software_version": __version__,
        "archive_snapshot": __snapshot__,
        "mode": "provenance/category gates; non-adjudicative",
        "repository_boundary": (
            "Git=machine+lineage+indexes; WITNESS Drive=raw/private evidence vault"
        ),
        "organs": [
            "ghost-cut",
            "source-sync",
            "media-contact",
            "anti-narc",
            "situation-decoder",
            "phone-witness",
            "chat-archive",
            "child-first",
        ],
    }
    print(
        dump_json(payload)
        if args.json
        else "\n".join(f"{key}: {value}" for key, value in payload.items())
    )
    return 0


def cmd_validate_cut(args) -> int:
    return _emit_result(validate_cut(load_json(args.path)), json_mode=args.json)


def cmd_validate_activation(args) -> int:
    return _emit_result(validate_activation(load_json(args.path)), json_mode=args.json)


def cmd_audit_discovery(args) -> int:
    return _emit_result(audit_discovery(load_ndjson(args.path)), json_mode=args.json)


def cmd_delta(args) -> int:
    print(dump_json(observer_delta(load_json(args.old), load_json(args.new))))
    return 0


def cmd_sources(args) -> int:
    if args.index:
        index_path = Path(args.index)
    else:
        home, rc = _home_or_error(args)
        if rc:
            return rc
        index_path = home / "source-registry/v45-index.json"
    return _emit_result(validate_index(load_json(index_path)), json_mode=args.json)


def cmd_source_check(args) -> int:
    if args.index:
        index_path = Path(args.index)
    else:
        home, rc = _home_or_error(args)
        if rc:
            return rc
        index_path = home / "source-registry/v45-index.json"

    index = load_json(index_path)
    index_result = validate_index(index)
    if not index_result.ok or not args.vault:
        return _emit_result(index_result, json_mode=args.json)

    vault = Path(args.vault)
    registry_path = vault / index["sealed_release"]["full_registry_path"]
    if not registry_path.exists():
        return _emit_result(
            ValidationResult.from_messages(
                [f"missing full release registry: {registry_path}"]
            ),
            json_mode=args.json,
        )

    registry = load_json(registry_path)
    structural = validate_full_registry(registry)
    if not structural.ok:
        return _emit_result(structural, json_mode=args.json)
    return _emit_result(
        verify_vault_bytes(registry, vault),
        json_mode=args.json,
    )


def cmd_validate_contact(args) -> int:
    return _emit_result(
        validate_contact_receipt(load_json(args.path)),
        json_mode=args.json,
    )


def cmd_validate_artifact_lineage(args) -> int:
    return _emit_result(
        validate_artifact_lineage(load_json(args.path)),
        json_mode=args.json,
    )


def cmd_validate_media_observations(args) -> int:
    return _emit_result(
        validate_media_observations(load_ndjson(args.path)),
        json_mode=args.json,
    )


def cmd_validate_proxy(args) -> int:
    return _emit_result(
        validate_proxy_receipt(load_json(args.path)),
        json_mode=args.json,
    )


def cmd_validate_attachment(args) -> int:
    return _emit_result(
        validate_interpretive_attachment(load_json(args.path)),
        json_mode=args.json,
    )


def cmd_lint_claims(args) -> int:
    return _emit_result(lint_claims(load_ndjson(args.path)), json_mode=args.json)


def cmd_trace_lineage(args) -> int:
    result = trace_lineage(load_json(args.path))
    return _emit_result(result, json_mode=args.json)


def cmd_audit_status(args) -> int:
    return _emit_result(
        audit_status_deltas(load_ndjson(args.path)),
        json_mode=args.json,
    )


def cmd_mirror_lint(args) -> int:
    return _emit_result(lint_mirrors(load_ndjson(args.path)), json_mode=args.json)


def cmd_validate_event(args) -> int:
    return _emit_result(
        validate_event_packet(load_json(args.path)),
        json_mode=args.json,
    )


def cmd_render_event(args) -> int:
    print(render_event_packet(load_json(args.path)), end="")
    return 0


def cmd_render_authority(args) -> int:
    print(render_authority_map(load_json(args.path)), end="")
    return 0


def cmd_validate_decoder(args) -> int:
    return _emit_result(validate_decoder(args.path), json_mode=args.json)


def cmd_decoder_candidates(args) -> int:
    rows = load_ndjson(args.ndjson)
    found = candidate_windows(
        rows,
        identifiers=set(args.identifier or []),
        context=args.context,
    )
    print(dump_json(found))
    return 0


def cmd_render_decoder(args) -> int:
    print(render_decoder_report(args.path), end="")
    return 0


def cmd_phone_ingest(args) -> int:
    store = Path(args.store)
    db = phone_connect(store)
    try:
        results = [
            phone_ingest_one(db, store, Path(path))
            for path in args.files
        ]
        rendered = phone_render(db, store, args.timezone)
        print(dump_json({"ingest": results, "render": rendered}))
        return 0
    finally:
        db.close()


def cmd_phone_import_notes(args) -> int:
    store = Path(args.store)
    db = phone_connect(store)
    try:
        imported = phone_import_notes(db, Path(args.file))
        rendered = phone_render(db, store, args.timezone)
        print(dump_json({"notes_imported": imported, "render": rendered}))
        return 0
    finally:
        db.close()


def cmd_phone_summary(args) -> int:
    db = phone_connect(Path(args.store))
    try:
        print(dump_json(phone_summary(db)))
        return 0
    finally:
        db.close()


def cmd_chat_ingest(args) -> int:
    store = Path(args.store)
    db = chat_connect(store)
    try:
        result = chat_ingest_export(
            db,
            store,
            Path(args.export),
            copy_source=args.copy_source,
            hash_members=args.hash_members,
            terms_path=Path(args.terms) if args.terms else None,
        )
        print(dump_json(result))
        return 0
    finally:
        db.close()


def cmd_chat_status(args) -> int:
    db = chat_connect(Path(args.store))
    try:
        print(dump_json(chat_status(db, args.export_id)))
        return 0
    finally:
        db.close()


def cmd_chat_search(args) -> int:
    db = chat_connect(Path(args.store))
    try:
        print(
            dump_json(
                chat_search_messages(
                    db,
                    args.query,
                    export_id=args.export_id,
                    from_date=args.from_date,
                    to_date=args.to_date,
                    timezone_name=args.timezone,
                    role=args.role,
                    context=args.context,
                    limit=args.limit,
                )
            )
        )
        return 0
    finally:
        db.close()


def cmd_chat_conversations(args) -> int:
    db = chat_connect(Path(args.store))
    try:
        print(
            dump_json(
                chat_list_conversations(
                    db,
                    export_id=args.export_id,
                    from_date=args.from_date,
                    to_date=args.to_date,
                    timezone_name=args.timezone,
                    limit=args.limit,
                )
            )
        )
        return 0
    finally:
        db.close()


def cmd_chat_bomb_run(args) -> int:
    store = Path(args.store)
    db = chat_connect(store)
    try:
        print(
            dump_json(
                chat_bomb_run(
                    db,
                    store,
                    Path(args.plan),
                    out=Path(args.out) if args.out else None,
                    export_id=args.export_id,
                )
            )
        )
        return 0
    finally:
        db.close()


def cmd_chat_verify(args) -> int:
    db = chat_connect(Path(args.store))
    try:
        result = chat_verify_source(db, args.export_id)
        print(dump_json(result))
        return 0 if result.get("ok") else 1
    finally:
        db.close()


def cmd_child_validate(args) -> int:
    return _emit_result(
        validate_child_record(load_json(args.path)),
        json_mode=args.json,
    )


def cmd_child_perspectives(args) -> int:
    print(dump_json(perspective_matrix(load_json(args.path))))
    return 0


def cmd_child_memory(args) -> int:
    record = load_json(args.path)
    result = validate_child_record(record)
    if not result.ok:
        return _emit_result(result, json_mode=args.json)
    print(dump_json(memory_packet(record)))
    return 0


def cmd_selftest(args) -> int:
    home, rc = _home_or_error(args)
    if rc:
        return rc

    checks: list[tuple[str, ValidationResult]] = []
    cuts_dir = home / "derived/ghost-cut/cuts"
    for path in sorted(cuts_dir.glob("*.json")):
        checks.append((str(path.relative_to(home)), validate_cut(load_json(path))))

    activation_dir = home / "derived/ghost-cut/activation-receipts"
    for path in sorted(activation_dir.glob("*.json")):
        checks.append(
            (str(path.relative_to(home)), validate_activation(load_json(path)))
        )

    discovery = home / "derived/ghost-cut/discovery-ledger.ndjson"
    checks.append(
        (str(discovery.relative_to(home)), audit_discovery(load_ndjson(discovery)))
    )

    index = home / "source-registry/v45-index.json"
    checks.append((str(index.relative_to(home)), validate_index(load_json(index))))

    child_example = home / "examples/synthetic/child-life-record.json"
    checks.append(
        (
            str(child_example.relative_to(home)),
            validate_child_record(load_json(child_example)),
        )
    )

    synthetic = home / "examples/synthetic"
    claims_example = synthetic / "anti-narc-claims.ndjson"
    checks.append(
        (
            str(claims_example.relative_to(home)),
            lint_claims(load_ndjson(claims_example)),
        )
    )

    event_example = synthetic / "event-packet.json"
    checks.append(
        (
            str(event_example.relative_to(home)),
            validate_event_packet(load_json(event_example)),
        )
    )

    media_dir = synthetic / "media"
    media_checks = [
        (
            "contact-receipt.json",
            lambda path: validate_contact_receipt(load_json(path)),
        ),
        (
            "artifact-lineage.json",
            lambda path: validate_artifact_lineage(load_json(path)),
        ),
        (
            "observations.ndjson",
            lambda path: validate_media_observations(load_ndjson(path)),
        ),
        (
            "proxy-receipt.json",
            lambda path: validate_proxy_receipt(load_json(path)),
        ),
        (
            "interpretive-attachment.json",
            lambda path: validate_interpretive_attachment(load_json(path)),
        ),
    ]
    for filename, validator in media_checks:
        path = media_dir / filename
        checks.append((str(path.relative_to(home)), validator(path)))

    decoder_example = synthetic / "situation-decoder"
    checks.append(
        (
            str(decoder_example.relative_to(home)),
            validate_decoder(decoder_example),
        )
    )

    try:
        with tempfile.TemporaryDirectory() as temp:
            temp_root = Path(temp)
            store = temp_root / "phone-store"
            calls = temp_root / "calls.xml"
            calls.write_text(
                '<calls count="1">'
                '<call date="1760000000000" number="+15550000111" '
                'contact_name="Synthetic" type="1" duration="1"/>'
                '</calls>',
                encoding="utf-8",
            )
            db = phone_connect(store)
            try:
                phone_ingest_one(db, store, calls)
                stats = phone_summary(db)
            finally:
                db.close()
            phone_errors = []
            if stats["sources"] != 1 or stats["events"] != 1:
                phone_errors.append(
                    f"synthetic phone witness counts unexpected: {stats}"
                )
            checks.append(
                (
                    "synthetic-phone-witness",
                    ValidationResult.from_messages(
                        phone_errors,
                        details=stats,
                    ),
                )
            )
    except Exception as exc:
        checks.append(
            (
                "synthetic-phone-witness",
                ValidationResult.from_messages([str(exc)]),
            )
        )

    checks.append(("synthetic-chat-archive", chat_selftest()))

    failed = [(name, result) for name, result in checks if not result.ok]
    payload = {
        "ok": not failed,
        "checks": len(checks),
        "passed": len(checks) - len(failed),
        "failed": [name for name, _ in failed],
    }

    if args.json:
        print(dump_json(payload))
    else:
        print(
            f"BLACK STAR SELFTEST: {'PASS' if not failed else 'FAIL'} "
            f"({payload['passed']}/{payload['checks']})"
        )
        for name, result in failed:
            print(name)
            for error in result.errors:
                print(f"  ERROR: {error}")
    return 0 if not failed else 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="blackstar",
        description="Black Star provenance-first witness instrument",
    )
    parser.add_argument("--json", action="store_true", help="machine-readable output")
    parser.add_argument(
        "--root",
        help="Black Star repository home; otherwise auto-detect or use BLACKSTAR_HOME",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("status", help="show software/archive status")
    p.set_defaults(func=cmd_status)
    p = sub.add_parser("selftest", help="run deterministic bundled-fixture checks")
    p.set_defaults(func=cmd_selftest)

    p = sub.add_parser("validate-cut", aliases=["ghost-cut"], help="validate a Ghost Cut JSON file")
    p.add_argument("path")
    p.set_defaults(func=cmd_validate_cut)
    p = sub.add_parser("validate-activation", aliases=["activation"], help="validate an activation/no-retcon receipt")
    p.add_argument("path")
    p.set_defaults(func=cmd_validate_activation)
    p = sub.add_parser("audit-discovery", aliases=["discovery"], help="audit artifact-level discovery-order NDJSON")
    p.add_argument("path")
    p.set_defaults(func=cmd_audit_discovery)
    p = sub.add_parser("delta", help="compare two observer cuts")
    p.add_argument("old")
    p.add_argument("new")
    p.set_defaults(func=cmd_delta)

    p = sub.add_parser("sources", help="validate and summarize the Git source index")
    p.add_argument("--index")
    p.set_defaults(func=cmd_sources)
    p = sub.add_parser("source-check", help="validate Git index; optionally verify a reassembled sealed vault")
    p.add_argument("--index")
    p.add_argument("--vault")
    p.set_defaults(func=cmd_source_check)

    p = sub.add_parser("validate-contact", help="validate a media/source byte-contact receipt")
    p.add_argument("path")
    p.set_defaults(func=cmd_validate_contact)
    p = sub.add_parser("validate-artifact-lineage", help="validate primary-to-derivative media lineage")
    p.add_argument("path")
    p.set_defaults(func=cmd_validate_artifact_lineage)
    p = sub.add_parser("validate-media-observations", help="validate timecoded media-observation NDJSON")
    p.add_argument("path")
    p.set_defaults(func=cmd_validate_media_observations)
    p = sub.add_parser("validate-proxy", help="validate a media proxy transformation receipt")
    p.add_argument("path")
    p.set_defaults(func=cmd_validate_proxy)
    p = sub.add_parser("validate-attachment", help="validate later context attached without source rewrite")
    p.add_argument("path")
    p.set_defaults(func=cmd_validate_attachment)

    p = sub.add_parser("lint-claims", help="lint claim envelopes for category errors")
    p.add_argument("path")
    p.set_defaults(func=cmd_lint_claims)
    p = sub.add_parser("trace-lineage", help="audit a claim lineage for echo mistaken as corroboration")
    p.add_argument("path")
    p.set_defaults(func=cmd_trace_lineage)
    p = sub.add_parser("audit-status", help="require evidence receipts for epistemic promotions")
    p.add_argument("path")
    p.set_defaults(func=cmd_audit_status)
    p = sub.add_parser("mirror-lint", help="lint actor-swap mirror tests")
    p.add_argument("path")
    p.set_defaults(func=cmd_mirror_lint)
    p = sub.add_parser("validate-event", help="validate an event packet before rendering")
    p.add_argument("path")
    p.set_defaults(func=cmd_validate_event)
    p = sub.add_parser("render-event", help="render an event packet as Markdown")
    p.add_argument("path")
    p.set_defaults(func=cmd_render_event)
    p = sub.add_parser("render-authority", help="render an authority map as Mermaid")
    p.add_argument("path")
    p.set_defaults(func=cmd_render_authority)

    p = sub.add_parser("validate-decoder", help="validate a Situation Decoder seed directory")
    p.add_argument("path")
    p.set_defaults(func=cmd_validate_decoder)
    p = sub.add_parser("decoder-candidates", help="surface lexical review windows; never a classifier")
    p.add_argument("ndjson")
    p.add_argument("--identifier", action="append", default=[])
    p.add_argument("--context", type=int, default=2)
    p.set_defaults(func=cmd_decoder_candidates)
    p = sub.add_parser("render-decoder", help="render a Situation Decoder seed report")
    p.add_argument("path")
    p.set_defaults(func=cmd_render_decoder)
    p = sub.add_parser("phone-ingest", help="ingest source XML into a private local Phone Witness store")
    p.add_argument("files", nargs="+")
    p.add_argument("--store", required=True)
    p.add_argument("--timezone", default="America/Chicago")
    p.set_defaults(func=cmd_phone_ingest)

    p = sub.add_parser("phone-import-notes", help="import later-context annotations into a Phone Witness store")
    p.add_argument("file")
    p.add_argument("--store", required=True)
    p.add_argument("--timezone", default="America/Chicago")
    p.set_defaults(func=cmd_phone_import_notes)

    p = sub.add_parser("phone-summary", help="show counts for a local Phone Witness store")
    p.add_argument("--store", required=True)
    p.set_defaults(func=cmd_phone_summary)

    p = sub.add_parser(
        "chatgpt",
        help="ingest/query a private local ChatGPT export store",
    )
    chat = p.add_subparsers(
        dest="chatgpt_command",
        required=True,
    )

    q = chat.add_parser(
        "ingest",
        help="hash, inventory, stream, normalize, tag, and index an export ZIP",
    )
    q.add_argument("export")
    q.add_argument("--store", required=True)
    q.add_argument("--copy-source", action="store_true")
    q.add_argument("--hash-members", action="store_true")
    q.add_argument("--terms")
    q.set_defaults(func=cmd_chat_ingest)

    q = chat.add_parser(
        "status",
        help="show local archive/index coverage",
    )
    q.add_argument("--store", required=True)
    q.add_argument("--export-id", type=int)
    q.set_defaults(func=cmd_chat_status)

    q = chat.add_parser(
        "search",
        help="literal text search with branch-aware lineage context",
    )
    q.add_argument("query")
    q.add_argument("--store", required=True)
    q.add_argument("--export-id", type=int)
    q.add_argument("--from", dest="from_date")
    q.add_argument("--to", dest="to_date")
    q.add_argument("--timezone", default="America/Chicago")
    q.add_argument("--role")
    q.add_argument("--context", type=int, default=2)
    q.add_argument("--limit", type=int, default=50)
    q.set_defaults(func=cmd_chat_search)

    q = chat.add_parser(
        "conversations",
        help="list conversation metadata in a date window",
    )
    q.add_argument("--store", required=True)
    q.add_argument("--export-id", type=int)
    q.add_argument("--from", dest="from_date")
    q.add_argument("--to", dest="to_date")
    q.add_argument("--timezone", default="America/Chicago")
    q.add_argument("--limit", type=int, default=200)
    q.set_defaults(func=cmd_chat_conversations)

    q = chat.add_parser(
        "bomb-run",
        help="emit provenance-preserving recovery packs from a JSON plan",
    )
    q.add_argument("plan")
    q.add_argument("--store", required=True)
    q.add_argument("--out")
    q.add_argument("--export-id", type=int)
    q.set_defaults(func=cmd_chat_bomb_run)

    q = chat.add_parser(
        "verify",
        help="rehash the registered source ZIP or copied source",
    )
    q.add_argument("--store", required=True)
    q.add_argument("--export-id", type=int)
    q.set_defaults(func=cmd_chat_verify)

    p = sub.add_parser("child-validate", help="validate a child-first life record")
    p.add_argument("path")
    p.set_defaults(func=cmd_child_validate)

    p = sub.add_parser("child-perspectives", help="show aligned/divergent structured assertions without a verdict")
    p.add_argument("path")
    p.set_defaults(func=cmd_child_perspectives)

    p = sub.add_parser("child-memory", help="emit a child-safe memory packet with provenance appendix")
    p.add_argument("path")
    p.set_defaults(func=cmd_child_memory)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
