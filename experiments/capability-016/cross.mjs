#!/usr/bin/env node
/**
 * Explicit local experiment execution. Writes ONE JSON report containing
 * every candidate's synthetic test bytes. It does NOT write the deliberately
 * unsafe renderer result to an executable .html file.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runAllCandidates} from './methods.mjs';
export async function writeComparison(spec,out){
 if(!out||typeof out!=='string')throw new TypeError('Need a chosen new output directory');
 const report=runAllCandidates(spec);
 const dir=resolve(out);
 await mkdir(dir,{recursive:false});
 await writeFile(join(dir,'method-evidence.json'),
   JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 return {path:join(dir,'method-evidence.json'),
   candidateCount:report.candidates.length,
   originalHtmlFilesWritten:0,
   actualContacts:0,realFundsMovedCents:0,
   createdLocalJsonOnly:true};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const a=process.argv.slice(2);
  if(a.length!==4||a[0]!=='--request'||a[2]!=='--out')
   throw new Error('Usage: node cross.mjs --request /safe/synthetic/spec.json --out /new/dir');
  const text=await readFile(resolve(a[1]),'utf8');
  if(text.length>10000)throw new Error('Experiment inputs beyond bounded fixture scope');
  const result=await writeComparison(JSON.parse(text),a[3]);
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
 }catch(e){
  process.stderr.write('HOLD: '+(e.message||e)+'\n');process.exitCode=1;
 }
}
