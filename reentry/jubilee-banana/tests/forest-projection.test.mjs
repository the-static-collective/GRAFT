import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {composeForest,nextInvitation} from '../forest/forest-projection.mjs';
const candidate={
 schema:'graft/participation-bridge-candidate-v0',standing:'PROPOSE_ONLY',
 source:{veracity:'UNVERIFIED_SELF_REPORT',scope:'REVIEWED_REDACTION'},
 candidate:{summary:'Would a willing food shelf steward welcome a neutral purchasing worksheet?'},
 authority:{canonicalWrite:false,publicationApproved:false}
};
const options={authorReviewed:true,exportConsent:true,
 fruit:'A fictional neutral worksheet was drafted but no milk was delivered.',
 seed:'Could an authorized buyer confirm whether additional research is useful?'};
const canonical=o=>Array.isArray(o)?'['+o.map(canonical).join(',')+']':o&&typeof o==='object'?
 '{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+canonical(o[k])).join(',')+'}':JSON.stringify(o);
const hex=o=>createHash('sha256').update(canonical(o)).digest('hex');
test('consent and review refuse graph production independently',async()=>{
 for(const field of ['authorReviewed','exportConsent']){
  const r=await composeForest(candidate,{...options,[field]:false},webcrypto);
  assert.equal(r.standing,'HOLD_LOCAL');
  assert.equal(r.graph,undefined);
 }
});
test('Free Graph v0 record and packet identities are real SHA-256 canonical hashes',async()=>{
 const r=await composeForest(candidate,options,webcrypto),p=r.graph;
 assert.equal(p.schema,'free-graph.packet/v0');
 assert.equal(p.task_world_cut.status,'unresolved');
 assert.deepEqual(p.modes,['re-enter','seed']);
 assert.equal(p.sources[0].source_class,'conversation-witness');
 for(const [prefix,group] of [['fgs',p.sources],['fgn',p.nodes],['fgl',p.links]]){
  for(const record of group){
   const {id,...content}=record;
   assert.equal(id,prefix+':sha256:'+hex(content));
  }
 }
 const {packet_id,...rest}=p;
 assert.equal(packet_id,'fgp:sha256:'+hex(rest));
 assert.equal(p.links.length,2);
 assert.ok(p.links.every(x=>x.verb==='connects'&&x.status==='proposed'&&x.authority==='none'));
 assert.equal(r.authority.verifiedFulfillment,false);
});
test('separately authored public-safe text may not contain contacts',async()=>{
 await assert.rejects(composeForest(candidate,{...options,fruit:'Contact buyer@example.org'},webcrypto),/PRIVATE_CONTENT_REFUSED/);
 await assert.rejects(composeForest(candidate,{...options,seed:'Phone 507-555-0123 for details'},webcrypto),/PRIVATE_CONTENT_REFUSED/);
});
test('only an explicit new approval produces a native Seventh Table link',async()=>{
 const r=await composeForest(candidate,options,webcrypto);
 const input={title:'The Next Table',purpose:'Would willing people explore the next open question?',
  date:'2026-11-03'};
 assert.throws(()=>nextInvitation(r,{...input,approved:false},webcrypto),/INVITATION_REVIEW_REQUIRED/);
 const next=nextInvitation(r,{...input,approved:true},webcrypto);
 assert.equal(next.standing,'LINK_PREPARED_NOT_SENT');
 assert.equal(next.card.parent,'');
 assert.deepEqual(next.card.chain,[]);
 assert.equal(next.authority.tableCreated,false);
 assert.equal(next.authority.contactSent,false);
 assert.ok(next.url.startsWith('https://abundent.org/tables/#invite='));
 assert.deepEqual(JSON.parse(Buffer.from(next.url.split('#invite=')[1],'base64url').toString('utf8')),next.card);
});
test('fruit without seed cannot authorize successor; calendar must be real',async()=>{
 const noSeed=await composeForest(candidate,{...options,seed:''},webcrypto);
 assert.throws(()=>nextInvitation(noSeed,{title:'Next',purpose:'A question',date:'2026-11-03',approved:true},webcrypto),/NO_SEED_NO_SUCCESSOR/);
 const full=await composeForest(candidate,options,webcrypto);
 assert.throws(()=>nextInvitation(full,{title:'Next',purpose:'A question',date:'2026-02-30',approved:true},webcrypto),/INVALID_CALENDAR_DATE/);
});
