import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareCandidate,VERSION} from '../bridge/participation-bridge.mjs';
const base={sourceRef:'room:sample-case-1',status:'participating',kind:'question',destination:'first-yes',
 redactedSummary:'Would a verified milk sourcing comparison be useful to the right steward?',
 consentToExport:true,reviewedByHuman:true,sourceVisibility:'eligible-for-explicit-export'};
test('consented review yields inert typed candidate',()=>{
 const r=prepareCandidate(base);
 assert.equal(r.schema,VERSION);assert.equal(r.standing,'PROPOSE_ONLY');
 for(const v of Object.values(r.authority))assert.equal(v,false);
 assert.equal(r.source.veracity,'UNVERIFIED_SELF_REPORT');
 assert.ok(!('invitationToken'in r)&&!('identity'in r));
});
test('no consent means HOLD and no source text leak',()=>{
 const r=prepareCandidate({...base,consentToExport:false});
 assert.deepEqual(Object.keys(r).sort(),['schema','standing','why']);
 assert.equal(r.standing,'HOLD_LOCAL');
});
test('no human reviewer and private origin both stay held',()=>{
 assert.equal(prepareCandidate({...base,reviewedByHuman:false}).standing,'HOLD_LOCAL');
 assert.equal(prepareCandidate({...base,sourceVisibility:'private'}).standing,'HOLD_LOCAL');
});
test('declined, delegated and unresponded seats do not cross',()=>{
 for(const status of ['declined','delegated','invited'])
  assert.equal(prepareCandidate({...base,status}).standing,'HOLD_LOCAL');
});
test('URLs, email, phone and bearer tokens are not exported',()=>{
 for(const summary of ['Email me at hello@example.org','Here is https://example.org',
 'Call 507-555-1234','Contact abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0123'])
 assert.throws(()=>prepareCandidate({...base,redactedSummary:summary}),/PRIVATE_CONTENT_REFUSED/);
});
test('cannot choose unlicensed transport or arbitrary status',()=>{
 assert.throws(()=>prepareCandidate({...base,destination:'send-message'}),/UNSUPPORTED_SEAM/);
 assert.throws(()=>prepareCandidate({...base,kind:'fulfillment.confirmed'}),/UNSUPPORTED_SEAM/);
});
test('no mutation of submitted input',()=>{
 const v={...base}; const snapshot=JSON.stringify(v);prepareCandidate(v);assert.equal(JSON.stringify(v),snapshot);
});
