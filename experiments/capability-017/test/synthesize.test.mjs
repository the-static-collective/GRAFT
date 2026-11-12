import test from 'node:test';
import assert from 'node:assert/strict';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {allPrograms,renderProgram} from '../primitives.mjs';
import {runSyntheses,synthesizeOne} from '../synthesize.mjs';
import {createResearchReport,writeResearchReport} from '../cross.mjs';

const root=process.env.JUBILEE_SOURCE_ROOT;
const priorityPath=process.env.MOTIF_PRIORITY_FILE;
if(!root||!priorityPath)throw new Error('Pinned original Jubilee source and actual native MOTIF output are required');
const importJ=async p=>import(pathToFileURL(resolve(root,p)).href);
const contract=await importJ('labs/penny-puddle-017/contract.mjs');
const independent=await importJ('labs/penny-puddle-017/independent.mjs');
const developer=await importJ('labs/penny-puddle-017/development.mjs');
const evaluator=await importJ('labs/penny-puddle-017/evaluation.mjs');
const native=JSON.parse(await readFile(resolve(priorityPath),'utf8'));
const spec=()=>contract.makeUnwrittenSpec();
const inspect=async()=>createResearchReport(spec(),native,root);

test('the built program was NOT provided as a whole method; finite 72-combination grammar expands new ASTs',()=>{
 const programs=allPrograms();
 assert.equal(programs.length,72);
 assert.equal(new Set(programs.map(x=>JSON.stringify(x))).size,72);
 const actual=allPrograms(native.escapeOperatorPriority);
 assert.equal(actual.length,72);
 assert.equal(actual[0].stages[0].choice,'entities');
 assert.equal(actual.every(x=>contract.validateTypedProgram(x,spec())),true);
 assert.equal(spec().publicCases.length,2);
 assert.equal(native.executed_original_motif_003_analyze_first_moves,true);
 assert.equal(native.first_native_operator,'choose-entities');
});
test('native MOTIF-003 branch ordering and classical exhaustive baseline solve the same development tests',async()=>{
 const report=await inspect();
 assert.equal(report.runs.length,2);
 const [motif,classic]=report.runs;
 assert.equal(motif.strategy,'motif-structural-priority');
 assert.equal(classic.strategy,'classical-exhaustive');
 assert.equal(motif.selectedProgram.stages[0].choice,'entities');
 assert.equal(classic.selectedProgram.stages[0].choice,'entities');
 assert.deepEqual(motif.selectedProgram,classic.selectedProgram);
 assert.equal(motif.counterexampleRounds,0);
 assert.equal(classic.counterexampleRounds,1);
 assert.equal(classic.attempts[0].developmentPass,false);
 assert.equal(classic.attempts[0].counterexampleName,'active-markup-and-ampersand');
 assert.ok(motif.programsEvaluated<classic.programsEvaluated);
 assert.equal(report.nativeMotifStructuralProbe.sourceVerifiedByPinnedCheckout,true);
 assert.equal(report.existingWholeMethodCatalog.existingMethodCount,3);
 assert.equal(report.existingWholeMethodCatalog.complete017RequirementMatches,0);
});
test('source-owned independent Jubilee evaluator passes all FOUR final-only cases for both programs',async()=>{
 const report=await inspect();
 const verdict=evaluator.verifyUnwrittenLaboratory(spec(),report);
 assert.equal(verdict.status,'TESTED-SYNTHESIZED-METHOD-PROPOSE-ONLY');
 assert.equal(verdict.allHeldoutPassed,true);
 assert.equal(verdict.verified.length,2);
 assert.equal(verdict.verified.every(x=>x.finalHeldout.heldoutCasesPassed===4),true);
 assert.equal(verdict.conditionalOptionsBefore,0);
 assert.equal(verdict.conditionalOptionsAfter,1);
 assert.equal(verdict.actualMoneyMovedCents,0);
 assert.equal(verdict.actualServicesDelivered,0);
 assert.equal(verdict.addedToGraftProduction,false);
});
test('generated GRAFT runtime bytes match an independent Jubilee interpreter, including escaped hostile text',async()=>{
 const report=await inspect();
 const p=report.runs[0].selectedProgram;
 const hostile=developer.developmentCases[0].story;
 const rendered=renderProgram(p,hostile);
 const independently=independent.independentRun(p,hostile,spec());
 assert.equal(rendered,independently);
 assert.equal(rendered.includes('&lt;script&gt;'),true);
 assert.equal(rendered.includes('&amp;'),true);
 assert.equal(rendered.includes('<script>'),false);
 assert.equal(developer.revealOneDevelopmentCounterexample(p),null);
});
test('raw first attempt is an observed, retained failure; fixing it does not silently redefine the goal',async()=>{
 const report=await inspect(),old=report.runs[1].attempts[0];
 assert.equal(old.program.stages[0].choice,'raw');
 assert.equal(old.publicPass,true);
 assert.equal(old.developmentPass,false);
 assert.equal(developer.revealOneDevelopmentCounterexample(old.program).name,
   old.counterexampleName);
 assert.equal(independent.qualitySummary(
   old.program,spec().publicCases).passing,true);
 assert.equal(contract.makeUnwrittenSpec().objective.escapeUntrustedText,true);
});
test('tampering selected program, report hashes or native proof cannot grant a new right',async()=>{
 const report=await inspect();
 report.runs[0].publicOutputHashes[0]='0'.repeat(64);
 assert.equal(evaluator.verifyUnwrittenLaboratory(spec(),report).status,
  'HOLD-INVALID-METHOD-EVIDENCE');
 const bad=structuredClone(native);
 bad.realWorldAuthority=true;
 await assert.rejects(()=>createResearchReport(spec(),bad,root),/Native structural/);
 const other=await inspect();
 other.realMoneyMovedCents=30000;
 assert.equal(evaluator.verifyUnwrittenLaboratory(spec(),other).status,
  'HOLD-INVALID-METHOD-EVIDENCE');
});
test('actual GRAFT output is an inert JSON program and proof, never an unsafe HTML or auto-deployment',async()=>{
 const folder=join(tmpdir(),'graft-017-'+randomUUID());
 try{
  const write=await writeResearchReport(spec(),native,root,folder);
  assert.equal(write.createdOnlyJson,true);
  assert.equal(write.codeAdmittedToProduction,false);
  assert.deepEqual(await readdir(folder),['generated-method-report.json']);
  const report=JSON.parse(await readFile(join(folder,'generated-method-report.json'),'utf8'));
  assert.equal(evaluator.verifyUnwrittenLaboratory(spec(),report).allHeldoutPassed,true);
  await assert.rejects(()=>writeResearchReport(spec(),native,root,folder),/EEXIST/);
 }finally{await rm(folder,{recursive:true,force:true});}
});
