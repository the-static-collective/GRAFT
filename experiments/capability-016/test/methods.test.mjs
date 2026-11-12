import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {readFile,rm,readdir} from 'node:fs/promises';
import {
 sourceMethods,runCandidate,runAllCandidates,controlledDiagnostics
} from '../methods.mjs';
import {writeComparison} from '../cross.mjs';

const source=process.env.JUBILEE_SOURCE_ROOT;
if(!source)throw new Error('CI must pin authentic Jubilee code checkout to exact SHA');
const j=await import(pathToFileURL(resolve(source,'labs/penny-puddle-016/laboratory.mjs')).href);
const spec=()=>j.makeCapabilityExperiment();

test('three different real functions run on exactly the same three synthetic cases',()=>{
 const s=spec(),out=runAllCandidates(s);
 assert.deepEqual(sourceMethods(),[
  'unsafe-interpolation','escaped-compact','accessible-print']);
 assert.equal(out.candidates.length,3);
 assert.equal(out.candidates.every(x=>Object.keys(x.outputs).length===3),true);
 assert.equal(out.realHumanContactCount,0);
 assert.equal(out.externalActionAuthorization,false);
 assert.equal(out.productionAdmitted,false);
 assert.equal(out.legacy015AdversarialFalsePositive,true);
 assert.equal(out.contractFingerprintSha256,j.requestFingerprint(s));
});
test('independent recipient rejects the unsafe implementation and ranks safe accessible method highest',()=>{
 const s=spec(),out=runAllCandidates(s);
 const result=j.verifyCapabilityLaboratory(s,out);
 assert.equal(result.status,'PROPOSE_TESTED_TECHNIQUE_ONLY');
 assert.equal(result.acceptedCandidateCount,2);
 assert.equal(result.rejectedCandidateCount,1);
 assert.equal(result.candidates[0].valid,false);
 assert.ok(result.candidates[0].issues.some(x=>x.includes('offline')));
 assert.equal(result.candidates[1].valid,true);
 assert.equal(result.candidates[2].valid,true);
 assert.equal(result.selectedMethodId,'accessible-print');
 assert.ok(result.candidates[2].qualityPoints>result.candidates[1].qualityPoints);
 assert.equal(result.realMoneyMovedCents,0);
});
test('under an actual output-byte cap, choose smallest safe rather than pretend energy efficiency',()=>{
 const s=spec(),out=runAllCandidates(s);
 const baseline=j.verifyCapabilityLaboratory(s,out);
 const compact=baseline.candidates[1].cleanUtf8Bytes;
 const quality=baseline.candidates[2].cleanUtf8Bytes;
 assert.ok(compact<quality);
 const small=j.verifyCapabilityLaboratory(s,out,{budgetBytes:compact});
 assert.equal(small.selectedMethodId,'escaped-compact');
 const no=j.verifyCapabilityLaboratory(s,out,{budgetBytes:20});
 assert.equal(no.status,'HOLD-NO-METHOD-PASSED');
});
test('independent Jubilee actual 014 composer sees a new conditional technique, never rent discharge',()=>{
 const s=spec(),out=runAllCandidates(s),composed=j.recomposeAfterLaboratory(s,out);
 assert.equal(composed.priorConditionalRoutes,0);
 assert.equal(composed.newConditionalRoutes,1);
 assert.equal(composed.authorization,'PLANNING_ONLY_HOLD');
 assert.equal(composed.actualLegalDebtDischargeCents,0);
 assert.equal(composed.actualThirdPartyWorkCompleted,0);
 assert.equal(composed.admittedToProduction,false);
 assert.equal(composed.realMoneyMovedCents,0);
 assert.ok(composed.offeredOperatorIds[0].some(x=>x.includes('GRAFT-016-tested-')));
});
test('modifying output bytes cannot be hidden by a builder claiming tests passed',()=>{
 const s=spec(),out=runAllCandidates(s);
 out.candidates[2].outputs.ordinary.html+='<img src=x>';
 const proof=j.verifyCapabilityLaboratory(s,out);
 assert.equal(proof.candidates[2].valid,false);
 assert.equal(proof.selectedMethodId,'escaped-compact');
 out.productionAdmitted=true;
 assert.equal(j.verifyCapabilityLaboratory(s,out).status,'HOLD-invalid-capability-experiment');
});
test('four actual controlled render variants exist for MOTIF native diagnostic experiments',()=>{
 const out=controlledDiagnostics(spec());
 assert.equal(out.length,4);
 assert.deepEqual(out.map(x=>[x.escaped,x.printable]),[
  [false,false],[false,true],[true,false],[true,true]]);
 assert.equal(out.filter(x=>x.html.includes('@media print')).length,2);
 assert.equal(out.filter(x=>x.html.includes('<script>')).length,2);
 assert.equal(out.every(x=>x.synthetic),true);
});
test('method runner only writes JSON evidence, never executable unsafe HTML',async()=>{
 const out=join(tmpdir(),'graft-016-'+randomUUID());
 try{
  const meta=await writeComparison(spec(),out);
  assert.equal(meta.createdLocalJsonOnly,true);
  assert.equal(meta.originalHtmlFilesWritten,0);
  assert.deepEqual(await readdir(out),['method-evidence.json']);
  const r=JSON.parse(await readFile(join(out,'method-evidence.json'),'utf8'));
  assert.equal(j.verifyCapabilityLaboratory(spec(),r).selectedMethodId,'accessible-print');
  await assert.rejects(()=>writeComparison(spec(),out),/EEXIST/);
 }finally{await rm(out,{recursive:true,force:true});}
});
