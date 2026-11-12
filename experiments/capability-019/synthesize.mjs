/**
 * GRAFT-019 finite counterexample-guided program synthesis.
 *
 * Only public cases are visible initially. A distinct independent
 * development counterexample is revealed AFTER an actual proposed AST.
 * Each newly revealed failure is added to the constraints. The generator
 * NEVER imports the final-only heldout cases.
 *
 * Baseline: exhaustive same DSL, same public examples, same feedback.
 * Native MOTIF-003 controls the ordering of segmenter operations only.
 */
import {createHash} from 'node:crypto';
import {enumeratePrograms,candidatePasses,runCandidate} from './program.mjs';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function assertStrat(x){
 if(!['native-motif-structural-order','classical-exhaustive'].includes(x))
  throw new Error('Unsupported source-owned research strategy');
}
export function synthesize(spec,{strategy,priority,developmentOracle}){
 assertStrat(strategy);
 if(!spec||spec.schema!=='jubilee.constructive-missing-primitive/v1'||
    spec.authority!=='PROPOSE_ONLY'||spec.publicCases?.length!==2||
    typeof developmentOracle!=='function')
  throw new Error('No speculative, non-source-owned task accepted');
 const known=spec.publicCases.map(x=>structuredClone(x));
 const possible=enumeratePrograms(priority);
 const attempts=[],previous=new Set();
 let searchEvaluations=0;
 for(let round=0;round<=spec.constraints.maxCounterexampleRounds;round++){
  let suggested=null;
  for(const p of possible){
   searchEvaluations++;
   if(searchEvaluations>spec.constraints.maxPrograms*
       (spec.constraints.maxCounterexampleRounds+1))
    throw new Error('Finite candidate-search budget exceeded');
   if(known.every(c=>candidatePasses(p,c))){
    suggested=p;break;
   }
  }
  if(!suggested)throw new Error('No program remains after counterexample evidence');
  const fingerprint=JSON.stringify(suggested);
  if(previous.has(fingerprint))
   throw new Error('The new evidence did not eliminate the failed AST');
  previous.add(fingerprint);
  const counterexample=developmentOracle(suggested);
  const attempt={
   program:structuredClone(suggested),
   publicPass:true,developmentPass:counterexample===null
  };
  if(counterexample){
   if(counterexample.kind!=='SYNTHETIC_AFTER_PROPOSAL_COUNTEREXAMPLE'||
      counterexample.onlyRevealedAfterCandidate!==true||
      !counterexample.id||!Array.isArray(counterexample.expected))
    throw new Error('Invalid developmental challenger response');
   attempt.counterexampleId=counterexample.id;
   known.push({id:counterexample.id,input:counterexample.input,
     expected:structuredClone(counterexample.expected)});
  }
  attempts.push(attempt);
  if(counterexample===null)return {
   strategy,selectedProgram:suggested,attempts,
   counterexampleRounds:attempts.length-1,
   searchEvaluations,
   publicOutputHashes:spec.publicCases.map(c=>
    sha(runCandidate(suggested,c.input))),
   usedOnlyPublicAndRevealedDevelopmentCases:true,
   generatedCompleteProgramFromStages:true,
   executedArbitraryUntrustedJavaScript:false,
   realPeopleOrMoneyTouched:false
  };
 }
 throw new Error('No proven synthesizable program within experiment bound');
}
export function runBoth(spec,motifPriority,developmentOracle){
 if(!Array.isArray(motifPriority)||
    JSON.stringify([...motifPriority].sort())!==
     JSON.stringify(['codepoint','grapheme','utf16']))
  throw new Error('Original native source did not return allowed primitive ordering');
 return {
  schema:'graft.constructive-primitive-lab/v1',
  authority:'PROPOSE_ONLY',
  specFingerprintSha256:sha(spec),
  origin:'the-static-collective/GRAFT',
  actualNativeMotif003Used:true,
  nativeOriginalCommit:'66d27cfbd077b2c91d0d86d66e320206d88d8f95',
  methodWasWholeProgramLookup:false,
  runs:[
   synthesize(spec,{strategy:'native-motif-structural-order',
    priority:motifPriority,developmentOracle}),
   synthesize(spec,{strategy:'classical-exhaustive',
    priority:['utf16','codepoint','grapheme'],developmentOracle})
  ],
  realPeopleContacted:0,realMoneyMovedCents:0,
  anyProductionDeployment:false
 };
}
