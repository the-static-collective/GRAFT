import {createGram,addTrace,addTension,linkNearby,selectFirstYes,makeReturn,formatCard} from '../gram/portable-gram.mjs';
let g=createGram({
 sourceRef:'garden:milkbridge001',kind:'question',
 need:'Verify whether a food shelf faces a change to its available milk sourcing, before suggesting any solution.',
 offeringBack:'If helpful, share a public-safe learning after steward review. No obligation.',
 ifThisSucceeds:'The authorized buyer can compare appropriate sourcing options and make a well-grounded choice.',
 question:'Would a private fifteen-minute comparison actually save the buyer time?'
});
g=addTrace(g,{statement:'A conversation raised a possible change to grant-supported milk; amount and dates not verified.',sourceType:'heard_from_someone'});
g=addTension(g,{oneView:'Some milk funding could expire',
 otherView:'Other purchasing routes may remain available',
 unresolvedQuestion:'Which actual program, allocation and ordering category applies?'});
g=linkNearby(g,{verb:'makes_possible',targetRef:'garden:seventable001',
 why:'A consenting table participant might know who can answer the next question.'});
const plan=selectFirstYes(g,{selected:true,
 prepareNow:'Make an empty worksheet comparing available milk procurement options.',
 permissionQuestion:'Ask the food shelf steward whether one limited comparison would genuinely help.',
 proofOfReturn:'The steward replies yes, no, or not yet; record no claim of supply.'});
const ret=makeReturn(g,{reviewed:true,
 fruit:'A synthetic working example and comparison worksheet proposal were prepared; no actual milk bought.',
 seed:'A willing steward could authorize a verified purchasing comparison.',
 compost:'Unverified assumptions about grant expiration and actual quantities remain open.'});
console.log(formatCard(g,ret));
console.log('\n--- FIRST YES · LOCAL PLAN ONLY ---\n'+JSON.stringify(plan,null,2));
