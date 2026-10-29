import {createHash} from 'node:crypto';
// GRAFT is a nursery, not a Git branch creator or publication gate.
const hash=x=>'sha256:'+createHash('sha256').update(JSON.stringify(x)).digest('hex');
const only=(v,fields)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join('|')===fields.slice().sort().join('|');
const fail=(p,why)=>{if(!p)throw Error('GRAFT_CULTURE_HOLD: '+why)};
const SHA=/^sha256:[a-f0-9]{64}$/;
export function proposeCultureGraft(packet,triage,registry){
 fail(only(registry,['schema','updated','policy','candidates','legacy_synthetic_demos','adapters'])&&
  registry.schema==='graft.donor-code-registry/v1'&&registry.policy.donor_history_imported===false&&
  registry.policy.raw_witness_data_imported===false&&registry.policy.secret_policy==='keys_must_not_be_published',
  'ORIGINAL_NURSERY_POLICY');
 fail(packet?.schema==='cannon.culture-reuse-offer/v1'&&SHA.test(packet.identity)&&
  packet.truth?.fictional===true&&Object.entries(packet.truth).every(([k,v])=>k==='fictional'||v===false)&&
  Object.values(packet.effects??{}).every(x=>x===0),'UNAUTHORIZED_CULTURE_SOURCE');
 fail(only(triage,['schema','culturePacket','planId','planSource','indexEdition','selection','relation',
  'ownerGate','blockedBy','disposition','sourceOwnerApproved','planUpdated','fieldVerified',
  'thirdPartyApproved','executionAllowed','networkSent','authority','triageId'])&&
  triage.schema==='planz.culture-return-triage/v1'&&
  triage.culturePacket===packet.identity&&SHA.test(triage.triageId)&&
  triage.disposition==='HOLD_FOR_PLAN_OWNER_REVIEW'&&triage.authority==='NONE'&&
  triage.executionAllowed===false&&triage.sourceOwnerApproved===false&&
  triage.planUpdated===false&&triage.networkSent===false,'TRIAGE_SOURCE_NOT_HELD');
 fail(only(packet.proposal,['kind','title','candidateMethod','suggestedUse'])&&
  packet.proposal.kind==='REUSABLE_CULTURAL_METHOD_CANDIDATE'&&
  typeof packet.proposal.candidateMethod==='string'&&packet.proposal.candidateMethod.length<=240,
  'NO_BOUNDED_METHOD');
 const body={schema:'graft.culture-nursery-candidate/v1',
  parentCulture:packet.identity,parentComic:packet.source.comicSha256,
  parentPress:packet.source.pressReceipt,returnCrossing:packet.source.crossing,
  planReview:triage.triageId,planId:triage.planId,
  proposedMethod:packet.proposal.candidateMethod,
  proposedNextUse:packet.proposal.suggestedUse,
  ancestry:'SOURCE_LINKED_NO_IMPORTED_GIT_HISTORY',
  capacity:'OPTIONAL_UNTESTED_CULTURAL_METHOD',
  status:'HELD_BRANCH_CANDIDATE_NOT_A_BRANCH',
  ownerConsent:'UNKNOWN',fieldEffect:'NONE',rights:'UNREVIEWED',
  branchCreated:false,codeImported:false,publication:false,
  independentReceiverDecision:'AWAITING_OWNER_REVIEW',
  trust:'SUPPLIED_PACKET_HASHES_ARE_NOT_HUMAN_SIGNATURE_VERIFICATION',
  nextGate:'Ask the original project owner and an intended recipient to independently review one bounded proposed use.'};
 return {...body,candidateId:hash(body)};
}
