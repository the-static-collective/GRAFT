#!/usr/bin/env python3
"""One public checksum becomes an audible, deterministic Morse-code beacon.

Only the first eight SHA-256 hex digits are transmitted; no people, stories,
identifiers or private archives. This is an audio FILE, not RF transmission.
"""
import hashlib
import json
import math
import struct
import sys
import wave
from pathlib import Path

MORSE = {"A":".-","B":"-...","C":"-.-.","D":"-..","E":".","F":"..-.","G":"--.",
"H":"....","I":"..","J":".---","K":"-.-","L":".-..","M":"--","N":"-.",
"O":"---","P":".--.","Q":"--.-","R":".-.","S":"...","T":"-","U":"..-",
"V":"...-","W":".--","X":"-..-","Y":"-.--","Z":"--..",
"0":"-----","1":".----","2":"..---","3":"...--","4":"....-",
"5":".....","6":"-....","7":"--...","8":"---..","9":"----."}
def make(hash_input,output):
    if not isinstance(hash_input,str) or len(hash_input)!=71 or not hash_input.startswith("sha256:"):
        raise ValueError("SOURCE_SHA256_REQUIRED")
    h=hash_input[7:]
    if len(h)!=64 or any(c not in "0123456789abcdef" for c in h):
        raise ValueError("SOURCE_SHA256_MALFORMED")
    message="HC "+h[:8].upper()
    unit=0.038;rate=16000;scale=int(rate*unit)
    sound=[]
    def append(units,tone=False):
        for i in range(units*scale):
            sample=round(3500*math.sin(2*math.pi*550*i/rate)) if tone else 0
            sound.append(struct.pack("<h",sample))
    for ci,char in enumerate(message):
        if char==" ":
            append(5,False)
            continue
        for si,s in enumerate(MORSE[char]):
            append(3 if s=="-" else 1,True)
            if si<len(MORSE[char])-1:append(1,False)
        if ci<len(message)-1:append(3,False)
    p=Path(output)
    if p.exists():raise ValueError("WAV_ALREADY_EXISTS")
    with wave.open(str(p),"wb") as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate)
        w.writeframes(b"".join(sound))
    digest=hashlib.sha256(p.read_bytes()).hexdigest()
    return {"schema":"graft.synthetic-morse-beacon/v0",
       "message":message,"reference_sha256":hash_input,"audio_sha256":"sha256:"+digest,
       "codec":"pcm_s16le","sample_rate":rate,"radio_transmission":False,
       "synthetic_public_only":True,"contains_full_source":False}
if __name__=="__main__":
    if len(sys.argv)!=3:raise SystemExit("USAGE: make-audio-beacon.py SHA256 OUTPUT.WAV")
    print(json.dumps(make(sys.argv[1],sys.argv[2]),sort_keys=True))
