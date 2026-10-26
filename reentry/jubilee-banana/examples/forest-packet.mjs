import {composeForest,nextInvitation} from '../forest/forest-projection.mjs';
import {writeFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';

// Fictional author-approved public-safe redaction; no real field claim.
const candidate={
 schema:'graft/participation-bridge-candidate-v0',standing:'PROPOSE_ONLY',
 source:{opaqueRef:'gram:fictional:r2',veracity:'UNVERIFIED_SELF_REPORT',scope:'REVIEWED_REDACTION'},
 candidate:{kind:'question',summary:'Would a willing food shelf steward welcome a neutral milk sourcing worksheet?'},
 authority:{canonicalWrite:false,publicationApproved:false}
};
const result=await composeForest(candidate,{
 authorReviewed:true,exportConsent:true,
 fruit:'A hypothetical blank worksheet was drafted; no milk was purchased or delivered.',
 seed:'Would an authorized buyer like to review the unknowns in a sourcing comparison?'
},webcrypto);
if(result.standing!=='REVIEWED_PACKET_UNPUBLISHED')throw Error('INVALID_PROJECTION');
const json=JSON.stringify(result.graph,null,2)+'\n';
const path=process.argv[2];
if(path){writeFileSync(path,json);console.log('Wrote portable Free Graph seed packet to',path);}
else console.log(json);
if(process.argv.includes('--invite')){
 const invitation=nextInvitation(result,{title:'The Next Table · Milk Questions',
  purpose:'Would an authorized buyer like to review the unknowns in a sourcing comparison?',
  date:'2026-11-03',approved:true},webcrypto);
 console.log(JSON.stringify({standing:invitation.standing,card:invitation.card,authority:invitation.authority}));
}
