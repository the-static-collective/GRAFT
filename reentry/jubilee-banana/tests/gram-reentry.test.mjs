import test from 'node:test';
import assert from 'node:assert/strict';
import {createGram,addTrace} from '../gram/portable-gram.mjs';
import {proposeGramCrossing} from '../bridge/gram-reentry.mjs';
const gram=()=>createGram({sourceRef:'garden:milkbridge001',
 need:'Verify whether the food shelf has an actual milk procurement gap',
 ifThisSucceeds:'A willing buyer can choose among real available options'});
const opts={participationConfirmedByAuthor:true,consentToExport:true,reviewedByHuman:true,
 redactedSummary:'Would a willing steward want a brief review of milk sourcing?',
 destination:'first-yes',kind:'question'};
test('author submission, consent and review are each required',()=>{
 for(const field of ['participationConfirmedByAuthor','consentToExport','reviewedByHuman']){
  const r=proposeGramCrossing(gram(),{...opts,[field]:false});
  assert.equal(r.standing,'HOLD_LOCAL');
  assert.deepEqual(Object.keys(r).sort(),['schema','standing','why']);
 }
});
test('only human-written redaction crosses; never the private trace',()=>{
 const g=addTrace(gram(),{statement:'Private stories about family should never leave this device'});
 const r=proposeGramCrossing(g,opts);
 assert.equal(r.standing,'PROPOSE_ONLY');
 assert.ok(Object.values(r.authority).every(x=>x===false));
 assert.ok(!JSON.stringify(r).includes('family'));
 assert.equal(r.source.opaqueRef,'garden:milkbridge001:r2');
});
test('revision pin changes as source changes',()=>{
 const one=proposeGramCrossing(gram(),opts);
 const two=proposeGramCrossing(addTrace(gram(),{statement:'A source may have changed'}),opts);
 assert.notEqual(one.source.opaqueRef,two.source.opaqueRef);
});
test('private contacts rejected by established re-entry boundary',()=>{
 for(const redactedSummary of ['Please email test@example.org','Text 507-555-0123','https://example.org is a contact']){
  assert.throws(()=>proposeGramCrossing(gram(),{...opts,redactedSummary}),/PRIVATE_CONTENT_REFUSED/);
 }
});
test('Telegram porch does not have a send or command capability',()=>{
 const r=proposeGramCrossing(gram(),{...opts,destination:'telegram-porch-draft'});
 assert.equal(r.target,'telegram-porch-draft');
 assert.equal(r.authority.transportDispatched,false);
 assert.equal(r.authority.canonicalWrite,false);
});
