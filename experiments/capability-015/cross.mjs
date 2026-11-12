#!/usr/bin/env node
/**
 * GRAFT 015 local-only adapter: read one explicitly selected synthetic
 * proposal JSON and write an independently tested offline HTML card + receipt.
 * Never contacts people, deploys a website, admits code, moves funds or
 * changes any other repository. Refuses overwriting any existing directory.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildLocalCandidate} from './compiler.mjs';

function assertFileArgs(args){
 if(args.length!==4||args[0]!=='--request'||args[2]!=='--out'||
  !args[1]||!args[3])throw new Error(
   'Usage: node cross.mjs --request /path/request.json --out /new/local/directory');
 return {request:resolve(args[1]),out:resolve(args[3])};
}
export async function writeGraftKit(request,out){
 if(!out||typeof out!=='string')throw new TypeError('Explicit local output path required');
 const result=buildLocalCandidate(request); // validate BEFORE any file write
 const dir=resolve(out);
 await mkdir(dir,{recursive:false});
 await writeFile(resolve(dir,'offline-story-card.html'),result.html,{flag:'wx'});
 await writeFile(resolve(dir,'capability-receipt.json'),
  JSON.stringify(result.receipt,null,2)+'\n',{flag:'wx'});
 return {status:'LOCAL_ARTIFACT_FILES_WRITTEN',directory:dir,
  ...result.receipt,remoteSideEffects:0,peopleContacted:0,
  ownerConsentToAnyActualRights:false};
}
const executed=process.argv[1]&&
  resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(executed){
 try{
  const flags=assertFileArgs(process.argv.slice(2));
  const buffer=await readFile(flags.request,'utf8');
  if(buffer.length>6000)throw new Error('No oversized or real-world source import');
  const request=JSON.parse(buffer);
  const witness=await writeGraftKit(request,flags.out);
  process.stdout.write(JSON.stringify(witness,null,2)+'\n');
 }catch(e){
  process.stderr.write('HOLD: '+String(e.message||e)+'\n');
  process.exitCode=1;
 }
}
