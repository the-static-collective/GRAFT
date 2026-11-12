/**
 * CLI cross from native MOTIF-003 priority into GRAFT finite program synthesis.
 *
 * Reads pinned Jubilee PUBLIC contract, receives *only* permitted developer
 * counterexamples after proposing, writes a JSON-only frozen program report.
 * No arbitrary code eval, browser, remote messaging, real images or finance.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {runSyntheses} from './synthesize.mjs';
import {runAllCandidates as original016Methods} from '../capability-016/methods.mjs';

const isProgramSafeField=x=>x&&typeof x==='object'&&!Array.isArray(x);
function assertNativeProbe(proof){
 if(!isProgramSafeField(proof)||
   proof.schema!=='motif.native-affordance-priority-for-graft-017/v1'||
   proof.status!=='SOURCE_VERIFIED_STRUCTURAL_HINT_ONLY'||
   proof.native_source_commit!=='66d27cfbd077b2c91d0d86d66e320206d88d8f95'||
   proof.original_file_git_blob_sha1!=='db25da0d50a9c8e2cd87aa576a22f969405737cf'||
   proof.executed_original_motif_003_analyze_first_moves!==true||
   proof.executed_original_motif_003_select_first_move!==true||
   proof.classicalTypedHeuristicCouldMatchThisOrdering!==true||
   proof.arbitraryProgramSynthesisProved!==false||
   proof.realWorldAuthority!==false||
   !Array.isArray(proof.escapeOperatorPriority)||
   JSON.stringify([...proof.escapeOperatorPriority].sort())!==
     JSON.stringify(['angles','entities','raw']))
  throw new Error('Native structural source provenance or allowed primitive order invalid');
 return proof.escapeOperatorPriority;
}
export async function createResearchReport(spec,proof,sourceRoot){
 const priority=assertNativeProbe(proof);
 if(!sourceRoot)throw new Error('Jubilee source directory required');
 const root=resolve(sourceRoot);
 const {makeUnwrittenSpec}=await import(pathToFileURL(
  resolve(root,'labs/penny-puddle-017/contract.mjs')).href);
 const {revealOneDevelopmentCounterexample}=await import(pathToFileURL(
  resolve(root,'labs/penny-puddle-017/development.mjs')).href);
 const {makeCapabilityExperiment}=await import(pathToFileURL(
  resolve(root,'labs/penny-puddle-016/laboratory.mjs')).href);
 if(JSON.stringify(makeUnwrittenSpec())!==JSON.stringify(spec))
   throw new Error('Public fixture differs from independently authored source');
 const report=runSyntheses(spec,priority,revealOneDevelopmentCounterexample);
 // Actual existing 016 source is consulted as a fixed WHOLE-METHOD catalog
 // baseline. None has the NEW 017 per-card data index & ARIA label contract.
 // This is a deliberately limited retrieval control, not the best classical
 // program-synthesis comparison.
 const priorSpec=makeCapabilityExperiment();
 priorSpec.caseStories.ordinary=structuredClone(spec.publicCases[0].story);
 const catalog=original016Methods(priorSpec);
 const found=catalog.candidates.filter(c=>{
  const html=c.outputs.ordinary.html;
  return html.includes('aria-label="Story card 1"')&&
    html.includes('data-index="1"');
 }).map(x=>x.methodId);
 report.nativeMotifStructuralProbe={
   sourceVerifiedByPinnedCheckout:true,
   native03SourceBlob:proof.original_file_git_blob_sha1,
   priorityFromActualOriginalMOTIF:priority,
   native03HighestAffordanceFirst:proof.first_native_operator,
   structuralHeuristicNotEmpiricalSafety:true
 };
 report.existingWholeMethodCatalog={
  source:'actual-GRAFT-016-methods.mjs',
  existingMethodCount:catalog.candidates.length,
  complete017RequirementMatches:found.length,
  matchingNames:found,
  notStrongEnoughToClaimNovelMath:true
 };
 return report;
}
export async function writeResearchReport(spec,probe,sourceRoot,newDirectory){
 const report=await createResearchReport(spec,probe,sourceRoot);
 const dir=resolve(newDirectory);
 await mkdir(dir,{recursive:false});
 await writeFile(join(dir,'generated-method-report.json'),
   JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 return {
  status:'LOCAL-FROZEN-DSL-REPORT-WRITTEN',
  artifact:'generated-method-report.json',
  createdOnlyJson:true,
  methodWasGeneratedAsTypedAST:true,
  realContacts:0,realMoneyMovedCents:0,
  codeAdmittedToProduction:false
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const a=process.argv.slice(2);
  if(a.length!==6||a[0]!=='--request'||a[2]!=='--priority'||a[4]!=='--out')
   throw new Error('Usage: node cross.mjs --request /path/public-spec.json --priority /path/native-motif.json --out /new/unused/local-dir');
  const sourceRoot=process.env.JUBILEE_SOURCE_ROOT;
  if(!sourceRoot)throw new Error('Source-pinned Jubilee path unavailable');
  const raw=await readFile(resolve(a[1]),'utf8');
  const priorityRaw=await readFile(resolve(a[3]),'utf8');
  if(raw.length>11000||priorityRaw.length>11000)
   throw new Error('Unexpectedly large research input');
  const result=await writeResearchReport(JSON.parse(raw),JSON.parse(priorityRaw),
   sourceRoot,a[5]);
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
 }catch(e){
  process.stderr.write('HOLD: '+String(e.message||e)+'\n');process.exitCode=1;
 }
}
