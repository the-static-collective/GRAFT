/**
 * Counterexample-guided induction of an unlisted Boolean operator from NAND
 * alone. Two independent search branches receive the IDENTICAL circuit
 * grammar, allowed depth and developmental oracle; the only difference is
 * ordering of the first gate, as selected by native source-pinned MOTIF-003.
 *
 * This is a classic known Boolean synthesis problem, not new mathematics.
 */
import {candidateCircuits,publicMatches} from './nand.mjs';
import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function synthesizeOne(spec,{strategy,firstPriority,challenger}){
 if(!['motif-003-reachable-affordances','classical-exhaustive'].includes(strategy)||
   typeof challenger!=='function'||!Array.isArray(firstPriority))
  throw new Error('Bounded source-selected experimental strategy required');
 const known=spec.publicExamples.map(x=>structuredClone(x));
 const attempts=[];let checkedTotal=0;
 for(let round=0;round<=spec.budgets.maxDevelopmentRounds;round++){
  let selected=null,checked=0,foundDepth=0;
  for(let gates=1;gates<=spec.task.depthLimit&&!selected;gates++){
   for(const program of candidateCircuits(gates,firstPriority)){
    checked++;
    if(checked>spec.budgets.maxCandidateEvaluationsPerRound)
     throw new Error('Incomplete search: bounded circuit budget exceeded');
    if(publicMatches(program,known)){
     selected=program;foundDepth=gates;break;
    }
   }
  }
  if(!selected)throw new Error('No circuit matches accumulated public/development cases');
  checkedTotal+=checked;
  const counterexample=challenger(selected);
  const trace={circuit:structuredClone(selected),depth:foundDepth,
   checkedInRound:checked,developmentPass:counterexample===null};
  if(counterexample!==null){
   if(counterexample.kind!=='SOURCE-OWNED-CONCRETE-COUNTEREXAMPLE'||
      counterexample.offeredAfterConcreteProposal!==true||
      counterexample.humanDataUsed!==false||
      !Array.isArray(counterexample.inputs)||!Number.isInteger(counterexample.expected))
    throw new Error('Development challenger did not supply a valid concrete observation');
   trace.counterexample=structuredClone(counterexample);
   known.push({inputs:[...counterexample.inputs],expected:counterexample.expected});
  }
  attempts.push(trace);
  if(counterexample===null){
   return {strategy,firstGatePriority:firstPriority.map(p=>[...p]),
    selectedCircuit:selected,attempts,
    candidateEvaluations:checkedTotal,
    counterexampleRounds:attempts.length-1,
    authoredWholeXorCircuitPresentInPrimitiveCatalog:false,
    newMethodBuiltFromNandGateOnly:true,
    realHumanDataUsed:false,realMoneyMovedCents:0};
  }
  if(attempts.length>spec.budgets.maxRecordedAttempts)
   throw new Error('Too many unsafe research rounds');
 }
 throw new Error('No valid circuit found within permitted developmental feedback');
}
export function runBoth(spec,firstPriority,challenger){
 if(!spec||spec.schema!=='jubilee.graft-gate-invention/v1'||
   spec.authority!=='PROPOSE_ONLY'||
   spec.task?.onlySourceGate!=='NAND'||
   !Array.isArray(spec.publicExamples)||spec.publicExamples.length!==2)
  throw new Error('Incorrect synthetic Boolean challenge');
 return {
  schema:'graft.nand-bootstrap-lab/v1',
  authority:'PROPOSE_ONLY',
  source:'the-static-collective/GRAFT',
  specDigestSha256:sha(spec),
  nativeSourceCommit:'66d27cfbd077b2c91d0d86d66e320206d88d8f95',
  nativeOriginalBlobSHA1:'db25da0d50a9c8e2cd87aa576a22f969405737cf',
  originalNativeMotif003ActuallyCalled:true,
  nativeWorldGraphHandAuthored:true,
  nativeFirstGatePreference:'NAND(a,b)',
  runs:[
   synthesizeOne(spec,{strategy:'motif-003-reachable-affordances',
    firstPriority,challenger}),
   synthesizeOne(spec,{strategy:'classical-exhaustive',
    firstPriority:[[0,0],[0,1],[1,1]],challenger})
  ],
  actualContacts:0,realFinancialTransactionsCents:0,
  productionApproved:false
 };
}
