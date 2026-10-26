#!/usr/bin/env python3
"""WEAVES -> WE'VES 001: offline, attributed, proposal-only composition.

No network, database, participant matching, contact, transmission, or authority
transfer. Packets are public-safe candidate structures, never proof of field work.
"""
import argparse
import hashlib
import json
from pathlib import Path

BUNDLE = "weaves.bundle/v1"
PARTICULAR = "weaves.particular/v1"
WEAVE = "weaves.weave/v1"
WEVE = "weaves.weve/v1"
RETURN = "weaves.return/v1"

def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def address(body):
    return "sha256:" + hashlib.sha256(canonical(body).encode("utf-8")).hexdigest()

def packet(body):
    if "id" in body:
        raise ValueError("cannot address a body with an existing id")
    return {**body, "id": address(body)}

def check(packet_value):
    if not isinstance(packet_value, dict) or not isinstance(packet_value.get("id"), str):
        raise ValueError("packet missing id")
    body = {key: value for key, value in packet_value.items() if key != "id"}
    if packet_value["id"] != address(body):
        raise ValueError("changed or forged packet content hash")
    return True

def public_ref(url):
    if not isinstance(url, str) or not url.startswith("https://"):
        raise ValueError("source must be a public HTTPS reference")
    if "@" in url.split("://", 1)[1].split("/", 1)[0] or "?" in url:
        raise ValueError("source must not carry credentials or query parameters")
    return url

def require_string(value, name):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{name} must be nonempty text")
    if len(value) > 400:
        raise ValueError(f"{name} exceeds public-card length")
    return value.strip()

def particular(title, source, role, source_state="REFERENCE_ONLY"):
    if source_state not in {"REFERENCE_ONLY", "SOURCE_OBSERVED"}:
        raise ValueError("a project reference is not a verified field outcome")
    return packet({
        "schema": PARTICULAR, "kind": "particular",
        "title": require_string(title, "title"),
        "source": public_ref(source),
        "role": require_string(role, "role"),
        "source_state": source_state,
        "authority": "SOURCE_OWNED",
        "privacy": "PUBLIC_REFERENCES_ONLY"
    })

def weave(title, children, purpose):
    if len(children) < 2:
        raise ValueError("a weave connects at least two distinct things")
    refs = []
    for node, relation in children:
        check(node)
        if node["schema"] not in {PARTICULAR, WEAVE, RETURN}:
            raise ValueError("weave inputs must be particulars, weaves, or returns")
        refs.append({"ref": node["id"], "relation": require_string(relation, "relation")})
    if len({ref["ref"] for ref in refs}) != len(refs):
        raise ValueError("duplicate nodes are not independent inputs")
    return packet({
        "schema": WEAVE, "kind": "weave",
        "title": require_string(title, "title"),
        "purpose": require_string(purpose, "purpose"),
        "inputs": refs,
        "status": "PROPOSED_RELATION",
        "authority": "NONE_INFERRED",
        "privacy": "PUBLIC_REFERENCES_ONLY"
    })

def weve_candidate(title, source_weave, next_act, steward_role):
    check(source_weave)
    if source_weave["schema"] != WEAVE:
        raise ValueError("a we've candidate needs an explicit source weave")
    return packet({
        "schema": WEVE, "kind": "weve",
        "title": require_string(title, "title"),
        "source_weave": source_weave["id"],
        "next_act": require_string(next_act, "next_act"),
        "steward_role": require_string(steward_role, "steward_role"),
        "stage": "PROPOSE_ONLY",
        "participant_consent": "NOT_INFERRED",
        "field_outcome": "NOT_CLAIMED",
        "authority": "LOCAL_HUMAN_REVIEW_REQUIRED",
        "privacy": "PUBLIC_REFERENCES_ONLY"
    })

def return_report(candidate, evidence_url, report, review_state="UNREVIEWED"):
    """A report is not independent proof or project-owner adoption."""
    check(candidate)
    if candidate["schema"] != WEVE:
        raise ValueError("return must refer to a we've candidate")
    if review_state not in {"UNREVIEWED", "HUMAN_REVIEW_REPORTED"}:
        raise ValueError("automatic verification is forbidden")
    return packet({
        "schema": RETURN, "kind": "return",
        "source_candidate": candidate["id"],
        "evidence_reference": public_ref(evidence_url),
        "report": require_string(report, "report"),
        "review_state": review_state,
        "real_world_verification": "NOT_ESTABLISHED_BY_THIS_TOOL",
        "authority": "LOCAL_OWNER_DECIDES",
        "privacy": "PUBLIC_REFERENCES_ONLY"
    })

def bundle(title, nodes, root):
    ids = [node["id"] for node in nodes]
    if len(ids) != len(set(ids)) or root["id"] not in ids:
        raise ValueError("duplicate or absent root")
    result = {"schema": BUNDLE, "title": require_string(title, "title"),
              "nodes": nodes, "root": root["id"],
              "disclaimer": "Public-safe interpretive map; no automatic consent, delivery, permission, or adoption."}
    validate(result)
    return result

def validate(document):
    if not isinstance(document, dict) or document.get("schema") != BUNDLE:
        raise ValueError("unsupported bundle schema")
    if set(document) != {"schema", "title", "nodes", "root", "disclaimer"}:
        raise ValueError("unexpected bundle fields")
    seen = set()
    for node in document["nodes"]:
        check(node)
        if node["id"] in seen:
            raise ValueError("duplicate node")
        if node.get("privacy") != "PUBLIC_REFERENCES_ONLY":
            raise ValueError("cannot include private packets in public bundle")
        schema = node.get("schema")
        permitted = {
            PARTICULAR: {"schema", "kind", "title", "source", "role", "source_state", "authority", "privacy", "id"},
            WEAVE: {"schema", "kind", "title", "purpose", "inputs", "status", "authority", "privacy", "id"},
            WEVE: {"schema", "kind", "title", "source_weave", "next_act", "steward_role", "stage", "participant_consent", "field_outcome", "authority", "privacy", "id"},
            RETURN: {"schema", "kind", "source_candidate", "evidence_reference", "report", "review_state", "real_world_verification", "authority", "privacy", "id"},
        }
        if schema not in permitted or set(node) != permitted[schema]:
            raise ValueError("unknown, missing, or potentially sensitive packet fields")
        kinds = {PARTICULAR: "particular", WEAVE: "weave", WEVE: "weve", RETURN: "return"}
        if node["kind"] != kinds[schema]:
            raise ValueError("node kind/schema mismatch")
        if schema == PARTICULAR:
            public_ref(node["source"])
            if node["authority"] != "SOURCE_OWNED" or node["source_state"] not in {"REFERENCE_ONLY", "SOURCE_OBSERVED"}:
                raise ValueError("illegitimate particular state")
        elif schema == WEAVE:
            refs = [entry["ref"] for entry in node["inputs"]]
            if len(refs) < 2 or len(refs) != len(set(refs)) or any(ref not in seen for ref in refs):
                raise ValueError("unresolved, duplicated, forward, or cyclic weave input")
            if node["status"] != "PROPOSED_RELATION" or node["authority"] != "NONE_INFERRED":
                raise ValueError("weave cannot declare adoption")
        elif schema == WEVE:
            if node["source_weave"] not in seen:
                raise ValueError("missing source weave")
            source = next(x for x in document["nodes"] if x["id"] == node["source_weave"])
            if source["schema"] != WEAVE or node["stage"] != "PROPOSE_ONLY":
                raise ValueError("a we've candidate cannot impersonate accomplishment")
            if node["field_outcome"] != "NOT_CLAIMED" or node["participant_consent"] != "NOT_INFERRED":
                raise ValueError("candidate cannot assert field outcome or participant consent")
        elif schema == RETURN:
            if node["source_candidate"] not in seen:
                raise ValueError("missing candidate")
            source = next(x for x in document["nodes"] if x["id"] == node["source_candidate"])
            if source["schema"] != WEVE or node["review_state"] not in {"UNREVIEWED", "HUMAN_REVIEW_REPORTED"}:
                raise ValueError("invalid reported return")
            if node["real_world_verification"] != "NOT_ESTABLISHED_BY_THIS_TOOL":
                raise ValueError("real-world verification is never automatic")
            public_ref(node["evidence_reference"])
        else:
            raise ValueError(f"unknown node schema: {schema}")
        seen.add(node["id"])
    if document["root"] not in seen:
        raise ValueError("missing root")
    return True

def specimen():
    """Real public project pointers; ONLY invented relationships/candidate work."""
    refs = [
        ("Black Star (reviewed GRAFT subset)", "https://github.com/the-static-collective/GRAFT/tree/graft/black-star", "historical source witness"),
        ("MEMENTO (reviewed GRAFT subset)", "https://github.com/the-static-collective/GRAFT/tree/graft/MEMENTO", "context return"),
        ("Free Graph", "https://github.com/the-static-collective/free-graph", "relation exploration"),
        ("GRAFT", "https://github.com/the-static-collective/GRAFT", "independent receipts"),
        ("JAR;VIS", "https://github.com/the-static-collective/JAR-VIS", "attention and unsent work cards"),
        ("BananaSpork", "https://github.com/the-static-collective/BananaSpork", "locally stewarded Campfire"),
        ("Jubilee Engine VM", "https://github.com/the-static-collective/Jubilee-Engine-VM", "voluntary return"),
        ("webZ", "https://github.com/the-static-collective/webZ", "public door"),
        ("LemonPRESS", "https://github.com/the-static-collective/lemonPRESS", "human-reviewed invitation"),
        ("Haunted Toaster", "https://github.com/the-static-collective/the-haunted-toaster", "deterministic creative work"),
        ("Haunted Blender", "https://github.com/the-static-collective/the-haunted-blender", "creative processing"),
        ("Static Live", "https://github.com/the-static-collective/static-live", "media encounter"),
        ("GHoT", "https://github.com/the-static-collective/GHoT", "resource execution candidate"),
        ("reLATTE", "https://github.com/the-static-collective/reLATTE", "bounded crossings"),
        ("MSyoU", "https://github.com/the-static-collective/MSyoU", "campus useful-work candidate")
    ]
    points = [particular(*row) for row in refs]
    def sub(title, indices, purpose):
        return weave(title, [(points[n], refs[n][2]) for n in indices], purpose)
    a = sub("Witness and reconstruct", [0, 1, 2, 3], "Offer source-backed roads, not invented memories")
    b = sub("Find and steward", [4, 5, 6], "Notice a need and propose a freely chosen next act")
    c = sub("Invite and return", [7, 8], "Produce an independently reviewed public invitation")
    d = sub("Create and publish", [9, 10, 11], "Make attributable creative material with local tools")
    e = sub("Route useful resources", [12, 13, 14], "Propose energy-aware work without remote control")
    all_weaves = weave("Weave of weaves", [
        (a, "carry witnesses"), (b, "human choice"), (c, "public door"),
        (d, "creative participation"), (e, "physical capacity")],
        "Compose independent organs without merging their authority")
    possible = weve_candidate("One freely chosen useful act",
        all_weaves,
        "Human steward reviews one safe paper-first invitation; another consenting adult may act and independently report what happened",
        "Local volunteer steward (not assigned)")
    return bundle("WEAVES TO WE'VES — OCT 26 SYNTHETIC CROSSWALK",
                  [*points, a, b, c, d, e, all_weaves, possible], possible)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["demo", "validate", "trace"])
    parser.add_argument("path", nargs="?")
    args = parser.parse_args()
    if args.command == "demo":
        print(json.dumps(specimen(), ensure_ascii=False, indent=2))
    else:
        if not args.path:
            parser.error("path required")
        value = json.loads(Path(args.path).read_text(encoding="utf-8"))
        validate(value)
        if args.command == "validate":
            print("VALID PACKET STRUCTURE; field reality and consent NOT verified")
        else:
            for node in value["nodes"]:
                inputs = node.get("inputs", [])
                print(node["kind"], node["id"][:19], node.get("title", ""), f"inputs={len(inputs)}")

if __name__ == "__main__":
    main()
