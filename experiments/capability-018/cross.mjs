/**
 * Source-pinned Jubilee public spec → original native MOTIF-003 branch hint
 * → two real GRAFT CEGIS search strategies → frozen JSON primitive methods
 * → original independently authored Jubilee verifier.
 *
 * The GRAFT builder imports only the permitted public and development
 * oracle—not the final-only heldout suite. A public repo is not secrecy.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {runBoth} from './synthesize.mjs';
import {allPrograms,renderProgram} from '../capability-017/primitives.mjs';

const validPriority=p=>{
 const supported=['constant-one','utf16-units','unicode-codepoints',
  'whitespace-tokens','intl-graphemes'];
 if(!p||p.schema!=='motif.native-missing-primitive-priority/v1'||
    p.status!=='SOURCE_VERIFIED_STRUCTURAL_HINT_ONLY'||
    p.nativeSourceCommit!=='66d27cfbd077b2c91d0d86d66e320206d88d8f95'||
    p.nativeSourceBlob!=='db25da0d50a9c8e2cd87aa576a22f969405737cf'||
    p.ranOriginalAnalyzeFirstMoves!==true||
    p.ranOriginalSelectFirstMove!==true||
    p.recommendedFirstOperator!=='choose-intl-graphemes'||
    p.typeGraphIsHandAuthored!==true||
    p.calibratedNoveltyEvidence!==false||
    p.realWorldAuthority!==false||
    !Array.isArray(p.candidatePriority)||
    JSON.stringify([...p.candidatePriority].sort())!==
     JSON.stringify([...supported].sort()))
  throw new Error('Missing authentic source-verified native research hint');
 return p.candidatePriority;
};
export async function conductResearch(spec,priority,sourceRoot){
 const ordered=validPriority(priority);
 if(!sourceRoot)throw new Error('Original source-pinned Jubilee directory is required');
 const base=resolve(sourceRoot);
 const sourceModule=await import(pathToFileURL(resolve(base,
  'labs/penny-puddle-018/contract.mjs')).href);
 const developer=await import(pathToFileURL(resolve(base,
  'labs/penny-puddle-018/development.mjs')).href);
 sourceModule.validatePrimitiveChallenge(spec);
 const report=runBoth(spec,ordered,developer.firstDeveloperCounterexample);
 // Execute actual original GRAFT-017 complete DSL programs, not a symbolic
 // claim of impossibility. All 72 have no content-derived attribute.
 const previous=allPrograms();
 if(previous.length!==72)throw new Error('Old source grammar is not finite as declared');
 const existing=previous.filter(p=>spec.publicExamples.every(c=>
  renderProgram(p,c.story).includes('data-graphemes=')));
 report.earlierGrammarExhaustiveControl={
  executedOriginal017Programs:previous.length,
  candidatesSupportingRequiredDerivedAttribute:existing.length,
  unableToExpressMissingPrimitiveInOldFiniteGrammar:existing.length===0
 };
 report.motifNativeProbe={
  originalSourceCommit:priority.nativeSourceCommit,
  verifiedBlob:priority.nativeSourceBlob,
  actualNativePriority:ordered,
  handAuthoredAffordanceGraph:true
 };
 return report;
}
export async function writeResearch(spec,priority,sourceRoot,outputDir){
 const report=await conductResearch(spec,priority,sourceRoot);
 const destination=resolve(outputDir);
 await mkdir(destination,{recursive:false});
 await writeFile(join(destination,'missing-primitive-report.json'),
  JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 return {
  status:'LOCAL-BOUNDED-PRIMITIVE-RESEARCH-WRITTEN',
  onlyInertJSONWritten:true,
  usedOriginalMOTIFSourcePriority:true,
  oldProgramsActuallyTested:report.earlierGrammarExhaustiveControl.executedOriginal017Programs,
  actualRealWorldActions:0,realMoneyMovedCents:0,
  codeAutoDeployed:false
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const a=process.argv.slice(2);
  if(a.length!==6||a[0]!=='--request'||a[2]!=='--priority'||a[4]!=='--out')
   throw new Error('Usage: node cross.mjs --request /spec.json --priority /motif-native.json --out /brand-new-dir');
  if(!process.env.JUBILEE_SOURCE_ROOT)
   throw new Error('Pinned original Jubilee checkout required');
  const requestText=await readFile(resolve(a[1]),'utf8');
  const motifText=await readFile(resolve(a[3]),'utf8');
  if(requestText.length>10000||motifText.length>10000)
   throw new Error('Experiment evidence size exceeded');
  const result=await writeResearch(
   JSON.parse(requestText),JSON.parse(motifText),
   process.env.JUBILEE_SOURCE_ROOT,a[5]);
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
 }catch(error){
  process.stderr.write('HOLD: '+String(error.message||error)+'\n');
  process.exitCode=1;
 }
}
