from __future__ import annotations

import csv
import hashlib
import html
import json
import shutil
import sqlite3
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

SCHEMA = """
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, sha256 TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL, declared_count INTEGER, imported_count INTEGER NOT NULL,
  first_ms INTEGER, last_ms INTEGER, imported_at TEXT NOT NULL,
  backup_date TEXT, backup_set TEXT, vault_path TEXT NOT NULL, warnings TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  key TEXT PRIMARY KEY, occurred_ms INTEGER NOT NULL, kind TEXT NOT NULL,
  direction TEXT NOT NULL, number_key TEXT NOT NULL, contact_name TEXT NOT NULL,
  body TEXT NOT NULL, duration_s INTEGER, media_description TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_time ON events(occurred_ms);
CREATE INDEX IF NOT EXISTS events_number ON events(number_key, occurred_ms);
CREATE TABLE IF NOT EXISTS appearances (
  source_id INTEGER NOT NULL REFERENCES sources(id), record_index INTEGER NOT NULL,
  event_key TEXT NOT NULL REFERENCES events(key),
  PRIMARY KEY(source_id, record_index)
);
CREATE TABLE IF NOT EXISTS number_labels (
  number_key TEXT NOT NULL, label TEXT NOT NULL, source_id INTEGER NOT NULL REFERENCES sources(id),
  PRIMARY KEY(number_key, label, source_id)
);
CREATE TABLE IF NOT EXISTS notes (
  event_key TEXT NOT NULL REFERENCES events(key), created_at TEXT NOT NULL,
  text TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'later recollection',
  PRIMARY KEY(event_key, created_at, text)
);
"""

CALL_DIRECTIONS = {
    "1": "incoming answered", "2": "outgoing", "3": "missed", "4": "voicemail",
    "5": "rejected", "6": "blocked", "7": "answered elsewhere",
}
MESSAGE_DIRECTIONS = {
    "1": "received", "2": "sent", "3": "draft", "4": "outbox",
    "5": "failed", "6": "queued",
}


def hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def number_key(value: str | None) -> str:
    raw = (value or "").strip()
    digits = "".join(c for c in raw if c.isdigit())
    if len(digits) == 11 and digits.startswith("1"):
        return "+" + digits
    if len(digits) == 10:
        return "+1" + digits
    return "+" + digits if digits else "(unavailable)"


def epoch_ms(value, kind: str, warnings: Counter) -> int | None:
    try:
        val = int(value)
    except (TypeError, ValueError):
        warnings["invalid_date"] += 1
        return None
    if kind == "mms" and 1_000_000_000 <= val < 100_000_000_000:
        warnings["mms_seconds_converted"] += 1
        val *= 1000
    if not 946684800000 <= val < 4102444800000:
        warnings["out_of_range_date"] += 1
        return None
    return val


def parse_event(element, warnings: Counter):
    tag = element.tag.rsplit("}", 1)[-1]
    attrs = element.attrib
    media_fingerprint = None

    if tag == "call":
        kind = "call"
        direction = CALL_DIRECTIONS.get(
            attrs.get("type"), "type " + attrs.get("type", "?")
        )
        raw_number = attrs.get("number", "")
        body = ""
        try:
            duration = int(attrs.get("duration", "0"))
        except ValueError:
            duration = None
            warnings["invalid_duration"] += 1
        media = ""
    elif tag == "sms":
        kind = "sms"
        direction = MESSAGE_DIRECTIONS.get(
            attrs.get("type"), "type " + attrs.get("type", "?")
        )
        raw_number = attrs.get("address", "")
        body = attrs.get("body", "")
        duration = None
        media = ""
    elif tag == "mms":
        kind = "mms"
        direction = MESSAGE_DIRECTIONS.get(
            attrs.get("msg_box"), "type " + attrs.get("msg_box", "?")
        )
        raw_number = attrs.get("address", "")
        parts = [
            part for part in element.iter()
            if part.tag.rsplit("}", 1)[-1] == "part"
        ]
        text_parts = [
            part.get("text", "")
            for part in parts
            if part.get("ct", "").startswith("text/") and part.get("text")
        ]
        media_parts = [
            part for part in parts
            if part.get("data")
            or (part.get("ct") and not part.get("ct", "").startswith("text/"))
        ]
        body = "\n".join(text_parts)
        if attrs.get("sub") and attrs.get("sub") != "null":
            body = "Subject: " + attrs["sub"] + ("\n" + body if body else "")
        duration = None
        media = (
            f"{len(media_parts)} non-text part(s) in the original XML"
            if media_parts else ""
        )
        media_fingerprint = [
            (
                part.get("ct", ""),
                part.get("cl", ""),
                hashlib.sha256(
                    part.get("data", "").encode("utf-8")
                ).hexdigest(),
            )
            for part in media_parts
        ]
        if not raw_number:
            addresses = [
                item.get("address", "")
                for item in element.iter()
                if item.tag.rsplit("}", 1)[-1] == "addr"
            ]
            raw_number = ", ".join(
                item for item in addresses
                if item and item != "insert-address-token"
            )
    else:
        return None

    occurred = epoch_ms(attrs.get("date"), kind, warnings)
    if occurred is None:
        return None

    identity = (
        number_key(raw_number)
        if "," not in raw_number
        else raw_number
    )
    name = attrs.get("contact_name", "") or "(unlabeled)"
    if len(body) > 200000:
        warnings["very_long_body"] += 1

    fingerprint = json.dumps(
        [occurred, kind, direction, identity, body, duration, media, media_fingerprint],
        ensure_ascii=False,
        separators=(",", ":"),
    )
    key = hashlib.sha256(fingerprint.encode("utf-8")).hexdigest()
    return (key, occurred, kind, direction, identity, name, body, duration, media)


def connect(store: Path) -> sqlite3.Connection:
    store.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(store / "witness.sqlite3")
    db.execute("PRAGMA foreign_keys=ON")
    db.executescript(SCHEMA)
    return db


def ingest_one(
    db: sqlite3.Connection,
    store: Path,
    input_file: Path,
) -> dict:
    path = input_file.resolve()
    digest = hash_file(path)
    previous = db.execute(
        "SELECT id,imported_count FROM sources WHERE sha256=?",
        (digest,),
    ).fetchone()
    if previous:
        return {
            "status": "already_imported",
            "file": path.name,
            "records": previous[1],
            "sha256": digest,
        }

    parser = ET.iterparse(path, events=("start", "end"))
    event, root = next(parser)
    if event != "start" or root.tag not in {"calls", "smses"}:
        raise ValueError(
            f"Unexpected backup root {root.tag!r}: expected calls or smses"
        )

    vault = store / "originals"
    vault.mkdir(exist_ok=True)
    target = vault / (digest[:16] + "-" + path.name)
    if not target.exists():
        shutil.copyfile(path, target)
    if hash_file(target) != digest:
        raise ValueError("Original-copy hash check failed")

    declared = root.get("count")
    now = datetime.now(timezone.utc).isoformat()
    warnings = Counter()
    first = last = None
    read_count = 0
    fingerprint_counts = Counter()

    try:
        with db:
            source_id = db.execute(
                "INSERT INTO sources(name,sha256,kind,declared_count,imported_count,"
                "first_ms,last_ms,imported_at,backup_date,backup_set,vault_path,warnings) "
                "VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
                (
                    path.name,
                    digest,
                    root.tag,
                    int(declared) if declared and declared.isdigit() else None,
                    0,
                    None,
                    None,
                    now,
                    root.get("backup_date"),
                    root.get("backup_set"),
                    str(target.relative_to(store)),
                    "{}",
                ),
            ).lastrowid
            depth = 1
            for event_type, element in parser:
                if event_type == "start":
                    depth += 1
                    continue
                if (
                    depth == 2
                    and element.tag.rsplit("}", 1)[-1] in {"call", "sms", "mms"}
                ):
                    read_count += 1
                    row = parse_event(element, warnings)
                    if row is not None:
                        ordinal = fingerprint_counts[row[0]]
                        fingerprint_counts[row[0]] += 1
                        if ordinal:
                            warnings["identical_rows_within_source_retained"] += 1
                            row = (
                                hashlib.sha256(
                                    f"{row[0]}|repeat:{ordinal}".encode()
                                ).hexdigest(),
                                *row[1:],
                            )
                        db.execute(
                            "INSERT OR IGNORE INTO events VALUES(?,?,?,?,?,?,?,?,?)",
                            row,
                        )
                        db.execute(
                            "INSERT INTO appearances VALUES(?,?,?)",
                            (source_id, read_count, row[0]),
                        )
                        db.execute(
                            "INSERT OR IGNORE INTO number_labels VALUES(?,?,?)",
                            (row[4], row[5], source_id),
                        )
                        first = row[1] if first is None else min(first, row[1])
                        last = row[1] if last is None else max(last, row[1])
                    element.clear()
                    root.clear()
                depth -= 1

            if declared and declared.isdigit() and int(declared) != read_count:
                warnings["declared_count_mismatch"] += 1
            db.execute(
                "UPDATE sources SET imported_count=?,first_ms=?,last_ms=?,warnings=? "
                "WHERE id=?",
                (
                    read_count,
                    first,
                    last,
                    json.dumps(warnings, sort_keys=True),
                    source_id,
                ),
            )
    except Exception:
        if not db.execute(
            "SELECT 1 FROM sources WHERE sha256=?",
            (digest,),
        ).fetchone():
            target.unlink(missing_ok=True)
        raise

    return {
        "status": "imported",
        "file": path.name,
        "records": read_count,
        "sha256": digest,
        "warnings": dict(warnings),
    }


def source_register(db: sqlite3.Connection, store: Path) -> list[dict]:
    sources = []
    rows = db.execute(
        "SELECT name,sha256,kind,declared_count,imported_count,first_ms,last_ms,"
        "imported_at,vault_path,warnings FROM sources ORDER BY id"
    )
    for row in rows:
        (
            name, digest, kind, declared, count, first, last,
            imported, vault, warnings,
        ) = row
        sources.append(
            {
                "name": name,
                "sha256": digest,
                "kind": kind,
                "declared_count": declared,
                "imported_count": count,
                "first_ms": first,
                "last_ms": last,
                "imported_at": imported,
                "original_copy": vault,
                "warnings": json.loads(warnings),
            }
        )
    (store / "source-register.json").write_text(
        json.dumps(sources, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return sources


def import_notes(db: sqlite3.Connection, filename: Path) -> int:
    data = json.loads(filename.read_text(encoding="utf-8"))
    entries = data.get("notes", []) if isinstance(data, dict) else data
    if not isinstance(entries, list):
        raise ValueError("Annotation export must contain a notes list")

    imported = 0
    with db:
        for entry in entries:
            if (
                not isinstance(entry, dict)
                or not all(
                    isinstance(entry.get(key), str)
                    for key in ("event_id", "created_at", "text")
                )
            ):
                raise ValueError("Invalid annotation entry")
            if not db.execute(
                "SELECT 1 FROM events WHERE key=?",
                (entry["event_id"],),
            ).fetchone():
                raise ValueError(
                    "Annotation refers to an event missing from this timeline: "
                    + entry["event_id"][:12]
                )
            result = db.execute(
                "INSERT OR IGNORE INTO notes(event_key,created_at,text,category) "
                "VALUES(?,?,?,?)",
                (
                    entry["event_id"],
                    entry["created_at"],
                    entry["text"],
                    "later recollection",
                ),
            )
            imported += result.rowcount
    return imported


def render(
    db: sqlite3.Connection,
    store: Path,
    timezone_name: str,
) -> dict:
    tz = ZoneInfo(timezone_name)
    sources = source_register(db, store)
    identity_rules = []
    identity_file = store / "identity-map.json"
    if identity_file.exists():
        mapping = json.loads(identity_file.read_text(encoding="utf-8"))
        identity_rules = mapping.get("rules", [])
        invalid = any(
            not isinstance(rule, dict)
            or not rule.get("person")
            or not (rule.get("match_label") or rule.get("match_number"))
            for rule in identity_rules
        )
        if not isinstance(identity_rules, list) or invalid:
            raise ValueError(
                "identity-map.json must contain rules with person and "
                "match_label or match_number"
            )

    numbers = [
        row[0]
        for row in db.execute(
            "SELECT DISTINCT number_key FROM events ORDER BY number_key"
        )
    ]
    pseudonym = {number: f"N{i:03}" for i, number in enumerate(numbers, 1)}

    def identity(name, number):
        for rule in identity_rules:
            if (
                rule.get("match_label") == name
                or rule.get("match_number") == number
            ):
                return {
                    "person": rule["person"],
                    "basis": rule.get("basis", "later identification"),
                }
        return None

    notes: dict[str, list[dict]] = {}
    for key, created, body, category in db.execute(
        "SELECT event_key,created_at,text,category FROM notes ORDER BY created_at"
    ):
        notes.setdefault(key, []).append(
            {"created_at": created, "text": body, "category": category}
        )

    events = []
    query = """
      SELECT e.key,e.occurred_ms,e.kind,e.direction,e.number_key,e.contact_name,
        e.body,e.duration_s,e.media_description,
        group_concat(DISTINCT s.name || ' [' || substr(s.sha256,1,8) || ']')
      FROM events e
      LEFT JOIN appearances a ON a.event_key=e.key
      LEFT JOIN sources s ON s.id=a.source_id
      GROUP BY e.key
      ORDER BY e.occurred_ms DESC,e.key
    """
    for (
        key, occurred, kind, direction, number, name,
        body, duration, media, source_names,
    ) in db.execute(query):
        dt = datetime.fromtimestamp(occurred / 1000, tz)
        events.append(
            {
                "id": key,
                "time": dt.isoformat(timespec="seconds"),
                "day": dt.date().isoformat(),
                "kind": kind,
                "direction": direction,
                "number": pseudonym[number],
                "contact": name,
                "identity": identity(name, number),
                "body": body,
                "duration": duration,
                "media": media,
                "source": source_names or "",
                "notes": notes.get(key, []),
            }
        )

    months = Counter(event["day"][:7] for event in events)
    coverage = []
    if months:
        year, month = map(int, min(months).split("-"))
        last_year, last_month = map(int, max(months).split("-"))
        while (year, month) <= (last_year, last_month):
            label = f"{year:04}-{month:02}"
            coverage.append({"month": label, "count": months[label]})
            year, month = (
                (year + 1, 1)
                if month == 12
                else (year, month + 1)
            )

    with (store / "month-coverage.csv").open(
        "w",
        encoding="utf-8",
        newline="",
    ) as stream:
        writer = csv.writer(stream)
        writer.writerow(
            ["month", "records_in_imported_backups", "interpretation"]
        )
        for entry in coverage:
            writer.writerow(
                [
                    entry["month"],
                    entry["count"],
                    "Count within imported backups; gaps do not prove no communications",
                ]
            )

    labels = [
        {
            "number": pseudonym[number],
            "labels": sorted(
                {
                    row[0]
                    for row in db.execute(
                        "SELECT label FROM number_labels WHERE number_key=?",
                        (number,),
                    )
                }
            ),
        }
        for number in numbers
    ]

    payload = {
        "events": events,
        "sources": sources,
        "timezone": timezone_name,
        "labels": labels,
        "coverage": coverage,
    }
    json_text = (
        json.dumps(payload, ensure_ascii=False)
        .replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("&", "\\u0026")
    )
    rendered_events = []
    for event in events:
        identity_text = ""
        if event.get("identity"):
            identity_text = (
                f" · {event['identity']['person']} "
                f"({event['identity']['basis']})"
            )
        note_text = " | ".join(
            note["text"] for note in event.get("notes", [])
        )
        rendered_events.append(
            "<article><strong>"
            + html.escape(
                f"{event['time']} · {event['kind']} · {event['direction']}"
            )
            + "</strong><div>"
            + html.escape(
                f"{event['contact']} · {event['number']}{identity_text}"
            )
            + "</div><pre>"
            + html.escape(event.get("body") or "")
            + "</pre><small>"
            + html.escape(f"source: {event.get('source') or ''}")
            + "</small><div>"
            + html.escape(f"later notes: {note_text}")
            + "</div></article>"
        )

    page = (
        "<!doctype html><meta charset='utf-8'>"
        "<title>Black Star Phone Witness</title>"
        "<h1>Phone Witness</h1>"
        "<p>Private local timeline. Source labels are backup labels; "
        "numbers are pseudonymized. Later notes remain separate.</p>"
        + "".join(rendered_events)
    )
    timeline = store / "witness-timeline.html"
    timeline.write_text(page, encoding="utf-8")
    return {
        "events": len(events),
        "sources": len(sources),
        "timeline": str(timeline),
    }


def summary(db: sqlite3.Connection) -> dict:
    return {
        "sources": db.execute("SELECT count(*) FROM sources").fetchone()[0],
        "events": db.execute("SELECT count(*) FROM events").fetchone()[0],
        "appearances": db.execute(
            "SELECT count(*) FROM appearances"
        ).fetchone()[0],
        "notes": db.execute("SELECT count(*) FROM notes").fetchone()[0],
    }
