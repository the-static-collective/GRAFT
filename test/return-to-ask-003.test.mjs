import test from 'node:test';
import assert from 'node:assert/strict';
import {draftCall,toPrintHtml,eligibleCall} from '../src/return-to-ask-003.mjs';
const digest='sha256:'+'b'.repeat(64);
const n={
 schema:'graft.hypercross-native-proof-of-return/v0',
 native_ghot_radio_return_verified:true,
 real_human_consent:false,external_media_or_network_actions:0,
 semantic_authority:'NONE',
 parent_held_crossing_id:digest,
 computed_output_sha256:'sha256:'+'f'.repeat(64),
 new_signed_crossing_id:digest,
 signed_execution_receipt_id:digest
};
const heartbeat={
 schema:'jarvis.heartbeat/v0',current:'DISCOVER',phases:[{status:'unmatched'}],
 realWorldFulfillment:'not-established',externalAction:false
};
const call={id:'LP-OC-006',category:'TECH',institutionalSponsor:true,
 status:'INDEPENDENT_STATIC_COLLECTIVE_REQUEST',
 expertise:['Accessibility testing','Web / mobile UX'],title:'Usability review'};
test('Actual computer completion returns a bounded HUMAN ASK, not a fictitious human match',()=>{
 const x=draftCall(n,heartbeat,call);
 assert.match(x.first_question,/20-minute mobile usability/);
 assert.match(x.first_question,/STILL HERE/);
 assert.match(x.first_action,/ONLY invented|invented|fictional/);
 assert.match(x.first_action,/Do not submit names/);
 assert.match(x.next_owner_gate,/editor/);
 assert.equal(x.disposition,'HOLD_EDITORIAL_AND_HUMAN_PERMISSION');
 assert.equal(x.automatic_publication,false);
 assert.equal(x.automatic_outreach,false);
 assert.equal(x.user_private_data_exported,false);
 const html=toPrintHtml(x);
 assert.match(html,/not an active recruitment notice/i);
 assert.match(html,/No actual case information/);
 assert.match(html,/No reply destination/);
 assert.doesNotMatch(html,/<form|http:\/\/|https:\/\//);
});
test('No verified native prior receipt => refuse downstream story',()=>{
 assert.throws(()=>draftCall({...n,native_ghot_radio_return_verified:false},heartbeat,call),/INVALID_NATIVE_RETURN/);
 assert.throws(()=>draftCall({...n,real_human_consent:true},heartbeat,call),/INVALID_NATIVE_RETURN/);
 assert.throws(()=>draftCall({...n,computed_output_sha256:'other'},heartbeat,call),/INVALID_NATIVE_RETURN/);
 assert.throws(()=>draftCall(n,{...heartbeat,current:'RETURN'},call),/JARVIS_HUMAN_NEED_NOT_UNMATCHED/);
 assert.throws(()=>draftCall(n,{...heartbeat,externalAction:true},call),/JARVIS_HUMAN_NEED_NOT_UNMATCHED/);
});
test('Original LemonPRESS notice must be own approved-type independent TECH call, never a third-party vacancy',()=>{
 assert.equal(eligibleCall(call),true);
 for(const [k,v] of [['category','CARE'],['institutionalSponsor',false],['status','VERIFIED_INSTITUTIONAL_VACANCY'],['id','LP-OC-002']])
  assert.throws(()=>eligibleCall({...call,[k]:v}),/LEMONPRESS_OPEN_CALL_NOT_ALLOWED/);
});
test('The artifact renderer escapes text and remains print-ready',()=>{
 const altered=draftCall(n,heartbeat,{...call,title:'<script>alert(1)</script>'});
 const out=toPrintHtml(altered);
 assert.match(out,/<title>One useful human ask/);
 assert.doesNotMatch(out,/<script>alert\(1\)<\/script>/);
 assert.throws(()=>toPrintHtml({...altered,automatic_publication:true}),/PRINT_NOT_ALLOWED/);
});
