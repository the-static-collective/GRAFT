import test from 'node:test';
import assert from 'node:assert/strict';
import {createGram,addTrace,addTension,linkNearby,selectFirstYes,makeReturn,formatCard} from '../gram/portable-gram.mjs';
const seed={sourceRef:'garden:milkbridge001',kind:'question',
need:'Explore whether temporary milk support creates a real food shelf purchasing gap',
ifThisSucceeds:'A willing, authorized buyer can choose a good sourcing option without guessing',
question:'Would one narrow private comparison help?'};
const draft=()=>createGram(seed);
test('local only; reciprocity never required',()=>{
 const a=draft();
 assert.equal(a.scope,'this-device');
 assert.equal(a.reciprocity,'VOLUNTARY_NOT_REQUIRED');
 assert.deepEqual(Object.values(a.authority),Array(6).fill(false));
});
test('trace is self report and preserves previous snapshot',()=>{
 const a=draft();
 const b=addTrace(a,{statement:'One person mentioned that grant-funded milk might be changing'});
 assert.equal(a.trace.length,0);
 assert.equal(b.previousRevision,1);
 assert.equal(b.revision,2);
 assert.equal(b.trace[0].standing,'REPORTED_NOT_CONFIRMED');
});
test('opposing claims both survive as unresolved tension',()=>{
 const b=addTension(draft(),{oneView:'The grant has ended',otherView:'The program may still be open',
 unresolvedQuestion:'What program and dates can the actual buyer verify?'});
 assert.equal(b.tensions[0].standing,'OPEN_NOT_RESOLVED');
 assert.match(formatCard(b),/TENSIONS — KEEP BOTH PERSPECTIVES/);
});
test('BananaGram native edges do not become Free Graph authority',()=>{
 const b=linkNearby(draft(),{verb:'makes_possible',targetRef:'garden:seventable001',
 why:'A willing contributor might help clarify the practical question'});
 assert.equal(b.relations[0].freeGraphAdmitted,false);
 assert.throws(()=>linkNearby(draft(),{verb:'constitutes',targetRef:'garden:seventable001',why:'Unknown verb in local grammar'}),/INVALID_BANANAGRAM_LINK/);
 assert.throws(()=>linkNearby(draft(),{verb:'learned_from',targetRef:seed.sourceRef,why:'Reject self link reflexivity'}),/SELF_LINK_REFUSED/);
});
test('selecting a First Yes proposal does not execute or authorize',()=>{
 const a=draft();
 assert.equal(selectFirstYes(a,{selected:false}).standing,'HOLD_SELECTION_REQUIRED');
 const b=selectFirstYes(a,{selected:true,
   prepareNow:'Draft a neutral buyer worksheet leaving unknown prices blank',
   permissionQuestion:'Ask the steward whether a sourcing comparison would be useful',
   proofOfReturn:'Record yes, no, not yet or the verified unanswered question'});
 assert.equal(b.standing,'SELECTED_PLAN_ONLY');
 assert.ok(Object.values(b.authority).every(x=>x===false));
});
test('fruit seed compost do not manufacture fulfillment or successor authority',()=>{
 const a=draft();
 assert.equal(makeReturn(a,{reviewed:false}).standing,'HOLD_HUMAN_REVIEW_REQUIRED');
 const b=makeReturn(a,{reviewed:true,fruit:'A neutral worksheet draft exists',
 seed:'Ask buyer if they want the research',compost:'Grant expiry unconfirmed'});
 assert.equal(b.fruit.confirmed,false);
 assert.equal(b.consequenceReceipt,null);
 assert.equal(b.seed.selectionAuthority,false);
 assert.equal(b.successorTableInvite,null);
 assert.throws(()=>makeReturn(a,{reviewed:true}),/EMPTY_RETURN/);
});
test('return must match source AND exact source revision',()=>{
 const a=draft(),b=addTrace(a,{statement:'Someone reported possible change to milk allocation'});
 const ret=makeReturn(b,{reviewed:true,seed:'Clarify with the authorized buyer if they want this'});
 assert.match(formatCard(b,ret),/No message sent/);
 assert.throws(()=>formatCard(a,ret),/STALE_OR_WRONG_RETURN/);
 assert.throws(()=>formatCard(createGram({...seed,sourceRef:'garden:othercase001'}),ret),/STALE_OR_WRONG_RETURN/);
});
