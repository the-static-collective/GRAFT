from __future__ import annotations

import hashlib
import json
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS exports (
  id INTEGER PRIMARY KEY, sha256 TEXT NOT NULL UNIQUE, source_path TEXT NOT NULL,
  size_bytes INTEGER NOT NULL, imported_at TEXT NOT NULL, copied_path TEXT,
  member_count INTEGER NOT NULL, conversation_members INTEGER NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'chatgpt-export-zip'
);
CREATE TABLE IF NOT EXISTS archive_members (
  export_id INTEGER NOT NULL REFERENCES exports(id) ON DELETE CASCADE,
  name TEXT NOT NULL, file_size INTEGER NOT NULL, compress_size INTEGER NOT NULL,
  crc32 TEXT NOT NULL, member_kind TEXT NOT NULL, sha256 TEXT,
  PRIMARY KEY(export_id,name)
);
CREATE TABLE IF NOT EXISTS conversations (
  export_id INTEGER NOT NULL REFERENCES exports(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL, title TEXT NOT NULL, create_time REAL,
  update_time REAL, current_node TEXT, source_member TEXT NOT NULL,
  source_index INTEGER NOT NULL, object_token_sha256 TEXT NOT NULL,
  mapping_count INTEGER NOT NULL, PRIMARY KEY(export_id,conversation_id)
);
CREATE INDEX IF NOT EXISTS conversations_time ON conversations(export_id,create_time,update_time);
CREATE TABLE IF NOT EXISTS conversation_appearances (
  export_id INTEGER NOT NULL REFERENCES exports(id) ON DELETE CASCADE,
  source_member TEXT NOT NULL, source_index INTEGER NOT NULL,
  conversation_id TEXT NOT NULL, object_token_sha256 TEXT NOT NULL,
  PRIMARY KEY(export_id,source_member,source_index)
);
CREATE TABLE IF NOT EXISTS nodes (
  export_id INTEGER NOT NULL, conversation_id TEXT NOT NULL, node_id TEXT NOT NULL,
  parent_id TEXT, children_json TEXT NOT NULL, has_message INTEGER NOT NULL,
  PRIMARY KEY(export_id,conversation_id,node_id),
  FOREIGN KEY(export_id,conversation_id) REFERENCES conversations(export_id,conversation_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS nodes_parent ON nodes(export_id,conversation_id,parent_id);
CREATE TABLE IF NOT EXISTS edges (
  export_id INTEGER NOT NULL, conversation_id TEXT NOT NULL,
  parent_node_id TEXT NOT NULL, child_node_id TEXT NOT NULL, edge_source TEXT NOT NULL,
  PRIMARY KEY(export_id,conversation_id,parent_node_id,child_node_id,edge_source)
);
CREATE TABLE IF NOT EXISTS messages (
  export_id INTEGER NOT NULL, conversation_id TEXT NOT NULL, node_id TEXT NOT NULL,
  author_role TEXT NOT NULL, author_name TEXT NOT NULL, create_time REAL,
  update_time REAL, status TEXT NOT NULL, end_turn INTEGER, weight REAL,
  recipient TEXT, model_slug TEXT, content_type TEXT NOT NULL, text TEXT NOT NULL,
  content_sha256 TEXT NOT NULL, metadata_sha256 TEXT NOT NULL,
  raw_message_sha256 TEXT NOT NULL, source_member TEXT NOT NULL,
  source_index INTEGER NOT NULL, PRIMARY KEY(export_id,conversation_id,node_id),
  FOREIGN KEY(export_id,conversation_id,node_id) REFERENCES nodes(export_id,conversation_id,node_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS messages_time ON messages(export_id,create_time);
CREATE INDEX IF NOT EXISTS messages_role_time ON messages(export_id,author_role,create_time);
CREATE TABLE IF NOT EXISTS references_found (
  export_id INTEGER NOT NULL, conversation_id TEXT NOT NULL, node_id TEXT NOT NULL,
  reference_kind TEXT NOT NULL, reference_key TEXT NOT NULL, value TEXT NOT NULL,
  PRIMARY KEY(export_id,conversation_id,node_id,reference_kind,reference_key,value)
);
CREATE TABLE IF NOT EXISTS signals (
  export_id INTEGER NOT NULL, conversation_id TEXT NOT NULL, node_id TEXT NOT NULL,
  signal_kind TEXT NOT NULL, value TEXT NOT NULL, start_offset INTEGER,
  end_offset INTEGER, rule_id TEXT NOT NULL, authority TEXT NOT NULL,
  PRIMARY KEY(export_id,conversation_id,node_id,signal_kind,value,start_offset,end_offset,rule_id)
);
CREATE INDEX IF NOT EXISTS signals_kind ON signals(export_id,signal_kind,value);
CREATE TABLE IF NOT EXISTS warnings (
  export_id INTEGER NOT NULL, conversation_id TEXT, node_id TEXT,
  warning_code TEXT NOT NULL, detail TEXT NOT NULL, source_member TEXT,
  source_index INTEGER
);
"""

URL_RE = re.compile(r"https?://[^\s<>\]\)\}\"']+", re.I)
EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)
ISO_DATE_RE = re.compile(r"\b(?:19|20)\d{2}-\d{2}-\d{2}\b")
US_DATE_RE = re.compile(r"\b(?:0?[1-9]|1[0-2])/(?:0?[1-9]|[12]\d|3[01])/(?:\d{2}|\d{4})\b")
TIME_RE = re.compile(r"\b(?:[01]?\d|2[0-3]):[0-5]\d(?:\s?[ap]m)?\b", re.I)
MONTH_DATE_RE = re.compile(
    r"\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|"
    r"Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+"
    r"\d{1,2}(?:,\s*(?:19|20)\d{2})?\b", re.I,
)

HEURISTIC_RULES = (
    ("creative-form-candidate", re.compile(r"\b(?:lyrics?|song(?:writing)?|chorus|verse|bridge|poem|poetry|suno|album|track|hook|rhyme)\b|\[(?:verse|chorus|bridge)[^\]]*\]", re.I)),
    ("correction-language-candidate", re.compile(r"\b(?:correction|actually|I was wrong|I misremembered|not sure|I think|I believe|maybe|probably|might have|could have)\b", re.I)),
    ("quoted-speech-candidate", re.compile(r"\b(?:he|she|they|you|I)\s+(?:said|says|told|asked|yelled|wrote)\b", re.I)),
    ("legal-language-candidate", re.compile(r"\b(?:court|police|prosecutor|attorney|lawyer|hearing|custody|restraining order|protective order|DANCO|Rule 20|evidence|witness)\b", re.I)),
    ("medical-language-candidate", re.compile(r"\b(?:hospital|doctor|medical|medication|diagnos\w*|injur\w*|clinic|urgent care|emergency room|ER)\b", re.I)),
    ("relationship-language-candidate", re.compile(r"\b(?:relationship|marriage|partner|boyfriend|girlfriend|wife|husband|breakup|separation|reconcile|save (?:my|our) family)\b", re.I)),
    ("incident-language-candidate", re.compile(r"\b(?:hit|hits|hitting|punch(?:ed|es|ing)?|kick(?:ed|s|ing)?|drag(?:ged|s|ging)?|threat(?:en|ened|ening|s)?|broke|broken|called the police|police came)\b", re.I)),
    ("ordinary-routine-candidate", re.compile(r"\b(?:laundry|dishes|clean(?:ed|ing)?|fridge|refrigerator|groceries|dog nails|work shift|formula|breakfast|lunch|dinner|chores?)\b", re.I)),
)

REFERENCE_KEYS = {"asset_pointer", "file_id", "upload_id", "sandbox_path", "image_url", "url", "download_url", "name", "mime_type"}


def connect(store: Path) -> sqlite3.Connection:
    store.mkdir(parents=True, exist_ok=True)
    (store / "receipts").mkdir(exist_ok=True)
    (store / "bomb-runs").mkdir(exist_ok=True)
    db = sqlite3.connect(store / "chat-archive.sqlite3")
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA synchronous=NORMAL")
    db.executescript(SCHEMA)
    try:
        db.execute("CREATE VIRTUAL TABLE IF NOT EXISTS message_fts USING fts5(export_id UNINDEXED,conversation_id UNINDEXED,node_id UNINDEXED,title,text,tokenize='unicode61')")
        db.execute("INSERT OR REPLACE INTO meta(key,value) VALUES('fts5','1')")
    except sqlite3.OperationalError:
        db.execute("INSERT OR REPLACE INTO meta(key,value) VALUES('fts5','0')")
    db.commit()
    return db


def fts_enabled(db: sqlite3.Connection) -> bool:
    row = db.execute("SELECT value FROM meta WHERE key='fts5'").fetchone()
    return bool(row and row[0] == "1")


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def canonical_json(value) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def canonical_sha256(value) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()
