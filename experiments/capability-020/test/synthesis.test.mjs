import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {enumerate,execute,passesPublic} from '../program.mjs';
import {constructResearch,writeFrozenResearch,verifyOriginalNative} from '../cross.mjs';

const root=process.env.JUBILEE_SOURCE_ROOT;
const priorityFile=process.env.MOTIF_PRIORITY_FILE;
if(!root||!priorityFile)throw new Error('Exact original source-pinned Jubilee and MOTIF output required');
const module=async x=>import(pathToFileURL(resolve(root,
 'labs/penny-puddle-020/'+x+'.mjs')).href);
const contract=await module('contract'),independent=await module('independent');
const developer=await module('development'),heldout=await module('heldout');
const receiver=await module('verify');
const native=JSON.parse(await readFile(resolve(priorityFile),'utf8'));
const spec=()=>contract.challenge(),research=()=>constructResearch(spec(),native,root);

test('48 actual complete program ASTs are made from typed primitive choices; none is prelisted as winner',()=>{
 const candidates=enumerate();
 assert.equal(candidates.length,48);
 assert.equal(new Set(candidates.map(x=>JSON.stringify(x))).size,48);
 assert.equal(candidates.every(x=>contract.assertProgram(x)),true);
 assert.equal(spec().existingLibrary.correctArchitectureProvidedAsWholeProgram,false);
 assert.equal(spec().publicCases.length,3);
});
test('actual source-owned original 019 stream-reduction library is inspected and does not emit nested-pair witnesses',async()=>{
 const report=await research();
 assert.equal(report.actualOldLibraryControl.prior019ProgramsActuallyExecuted,48);
 assert.equal(report.actualOldLibraryControl.priorProgramOutputsMatchingNewWitnessType,0);
 assert.equal(independent.oldLibraryTypeGap().original019WholeProgramsExecuted,48);
});
test('original native MOTIF-003 deliberately preferred a wrong memory architecture; evidence must repair it',async()=>{
 const priority=verifyOriginalNative(native);
 assert.equal(native.executedOriginalAnalyzeFirstMoves,true);
 assert.equal(native.firstHypothesis,'try-per-type-counters');
 assert.equal(priority[0],'per-type-counters');
 const r=await research(),result=r.runs[0];
 assert.equal(result.strategy,'native-motif-structural-priority');
 assert.equal(result.selectedProgram.stages[0].choice,'lifo-list');
 assert.ok(result.counterexampleRounds>=1);
 assert.ok(result.attempts.some(x=>x.developmentPass===false));
 assert.ok(result.attempts.some(x=>x.counterexampleName==='cross-nesting-is-invalid'));
});
test('strong classical exhaustive CEGIS has identical grammar, examples and feedback; both produce the same valid program',async()=>{
 const report=await research(),[motif,classic]=report.runs;
 assert.equal(classic.strategy,'classical-exhaustive');
 assert.deepEqual(classic.selectedProgram,motif.selectedProgram);
 assert.equal(motif.selectedProgram.stages[1].choice,'correct-type');
 assert.equal(motif.selectedProgram.stages[2].choice,'require-empty');
 assert.equal(motif.selectedProgram.stages[3].choice,'sticky-reject');
 assert.equal(motif.selectedProgram.stages[4].choice,'matched-indices');
 assert.ok(classic.attempts.length>1);
});
test('a single last-opening register passes friendly cases but fails actual nested structure',()=>{
 const wrong=enumerate().find(x=>{
  const stage=Object.fromEntries(x.stages.map(s=>[s.slot,s.choice]));
  return stage.memory==='last-register'&&
    stage.match==='any-closer'&&stage.end==='allow-unclosed'&&
    stage.invalid==='ignore'&&stage.emit==='matched-indices';
 });
 assert.ok(wrong);
 assert.equal(spec().publicCases.every(c=>passesPublic(wrong,c)),true);
 const failed=developer.revealFirstCounterexample(wrong);
 assert.equal(failed.name,'nested-different-types');
 assert.equal(failed.disclosedAfterProposal,true);
 assert.deepEqual(failed.expected.pairs,[[0,3,'()'],[1,2,'[]']]);
});
test('source-owned independent parser and GRAFT runtime agree exactly on ten frozen cases',async()=>{
 const report=await research();
 for(const run of report.runs){
  const program=run.selectedProgram;
  for(const c of heldout.cases){
   assert.deepEqual(execute(program,c.input),independent.interpret(program,c.input),c.name);
   assert.deepEqual(execute(program,c.input),c.expected,c.name);
   assert.deepEqual(execute(program,c.input),independent.classicalStackReference(c.input),c.name);
  }
  assert.equal(heldout.examineAfterFreeze(program).passed,10);
 }
});
test('post-freeze 5,461-string exhaustive bracket battery matches a DIRECT classical stack parser',async()=>{
 const report=await research();
 const winners=report.runs.map(x=>x.selectedProgram);
 let visited=0;
 function check(prefix,depth){
  const expected=independent.classicalStackReference(prefix);
  for(const program of winners){
   assert.deepEqual(execute(program,prefix),expected,prefix);
   assert.deepEqual(independent.interpret(program,prefix),expected,prefix);
  }
  visited++;
  if(depth<6)for(const mark of ['(',')','[',']'])check(prefix+mark,depth+1);
 }
 check('',0);
 assert.equal(visited,1+4+16+64+256+1024+4096);
});
test('post-freeze long-range nesting tests reach the exact forty-token input bound',async()=>{
 const r=await research(),winners=r.runs.map(x=>x.selectedProgram);
 const cases=[
  '('.repeat(20)+')'.repeat(20),
  '['.repeat(20)+']'.repeat(20),
  '(['.repeat(10)+'])'.repeat(10),
  '(['.repeat(9)+'([)]'+'])'.repeat(9),
  ')'+ '('.repeat(19)+')'.repeat(20),
  '()[]'.repeat(10)
 ];
 assert.equal(cases.every(x=>x.length===40),true);
 for(const s of cases){
  const expected=independent.classicalStackReference(s);
  for(const program of winners){
   assert.deepEqual(execute(program,s),expected,s);
   assert.deepEqual(independent.interpret(program,s),expected,s);
  }
 }
 assert.equal(independent.classicalStackReference(cases[0]).valid,true);
 assert.equal(independent.classicalStackReference(cases[3]).valid,false);
 assert.equal(independent.classicalStackReference(cases[4]).valid,false);
});

test('the recipient verifies technique but correctly DOES NOT invent a new creditor agreement or economic usefulness',async()=>{
 const report=await research(),result=receiver.verifyArchitecture(spec(),report);
 assert.equal(result.status,'TESTED-NEW-TO-LIBRARY-MEMORY-ARCHITECTURE-PROPOSE-ONLY');
 assert.equal(result.independentlyVerifiedRuns.length,2);
 assert.equal(result.independentlyVerifiedRuns.every(x=>x.heldout.passed===10),true);
 assert.deepEqual(result.chosenMemoryRepresentations,['lifo-list','lifo-list']);
 assert.equal(result.newCONCORDEconomicPaths,0);
 assert.equal(result.addedEconomicAgreements,0);
 assert.equal(result.realPeopleContacted,0);
 assert.equal(result.realMoneyMovedCents,0);
 assert.equal(result.productionAdmitted,false);
 assert.equal(result.fundamentalAlgorithmicNovelty,false);
});
test('forged output hashes, false source claims and imaginary money are rejected',async()=>{
 const report=await research();
 report.runs[0].publicOutputDigests[0]='0'.repeat(64);
 assert.equal(receiver.verifyArchitecture(spec(),report).status,'HOLD-invalid-structure-proof');
 const bad=await research();bad.realMoneyMovedCents=30000;
 assert.equal(receiver.verifyArchitecture(spec(),bad).status,'HOLD-invalid-structure-proof');
 const fake={...native,graphIsHandAuthored:false};
 assert.throws(()=>verifyOriginalNative(fake),/provenance/);
 const forged=await research();
 forged.runs[1].attempts[0].counterexampleName='invented-failure';
 assert.equal(receiver.verifyArchitecture(spec(),forged).status,'HOLD-invalid-structure-proof');
});
test('outputs only inert frozen JSON evidence to a new directory without auto-executing a generated source file',async()=>{
 const output=join(tmpdir(),'graft-020-'+randomUUID());
 try{
  const w=await writeFrozenResearch(spec(),native,root,output);
  assert.equal(w.inertJSONOnly,true);
  assert.equal(w.olderProgramsExecuted,48);
  assert.equal(w.realMoneyMovedCents,0);
  assert.deepEqual(await readdir(output),['structure-report.json']);
  const frozen=JSON.parse(await readFile(join(output,'structure-report.json'),'utf8'));
  assert.equal(receiver.verifyArchitecture(spec(),frozen).status,
    'TESTED-NEW-TO-LIBRARY-MEMORY-ARCHITECTURE-PROPOSE-ONLY');
  await assert.rejects(()=>writeFrozenResearch(spec(),native,root,output),/EEXIST/);
 }finally{await rm(output,{recursive:true,force:true});}
});
