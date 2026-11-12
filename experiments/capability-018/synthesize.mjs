/**
 * Bounded counterexample-guided discovery of the omitted primitive.
 *
 * The existing full 017 document renderer is held constant; GRAFT searches
 * five independently implemented candidate computations and tests which
 * ones actually produce correct content-derived counts. The old language
 * cannot do this. The candidates are existing standard JS operations; this
 * does not claim any entirely unprecedented algorithm.
 */
import {createHash} from 'node:crypto';
import {modes,descriptor,runPrimitive,candidatePassesExample} from './primitive.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const recognized=new Set(['motif-affordance-priority','classical-exhaustive']);
export function synthesizeMode(spec,{strategy,orderedModes,developerChallenge}){
 if(!recognized.has(strategy)||typeof developerChallenge!=='function'||
    !Array.isArray(orderedModes)||orderedModes.length!==modes.length||
    JSON.stringify([...orderedModes].sort())!==JSON.stringify([...modes].sort()))
  throw new Error('Exact typed candidate vocabulary and external challenger required');
 const known=spec.publicExamples.map(x=>structuredClone(x));
 const attempts=[],evaluated=new Set();
 let searchEvaluations=0;
 for(let round=0;round<=spec.bounds.maxDevelopmentRounds;round++){
  let candidate=null;
  for(const mode of orderedModes){
   searchEvaluations++;
   if(searchEvaluations>spec.bounds.maxPrograms*(spec.bounds.maxDevelopmentRounds+1))
    throw new Error('Unbounded search');
   const proposed=descriptor(mode);
   if(known.every(c=>candidatePassesExample(proposed,c,spec.baseMethod))){
    candidate=proposed;break;
   }
  }
  if(!candidate)throw new Error('No source-known primitive satisfies observed evidence');
  if(evaluated.has(candidate.mode))
    throw new Error('New counterexample did not eliminate the previously refuted candidate');
  evaluated.add(candidate.mode);
  // Only the AFTER-PROPOSAL challenger can expose a case that was absent
  // from public source; no hidden final-only case is ever imported.
  const feedback=developerChallenge(candidate);
  const trace={method:candidate,publicPass:true,developmentPass:feedback===null};
  if(feedback!==null){
   if(!feedback.id||!feedback.story||!Array.isArray(feedback.expectedCounts)||
      feedback.offeredAfterProposal!==true||feedback.noHumanData!==true)
    throw new Error('Malformed or unauthorized counterexample');
   trace.counterexampleId=feedback.id;
   known.push({
    name:feedback.id,story:structuredClone(feedback.story),
    expectedCounts:[...feedback.expectedCounts]
   });
  }
  attempts.push(trace);
  if(feedback===null){
   return {
    strategy,selectedMethod:candidate,
    attempts,counterexampleRounds:attempts.length-1,
    searchEvaluations,
    publicOutputHashes:spec.publicExamples.map(c=>
      sha(runPrimitive(candidate,c.story,spec.baseMethod).html)),
    selectedFromTypedKnownAPIs:true,
    noUnrestrictedCodeExecuted:true,
    noActualPersonContacted:true
   };
  }
 }
 throw new Error('No primitive passes within the allowed experimental rounds');
}
export function runBoth(spec,priority,developerChallenge){
 if(!spec||spec.schema!=='jubilee.graft-missing-primitive/v1'||
    spec.authority!=='PROPOSE_ONLY'||spec.publicExamples?.length!==2||
    !Array.isArray(priority)||priority.length!==modes.length)
  throw new Error('Source-owned bounded challenge required');
 return {
  schema:'graft.missing-primitive-laboratory/v1',
  authority:'PROPOSE_ONLY',
  specDigestSha256:sha(JSON.stringify(spec)),
  source:'the-static-collective/GRAFT',
  nativeMotifOriginalCommit:'66d27cfbd077b2c91d0d86d66e320206d88d8f95',
  nativeSourceVerified:true,
  runs:[
    synthesizeMode(spec,{
      strategy:'motif-affordance-priority',
      orderedModes:priority,developerChallenge
    }),
    synthesizeMode(spec,{
      strategy:'classical-exhaustive',
      orderedModes:[...modes],developerChallenge
    })
  ],
  realPeopleContacted:0,realMoneyMovedCents:0,
  authorizedProductionDeployment:false
 };
}
