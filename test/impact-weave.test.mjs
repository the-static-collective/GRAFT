import assert from "node:assert/strict";
import test from "node:test";
import {mkdtemp,readFile,rm,stat} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {buildImpactWeave,renderImpactTable,availableImpactLanes,INTENT,ACK,WEAVE_SCHEMA,WEAVE_DISPOSITION} from "../src/impact-weave.mjs";
import {runImpactWeave} from "../src/impact-weave-cli.mjs";

const input=lanes=>({purpose:INTENT,acknowledgement:ACK,lanes});
test("four distinct hypothetical lanes produce deterministic six bridge proposals, not commitments",()=>{
  const a=buildImpactWeave(input(["table","porch","stage","bench"]));
  const b=buildImpactWeave(input(["bench","stage","porch","table"]));
  assert.deepEqual(a,b);
  assert.equal(a.schema,WEAVE_SCHEMA);assert.equal(a.status,WEAVE_DISPOSITION);
  assert.equal(a.route_count,6);
  assert.equal(a.real_partners_confirmed,0);assert.equal(a.people_contacted,0);
  assert.equal(a.gates.contact_permission,false);assert.equal(a.authority,"none");
  assert.ok(a.routes.every(x=>x.can_contact===false&&x.can_dispatch===false&&x.can_publish===false));
  assert.ok(a.lanes.every(x=>x.partner_status==="NOT_ESTABLISHED"));
});
test("path proposes capacity overlaps without asserting a human match",()=>{
  const a=buildImpactWeave(input(["stage","porch"]));
  assert.equal(a.route_count,1);
  assert.deepEqual(a.routes[0].shared_possible_capacities.map(x=>x.code),["digital_help","welcoming","printing"]);
  assert.match(a.routes[0].next_permission,/each lane.s actual steward independently/);
  assert.doesNotMatch(JSON.stringify(a),/real human ready|is committed/i);
});
test("strict schema blocks case IDs, contacts, notes, identities, prior aid and permissions",()=>{
  for(const key of ["person","caseId","beneficiary","contact","household","survivorStory","childId","priorAid","email","partners","permission"]){
    const a=buildImpactWeave({...input(["table","porch"]),[key]:"private sample"});
    assert.equal(a.status,"REFUSED");
    assert.equal(a.routes.length,0);
    assert.doesNotMatch(JSON.stringify(a),/private sample/);
  }
  for(const a of [
    null,{},input(["table"]),input(["table","table"]),input(["table","stranger"]),
    {...input(["table","porch"]),acknowledgement:"ACTUAL_PERSON_APPROVED"},
    {...input(["table","porch"]),purpose:"PUBLIC_MATCHING"},
    {...input(["table","porch"]),lanes:["table","porch","stage","bench","other"]}
  ])assert.equal(buildImpactWeave(a).status,"REFUSED");
  assert.equal(availableImpactLanes().length,4);
});
test("printable map announces proposal and limits without naming participants",()=>{
  const html=renderImpactTable(buildImpactWeave(input(["table","porch"])));
  assert.match(html,/FICTIONAL CAPACITY MAP/);
  assert.match(html,/No child-specific or survivor details/i);
  assert.match(html,/No child-specific or survivor details/i);
  assert.doesNotMatch(html,/http:\/\//);
  assert.throws(()=>renderImpactTable(buildImpactWeave(input(["table"]))));
});
test("CLI writes GRAFT native four-card kit and hash-receipted printable role map only",async()=>{
  const root=await mkdtemp(join(tmpdir(),"graft-impact-"));
  try{
    const dir=join(root,"weave");
    const flags=["--lanes","table,porch,stage,bench","--output-directory",dir];
    const built=await runImpactWeave(flags);
    assert.equal(built.state,WEAVE_DISPOSITION);
    assert.equal(built.routeCount,6);
    const packet=JSON.parse(await readFile(join(dir,"impact-weave.json"),"utf8"));
    assert.equal(packet.people_contacted,0);
    const native=await readFile(join(dir,"graft-native-four-cards.html"),"utf8");
    assert.match(native,/NEED/);assert.match(native,/OFFER/);
    assert.match(native,/BUILD/);assert.match(native,/RETURN/);
    const receipt=JSON.parse(await readFile(join(dir,"work-receipt.json"),"utf8"));
    assert.equal(receipt.original_graft_four_card_renderer_used,true);
    assert.equal(receipt.real_source_observed,false);
    assert.equal(receipt.files.length,3);
    assert.ok(receipt.files.every(x=>x.sha256.startsWith("sha256:")));
    assert.equal((await stat(dir)).mode&0o777,0o700);
    assert.equal((await stat(join(dir,"impact-weave.json"))).mode&0o777,0o600);
    await assert.rejects(runImpactWeave(flags),/EEXIST/);
    await assert.rejects(runImpactWeave(["--lanes","table,porch","--output-directory",join(root,"next"),"--contact","someone"]),/USE_EXACT_FLAGS/);
    await assert.rejects(stat(join(root,"next")),/ENOENT/);
  } finally {await rm(root,{recursive:true,force:true});}
});
