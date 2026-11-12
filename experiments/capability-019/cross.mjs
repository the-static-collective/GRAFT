/**
 * GRAFT-019 cross-repository research writer.
 *
 * Reads ONLY the Jubilee-owned public spec and developer oracle. Original
 * native MOTIF source computes the first-stage branch order separately.
 * Final Jubilee heldout cases are not imported until a frozen output exists.
 *
 * Only a benign JSON AST/evidence file is written, in a new directory.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {runBoth} from './synthesize.mjs';
import {enumeratePrograms,runCandidate} from './program.mjs';
import {allPrograms as prior017,renderProgram as render017} from '../capability-017/primitives.mjs';
import {descriptor as oldDescriptor,runPrimitive as old018} from '../capability-018/primitive.mjs';

export function validatedNative(p){
 if(!p||p.schema!=='motif.native-019-tokenizer-order/v1'||
    p.authority!=='STRUCTURAL_BRANCH_ORDER_ONLY'||
    p.originalCommit!=='66d27cfbd077b2c91d0d86d66e320206d88d8f95'||
    p.originalBlob!=='db25da0d50a9c8e2cd87aa576a22f969405737cf'||
    p.executedOriginalMOTIF003!==true||
    p.executedNativeSelectFirstMove!==true||
    p.firstChoiceKnownToBeInsufficientForZWJ!==true||
    p.firstChoice!=='choose-codepoint'||
    p.sourceGraphHandAuthored!==true||
    p.classicalHeuristicCouldMatchOrOutperform!==true||
    p.generatedNewAlgorithmAutonomously!==false||
    p.realWorldActions!==0||
    !Array.isArray(p.candidateOrder)||
    JSON.stringify([...p.candidateOrder].sort())!==
     JSON.stringify(['codepoint','grapheme','utf16']))
  throw new Error('Rejected native source provenance or unapproved branch selection');
 return p.candidateOrder;
}
async function imports(root){
 if(!root)throw new Error('Exact source-pinned Jubilee checkout required');
 const from=async path=>import(pathToFileURL(resolve(root,path)).href);
 return {
  contract:await from('labs/penny-puddle-019/contract.mjs'),
  developer:await from('labs/penny-puddle-019/development.mjs'),
  prior:await from('labs/penny-puddle-018/contract.mjs')
 };
}
export async function constructReport(spec,native,sourceRoot){
 const order=validatedNative(native),src=await imports(sourceRoot);
 src.contract.validateChallenge(spec);
 const main=runBoth(spec,order,src.developer.firstCounterexample);
 // Execute original whole local library rather than simply asserting it.
 const oldStory={title:'Fictional',subtitle:'Invented',captions:['aaabbaa']};
 const oldBase=src.prior.baseMethod();
 const allOld017=prior017();
 const old017Outputs=allOld017.map(p=>render017(p,oldStory));
 const priorModes=['constant-one','utf16-units','unicode-codepoints',
  'whitespace-tokens','intl-graphemes'];
 const old018Outputs=priorModes.map(mode=>
   old018(oldDescriptor(mode),oldStory,oldBase));
 main.priorLibraryControl={
  executed017WholePrograms:allOld017.length,
  executed018PreviousCountOperators:old018Outputs.length,
  previousMethodsReturningTypedOrderedPairs:old017Outputs.filter(Array.isArray).length+
   old018Outputs.filter(Array.isArray).length,
  priorLibrarySearchWasFiniteOnly:true
 };
 main.actualNativeResearch={
  originalMOTIFSourcePinnedAndBlobVerified:true,
  priorityFromNativeMOTIF003:order,
  deliberatelyWrongFirstHypothesis:native.firstChoice,
  sourceAffordanceGraphHandWritten:true
 };
 return main;
}
export async function writeReport(spec,native,sourceRoot,output){
 const r=await constructReport(spec,native,sourceRoot);
 const dest=resolve(output);
 await mkdir(dest,{recursive:false});
 await writeFile(join(dest,'constructed-primitive-report.json'),
   JSON.stringify(r,null,2)+'\n',{flag:'wx'});
 return {status:'LOCAL-NEW-TO-LIBRARY-RLE-PROGRAM-EVIDENCE',
  onlyJSONWritten:true,
  actuallyEnumeratedOldLibrary:r.priorLibraryControl.executed017WholePrograms+
   r.priorLibraryControl.executed018PreviousCountOperators,
  generatedWholePrograms:r.runs.length,
  realPeopleMessaged:0,realMoneyMovedCents:0,sourceControlCodeUpdated:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const a=process.argv.slice(2);
  if(a.length!==6||a[0]!=='--request'||a[2]!=='--priority'||a[4]!=='--out')
   throw new Error('Usage: node cross.mjs --request /safe-public.json --priority /native.json --out /new-unused-dir');
  if(!process.env.JUBILEE_SOURCE_ROOT)
   throw new Error('Must supply exact source-pinned Jubilee checkout');
  const raw=await readFile(resolve(a[1]),'utf8');
  const nativeRaw=await readFile(resolve(a[3]),'utf8');
  if(raw.length>15000||nativeRaw.length>10000)
   throw new Error('Unexpected research fixture byte volume');
  const proof=await writeReport(JSON.parse(raw),JSON.parse(nativeRaw),
   process.env.JUBILEE_SOURCE_ROOT,a[5]);
  process.stdout.write(JSON.stringify(proof,null,2)+'\n');
 }catch(e){process.stderr.write('HOLD: '+String(e.message||e)+'\n');process.exitCode=1;}
}
