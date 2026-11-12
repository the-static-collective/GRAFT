import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {enumeratePrograms,runCandidate,candidatePasses} from '../program.mjs';
import {synthesize,runBoth} from '../synthesize.mjs';
import {constructReport,writeReport,validatedNative} from '../cross.mjs';

const sourceRoot=process.env.JUBILEE_SOURCE_ROOT;
const nativePath=process.env.MOTIF_PRIORITY_FILE;
if(!sourceRoot||!nativePath)
 throw new Error('Source-pinned Jubilee code and actual original MOTIF-003 evidence required');
const get=async path=>import(pathToFileURL(resolve(sourceRoot,path)).href);
const source=await get('labs/penny-puddle-019/contract.mjs');
const dev=await get('labs/penny-puddle-019/development.mjs');
const verdict=await get('labs/penny-puddle-019/verify.mjs');
const indie=await get('labs/penny-puddle-019/independent.mjs');
const frozen=await get('labs/penny-puddle-019/heldout.mjs');
const native=JSON.parse(await readFile(resolve(nativePath),'utf8'));
const spec=()=>source.makeChallenge();
const research=()=>constructReport(spec(),native,sourceRoot);

test('a full algorithm is not prelisted; real generator enumerates 48 original primitive compositions',()=>{
 const p=enumeratePrograms();
 assert.equal(p.length,48);
 assert.equal(new Set(p.map(x=>JSON.stringify(x))).size,48);
 assert.ok(p.every(x=>source.validateProgram(x)));
 assert.equal(spec().existingLibrary.knownFullSolutionProvided,false);
 assert.deepEqual(validatedNative(native).slice().sort(),['codepoint','grapheme','utf16']);
});
test('old source-owned library is actually tested: 72 programs and five count operations cannot output RLE',async()=>{
 const r=await research();
 assert.equal(r.priorLibraryControl.executed017WholePrograms,72);
 assert.equal(r.priorLibraryControl.executed018PreviousCountOperators,5);
 assert.equal(r.priorLibraryControl.previousMethodsReturningTypedOrderedPairs,0);
 assert.equal(indie.originalLibrariesGap().missingFromOriginalCombinedFiniteCatalog,true);
});
test('native MOTIF-003 actually chose an imperfect segmentation hypothesis, requiring counterexamples to correct it',async()=>{
 assert.equal(native.executedOriginalMOTIF003,true);
 assert.equal(native.firstChoice,'choose-codepoint');
 assert.equal(native.firstChoiceKnownToBeInsufficientForZWJ,true);
 const r=await research();
 assert.equal(r.actualNativeResearch.deliberatelyWrongFirstHypothesis,'choose-codepoint');
 const m=r.runs[0];
 assert.equal(m.strategy,'native-motif-structural-order');
 assert.equal(m.selectedProgram.stages[0].choice,'grapheme');
 assert.ok(m.attempts.length>1,'An imperfect original hint should have to revise at least once');
 assert.ok(m.attempts.some(a=>a.developmentPass===false));
 assert.ok(m.counterexampleRounds>=1);
});
test('classical exhaustive search receives identical requirements, test cases and budget and can solve',async()=>{
 const r=await research();
 const [nativeRun,classical]=r.runs;
 assert.equal(classical.strategy,'classical-exhaustive');
 assert.deepEqual(classical.selectedProgram,nativeRun.selectedProgram);
 assert.equal(classical.selectedProgram.stages[1].choice,'exact');
 assert.equal(classical.selectedProgram.stages[2].choice,'increment');
 assert.equal(classical.selectedProgram.stages[3].choice,'append');
 assert.equal(classical.selectedProgram.stages[4].choice,'ordered-pairs');
 assert.ok(classical.searchEvaluations>=nativeRun.searchEvaluations);
 assert.ok(classical.attempts.some(x=>x.counterexampleId==='adjacent-equal'));
 assert.ok(classical.attempts.some(x=>x.counterexampleId==='case-must-remain-distinct'));
 assert.ok(classical.attempts.some(x=>x.counterexampleId==='joined-emoji-are-one-grapheme'));
});
test('a wrong algorithm passes public inputs and then first developer challenger finds a genuine counterexample',()=>{
 const naive=enumeratePrograms().find(p=>{
  const d=Object.fromEntries(p.stages.map(x=>[x.slot,x.choice]));
  return d.segment==='utf16'&&d.identity==='casefold'&&
   d.ifSame==='append'&&d.ifDifferent==='append'&&
   d.emit==='ordered-pairs';
 });
 assert.ok(naive);
 assert.equal(spec().publicCases.every(c=>candidatePasses(naive,c)),true);
 const counterexample=dev.firstCounterexample(naive);
 assert.equal(counterexample.id,'adjacent-equal');
 assert.equal(counterexample.onlyRevealedAfterCandidate,true);
 assert.deepEqual(counterexample.expected,[['a',2]]);
 assert.deepEqual(counterexample.actual,[['a',1],['a',1]]);
});
test('new generated 5-stage algorithm is identical under independently implemented GRAFT and Jubilee interpreters',async()=>{
 const r=await research(),program=r.runs[0].selectedProgram;
 for(const c of frozen.heldoutCases){
  const generated=runCandidate(program,c.input);
  const separately=indie.compileAndRun(program,c.input);
  assert.deepEqual(generated,separately,c.id);
  assert.deepEqual(generated,c.expected,c.id);
  assert.equal(generated.map(([x,n])=>x.repeat(n)).join(''),c.input);
 }
 assert.equal(frozen.evaluateFrozen(program).testsPassed,8);
});
test('independent receiving verifier allows one new conditional operator only after all eight tests',async()=>{
 const r=await research(),v=verdict.verifyConstruction(spec(),r);
 assert.equal(v.status,'TESTED-COMPOSED-RLE-PRIMITIVE-PROPOSE-ONLY');
 assert.equal(v.originalExpressivityGap.original017ProgramsExecuted,72);
 assert.equal(v.originalExpressivityGap.original018OperatorsExecuted,5);
 assert.equal(v.verifiedResults.every(x=>x.frozenHeldout.testsPassed===8),true);
 assert.equal(v.newConditionalOptionsBefore,0);
 assert.equal(v.newConditionalOptionsAfter,1);
 assert.equal(v.realDebtDischargedCents,0);
 assert.equal(v.realWorkPerformed,0);
 assert.equal(v.productionAdmitted,false);
 assert.equal(v.historicallyNovelAlgorithm,false);
});

test('post-freeze exhaustive small Unicode alphabet battery: 1,554 composed inputs, lossless and maximal',async()=>{
 const r=await research();
 const programs=r.runs.map(x=>x.selectedProgram);
 const alphabet=['a','A','e\\u0301','👩‍💻','🇺🇸',' '];
 const reference=text=>{
  const units=[...new Intl.Segmenter('en',{granularity:'grapheme'}).segment(text)]
    .map(x=>x.segment);
  const result=[];
  for(const unit of units){
   if(result.length&&result.at(-1)[0]===unit)result.at(-1)[1]++;
   else result.push([unit,1]);
  }
  return result;
 };
 let examined=0;
 function verifyAll(prefix,depth){
  if(depth>0){
   const expected=reference(prefix);
   for(const p of programs){
    assert.deepEqual(runCandidate(p,prefix),expected,prefix);
    assert.deepEqual(indie.compileAndRun(p,prefix),expected,prefix);
    assert.equal(indie.checkRLEProgram(p,
     {input:prefix,expected}).passed,true,prefix);
   }
   examined++;
  }
  if(depth<4)for(const unit of alphabet)verifyAll(prefix+unit,depth+1);
 }
 verifyAll('',0);
 assert.equal(examined,6+36+216+1296);
});

test('tampered output bytes, forged source provenance, and real-world financial claims all fail closed',async()=>{
 const bad=await research();bad.runs[0].publicOutputHashes[0]='f'.repeat(64);
 assert.equal(verdict.verifyConstruction(spec(),bad).status,'HOLD-invalid-primitive-proof');
 const other=await research();other.realMoneyMovedCents=30000;
 assert.equal(verdict.verifyConstruction(spec(),other).status,'HOLD-invalid-primitive-proof');
 const fakeNative={...native,sourceGraphHandAuthored:false};
 assert.throws(()=>validatedNative(fakeNative),/native source/);
 const invalid=await research();invalid.runs[0].attempts[0].counterexampleId='fraud';
 assert.equal(verdict.verifyConstruction(spec(),invalid).status,'HOLD-invalid-primitive-proof');
});
test('writes only a frozen JSON AST and evidence file, never executable code or a real payment',async()=>{
 const output=join(tmpdir(),'graft-019-'+randomUUID());
 try{
  const result=await writeReport(spec(),native,sourceRoot,output);
  assert.equal(result.onlyJSONWritten,true);
  assert.equal(result.actuallyEnumeratedOldLibrary,77);
  assert.deepEqual(await readdir(output),['constructed-primitive-report.json']);
  const r=JSON.parse(await readFile(join(output,'constructed-primitive-report.json'),'utf8'));
  assert.equal(verdict.verifyConstruction(spec(),r).status,
   'TESTED-COMPOSED-RLE-PRIMITIVE-PROPOSE-ONLY');
  await assert.rejects(()=>writeReport(spec(),native,sourceRoot,output),/EEXIST/);
 }finally{await rm(output,{recursive:true,force:true});}
});
