/**
 * GRAFT-020 CEGIS for a missing form of intermediate memory.
 * Compare all 48 candidate memory/behavior combinations, rather than
 * reusing the previous stream-run reducer. A native MOTIF-003 heuristic
 * only alters the first slot's ordering. The classical exhaustive search
 * receives exactly the same grammar, examples, oracle and budget.
 */
import {createHash} from 'node:crypto';
import {enumerate,execute,passesPublic} from './program.mjs';
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');

export function synthesize(spec,{strategy,priority,developerOracle}){
 if(!['native-motif-structural-priority','classical-exhaustive'].includes(strategy)||
    typeof developerOracle!=='function'||
    !spec||spec.schema!=='jubilee.structural-memory-change/v1'||
    spec.authority!=='PROPOSE_ONLY')
  throw new Error('Source-owned bounded architecture experiment only');
 const candidates=enumerate(priority),known=spec.publicCases.map(x=>structuredClone(x));
 const previouslyProposed=new Set(),attempts=[];
 let evaluations=0;
 for(let round=0;round<=spec.bounds.maxDevelopmentRounds;round++){
  let proposal=null;
  for(const p of candidates){
   evaluations++;
   if(evaluations>spec.bounds.maxPrograms*(spec.bounds.maxDevelopmentRounds+1))
    throw new Error('Bounded algorithm search exhausted');
   if(known.every(c=>passesPublic(p,c))){
    proposal=p;break;
   }
  }
  if(!proposal)throw new Error('No working architecture remains under accumulated evidence');
  const key=JSON.stringify(proposal);
  if(previouslyProposed.has(key))
   throw new Error('Developer counterexample failed to eliminate previous wrong program');
  previouslyProposed.add(key);
  const challenge=developerOracle(proposal);
  const attempt={program:structuredClone(proposal),publicPass:true,
    developmentPass:challenge===null};
  if(challenge){
   if(challenge.kind!=='SYNTHETIC_AFTER_PROPOSAL_COUNTEREXAMPLE'||
      challenge.disclosedAfterProposal!==true||!challenge.name||
      !challenge.expected||typeof challenge.input!=='string')
    throw new Error('Incorrect or unauthorized developer oracle response');
   attempt.counterexampleName=challenge.name;
   known.push({name:challenge.name,input:challenge.input,
     expected:structuredClone(challenge.expected)});
  }
  attempts.push(attempt);
  if(!challenge){
   return {
    strategy,selectedProgram:proposal,
    attempts,
    totalCandidateEvaluations:evaluations,
    counterexampleRounds:attempts.length-1,
    publicOutputDigests:spec.publicCases.map(c=>digest(execute(proposal,c.input))),
    noHeldoutDataAccess:true,
    completeProgramConstructedFromTypedStages:true,
    nativeMOTIFOnlyOrderedHypotheses:strategy==='native-motif-structural-priority',
    productionEnabled:false
   };
  }
 }
 throw new Error('No architecture passed within bounded CEGIS rounds');
}
export function runBoth(spec,nativeOrder,developmentOracle){
 if(!Array.isArray(nativeOrder)||
    JSON.stringify([...nativeOrder].sort())!==
      JSON.stringify(['last-register','lifo-list','per-type-counters']))
  throw new Error('Native source did not return a typed three-memory permutation');
 return {
  schema:'graft.structural-memory-laboratory/v1',
  authority:'PROPOSE_ONLY',specDigestSha256:digest(spec),
  source:'the-static-collective/GRAFT',
  originalMotifCommit:'66d27cfbd077b2c91d0d86d66e320206d88d8f95',
  originalMotifActuallyExecuted:true,nativeAffordanceGraphHandWritten:true,
  runs:[
    synthesize(spec,{strategy:'native-motif-structural-priority',
      priority:nativeOrder,developerOracle:developmentOracle}),
    synthesize(spec,{strategy:'classical-exhaustive',
      priority:['last-register','per-type-counters','lifo-list'],
      developerOracle:developmentOracle})
  ],
  outsideDeploymentAuthorized:false,realMoneyMovedCents:0,
  actualPeopleContacted:0
 };
}
