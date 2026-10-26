import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {composeForest} from '../forest/forest-projection.mjs';
import {prepareFieldRequest,inspectClaimedEvidence,fieldReturnNote} from '../witness/field-return.mjs';
const c={
 schema:'graft/participation-bridge-candidate-v0',standing:'PROPOSE_ONLY',
 source:{scope:'REVIEWED_REDACTION',veracity:'UNVERIFIED_SELF_REPORT'},
 candidate:{summary:'Would a willing steward want a small food sourcing comparison?'},
 authority:{canonicalWrite:false,publicationApproved:false}
};
const options={authorReviewed:true,exportConsent:true,
 fruit:'A sample worksheet was drafted with no food delivered.',
 seed:'Would a willing buyer want to review the current milk ordering arrangements?'};
const response={reviewApproved:true,ask:'Would a food shelf purchaser be willing to verify one milk ordering question?',
 whatWouldProveIt:'An owner-authenticated receipt tied to a distinct confirmed provision occurrence.',
 uncertainty:'No grant end date or physical delivery has been independently verified.'};
const setup=async()=>{
 const f=await composeForest(c,options,webcrypto);
 return prepareFieldRequest(f,response);
};
test('a consented Forest produces only an unsent human witness request',async()=>{
 const forest=await composeForest(c,options,webcrypto);
 assert.equal(prepareFieldRequest(forest,{...response,reviewApproved:false}).standing,'HOLD_NO_REQUEST_APPROVAL');
 const request=prepareFieldRequest(forest,response);
 assert.equal(request.standing,'REQUEST_DRAFT_UNSENT');
 assert.ok(Object.values(request.authority).every(x=>x===false));
 assert.equal(request.noClaimOfPhysicalProvision,true);
 assert.equal(request.status,'NO_OWNER_OR_RECIPIENT_VERIFIED');
});
test('helper report does not reduce residual or confirm physical milk',async()=>{
 const r=inspectClaimedEvidence(await setup(),{
  stewardResponse:'accepted-to-review',requirement:'Milk procurement question',
  requestedUnits:100,unit:'cartons',helperReportedUnits:80,links:[],statusFresh:false
 });
 assert.equal(r.standing,'OWNER_RECEIPT_REVIEW_REQUIRED');
 assert.equal(r.quantity.claimedConfirmationLowerBound,0);
 assert.equal(r.quantity.residualUpperBound,null); // no links: unknown, not a zero receipt
 assert.ok(r.warnings.includes('HELPER_REPORT_HAS_NO_CONFIRMATION'));
 assert.equal(r.physicalProvisionVerified,false);
 assert.equal(r.ownerReceiptReviewed,false);
});
test('two Campfires with duplicate physical occurrence refs never double count',async()=>{
 const r=inspectClaimedEvidence(await setup(),{
  stewardResponse:'accepted-to-review',requirement:'Milk procurement question',
  requestedUnits:100,unit:'cartons',helperReportedUnits:80,
  links:[
   {claimedConfirmedUnits:24,occurrences:[{occurrenceRef:'receipt:occ-1',confirmedUnits:24}]},
   {claimedConfirmedUnits:24,occurrences:[{occurrenceRef:'receipt:occ-1',confirmedUnits:24}]}
  ],statusFresh:true,ownerReceiptClaim:'owner:example-a'
 });
 assert.equal(r.quantity.claimedConfirmationLowerBound,24);
 assert.equal(r.quantity.confirmationBasis,'deduplicated-occurrences');
 assert.equal(r.quantity.confirmedUnitsExact,true);
 assert.equal(r.quantity.residualUpperBound,76);
 assert.equal(r.physicalProvisionVerified,false);
});
test('distinct occurrence refs may add but remain claims until owner verification',async()=>{
 const r=inspectClaimedEvidence(await setup(),{
  requirement:'Milk procurement question',requestedUnits:40,unit:'cartons',
  links:[
   {claimedConfirmedUnits:12,occurrences:[{occurrenceRef:'receipt:occ-1',confirmedUnits:12}]},
   {claimedConfirmedUnits:8,occurrences:[{occurrenceRef:'receipt:occ-2',confirmedUnits:8}]}
  ],statusFresh:true,ownerReceiptClaim:'owner:receipt-id'
 });
 assert.equal(r.quantity.claimedConfirmationLowerBound,20);
 assert.equal(r.quantity.residualUpperBound,20);
 assert.equal(r.ownerReceiptReviewed,false);
});
test('ambiguous multi-link becomes conservative lower bound, never exact summed total',async()=>{
 const r=inspectClaimedEvidence(await setup(),{
  requirement:'Milk procurement question',requestedUnits:50,unit:'cartons',
  links:[{claimedConfirmedUnits:30,occurrences:[]},
         {claimedConfirmedUnits:25,occurrences:[]}],
 });
 assert.equal(r.quantity.claimedConfirmationLowerBound,30);
 assert.equal(r.quantity.confirmedUnitsExact,false);
 assert.equal(r.quantity.residualUpperBound,null);
 assert.ok(r.warnings.includes('CONFIRMATIONS_NOT_SAFELY_SUMMABLE'));
});
test('conflicting same physical occurrence cannot count as distinct proof',async()=>{
 const r=inspectClaimedEvidence(await setup(),{
  requirement:'Milk procurement question',requestedUnits:50,unit:'cartons',
  links:[{claimedConfirmedUnits:30,occurrences:[{occurrenceRef:'receipt:occ-1',confirmedUnits:30}]},
         {claimedConfirmedUnits:35,occurrences:[{occurrenceRef:'receipt:occ-1',confirmedUnits:35}]}]
 });
 assert.equal(r.quantity.confirmedUnitsExact,false);
 assert.equal(r.quantity.claimedConfirmationLowerBound,35);
 assert.ok(r.warnings.includes('CONFLICTING_OCCURRENCE_AMOUNT'));
});
test('declined or no-need is an honored stopping point',async()=>{
 for(const value of ['declined','no-need']){
  const r=inspectClaimedEvidence(await setup(),{
   stewardResponse:value,requirement:'Milk procurement question',
   requestedUnits:30,unit:'cartons'
  });
  assert.equal(r.standing,'STOP_OR_RETURN_TO_AUTHOR');
  assert.equal(r.physicalProvisionVerified,false);
  assert.ok(r.warnings.includes('NO_FURTHER_ACTION_WITHOUT_NEW_PERMISSION'));
 }
});
test('public return text stays unverified; contact details refused',async()=>{
 const r=inspectClaimedEvidence(await setup(),{
  requirement:'Milk procurement question',requestedUnits:30,unit:'cartons'
 });
 assert.equal(fieldReturnNote(r,{authorReviewed:false}).standing,'HOLD_AUTHOR_REVIEW');
 const note=fieldReturnNote(r,{authorReviewed:true,
  summary:'A purchasing question remains unresolved; no supply has been confirmed.'});
 assert.equal(note.graphEffect,'NONE');
 assert.equal(note.verifiedFulfillment,false);
 assert.throws(()=>fieldReturnNote(r,{authorReviewed:true,summary:'Email me at test@example.org'}),/PRIVATE_CONTACT_REFUSED/);
});
