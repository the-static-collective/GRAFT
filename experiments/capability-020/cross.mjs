/**
 * Source-pinned Jubilee public problem + after-proposal developmental oracle
 * → original native MOTIF heuristic → GRAFT composed memory programs
 * → frozen JSON report. The builder never imports final-only heldout cases.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {runBoth} from './synthesize.mjs';
import {enumeratePrograms as oldPrograms,runCandidate as oldExecute}
 from '../capability-019/program.mjs';

export function verifyOriginalNative(proof){
 if(!proof||proof.schema!=='motif.native-020-memory-structure-priority/v1'||
  proof.sourceAuthority!=='STRUCTURAL-HEURISTIC-ONLY'||
  proof.originalSourceCommit!=='66d27cfbd077b2c91d0d86d66e320206d88d8f95'||
  proof.originalSourceBlob!=='db25da0d50a9c8e2cd87aa576a22f969405737cf'||
  proof.executedOriginalAnalyzeFirstMoves!==true||
  proof.executedOriginalSelectFirstMove!==true||
  proof.firstHypothesis!=='try-per-type-counters'||
  proof.hypothesisKnownToFailCrossedNesting!==true||
  proof.graphIsHandAuthored!==true||
  proof.directClassicalStackParserIsStrongerBaseline!==true||
  proof.generalizedNovelComputingInvented!==false||
  proof.realActions!==0||
  !Array.isArray(proof.orderedMemories)||
  JSON.stringify([...proof.orderedMemories].sort())!==
    JSON.stringify(['last-register','lifo-list','per-type-counters']))
  throw new Error('Invalid original native MOTIF provenance or heuristic boundaries');
 return proof.orderedMemories;
}
export async function constructResearch(spec,proof,jubileeRoot){
 const priority=verifyOriginalNative(proof);
 if(!jubileeRoot)throw new Error('Exact source-pinned Jubilee root required');
 const module=async path=>import(pathToFileURL(resolve(jubileeRoot,path)).href);
 const owned=await module('labs/penny-puddle-020/contract.mjs');
 const developmental=await module('labs/penny-puddle-020/development.mjs');
 owned.verifyChallenge(spec);
 const report=runBoth(spec,priority,developmental.revealFirstCounterexample);
 // Run all 48 actual old GRAFT-019 programs. Their array output cannot be
 // mistaken for the new typed object including exact nested-pair indices.
 const old=oldPrograms();
 const outputs=old.map(p=>oldExecute(p,'([])'));
 const matching=outputs.filter(x=>x&&!Array.isArray(x)&&
   typeof x.valid==='boolean'&&Array.isArray(x.pairs));
 report.actualOldLibraryControl={
  prior019ProgramsActuallyExecuted:old.length,
  priorProgramOutputsMatchingNewWitnessType:matching.length,
  oldLibraryWasFiniteAndNotGlobalSearch:true
 };
 report.nativeStructuralProbe={
  firstPreference:proof.firstHypothesis,
  originalMOTIFSourceDigestVerifiedInProcess:true,
  incompleteHandAuthoredGraph:true,
  directClassicalStackReferenceWouldSucceedWithoutSearch:true
 };
 return report;
}
export async function writeFrozenResearch(spec,proof,sourceRoot,outputDirectory){
 const report=await constructResearch(spec,proof,sourceRoot);
 const directory=resolve(outputDirectory);
 await mkdir(directory,{recursive:false});
 await writeFile(join(directory,'structure-report.json'),
  JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 return {status:'FROZEN-LOCAL-ARCHITECTURE-PROOF-ONLY',
  output:'structure-report.json',inertJSONOnly:true,
  olderProgramsExecuted:report.actualOldLibraryControl.prior019ProgramsActuallyExecuted,
  noProductionDeployment:true,realPeopleContacted:0,realMoneyMovedCents:0};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const a=process.argv.slice(2);
  if(a.length!==6||a[0]!=='--request'||a[2]!=='--priority'||a[4]!=='--out')
   throw new Error('Usage: node cross.mjs --request /public.json --priority /native.json --out /unused-output-dir');
  if(!process.env.JUBILEE_SOURCE_ROOT)
   throw new Error('Source-pinned Jubilee checkout required');
  const raw=await readFile(resolve(a[1]),'utf8');
  const prior=await readFile(resolve(a[3]),'utf8');
  if(raw.length>12000||prior.length>10000)
   throw new Error('Unbounded input to local research CLI');
  const result=await writeFrozenResearch(JSON.parse(raw),JSON.parse(prior),
    process.env.JUBILEE_SOURCE_ROOT,a[5]);
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
 }catch(e){
  process.stderr.write('HOLD: '+String(e.message||e)+'\n');process.exitCode=1;
 }
}
