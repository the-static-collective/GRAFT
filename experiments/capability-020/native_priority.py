#!/usr/bin/env python3
"""Native MOTIF-003 branch ordering for a STRUCTURAL memory decision.

Original source-pinned MOTIF is actually executed, but the authored graph
gives the wrong structural hint: per-type counters open more conveniently
named immediate doors than a LIFO array. Nested/crossing test evidence must
overturn that preference. No new stack algorithm is magically invented.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys

COMMIT="66d27cfbd077b2c91d0d86d66e320206d88d8f95"
BLOB="db25da0d50a9c8e2cd87aa576a22f969405737cf"
DOORS={
 "last-register":("flat-paren-pair","single-local-witness"),
 "per-type-counters":("count-rounds","count-squares","balance-aggregate",
  "track-two-types","summarize-validity-heuristic"),
 "lifo-list":("remember-nested-openers","recover-index-pairs",
  "reject-interleaved-crossing")
}

def load_original():
 root=os.environ.get("MOTIF_SOURCE_ROOT")
 if not root:raise RuntimeError("An exact original MOTIF source checkout is required")
 path=Path(root).resolve() / "experiments/003/affordance.py"
 binary=path.read_bytes()
 actual=hashlib.sha1(b"blob "+str(len(binary)).encode()+
  b"\x00"+binary).hexdigest()
 if actual!=BLOB:raise RuntimeError("Native MOTIF original source is not the pinned blob")
 spec=importlib.util.spec_from_file_location("motif003_memory_020",path)
 if spec is None or spec.loader is None:
  raise RuntimeError("Could not resolve original native source")
 module=importlib.util.module_from_spec(spec)
 sys.modules[spec.name]=module
 spec.loader.exec_module(module)
 return module

def transitions(world,_):
 phase=next(v for k,v in world if k=="phase")
 if phase=="select":
  for name in ("last-register","per-type-counters","lifo-list"):
   target=(world-{("phase",phase)}) | {
    ("phase","analyze"),("memory",name)}
   yield ("try-"+name,(name,),frozenset(target))
 elif phase=="analyze":
  method=next(v for k,v in world if k=="memory")
  for door in DOORS[method]:
   target=(world-{("phase",phase)}) | {
    ("phase","finish"),("toy-affordance",door)}
   yield ("investigate-"+door,(door,),frozenset(target))

def utility(_current,_original):return 0

def run():
 original=load_original()
 world=frozenset({("phase","select"),
  ("source","invented-bracket-strings"),("legal-authority","none")})
 rows=original.analyze_first_moves(world,None,transitions,
  utility,horizon=2,max_worlds=80)
 first=original.select_first_move(rows,priority="new-choices")
 ordered=sorted(rows,key=lambda r:(
  len(r["new_affordances"]),r["reachable_after_first_move"],
  r["operator"]),reverse=True)
 names=[r["operator"].removeprefix("try-") for r in ordered]
 if sorted(names)!=["last-register","lifo-list","per-type-counters"]:
  raise RuntimeError("Bad structure vocabulary in native source")
 if first["operator"]!="try-per-type-counters":
  raise RuntimeError("Native graph did not exhibit deliberately fallible first preference")
 return {
  "schema":"motif.native-020-memory-structure-priority/v1",
  "sourceAuthority":"STRUCTURAL-HEURISTIC-ONLY",
  "originalSourceCommit":COMMIT,"originalSourceBlob":BLOB,
  "executedOriginalAnalyzeFirstMoves":True,
  "executedOriginalSelectFirstMove":True,
  "firstHypothesis":first["operator"],
  "hypothesisKnownToFailCrossedNesting":True,
  "orderedMemories":names,
  "toyAffordanceCounts":{r["operator"]:len(r["new_affordances"]) for r in rows},
  "graphIsHandAuthored":True,
  "directClassicalStackParserIsStrongerBaseline":True,
  "generalizedNovelComputingInvented":False,
  "realActions":0
 }

if __name__=="__main__":
 print(json.dumps(run(),indent=2))
