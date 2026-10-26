#!/usr/bin/env python3
"""Cold-check actual original GHoT Radio House 003 signatures on public/synthetic
payload. Supplied keys are fixture self-pins, NOT any real human identity.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

def need(ok,reason):
    if not ok:raise ValueError(reason)

def verify(root,signed_path,summary_path):
    sys.path.insert(0,str(Path(root).resolve()))
    from ghot.radio_house_003 import verify_return
    data=json.loads(Path(signed_path).read_text(encoding="utf8"))
    summary=json.loads(Path(summary_path).read_text(encoding="utf8"))
    need(data.get("schema")=="graft.radio-return-signed-proof/v0","WRONG_ORIGIN")
    need(summary.get("schema")=="graft.hypercross-experimental-radio-return/v0",
        "WRONG_SUMMARY")
    bundle=data["bundle"]
    admission=data["admission"]
    finished=data["execution"]
    request_pin=bundle["crossing"]["signing"]["public_key"]
    receiver_pin=admission["signing"]["public_key"]
    # Native GHoT verifier checks signatures, effect/recipient/expiry and
    # exact original bytes and result digest against source fixtures.
    checked=verify_return(bundle,admission,finished,
        pinned_requester_public=request_pin,
        pinned_worker_public=receiver_pin,at=1005)
    need(checked["status"]=="SIGNED_CROSSING_AND_LOCAL_HASH_RETURN_VERIFIED",
        "NATIVE_RETURN_NOT_VERIFIED")
    need(checked["crossing_id"]==summary["signed_request_crossing_id"] and
         admission["receipt_id"]==summary["native_worker_hold_receipt_id"] and
         finished["receipt_id"]==summary["native_worker_completion_receipt_id"] and
         checked["result_sha256"]==summary["work_done_digest"],
         "SYNTHETIC_RETURN_LINEAGE_MISMATCH")
    need(summary["actual_broadcasts"]==0 and not summary["real_operator_consent"] and
         not summary["publication"] and summary["native_return_verified"],
         "FALSE_EXTERNAL_EFFECT_CLAIM")
    prior=summary["previous_held_crossing_id"]
    need(isinstance(prior,str) and 8 <= len(prior) <= 200 and all(c.isascii() and (c.isalnum() or c in ":._-/") for c in prior),
         "PREVIOUS_CROSSING_NOT_LINKED")
    canonical=json.dumps({
      "bundle":bundle,"admission":admission,"execution":finished
    },sort_keys=True,separators=(",",":"),ensure_ascii=True).encode("utf8")
    return {
      "schema":"graft.hypercross-native-proof-of-return/v0",
      "input_signed_proof_sha256":"sha256:"+hashlib.sha256(canonical).hexdigest(),
      "parent_held_crossing_id":prior,
      "new_signed_crossing_id":checked["crossing_id"],
      "signed_local_hold_receipt_id":admission["receipt_id"],
      "signed_execution_receipt_id":finished["receipt_id"],
      "computed_output_sha256":checked["result_sha256"],
      "native_ghot_radio_return_verified":True,
      "synthetic_sender_public_pin_only":True,
      "real_human_consent":False,
      "external_media_or_network_actions":0,
      "semantic_authority":"NONE"
    }

if __name__=="__main__":
    p=argparse.ArgumentParser()
    for f in ("--radio-root","--proof","--summary"):p.add_argument(f,required=True)
    a=p.parse_args()
    try:print(json.dumps(verify(a.radio_root,a.proof,a.summary),sort_keys=True))
    except Exception as ex:
        print("COLD_RETURN_REFUSED: "+str(ex),file=sys.stderr)
        raise SystemExit(1)
