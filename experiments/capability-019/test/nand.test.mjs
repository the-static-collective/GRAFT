import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {readFile,readdir,rm} from 'node:fs/promises';
import {candidateCircuits,executeNandCircuit} from '../nand.mjs';
import {synthesizeOne} from '../synthesize.mjs';
import {conductGateResearch,writeGateResearch} from '../cross.mjs';

const jubilee=process.env.JUBILEE_SOURCE_ROOT;
const nativeFile=process.env.MOTIF_PRIORITY_FILE;
if(!jubilee||!nativeFile)
 throw new Error('Exact source-pinned Jubilee and original native MOTIF-003 evidence required');
const fromSource=async relative=>import(pathToFileURL(resolve(jubilee,
 'labs/penny-puddle-019/'+relative+'.mjs')).href);
const contract=await fromSource('contract');
const sourceDevelopment=await fromSource('development');
const originalVerifier=await fromSource('verify');
const originalIndependent=await fromSource('independent');
const originalHeldout=await fromSource('heldout');
const native=JSON.parse(await readFile(resolve(nativeFile),'utf8'));
const spec=()=>contract.makeGateChallenge();
const research=async()=>conductGateResearch(spec(),native,jubilee);

test('source-pinned original MOTIF-003 measured ACTUAL two-gate NAND-affordance functions',()=>{
 assert.equal(native.sourceCommit,'66d27cfbd077b2c91d0d86d66e320206d88d8f95');
 assert.equal(native.originalAnalyzeFirstMovesExecuted,true);
 assert.equal(native.originalSelectFirstMoveExecuted,true);
 assert.equal(native.nativeHighestAffordanceGate,'choose-01');
 assert.deepEqual(native.nativeFirstGatePriority,[[0,1],[0,0],[1,1]]);
 assert.deepEqual(native.computedTwoStepDistinctJointInfluenceCounts,{
  'choose-00':2,'choose-01':4,'choose-11':2
 });
 assert.equal(native.noXorCircuitSuppliedToNativeModel,true);
 assert.equal(native.classicalSemanticSearchCouldUseSameMetric,true);
});
test('GRAFT and independent Jubilee both enumerate 3 + 18 + 180 old NAND programs, with 0 valid target circuits',()=>{
 const counts=[1,2,3].map(n=>[...candidateCircuits(n)].length);
 assert.deepEqual(counts,[3,18,180]);
 assert.equal(originalIndependent.minimalCircuitProof(3).checkedCircuitCount,201);
 assert.equal(originalIndependent.minimalCircuitProof(3).matchesFound,0);
 assert.equal(counts.reduce((a,b)=>a+b,0),201);
});
test('two actual GRAFT searches synthesize same complete four-gate NAND-only method, absent from inputs',async()=>{
 const r=await research();
 assert.equal(r.runs.length,2);
 const [nativeRun,classical]=r.runs;
 assert.equal(nativeRun.strategy,'motif-003-reachable-affordances');
 assert.equal(classical.strategy,'classical-exhaustive');
 assert.deepEqual(nativeRun.selectedCircuit,classical.selectedCircuit);
 assert.deepEqual(classical.selectedCircuit.gates,
   [[0,1],[0,2],[1,2],[3,4]]);
 assert.equal(nativeRun.candidateEvaluations,731);
 assert.equal(classical.candidateEvaluations,1571);
 assert.equal(nativeRun.attempts.length,3);
 assert.equal(classical.attempts.length,3);
 assert.deepEqual(classical.attempts.filter(x=>!x.developmentPass)
   .map(x=>x.counterexample.id),[
     'previously-unseen-10','previously-unseen-11'
   ]);
 assert.equal(classical.selectedCircuit.gates.length,4);
 assert.equal(spec().publicExamples.length,2);
});
test('independent source-owned verifier replays every reported candidate count, not just final answers',async()=>{
 const r=await research();
 const v=originalVerifier.verifyGateLaboratory(spec(),r);
 assert.equal(v.status,'TESTED-NAND-ONLY-DERIVED-MACRO-PROPOSE-ONLY');
 assert.equal(v.finiteOldBudgetImpossibility.checkedCircuitCount,201);
 assert.equal(v.verifiedRuns[0].candidateEvaluationsIndependentlyReproduced,731);
 assert.equal(v.verifiedRuns[1].candidateEvaluationsIndependentlyReproduced,1571);
 assert.equal(v.bothPathsConvergeOnSameGateCircuit,true);
 assert.equal(v.newConditionalGoldOrRentAgreements,0);
 assert.equal(v.realMoneyMovedCents,0);
});
test('generated Boolean macro passes unseen 3-input transfer, requiring eight NAND gates',async()=>{
 const r=await research();
 for(const run of r.runs){
  const frozen=originalHeldout.scoreFrozenTransfer(run.selectedCircuit);
  assert.equal(frozen.allPassed,true);
  assert.equal(frozen.finalThreeInputChecks,8);
  assert.equal(frozen.transferChecksPassed,8);
  assert.equal(frozen.twoInputChecksPassed,4);
  assert.equal(run.selectedCircuit.gates.length*2,8);
 }
 assert.equal(executeNandCircuit(r.runs[0].selectedCircuit,[0,1]),1);
 assert.equal(executeNandCircuit(r.runs[0].selectedCircuit,[1,1]),0);
});
test('counterexamples are concrete, not inferred preferences; forged money and wrong source fail',async()=>{
 const r=await research();
 const broken=structuredClone(r);
 broken.runs[1].attempts[0].counterexample.expected=0;
 assert.equal(originalVerifier.verifyGateLaboratory(spec(),broken).status,
  'HOLD-INDEPENDENT-VERIFICATION-FAILED');
 const extra=structuredClone(r);
 extra.realFinancialTransactionsCents=30000;
 assert.equal(originalVerifier.verifyGateLaboratory(spec(),extra).status,
  'HOLD-INDEPENDENT-VERIFICATION-FAILED');
 const badNative=structuredClone(native);
 badNative.originalAnalyzeFirstMovesExecuted=false;
 await assert.rejects(()=>conductGateResearch(spec(),badNative,jubilee),/Source-pinned original MOTIF/);
 const swapped=structuredClone(r);
 swapped.runs.reverse();
 assert.equal(originalVerifier.verifyGateLaboratory(spec(),swapped).status,
  'HOLD-INDEPENDENT-VERIFICATION-FAILED');
 assert.equal(sourceDevelopment.firstFailedDevelopmentCase(r.runs[0].selectedCircuit),null);
});
test('the only generated deliverable is inert JSON; no JS source, network, contract or binary is executed',async()=>{
 const dest=join(tmpdir(),'graft-019-'+randomUUID());
 try{
  const s=await writeGateResearch(spec(),native,jubilee,dest);
  assert.equal(s.writesInertJsonOnly,true);
  assert.equal(s.actualMoneyMovedCents,0);
  assert.deepEqual(await readdir(dest),['gate-research-report.json']);
  const output=JSON.parse(await readFile(join(dest,'gate-research-report.json'),'utf8'));
  assert.equal(originalVerifier.verifyGateLaboratory(spec(),output).status,
   'TESTED-NAND-ONLY-DERIVED-MACRO-PROPOSE-ONLY');
  await assert.rejects(()=>writeGateResearch(spec(),native,jubilee,dest),/EEXIST/);
 }finally{await rm(dest,{recursive:true,force:true});}
});
