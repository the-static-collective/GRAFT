from __future__ import annotations

import hashlib
import json
import re
import shutil
import sqlite3
import zipfile
from collections import Counter
from pathlib import Path
from typing import Iterable

from .schema import (
    EMAIL_RE,
    HEURISTIC_RULES,
    ISO_DATE_RE,
    MONTH_DATE_RE,
    TIME_RE,
    URL_RE,
    US_DATE_RE,
    canonical_sha256,
    fts_enabled,
    hash_file,
    utc_now,
)
from .stream import extract_text, iter_json_values, walk_references


def _member_kind(name: str) -> str:
    lower, base = name.lower(), Path(name.lower()).name
    if re.fullmatch(r"conversations(?:[-_]?\d+)?\.json", base):
        return "conversation-json"
    if lower.endswith(".html"):
        return "html"
    if lower.endswith(".json"):
        return "json"
    if Path(lower).suffix in {
        ".png", ".jpg", ".jpeg", ".webp", ".gif", ".heic",
        ".mp4", ".mov", ".m4a", ".wav", ".mp3", ".pdf",
    }:
        return "asset"
    return "other"


def _conversation_member(name: str) -> bool:
    return bool(
        re.fullmatch(
            r"conversations(?:[-_]?\d+)?\.json",
            Path(name.lower()).name,
        )
    )


def _load_terms(path: Path | None) -> list[tuple[str, str]]:
    if path is None:
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    raw = data.get("terms", data) if isinstance(data, dict) else data
    if not isinstance(raw, list):
        raise ValueError(
            "custom terms must be a list or an object with a terms list"
        )
    out = []
    for item in raw:
        if isinstance(item, str):
            out.append(("custom-term", item))
        elif isinstance(item, dict) and isinstance(item.get("value"), str):
            out.append(
                (
                    str(item.get("label") or "custom-term"),
                    item["value"],
                )
            )
    return out


def _signal(
    db,
    export_id,
    conversation_id,
    node_id,
    kind,
    value,
    start,
    end,
    rule,
    authority,
):
    db.execute(
        "INSERT OR IGNORE INTO signals("
        "export_id,conversation_id,node_id,signal_kind,value,"
        "start_offset,end_offset,rule_id,authority"
        ") VALUES(?,?,?,?,?,?,?,?,?)",
        (
            export_id,
            conversation_id,
            node_id,
            kind,
            value,
            start,
            end,
            rule,
            authority,
        ),
    )


def _tag(
    db,
    export_id,
    conversation_id,
    node_id,
    text: str,
    terms: Iterable[tuple[str, str]],
):
    deterministic = (
        ("url", "exact-url", URL_RE),
        ("email", "exact-email", EMAIL_RE),
        ("explicit-date", "iso-date", ISO_DATE_RE),
        ("explicit-date", "us-date", US_DATE_RE),
        ("explicit-date", "month-date", MONTH_DATE_RE),
        ("explicit-time", "clock-time", TIME_RE),
    )
    for kind, rule, regex in deterministic:
        for match in regex.finditer(text):
            _signal(
                db, export_id, conversation_id, node_id,
                kind, match.group(0), match.start(), match.end(),
                rule, "deterministic-extraction",
            )
    for rule, regex in HEURISTIC_RULES:
        for match in regex.finditer(text):
            _signal(
                db, export_id, conversation_id, node_id,
                rule, match.group(0), match.start(), match.end(),
                rule, "heuristic-review",
            )
    folded = text.casefold()
    for label, term in terms:
        needle, start = term.casefold(), 0
        while needle:
            at = folded.find(needle, start)
            if at < 0:
                break
            _signal(
                db, export_id, conversation_id, node_id,
                "custom-term", text[at:at + len(term)],
                at, at + len(term), f"custom:{label}",
                "deterministic-extraction",
            )
            start = at + max(1, len(term))


def _warn(
    db,
    export_id,
    conversation_id,
    node_id,
    code,
    detail,
    member,
    index,
):
    db.execute(
        "INSERT INTO warnings("
        "export_id,conversation_id,node_id,warning_code,detail,"
        "source_member,source_index"
        ") VALUES(?,?,?,?,?,?,?)",
        (
            export_id, conversation_id, node_id, code,
            detail, member, index,
        ),
    )


def _normalize(
    db: sqlite3.Connection,
    export_id: int,
    conv: dict,
    token_sha: str,
    member: str,
    index: int,
    terms: list[tuple[str, str]],
) -> Counter:
    counts = Counter()
    raw_id = conv.get("id") or conv.get("conversation_id")
    cid = str(raw_id or f"missing-id:{token_sha[:24]}")
    title = str(conv.get("title") or "")
    mapping = (
        conv.get("mapping")
        if isinstance(conv.get("mapping"), dict)
        else {}
    )
    if not mapping:
        counts["missing_mapping"] += 1

    db.execute(
        "INSERT INTO conversation_appearances VALUES(?,?,?,?,?)",
        (export_id, member, index, cid, token_sha),
    )
    old = db.execute(
        "SELECT object_token_sha256 FROM conversations "
        "WHERE export_id=? AND conversation_id=?",
        (export_id, cid),
    ).fetchone()
    if old:
        counts["duplicate_conversation_appearance"] += 1
        if old[0] != token_sha:
            _warn(
                db, export_id, cid, None,
                "duplicate-conversation-id-different-content",
                "same conversation ID appeared with different "
                "object token hashes",
                member, index,
            )
        return counts

    db.execute(
        "INSERT INTO conversations VALUES(?,?,?,?,?,?,?,?,?,?)",
        (
            export_id, cid, title, conv.get("create_time"),
            conv.get("update_time"), conv.get("current_node"),
            member, index, token_sha, len(mapping),
        ),
    )
    counts["conversations"] += 1

    parents, children_map = {}, {}
    for raw_node_id, raw_node in mapping.items():
        node_id = str(raw_node_id)
        node = raw_node if isinstance(raw_node, dict) else {}
        parent = (
            str(node["parent"])
            if node.get("parent") is not None
            else None
        )
        children = [
            str(x)
            for x in (node.get("children") or [])
            if x is not None
        ]
        parents[node_id], children_map[node_id] = parent, children
        message = (
            node.get("message")
            if isinstance(node.get("message"), dict)
            else None
        )
        db.execute(
            "INSERT INTO nodes VALUES(?,?,?,?,?,?)",
            (
                export_id, cid, node_id, parent,
                json.dumps(children, ensure_ascii=False),
                1 if message else 0,
            ),
        )
        counts["nodes"] += 1
        if parent:
            db.execute(
                "INSERT OR IGNORE INTO edges VALUES(?,?,?,?,?)",
                (export_id, cid, parent, node_id, "parent-field"),
            )
        for child in children:
            db.execute(
                "INSERT OR IGNORE INTO edges VALUES(?,?,?,?,?)",
                (export_id, cid, node_id, child, "children-field"),
            )
        if not message:
            continue

        author = (
            message.get("author")
            if isinstance(message.get("author"), dict)
            else {}
        )
        content = (
            message.get("content")
            if isinstance(message.get("content"), dict)
            else {}
        )
        metadata = (
            message.get("metadata")
            if isinstance(message.get("metadata"), dict)
            else {}
        )
        text = extract_text(content)
        db.execute(
            "INSERT INTO messages VALUES("
            "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?"
            ")",
            (
                export_id, cid, node_id,
                str(author.get("role") or ""),
                str(author.get("name") or ""),
                message.get("create_time"),
                message.get("update_time"),
                str(message.get("status") or ""),
                None
                if message.get("end_turn") is None
                else int(bool(message.get("end_turn"))),
                message.get("weight"),
                message.get("recipient"),
                str(metadata.get("model_slug"))
                if metadata.get("model_slug") is not None
                else None,
                str(content.get("content_type") or ""),
                text,
                canonical_sha256(content),
                canonical_sha256(metadata),
                canonical_sha256(message),
                member,
                index,
            ),
        )
        counts["messages"] += 1
        if text:
            if fts_enabled(db):
                db.execute(
                    "INSERT INTO message_fts VALUES(?,?,?,?,?)",
                    (str(export_id), cid, node_id, title, text),
                )
            _tag(
                db, export_id, cid, node_id, text, terms
            )

        for kind, key, value in walk_references(
            {"content": content, "metadata": metadata}
        ):
            db.execute(
                "INSERT OR IGNORE INTO references_found "
                "VALUES(?,?,?,?,?,?)",
                (export_id, cid, node_id, kind, key, value),
            )
        for url in URL_RE.findall(text):
            db.execute(
                "INSERT OR IGNORE INTO references_found "
                "VALUES(?,?,?,?,?,?)",
                (
                    export_id, cid, node_id,
                    "text-url", "text", url,
                ),
            )

    current = conv.get("current_node")
    if current and str(current) not in parents:
        _warn(
            db, export_id, cid, str(current),
            "current-node-missing",
            "conversation current_node is not present in mapping",
            member, index,
        )
        counts["warnings"] += 1

    for child, parent in parents.items():
        if parent and parent not in children_map:
            _warn(
                db, export_id, cid, child, "orphan-parent",
                f"parent {parent!r} is not present in mapping",
                member, index,
            )
            counts["warnings"] += 1
        elif parent and child not in children_map[parent]:
            _warn(
                db, export_id, cid, child,
                "parent-child-disagreement",
                f"node names parent {parent!r}, but parent "
                "children list does not name node",
                member, index,
            )
            counts["warnings"] += 1

    for parent, children in children_map.items():
        if len(children) > 1:
            counts["branch_points"] += 1
        for child in children:
            if child not in parents:
                _warn(
                    db, export_id, cid, parent,
                    "orphan-child",
                    f"children list names absent node {child!r}",
                    member, index,
                )
                counts["warnings"] += 1
            elif parents[child] != parent:
                _warn(
                    db, export_id, cid, child,
                    "children-parent-disagreement",
                    f"child parent is {parents[child]!r}, "
                    f"not {parent!r}",
                    member, index,
                )
                counts["warnings"] += 1
    return counts


def ingest_export(
    db: sqlite3.Connection,
    store: Path,
    export_zip: Path,
    *,
    copy_source: bool = False,
    hash_members: bool = False,
    terms_path: Path | None = None,
) -> dict:
    export_zip = export_zip.expanduser().resolve()
    if not export_zip.is_file():
        raise FileNotFoundError(export_zip)
    if not zipfile.is_zipfile(export_zip):
        raise ValueError(f"not a ZIP archive: {export_zip}")

    source_sha = hash_file(export_zip)
    source_size = export_zip.stat().st_size
    old = db.execute(
        "SELECT id FROM exports WHERE sha256=?",
        (source_sha,),
    ).fetchone()
    if old:
        return {
            "status": "already_imported",
            "export_id": old[0],
            "sha256": source_sha,
        }

    copied_path = None
    if copy_source:
        originals = store / "originals"
        originals.mkdir(exist_ok=True)
        target = (
            originals
            / f"chatgpt-export-{source_sha[:16]}.zip"
        )
        if not target.exists():
            shutil.copy2(export_zip, target)
        copied_path = str(target)

    terms = _load_terms(terms_path)
    with zipfile.ZipFile(export_zip) as archive:
        infos = archive.infolist()
        convo_infos = [
            x
            for x in infos
            if _conversation_member(x.filename)
        ]
        if not convo_infos:
            raise ValueError(
                "no conversations*.json member found in export ZIP"
            )
        cur = db.execute(
            "INSERT INTO exports("
            "sha256,source_path,size_bytes,imported_at,copied_path,"
            "member_count,conversation_members"
            ") VALUES(?,?,?,?,?,?,?)",
            (
                source_sha, str(export_zip), source_size,
                utc_now(), copied_path,
                len(infos), len(convo_infos),
            ),
        )
        export_id = int(cur.lastrowid)
        for info in infos:
            db.execute(
                "INSERT INTO archive_members "
                "VALUES(?,?,?,?,?,?,NULL)",
                (
                    export_id, info.filename, info.file_size,
                    info.compress_size, f"{info.CRC:08x}",
                    _member_kind(info.filename),
                ),
            )
        db.commit()

        totals = Counter(
            archive_members=len(infos),
            conversation_members=len(convo_infos),
        )
        for info in convo_infos:
            member_hash = hashlib.sha256()
            with archive.open(info) as raw:

                class DigestReader:
                    def read(self, size=-1):
                        data = raw.read(size)
                        if data:
                            member_hash.update(data)
                        return data

                for index, value, token in iter_json_values(
                    DigestReader()
                ):
                    if not isinstance(value, dict):
                        _warn(
                            db, export_id, None, None,
                            "non-object-conversation-entry",
                            f"top-level entry {index} is "
                            f"{type(value).__name__}",
                            info.filename, index,
                        )
                        totals["warnings"] += 1
                        continue
                    token_sha = hashlib.sha256(
                        token.encode("utf-8")
                    ).hexdigest()
                    totals.update(
                        _normalize(
                            db, export_id, value, token_sha,
                            info.filename, index, terms,
                        )
                    )
                    db.commit()
            db.execute(
                "UPDATE archive_members SET sha256=? "
                "WHERE export_id=? AND name=?",
                (
                    member_hash.hexdigest(),
                    export_id,
                    info.filename,
                ),
            )
            db.commit()

        if hash_members:
            for info in infos:
                current = db.execute(
                    "SELECT sha256 FROM archive_members "
                    "WHERE export_id=? AND name=?",
                    (export_id, info.filename),
                ).fetchone()[0]
                if current:
                    continue
                digest = hashlib.sha256()
                with archive.open(info) as stream:
                    for block in iter(
                        lambda: stream.read(1024 * 1024),
                        b"",
                    ):
                        digest.update(block)
                db.execute(
                    "UPDATE archive_members SET sha256=? "
                    "WHERE export_id=? AND name=?",
                    (
                        digest.hexdigest(),
                        export_id,
                        info.filename,
                    ),
                )
            db.commit()

    receipt = {
        "schema": "black-star-chat-archive-export-receipt-v1",
        "export_id": export_id,
        "source_kind": "chatgpt-export-zip",
        "source_path": str(export_zip),
        "source_size_bytes": source_size,
        "source_sha256": source_sha,
        "copied_path": copied_path,
        "imported_at": db.execute(
            "SELECT imported_at FROM exports WHERE id=?",
            (export_id,),
        ).fetchone()[0],
        "member_count": totals["archive_members"],
        "conversation_members": totals["conversation_members"],
        "counts": dict(totals),
        "laws": [
            "EXPORT != RAW PLATFORM STATE",
            "NORMALIZED MESSAGE != EXPORT TOKEN",
            "TAG != EVENT",
            "HEURISTIC TAG != FACT",
            "MESSAGE NODE != DISPLAY POSITION",
            "BRANCH SIBLING != SUBSEQUENT MESSAGE",
            "EXPORT ORDER != CONVERSATION ORDER",
            "DERIVED VIEW != INDEPENDENT WITNESS",
        ],
    }
    receipt_path = (
        store
        / "receipts"
        / f"export-{source_sha[:16]}.json"
    )
    receipt_path.write_text(
        json.dumps(
            receipt,
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return {
        "status": "imported",
        "receipt": str(receipt_path),
        **receipt,
    }


def verify_source(
    db: sqlite3.Connection,
    export_id: int | None = None,
) -> dict:
    if export_id is None:
        row = db.execute(
            "SELECT id FROM exports ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if not row:
            raise ValueError(
                "chat archive store contains no ingested exports"
            )
        export_id = int(row[0])

    row = db.execute(
        "SELECT source_path,size_bytes,sha256,copied_path "
        "FROM exports WHERE id=?",
        (export_id,),
    ).fetchone()
    if not row:
        raise ValueError(f"unknown export id: {export_id}")

    paths = [Path(row["source_path"])]
    if row["copied_path"]:
        paths.insert(0, Path(row["copied_path"]))
    for path in paths:
        if path.is_file():
            actual = hash_file(path)
            size_ok = (
                path.stat().st_size == row["size_bytes"]
            )
            return {
                "ok": size_ok
                and actual == row["sha256"],
                "path": str(path),
                "size_ok": size_ok,
                "sha256_expected": row["sha256"],
                "sha256_actual": actual,
            }
    return {
        "ok": False,
        "error": (
            "no registered source or copied source path "
            "is currently readable"
        ),
    }
