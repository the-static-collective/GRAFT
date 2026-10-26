/**
 * FIELD-RETURN-001 · BananaGram's witness request membrane.
 *
 * In this portable UI there are NO verified identities, Campfire members, owner
 * database reads, real-world delivery witnesses or independently signed receipts.
 * Consequently this file can PREPARE a request and assess a claimed snapshot,
 * but can NEVER mark an actual outcome CONFIRMED.
 *
 * Mirrors BananaSpork FIELD-SPECIMEN-001 and RETURN-OF-THE-HELP-SLIP-001:
 * report != confirmation; record ID != physical occurrence;
 * ambiguous multi-Campfire confirmation != sum; subset != whole source request.
 */
export const REQUEST_SCHEMA='bananagram.field-witness-request/v0';
export const INSPECT_SCHEMA='bananagram.field-evidence-review/v0';
const CONTACT=/[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}|https?:\/\/|www\.|(?:^|[^\w])[a-z0-9_-]{43}(?:[^\w]|$)/i;
function safe(v,min,max){
 if(typeof v!=='string')throw Error('FIELD_TEXT_REQUIRED');
 const s=v.trim().replace(/\s+/g,' ');
 if(s.length<min||s.length>max||/[\u0000-\u001f\u007f]/.test(v))throw Error('FIELD_TEXT_LENGTH');
 if(CONTACT.test(s))throw Error('PRIVATE_CONTACT_REFUSED');
 return s;
}
function number(x){
 if(typeof x!=='number'||!Number.isFinite(x)||x<0)throw Error('NONNEGATIVE_QUANTITY_REQUIRED');
 return x;
}
const almost=(a,b)=>Math.abs(a-b)<=Number.EPSILON*Math.max(1,Math.abs(a),Math.abs(b))*8;
/** A question that can be given to an authorized steward, never a command. */
export function prepareFieldRequest(forest,{
 reviewApproved=false,ask='',whatWouldProveIt='',uncertainty=''
}={}){
 if(forest?.standing!=='REVIEWED_PACKET_UNPUBLISHED' ||
  forest?.graph?.schema!=='free-graph.packet/v0' ||
  forest?.authority?.verifiedFulfillment!==false)
  throw Error('REVIEWED_FOREST_REQUIRED');
 if(reviewApproved!==true)return Object.freeze({
  schema:REQUEST_SCHEMA,standing:'HOLD_NO_REQUEST_APPROVAL'
 });
 const question=safe(forest.question,12,240);
 const text=safe(ask,12,240);
 const proof=safe(whatWouldProveIt,12,240);
 const fog=safe(uncertainty,12,240);
 return Object.freeze({
  schema:REQUEST_SCHEMA,standing:'REQUEST_DRAFT_UNSENT',
  sourcePacketId:safe(forest.graph.packet_id,10,96),
  question,request:text,evidenceQuestion:proof,unresolved:fog,
  status:'NO_OWNER_OR_RECIPIENT_VERIFIED',
  noClaimOfPhysicalProvision:true,
  nextHumanGate:'An actual authorized steward chooses whether to review this question.',
  authority:{stewardConsented:false,requestDelivered:false,
   helperReportConfirmed:false,receiptVerified:false,
   supplyDelivered:false,sharedPublicly:false}
 });
}
/**
 * Inspect a manually transcribed snapshot from a proposed source.
 * A snapshot, even with an apparent receipt ID, is NOT verified by this app:
 * owner-current authentication + receipt binding must happen in NanaSpork.
 *
 * Source requirements are independent; links must not multiply demand.
 * The return reports conservative evidence-state, not a canonical count.
 */
export function inspectClaimedEvidence(request,{
 stewardResponse='not-asked',requirement='',requestedUnits=0,unit='',
 helperReportedUnits=0,links=[],statusFresh=false,
 ownerReceiptClaim='',independentRecipientConfirmation=false
}={}){
 if(request?.schema!==REQUEST_SCHEMA||request.standing!=='REQUEST_DRAFT_UNSENT')
  throw Error('FIELD_REQUEST_REQUIRED');
 if(!['not-asked','declined','accepted-to-review','no-need'].includes(stewardResponse))
  throw Error('INVALID_STEWARD_RESPONSE');
 if(!Array.isArray(links)||links.length>8)throw Error('TOO_MANY_LINKS');
 const q=safe(requirement,5,160),label=safe(unit,1,36);
 const target=number(requestedUnits),reported=number(helperReportedUnits);
 const seen=new Map(),warnings=[],counts=[];
 let allAttributable=links.length>0;
 for(const link of links){
  if(!link||typeof link!=='object')throw Error('BAD_SOURCE_LINK');
  const confirmed=number(link.claimedConfirmedUnits);
  counts.push(confirmed);
  const occurrences=link.occurrences;
  if(!Array.isArray(occurrences)||!occurrences.length){
   if(confirmed>0)allAttributable=false;
   continue;
  }
  let subTotal=0;
  for(const occ of occurrences){
   if(!occ||typeof occ!=='object')throw Error('BAD_OCCURRENCE');
   const ref=safe(occ.occurrenceRef,4,96),n=number(occ.confirmedUnits);
   if(n===0)throw Error('ZERO_OCCURRENCE_REFUSED');
   subTotal+=n;
   if(seen.has(ref)&&!almost(seen.get(ref),n)){
    allAttributable=false;warnings.push('CONFLICTING_OCCURRENCE_AMOUNT');
   }else seen.set(ref,n);
  }
  if(!almost(subTotal,confirmed)){
   allAttributable=false;warnings.push('OCCURRENCE_TOTAL_MISMATCH');
  }
 }
 let lowerBound=0,basis='none',exact=false;
 if(links.length===1){
  lowerBound=counts[0];basis='single-link';exact=true;
 }else if(links.length>1&&allAttributable){
  lowerBound=[...seen.values()].reduce((x,y)=>x+y,0);
  basis='deduplicated-occurrences';exact=true;
 }else if(links.length>1){
  lowerBound=Math.max(...counts);
  basis='ambiguous-multi-link-lower-bound';exact=false;
  warnings.push('CONFIRMATIONS_NOT_SAFELY_SUMMABLE');
 }
 if(stewardResponse==='declined'||stewardResponse==='no-need'){
  // Respect refusal or lack of need without turning a report into an action.
  return Object.freeze({schema:INSPECT_SCHEMA,
   standing:'STOP_OR_RETURN_TO_AUTHOR',stewardResponse,
   question:request.question,proposedRequirement:q,
   quantity:{unit:label,requested:target,helperReported:reported,
    claimedConfirmationLowerBound:lowerBound,confirmedUnitsExact:exact,
    confirmationBasis:basis,residualUpperBound:exact?Math.max(target-lowerBound,0):null},
   warnings:[...warnings,'NO_FURTHER_ACTION_WITHOUT_NEW_PERMISSION'],
   ownerReceiptReviewed:false,physicalProvisionVerified:false,
   humanDecision:'Do not contact suppliers, send a new ask, or publish a success claim.'});
 }
 if(reported>0&&lowerBound===0)warnings.push('HELPER_REPORT_HAS_NO_CONFIRMATION');
 if(links.length===0)warnings.push('NO_CONFIRMATION_RECORDS');
 if(!statusFresh)warnings.push('CLAIMED_STATUS_NOT_CURRENT');
 if(!ownerReceiptClaim.trim())warnings.push('NO_OWNER_RECEIPT_REFERENCE');
 if(independentRecipientConfirmation)warnings.push('SELF_ATTESTED_RECIPIENT_CONFIRMATION_NOT_IDENTITY_VERIFIED');
 return Object.freeze({schema:INSPECT_SCHEMA,
  standing:'OWNER_RECEIPT_REVIEW_REQUIRED',
  stewardResponse,
  question:request.question,proposedRequirement:q,
  quantity:{
   unit:label,requested:target,helperReported:reported,
   claimedConfirmationLowerBound:lowerBound,
   confirmedUnitsExact:exact,
   confirmationBasis:basis,
   residualUpperBound:exact?Math.max(target-lowerBound,0):null
  },
  warnings,sourceReceiptReference:ownerReceiptClaim.trim()?safe(ownerReceiptClaim,4,96):null,
  ownerReceiptReviewed:false,physicalProvisionVerified:false,
  authorization:'NONE_FROM_THIS_PACKET',
  nextGate:'An authenticated owner must inspect the source-current receipt and actual beneficiary/recipient confirmation before any confirmation or published consequence.'
 });
}
/** Preserve public-safe observations only; never emit a verified Free Graph edge. */
export function fieldReturnNote(review,{authorReviewed=false,summary=''}={}){
 if(review?.schema!==INSPECT_SCHEMA)throw Error('FIELD_REVIEW_REQUIRED');
 if(!authorReviewed)return {standing:'HOLD_AUTHOR_REVIEW'};
 const text=safe(summary,12,240);
 return Object.freeze({
  schema:'bananagram.field-return-note/v0',
  standing:'PUBLIC_SAFE_UNVERIFIED_NOTE',
  sourceStatus:review.standing,summary:text,
  interpretation:'REPORTED_OR_UNRESOLVED_NOT_OWNER_CONFIRMED',
  graphEffect:'NONE',nextInvite:'NONE',receiptCreated:false,
  verifiedFulfillment:false
 });
}
