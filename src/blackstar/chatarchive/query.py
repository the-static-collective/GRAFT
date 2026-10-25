from __future__ import annotations

import sqlite3
from datetime import date, datetime, time, timezone
from zoneinfo import ZoneInfo

from .schema import fts_enabled


def latest_export_id(db: sqlite3.Connection) -> int:
    row = db.execute(
        "SELECT id FROM exports ORDER BY id DESC LIMIT 1"
    ).fetchone()
    if not row:
        raise ValueError(
            "chat archive store contains no ingested exports"
        )
    return int(row[0])


def iso_utc(epoch_s: float | None) -> str | None:
    if epoch_s is None:
        return None
    return (
        datetime.fromtimestamp(
            float(epoch_s),
            timezone.utc,
        )
        .isoformat()
        .replace("+00:00", "Z")
    )


def epoch_bounds(
    from_date: str | None,
    to_date: str | None,
    timezone_name: str,
):
    tz = ZoneInfo(timezone_name)
    start = (
        datetime.combine(
            date.fromisoformat(from_date),
            time.min,
            tzinfo=tz,
        ).timestamp()
        if from_date
        else None
    )
    end = (
        datetime.combine(
            date.fromisoformat(to_date),
            time.max,
            tzinfo=tz,
        ).timestamp()
        if to_date
        else None
    )
    return start, end


def status(
    db: sqlite3.Connection,
    export_id: int | None = None,
) -> dict:
    export_id = export_id or latest_export_id(db)
    export = db.execute(
        "SELECT * FROM exports WHERE id=?",
        (export_id,),
    ).fetchone()
    if not export:
        raise ValueError(f"unknown export id: {export_id}")

    def one(sql):
        return db.execute(
            sql,
            (export_id,),
        ).fetchone()[0]

    counts = {
        "conversations": one(
            "SELECT count(*) FROM conversations "
            "WHERE export_id=?"
        ),
        "nodes": one(
            "SELECT count(*) FROM nodes WHERE export_id=?"
        ),
        "messages": one(
            "SELECT count(*) FROM messages WHERE export_id=?"
        ),
        "user_messages": one(
            "SELECT count(*) FROM messages "
            "WHERE export_id=? AND author_role='user'"
        ),
        "assistant_messages": one(
            "SELECT count(*) FROM messages "
            "WHERE export_id=? AND author_role='assistant'"
        ),
        "references": one(
            "SELECT count(*) FROM references_found "
            "WHERE export_id=?"
        ),
        "signals": one(
            "SELECT count(*) FROM signals WHERE export_id=?"
        ),
        "warnings": one(
            "SELECT count(*) FROM warnings WHERE export_id=?"
        ),
        "branch_points": one(
            "SELECT count(*) FROM ("
            "SELECT parent_node_id FROM edges "
            "WHERE export_id=? "
            "AND edge_source='children-field' "
            "GROUP BY conversation_id,parent_node_id "
            "HAVING count(*)>1"
            ")"
        ),
    }
    bounds = db.execute(
        "SELECT min(create_time),max(create_time) "
        "FROM messages "
        "WHERE export_id=? AND create_time IS NOT NULL",
        (export_id,),
    ).fetchone()
    return {
        "export": dict(export),
        "counts": counts,
        "message_time_bounds_utc": {
            "earliest": iso_utc(bounds[0]),
            "latest": iso_utc(bounds[1]),
        },
        "fts5": fts_enabled(db),
        "authority_boundary": (
            "source metadata/exact text are distinct "
            "from heuristic review tags"
        ),
    }


def message_payload(
    db,
    export_id,
    cid,
    node_id,
):
    row = db.execute(
        "SELECT m.*,c.title FROM messages m "
        "JOIN conversations c "
        "USING(export_id,conversation_id) "
        "WHERE m.export_id=? AND m.conversation_id=? "
        "AND m.node_id=?",
        (export_id, cid, node_id),
    ).fetchone()
    if not row:
        return None
    return {
        "export_id": export_id,
        "conversation_id": cid,
        "node_id": node_id,
        "title": row["title"],
        "role": row["author_role"],
        "author_name": row["author_name"],
        "create_time_utc": iso_utc(
            row["create_time"]
        ),
        "text": row["text"],
        "source_member": row["source_member"],
        "source_index": row["source_index"],
        "message_sha256": row[
            "raw_message_sha256"
        ],
    }


def lineage_context(
    db,
    export_id,
    cid,
    node_id,
    depth,
):
    if depth <= 0:
        return []
    out, seen, current = [], {node_id}, node_id

    for distance in range(1, depth + 1):
        row = db.execute(
            "SELECT parent_id FROM nodes "
            "WHERE export_id=? AND conversation_id=? "
            "AND node_id=?",
            (export_id, cid, current),
        ).fetchone()
        if (
            not row
            or not row[0]
            or row[0] in seen
        ):
            break
        parent = str(row[0])
        seen.add(parent)
        item = message_payload(
            db, export_id, cid, parent
        )
        if item:
            item.update(
                relation_to_hit="ancestor",
                distance=distance,
            )
            out.append(item)
        current = parent

    frontier = [(node_id, 0)]
    while frontier:
        parent, distance = frontier.pop(0)
        if distance >= depth:
            continue
        rows = db.execute(
            "SELECT child_node_id FROM edges "
            "WHERE export_id=? AND conversation_id=? "
            "AND parent_node_id=? "
            "AND edge_source='children-field' "
            "ORDER BY child_node_id",
            (export_id, cid, parent),
        ).fetchall()
        for row in rows:
            child = str(row[0])
            if child in seen:
                continue
            seen.add(child)
            item = message_payload(
                db, export_id, cid, child
            )
            if item:
                item.update(
                    relation_to_hit="descendant",
                    distance=distance + 1,
                )
                out.append(item)
            frontier.append(
                (child, distance + 1)
            )
    return out


def search_messages(
    db: sqlite3.Connection,
    query: str,
    *,
    export_id: int | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
    timezone_name: str = "UTC",
    role: str | None = None,
    context: int = 0,
    limit: int = 50,
) -> list[dict]:
    export_id = export_id or latest_export_id(db)
    start, end = epoch_bounds(
        from_date, to_date, timezone_name
    )
    time_sql, role_sql = "", ""
    params: list[object] = [export_id]

    if start is not None:
        time_sql += " AND m.create_time>=?"
        params.append(start)
    if end is not None:
        time_sql += " AND m.create_time<=?"
        params.append(end)
    if role:
        role_sql = " AND m.author_role=?"
        params.append(role)

    if query and fts_enabled(db):
        sql = (
            "SELECT m.conversation_id,m.node_id "
            "FROM message_fts f "
            "JOIN messages m "
            "ON m.export_id=CAST(f.export_id AS INTEGER) "
            "AND m.conversation_id=f.conversation_id "
            "AND m.node_id=f.node_id "
            "WHERE m.export_id=? "
            "AND message_fts MATCH ?"
            + time_sql
            + role_sql
            + " ORDER BY m.create_time LIMIT ?"
        )
        params.insert(
            1,
            '"' + query.replace('"', '""') + '"',
        )
    else:
        sql = (
            "SELECT m.conversation_id,m.node_id "
            "FROM messages m WHERE m.export_id=?"
        )
        if query:
            sql += (
                " AND instr(lower(m.text),lower(?))>0"
            )
            params.insert(1, query)
        sql += (
            time_sql
            + role_sql
            + " ORDER BY m.create_time LIMIT ?"
        )
    params.append(limit)

    out = []
    for row in db.execute(sql, params):
        item = message_payload(
            db,
            export_id,
            row["conversation_id"],
            row["node_id"],
        )
        if item:
            if context:
                item["lineage_context"] = (
                    lineage_context(
                        db,
                        export_id,
                        row["conversation_id"],
                        row["node_id"],
                        context,
                    )
                )
            out.append(item)
    return out


def list_conversations(
    db: sqlite3.Connection,
    *,
    export_id: int | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
    timezone_name: str = "UTC",
    limit: int = 200,
) -> list[dict]:
    export_id = export_id or latest_export_id(db)
    start, end = epoch_bounds(
        from_date, to_date, timezone_name
    )
    sql = (
        "SELECT c.*,count(m.node_id) message_count "
        "FROM conversations c "
        "LEFT JOIN messages m "
        "USING(export_id,conversation_id) "
        "WHERE c.export_id=?"
    )
    params: list[object] = [export_id]
    if start is not None:
        sql += (
            " AND coalesce("
            "c.create_time,c.update_time)>=?"
        )
        params.append(start)
    if end is not None:
        sql += (
            " AND coalesce("
            "c.create_time,c.update_time)<=?"
        )
        params.append(end)
    sql += (
        " GROUP BY c.export_id,c.conversation_id "
        "ORDER BY coalesce("
        "c.create_time,c.update_time) LIMIT ?"
    )
    params.append(limit)
    return [
        dict(row)
        for row in db.execute(sql, params)
    ]


def iter_window_messages(
    db,
    export_id,
    from_date,
    to_date,
    timezone_name,
    roles,
):
    start, end = epoch_bounds(
        from_date, to_date, timezone_name
    )
    sql = (
        "SELECT m.*,c.title FROM messages m "
        "JOIN conversations c "
        "USING(export_id,conversation_id) "
        "WHERE m.export_id=? "
        "AND m.create_time>=? AND m.create_time<=?"
    )
    params = [export_id, start, end]
    if roles:
        sql += (
            " AND m.author_role IN ("
            + ",".join("?" for _ in roles)
            + ")"
        )
        params.extend(roles)
    sql += (
        " ORDER BY m.create_time,"
        "m.conversation_id,m.node_id"
    )
    for row in db.execute(sql, params):
        yield {
            "conversation_id": row["conversation_id"],
            "node_id": row["node_id"],
            "title": row["title"],
            "role": row["author_role"],
            "create_time_utc": iso_utc(
                row["create_time"]
            ),
            "text": row["text"],
            "source_member": row["source_member"],
            "source_index": row["source_index"],
            "message_sha256": row[
                "raw_message_sha256"
            ],
        }
