#!/usr/bin/env node
// HYPERCROSS-003: real signed Radio House result -> native JAR;VIS unmet need
// -> original LemonPRESS open-call shape -> a reviewable physical first ask.
// This command never sends, posts, recruits, or admits anything.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';

const PINS=Object.freeze({
  jarvis:'57eb58d3b4d8256ccbfaf1c9b733f1ae0e154634',
  lemonpress:'bebc328b2cb2ea44b4a34418198820aaebdf0465',
  radio:'96bb7e39d8e558ab07f3bdbf39e54dd3cdcb3aec'
});
const error=reason=>{throw Error(reason);};
function args(argv){
  if(argv.length%2)error('ARGS_MUST_BE_PAIRED');
  const keys=['proof','summary','radio-root','jarvis-root','lemonpress-root','upstream-hold','output'];
  const ret={};
  for(let i=0;i<argv.length;i+=2){
    const k=argv[i].startsWith('--')?argv[i].slice(2):null;
    if(!keys.includes(k)||Object.hasOwn(ret,k))error('UNKNOWN_OR_DUPLICATE_FLAG');
    ret[k]=argv[i+1];
  }
  for(const k of keys)if(!ret[k])error('MISSING_'+k);
  return ret;
}
function pin(path,wanted,name){
  const home=resolve(path);
  let observed;
  try{observed=execFileSync('git',['-C',home,'rev-parse','HEAD'],{encoding:'utf8',timeout:5000}).trim();}
  catch{error('MISSING_GIT_SOURCE_'+name);}
  if(observed!==wanted)error('SOURCE_DRIFT_'+name);
  return home;
}
const sha=v=>'sha256:'+createHash('sha256').update(v).digest('hex');
export function eligibleCall(record){
  if(record?.id!=='LP-OC-006'||record?.category!=='TECH'||record?.institutionalSponsor!==true||
      record?.status!=='INDEPENDENT_STATIC_COLLECTIVE_REQUEST'||
      !record.expertise?.includes('Accessibility testing')||
      !record.expertise?.includes('Web / mobile UX'))error('LEMONPRESS_OPEN_CALL_NOT_ALLOWED');
  return true;
}
function escapeHtml(s){
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
}
export function draftCall(native,heartbeat,source){
  if(native?.schema!=='graft.hypercross-native-proof-of-return/v0'||
    native?.native_ghot_radio_return_verified!==true||native.real_human_consent!==false||
    native.external_media_or_network_actions!==0||native.semantic_authority!=='NONE'||
    !/^sha256:[a-f0-9]{64}$/.test(native.parent_held_crossing_id)||
    !/^sha256:[a-f0-9]{64}$/.test(native.computed_output_sha256))
    error('INVALID_NATIVE_RETURN');
  if(heartbeat?.schema!=='jarvis.heartbeat/v0'||
    heartbeat?.current!=='DISCOVER'||heartbeat?.phases?.[0]?.status!=='unmatched'||
    heartbeat?.realWorldFulfillment!=='not-established'||heartbeat?.externalAction!==false)
    error('JARVIS_HUMAN_NEED_NOT_UNMATCHED');
  eligibleCall(source);
  return {
    schema:'graft.hypercross-human-next-question/v0',
    id:'HC003-A11Y-REVIEW-'+native.computed_output_sha256.slice(7,19),
    origin:{
      prior_signed_hold:native.parent_held_crossing_id,
      new_native_signed_crossing:native.new_signed_crossing_id,
      local_execution_receipt:native.signed_execution_receipt_id,
      verified_local_hash:native.computed_output_sha256,
      scope:'PUBLIC_SYNTHETIC_HASH_ONLY'
    },
    editorial_source:{
      corpus:'lemonPRESS original open-calls.json at pinned commit',
      existing_call_id:source.id, title:source.title,
      status:source.status, exact_commit:PINS.lemonpress,
      sponsor:'Static Collective independent prototype, NOT a client or partner vacancy'
    },
    missing_role:'One willing accessibility and privacy usability reviewer',
    first_question:'Would you try a 20-minute mobile usability test of STILL HERE, using ONLY invented scenarios, and tell us one specific obstacle to completing a private timeline and asking one human for bounded help?',
    first_action:'Review a fictional journey on a phone; write one reproducible UX issue. Do not submit names, actual survivor histories, photos, evidence, or contact details of others.',
    safe_reply:'I can review a fictional mobile flow for 20 minutes; here is the one device/interaction issue I found.',
    nonconsent:'No volunteer, recipient, institution or co-parent has been contacted. Nobody has agreed. This is not a staffed service.',
    disposition:'HOLD_EDITORIAL_AND_HUMAN_PERMISSION',
    source_status:'ORIGINAL_PUBLIC_OPEN_CALL + VERIFIED_LOCAL_SYNTHETIC_HASH',
    truthful_return:'Native computer work completed; human work has not begun.',
    automatic_publication:false,automatic_outreach:false,
    user_private_data_exported:false,
    next_owner_gate:'Ask the Static Collective editor to decide whether to publish or personally offer this independent request. A respondent must freely opt in.'
  };
}
export function toPrintHtml(call){
  if(call.disposition!=='HOLD_EDITORIAL_AND_HUMAN_PERMISSION'||call.automatic_publication!==false)
    error('PRINT_NOT_ALLOWED');
  const s=escapeHtml;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>One useful human ask — HYPERCROSS-003 (DRAFT)</title>
<style>
:root{font-family:system-ui,sans-serif;color:#172b29;background:#f8f6ef}
*{box-sizing:border-box}body{margin:0;padding:clamp(14px,3vw,45px)}
main{max-width:770px;margin:auto;background:#fff;border:3px solid #204b3f;padding:clamp(18px,4vw,44px)}
h1{font-size:clamp(27px,5vw,45px);margin:.15em 0}h2{margin-bottom:.4em}
.badge{font-size:.85em;font-weight:800;letter-spacing:.08em}
.ask{font-size:clamp(21px,3vw,27px);line-height:1.4;border-left:5px solid #9b6d2c;padding:15px;background:#f6f0df}
p{line-height:1.55}small,footer{color:#42524c}code{overflow-wrap:anywhere}
@media print{body{padding:0}main{border:0;max-width:none}.badge{color:black}}
</style></head><body><main>
<p class="badge">THE STATIC COLLECTIVE · PROPOSED HUMAN OPEN CALL · NOT PUBLISHED</p>
<h1>One useful human ask</h1>
<p>This question came after a source-pinned cross-repository experiment produced a verified local computation return. The missing piece is not another computer: it is a willing human usability reviewer.</p>
<h2>Could you help?</h2><p class="ask">${s(call.first_question)}</p>
<h2>The first 20 minutes</h2><p>${s(call.first_action)}</p>
<h2>What to return</h2><p>${s(call.safe_reply)}</p>
<h2>Boundaries</h2><p>No actual case information. No application to a charity or official organization. No work assignment or contact is implied. Participation, introduction, and publication all require separate permission.</p>
<p><strong>Origin:</strong> verified synthetic local computation digest <code>${s(call.origin.verified_local_hash.slice(0,24))}…</code><br>
<strong>Source notice:</strong> ${s(call.editorial_source.existing_call_id)} (original LemonPRESS)<br>
<strong>Decision:</strong> ${s(call.disposition)}</p>
<footer>THIS IS A REVIEW COPY, NOT AN ACTIVE RECRUITMENT NOTICE. No reply destination or live intake is embedded until separately approved.</footer>
</main></body></html>`;
}
export async function returnToAsk(argv,{runner}={}){
  const o=args(argv),root=pin(o['radio-root'],PINS.radio,'RADIO');
  const jar=pin(o['jarvis-root'],PINS.jarvis,'JARVIS');
  const press=pin(o['lemonpress-root'],PINS.lemonpress,'LEMONPRESS');
  const binary=resolve('src/check-radio-return-003.py');
  const proof=runner?await runner(o):execFileSync('python3',[binary,
    '--radio-root',root,'--proof',resolve(o.proof),'--summary',resolve(o.summary)],
    {encoding:'utf8',maxBuffer:1024*1024,timeout:30000});
  const native=typeof proof==='string'?JSON.parse(proof):proof;
  const upstream=JSON.parse(await readFile(resolve(o['upstream-hold']),'utf8'));
  if(upstream?.schema!=='static-relay/relatte-hold-verification/v0'||
    upstream?.disposition!=='HOLD'||upstream?.signed_hold_valid!==true||
    upstream?.crossing_id!==native.parent_held_crossing_id)
      error('NATIVE_PARENT_HOLD_NOT_LINKED');
  const jarvis=await import(pathToFileURL(join(jar,'src','engine.mjs')).href);
  const heartbeat=await import(pathToFileURL(join(jar,'src','heartbeat.mjs')).href);
  const mockNeed={
    schema:'jarvis.particular/v0',id:'hypercross-003.missing-reviewer',
    kind:'need',steward:'graft-local-demo-only',category:'synthetic-mobile-usability',
    region:'unassigned-local-demo',quantity:1,unit:'review',
    status:'open',label:'Need: a willing reviewer. None is currently known.'
  };
  const jarBody=new jarvis.Jar([mockNeed]);
  const inspected=jarvis.observe(jarBody);
  if(inspected.needs.length!==1||inspected.offers.length!==0||
     jarvis.understand(jarBody,mockNeed.id)!==null)error('JARVIS_FALSE_MATCH');
  const view=heartbeat.projectHeartbeat({match:null});
  const base=JSON.parse(await readFile(join(press,'proposals','open-page-001','open-calls.json'),'utf8'));
  if(base.schema!=='lemonpress/open-calls-001'||base.publication!=='INDEPENDENT_EDITORIAL_PREVIEW'||
     base.houseAdmission!=='HELD'||base.verifiedInstitutionalVacancies!==0)
     error('ORIGINAL_PRESS_POLICY_CHANGED');
  const source=base.openCalls.find(x=>x.id==='LP-OC-006');
  const call=draftCall(native,view,source);
  const output=resolve(o.output);
  if(existsSync(output))error('OUTPUT_ALREADY_EXISTS');
  await mkdir(output,{recursive:false,mode:0o700});
  const html=toPrintHtml(call);
  const receipt={
    schema:'graft.hypercross-return-to-ask/v0',
    prior_native_crossing:native.parent_held_crossing_id,
    native_radio_return_checked:native.native_ghot_radio_return_verified,
    native_radio_signed_completion_receipt:native.signed_execution_receipt_id,
    jarvis_original_source_sha:PINS.jarvis,lemonpress_original_source_sha:PINS.lemonpress,
    original_jarvis_observed_need_count:inspected.needs.length,
    original_jarvis_observed_offer_count:inspected.offers.length,
    original_jarvis_next:view.next,
    press_original_call:source.id,
    generated_ask_id:call.id,
    generated_print_sha256:sha(html),
    decision:'HOLD_EDITORIAL_AND_HUMAN_PERMISSION',
    humans_contacted:0,human_work_completed:false,
    publication:false,confidential_case_material:false
  };
  await writeFile(join(output,'human-open-call-draft.json'),JSON.stringify(call,null,2)+'\n',{flag:'wx',mode:0o600});
  await writeFile(join(output,'printable-human-ask.html'),html,{flag:'wx',mode:0o600});
  await writeFile(join(output,'return-to-ask-receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
  return receipt;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(await returnToAsk(process.argv.slice(2)),null,2));}
 catch(err){console.error('HYPERCROSS_003_REFUSED:',err.message);process.exitCode=1;}
}
