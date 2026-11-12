/**
 * Actual source-owned cross: native original MOTIF-003 priority (source pinned)
 * + GRAFT NAND program synthesis + independent Jubilee counterexample oracle.
 * The ONLY output is an inert JSON circuit report; no generated executable JS.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {runBoth} from './synthesize.mjs';

function verifiedNativePrior(proof){
 if(!proof||proof.schema!=='motif.native-nand-affordance-019/v1'||
   proof.status!=='SOURCE-VERIFIED-BOUNDED-HEURISTIC'||
   proof.sourceCommit!=='66d27cfbd077b2c91d0d86d66e320206d88d8f95'||
   proof.sourceBlob!=='db25da0d50a9c8e2cd87aa576a22f969405737cf'||
   proof.originalAnalyzeFirstMovesExecuted!==true||
   proof.originalSelectFirstMoveExecuted!==true||
   proof.nativeHighestAffordanceGate!=='choose-01'||
   proof.usesActualNandTruthTables!==true||
   proof.domainMetricDesignedByEngineer!==true||
   proof.classicalSemanticSearchCouldUseSameMetric!==true||
   proof.noXorCircuitSuppliedToNativeModel!==true||
   proof.noFinancialOrHumanAuthority!==true||
   JSON.stringify(proof.nativeFirstGatePriority)!==
    JSON.stringify([[0,1],[0,0],[1,1]])||
   JSON.stringify(proof.computedTwoStepDistinctJointInfluenceCounts)!==
    JSON.stringify({'choose-00':2,'choose-01':4,'choose-11':2}))
  throw new Error('Source-pinned original MOTIF evidence was not as expected');
 return proof.nativeFirstGatePriority;
}
export async function conductGateResearch(spec,priority,sourceRoot){
 const firstPairs=verifiedNativePrior(priority);
 if(!sourceRoot)throw new Error('Exact source-pinned Jubilee original checkout required');
 const root=resolve(sourceRoot);
 const jubilee=await import(pathToFileURL(
  resolve(root,'labs/penny-puddle-019/contract.mjs')).href);
 const dev=await import(pathToFileURL(
  resolve(root,'labs/penny-puddle-019/development.mjs')).href);
 jubilee.validChallenge(spec);
 const result=runBoth(spec,firstPairs,dev.firstFailedDevelopmentCase);
 result.nativeEvidence={
  originalMotifSourceBlobVerified:true,
  selectedFirstGate:priority.nativeHighestAffordanceGate,
  actualNandTwoStepJointInputCounts:priority.computedTwoStepDistinctJointInfluenceCounts,
  nonTargetSpecificStructuralHeuristic:true,
  notProofOfAlgorithmicNovelty:true
 };
 return result;
}
export async function writeGateResearch(spec,priority,sourceRoot,folder){
 const report=await conductGateResearch(spec,priority,sourceRoot);
 const dir=resolve(folder);
 await mkdir(dir,{recursive:false});
 await writeFile(join(dir,'gate-research-report.json'),
  JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 return {status:'LOCAL-NAND-CIRCUIT-REPORT-FROZEN',
  methodNotInOriginalPrimitiveLibrary:true,
  includesBothSearchStrategies:true,
  writesInertJsonOnly:true,createdActualRemoteAuthority:false,
  actualMoneyMovedCents:0,peopleContacted:0};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const a=process.argv.slice(2);
  if(a.length!==6||a[0]!=='--request'||a[2]!=='--priority'||a[4]!=='--out')
   throw new Error('Usage: node cross.mjs --request /public.json --priority /motif-003.json --out /new-unique-dir');
  if(!process.env.JUBILEE_SOURCE_ROOT)throw new Error('Jubilee source checkout required');
  const request=await readFile(resolve(a[1]),'utf8');
  const native=await readFile(resolve(a[3]),'utf8');
  if(request.length>12000||native.length>12000)
   throw new Error('Synthetic research inputs are too large');
  const out=await writeGateResearch(
   JSON.parse(request),JSON.parse(native),
   process.env.JUBILEE_SOURCE_ROOT,a[5]);
  process.stdout.write(JSON.stringify(out,null,2)+'\n');
 }catch(e){
  process.stderr.write('HOLD: '+String(e.message||e)+'\n');
  process.exitCode=1;
 }
}
