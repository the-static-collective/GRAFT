#!/usr/bin/env python3
"""CAPABILITY-019: actual original native MOTIF-003 ranks candidate tokenizers.

An intentionally incomplete structural affordance map favors CODEPOINTS
over GRAPHEMES. This heuristic is NOT secretly the correct answer. The
developer's counterexamples must correct it. The graph is hand-authored and
cannot establish inherent superiority over type-aware classical search.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys

ORIGINAL_COMMIT = "66d27cfbd077b2c91d0d86d66e320206d88d8f95"
ORIGINAL_BLOB = "db25da0d50a9c8e2cd87aa576a22f969405737cf"

DOORS = {
 "utf16":("fast-code-unit-count","simple-ASCII-path"),
 "codepoint":("Unicode-scalar-inspection","codepoint-range-analysis",
              "surrogate-pair-avoidance","scalar-frequency-lookup"),
 "grapheme":("user-visible-cluster-inspection","combined-mark-diagnostic",
             "joined-emoji-grouping")
}

def native_source():
 source=os.environ.get("MOTIF_SOURCE_ROOT")
 if not source:
  raise RuntimeError("Exact pinned MOTIF_SOURCE_ROOT required")
 path=Path(source).resolve() / "experiments/003/affordance.py"
 content=path.read_bytes()
 blob=hashlib.sha1(b"blob "+str(len(content)).encode()+b"\x00"+content).hexdigest()
 if blob!=ORIGINAL_BLOB:
  raise RuntimeError("Original MOTIF-003 code differs from source blob")
 spec=importlib.util.spec_from_file_location("native_motif_019",path)
 module=importlib.util.module_from_spec(spec)
 sys.modules[spec.name]=module
 spec.loader.exec_module(module)
 return module

def expand(world,_):
 phase=next(v for k,v in world if k=="phase")
 if phase=="choose":
  for mode in ("utf16","codepoint","grapheme"):
   nxt=(world-{("phase",phase)})|{("phase","inspect"),("unitizer",mode)}
   yield ("choose-"+mode,(mode,),frozenset(nxt))
 elif phase=="inspect":
  mode=next(v for k,v in world if k=="unitizer")
  for affordance in DOORS[mode]:
   nxt=(world-{("phase",phase)})|{("phase","finished"),
       ("hypothetical-door",affordance)}
   yield ("open-"+affordance,(affordance,),frozenset(nxt))

def zero(_future,_start):
 return 0

def run():
 native=native_source()
 world=frozenset({("phase","choose"),("case-source","invented"),
  ("rights","none")})
 options=native.analyze_first_moves(world,None,expand,zero,
  horizon=2,max_worlds=72)
 first=native.select_first_move(options,priority="new-choices")
 ranked=sorted(options,key=lambda x:(
  len(x["new_affordances"]),x["reachable_after_first_move"],x["operator"]),reverse=True)
 order=[x["operator"].removeprefix("choose-") for x in ranked]
 if sorted(order)!=["codepoint","grapheme","utf16"]:
  raise RuntimeError("The native graph returned an unexpected typed operator set")
 if first["operator"]!="choose-codepoint":
  raise RuntimeError("The deliberately incomplete affordance map was not honored")
 return {
  "schema":"motif.native-019-tokenizer-order/v1",
  "authority":"STRUCTURAL_BRANCH_ORDER_ONLY",
  "originalCommit":ORIGINAL_COMMIT,
  "originalBlob":ORIGINAL_BLOB,
  "executedOriginalMOTIF003":True,
  "executedNativeSelectFirstMove":True,
  "firstChoiceKnownToBeInsufficientForZWJ":True,
  "firstChoice":first["operator"],
  "candidateOrder":order,
  "sourceGraphHandAuthored":True,
  "classicalHeuristicCouldMatchOrOutperform":True,
  "generatedNewAlgorithmAutonomously":False,
  "realWorldActions":0
 }

if __name__=="__main__":
 print(json.dumps(run(),indent=2))
