#!/usr/bin/env python3
"""RADIO-HOUSE-003 original native signed offline worker, fed by a previously
validated reLATTE RELAY-001 synthetic HOLD. Simulated operator consent only;
no real operator, RF signal, shared network, or real-world fulfillment.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

def require(cond,code):
    if not cond: raise ValueError(code)

def run(prior_verification, prior_result, ghroot, output):
    # Original GHoT branch supplied by the caller at an immutable source pin.
    sys.path.insert(0,str(Path(ghroot).resolve()))
    from ghot.radio_house_002 import connect,enable,observe_media,favorable_lab_power,status
    from ghot.radio_house_003 import make_bundle,accept,advance,settle,verify_return
    from ghot.relatte_identity import IdentityKey,verify_receipt
    verification=json.loads(Path(prior_verification).read_text())
    earlier=json.loads(Path(prior_result).read_text())
    require(verification.get("schema")=="static-relay/relatte-hold-verification/v0" and
            verification.get("signed_crossing_valid") is True and
            verification.get("signed_receive_valid") is True and
            verification.get("signed_hold_valid") is True and
            verification.get("disposition")=="HOLD" and
            verification.get("published") is False,"UPSTREAM_NATIVE_HOLD_UNVERIFIED")
    require(earlier.get("crossing",{}).get("crossing_id")==verification["crossing_id"] and
            earlier.get("disposition_receipt",{}).get("kind")=="R3_HOLD" and
            earlier.get("disposition_receipt",{}).get("semantic_effect")=="none","UPSTREAM_HOLD_RESULT_DRIFT")
    source_hash=verification["source_sha256"]
    require(isinstance(source_hash,str) and len(source_hash)==64 and
            all(c in "0123456789abcdef" for c in source_hash),"BAD_SOURCE_HASH")
    crossing_hash=hashlib.sha256(verification["crossing_id"].encode("ascii")).hexdigest()
    message="PUBLIC SYNTHETIC HANDOFF; PREVIOUS HOLD "+crossing_hash+"; MEDIA HASH "+source_hash+"; NO USER STORY; NO AUTHORITY TRANSFER"
    base=Path(output)
    require(not base.exists(),"OUTPUT_ALREADY_EXISTS")
    sender=base/"requester";worker=base/"worker"
    sender.mkdir(parents=True,mode=0o700);worker.mkdir(parents=True,mode=0o700)
    sender_key=IdentityKey.load_or_create(sender/"identity"/"requester.pem")
    worker_key=IdentityKey.load_or_create(worker/"identity"/"worker.pem")
    at=1000
    bundle=make_bundle(sender_key,worker_key.public_jwk(),"hypercross-experimental-002",message,at=at)
    courier=sender/"offline-courier.json"
    courier.write_text(json.dumps(bundle,sort_keys=True),encoding="utf-8")
    delivered=json.loads(courier.read_text())
    conn=connect(worker)
    power=favorable_lab_power()
    try:
        # This approval and machine condition are *lab fixture decisions*,
        # NOT consent from an actual site owner.
        enable(conn,True)
        observe_media(conn,"IDLE_CONFIRMED",at=1001)
        signed_local_hold=accept(conn,delivered,receiver_key=worker_key,
            pinned_requester_public=sender_key.public_jwk(),
            power=power,operator_approved=True,at=1001)
        first=advance(conn,delivered,receiver_key=worker_key,
            pinned_requester_public=sender_key.public_jwk(),power=power,at=1001)
        observe_media(conn,"RECORDING",at=1002)
        pause=advance(conn,delivered,receiver_key=worker_key,
            pinned_requester_public=sender_key.public_jwk(),power=power,at=1002)
        require(pause.get("status")=="HOLD" and pause.get("work_done_bytes")==0,
            "RECORDING_PAUSE_VIOLATION")
        observe_media(conn,"IDLE_CONFIRMED",at=1003)
        complete=None
        for _ in range(150):
            complete=advance(conn,delivered,receiver_key=worker_key,
                pinned_requester_public=sender_key.public_jwk(),power=power,at=1003)
            if complete.get("status")=="COMPLETE": break
        require(complete.get("status")=="COMPLETE","WORKER_INCOMPLETE")
        signed_execution=settle(conn,delivered,receiver_key=worker_key,
            pinned_requester_public=sender_key.public_jwk(),at=1004)
        checked=verify_return(delivered,signed_local_hold,signed_execution,
            pinned_requester_public=sender_key.public_jwk(),
            pinned_worker_public=worker_key.public_jwk(),at=1005)
        require(checked["status"]=="SIGNED_CROSSING_AND_LOCAL_HASH_RETURN_VERIFIED",
            "NATIVE_RADIO_RETURN_INVALID")
        require(verify_receipt(signed_local_hold) and verify_receipt(signed_execution),
            "SIGNATURE_INVALID")
        require(checked["result_sha256"]=="sha256:"+hashlib.sha256(message.encode("ascii")).hexdigest(),
            "WORKER_DIGEST_MISMATCH")
        # A derivative of the previously held crossing is used; no reopening
        # that held receiver or interpretation of its HOLD as permission.
        record={"schema":"graft.hypercross-experimental-radio-return/v0",
           "previous_held_crossing_id":verification["crossing_id"],
           "previous_held_source_sha256":"sha256:"+source_hash,
           "signed_request_crossing_id":delivered["crossing"]["crossing_id"],
           "native_worker_hold_receipt_id":signed_local_hold["receipt_id"],
           "native_worker_completion_receipt_id":signed_execution["receipt_id"],
           "work_done_digest":checked["result_sha256"],
           "media_pause_enforced":True,"native_return_verified":True,
           "simulated_operator_consent":True,"real_operator_consent":False,
           "actual_broadcasts":0,"real_human_helpers":0,
           "physical_execution":False,"publication":False,
           "note":"Two local synthetic identities and one SQLite worker, offline file courier."}
    finally: conn.close()
    # Copy ONLY public synthetic summary out; keys, raw signed bundle, courier
    # and local state remain in temporary protected work area.
    dest=base/"synthetic-summary.json"
    dest.write_text(json.dumps(record,indent=2,sort_keys=True)+"\n")
    return record
if __name__=="__main__":
    p=argparse.ArgumentParser()
    for arg in ("--verification","--roundtrip","--radio-root","--output"):p.add_argument(arg,required=True)
    a=p.parse_args()
    print(json.dumps(run(a.verification,a.roundtrip,a.radio_root,a.output),sort_keys=True))
