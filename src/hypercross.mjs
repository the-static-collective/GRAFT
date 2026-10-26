#!/usr/bin/env node
// HYPERCROSS-001: one bounded source-aware question across real, pinned native
// runtimes. No people contacted, no site deployment, no canon admission.
// Only synthetic/public questions may be used in CI or public artifacts.
import {createHash} from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {existsSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {mkdtempSync} from 'node:fs';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {runInitiative} from './jarvis-initiative.mjs';
import {writeWorkKit} from './work-kit.mjs';

export const EXTRA_PINS=Object.freeze({
  loadout:'1adcb3d82f736f3ca8329c3c1d0d9eba398d49ee',
  ghot:'e35dd470384d864b7b0b629a68dad570875a7df0',
  relatte:'7016dadcafc335d7ad8dccc26f4d6e0769dcf28c',
  lemonpress:'02feb4454240d482a5e0e03258f24f8b5cc0b9f5'
});
const ROOT_FLAGS=Object.freeze({
  loadout:'loadout-root',ghot:'ghot-root',relatte:'relatte-root',lemonpress:'lemonpress-root'
});
const NATIVE_FLAGS=['blackstar-root','memento-root','freegraph-root','jarvis-root','planz-root',
  'cannon-root','planz-garden-root','planz-table-root','planz-abundent-root'];
const sha=t=>'sha256:'+createHash('sha256').update(t).digest('hex');
function fail(code){throw Error(code);}
export function parseArgs(argv){
  if(argv.length%2)fail('PAIRED_ARGUMENTS_REQUIRED');
  const allowed=new Set(['question','output','cut','world','depth','graph-depth',...NATIVE_FLAGS,...Object.values(ROOT_FLAGS)]);
  const o={};
  for(let i=0;i<argv.length;i+=2){
    const key=argv[i].startsWith('--')?argv[i].slice(2):'';
    if(!allowed.has(key)||Object.hasOwn(o,key))fail('ARGUMENT_NOT_ALLOWED_OR_DUPLICATE');
    o[key]=argv[i+1];
  }
  for(const k of ['question','output','cut','world',...NATIVE_FLAGS,...Object.values(ROOT_FLAGS)])
    if(typeof o[k]!=='string'||!o[k])fail('MISSING_'+k.toUpperCase().replaceAll('-','_'));
  if(o.question.length>300||/[\r\n]/.test(o.question))fail('QUESTION_REFUSED');
  return o;
}
function checkPin(root,shaExpected,label){
  const path=resolve(root);
  let actual;
  try{actual=execFileSync('git',['-C',path,'rev-parse','HEAD'],
      {encoding:'utf8',timeout:5000,stdio:['ignore','pipe','ignore']}).trim();}
  catch{fail(label+'_UNVERIFIED_SOURCE');}
  if(actual!==shaExpected)fail(label+'_PIN_MISMATCH');
  return path;
}
function call(cmd,args,{cwd,env,input,timeout=45000}={}){
  const v=spawnSync(cmd,args,{cwd,env:env||process.env,input,encoding:'utf8',
    shell:false,maxBuffer:2*1024*1024,timeout,stdio:['pipe','pipe','pipe']});
  if(v.error||v.status!==0)fail('NATIVE_REFUSED_'+String(v.stderr||v.error?.message||'ERROR').slice(0,260));
  try{return JSON.parse(v.stdout)}catch{fail('NATIVE_JSON_INVALID');}
}
function enforceSource(result){
  if(result?.schema!=='graft.jarvis-live-work/v1'||
    result.authority!=='none'||result.approval!=='HUMAN_REQUIRED_FOR_EXTERNAL_EFFECTS'||
    result.remote_writes!==0||result.people_contacted!==0||result.canon_changes!==0||
    result.work_plan?.schema!=='graft.useful-work-plan/v1'||
    result.fresh_public_evidence?.coverage?.known_documents_read<1||
    result.historical_context?.cannon_selection_state!=='UNKNOWN_NO_EXTERNAL_TRUST_PINS')
    fail('UPSTREAM_CROSSING_NOT_SAFE');
}
function loadoutFence(root,workDigest){
  const code='import sys,json;from loadout.bind import evaluate_binding; v=json.load(sys.stdin); cap={"capability":"graft.local.print","reachable_effects":["local.file.write"],"parameters":{"digest":v["digest"]}}; print(json.dumps({"local":evaluate_binding(cap,["local.file.write"]),"external":evaluate_binding({"capability":"public.publish","reachable_effects":["public.publish"],"parameters":{}},[])}))';
  const value=call('python3',['-c',code],{env:{...process.env,PYTHONPATH:join(root,'src')},
    input:JSON.stringify({digest:workDigest})});
  if(value.local?.disposition!=='BIND'||value.local?.authority_delta!=='none'||
    value.external?.disposition!=='REFUSE'||value.external?.reason_code!=='UNFENCED_REACHABLE_EFFECT')
    fail('LOADOUT_FENCE_REFUSED');
  return {local:value.local.disposition,public_publish:value.external.disposition,
    authority_delta:'none',version:EXTRA_PINS.loadout};
}
function nativeHash(root,plain){
  const privateRoot=mkdtempSync(join(tmpdir(),'hypercross-ghot-'));
  try{
    const receipt=call('python3',[join(root,'ghot','reference_node.py'),'hash',plain],{
      cwd:root,env:{...process.env,GHOT_HOME:privateRoot}});
    if(receipt.kind!=='ghot.receipt'||receipt.status!=='ok'||
      receipt.capability!=='system.hash'||receipt.output?.sha256!==sha(plain).slice(7))
      fail('GHOT_NATIVE_HASH_REFUSED');
    return {receipt_kind:receipt.kind,capability:'system.hash',digest:receipt.output.sha256,
      verified_against_local_bytes:true,physical_device_identity_exported:false,version:EXTRA_PINS.ghot};
  }finally{rm(privateRoot,{recursive:true,force:true}).catch(()=>{});}
}
export function pressCandidate(workHash,schema){
  if(schema?.properties?.status?.enum?.includes('forming')!==true||
     schema?.properties?.admission?.properties?.state?.enum?.includes('pending')!==true)
    fail('LEMONPRESS_SCHEMA_CHANGED');
  return {work_id:'hypercross-001-'+workHash.slice(7,23),
    title:'A question became a bounded work kit',status:'forming',
    admission:{state:'pending',receipt:null,source_revision:null},
    lanes:['digital','physical'],rights:'REQUIRES_HUMAN_REVIEW',
    relations:[{type:'derived-from-local-work-receipt',target:workHash}],
    source_schema:'lemonPRESS work-manifest.schema.json',publication:false,
    note:'Locally generated editorial candidate; no lemonPRESS admission or publication.'};
}
function times(base){
  const t=Date.parse(base);
  if(!Number.isFinite(t))fail('TIME_INVALID');
  return [0,1000,2000,3000].map(delta=>new Date(t+delta).toISOString());
}
function nativeRoundTrip(root,out,kitHash,workHash,when){
  const [t0,t1,t2,t3]=times(when);
  const request={
    schema:'relatte.opaque-roundtrip-request/v0',
    spec:{
      schema:'relatte.opaque-organ-spec/v0',
      family_ref:'organ:graft/hypercross-001',
      donor_contract_ref:'graft.local-work-receipt/v1',
      artifact_kind:'local-printable-question-kit',
      source_world:'world:graft-local-fixture',
      source_particular:'particular:synthetic-question-packet',
      source_history_head:workHash,
      payload_refs:[{address:kitHash,role:'local-artifact',media_type:'text/html'}],
      donor_claims:{kit_prepared_locally:true,owner_adoption:false,public_distribution:false},
      requested_effect:{kind:'candidate-ingress',authority:'receiver-local'},
      return_address:'return:graft-local-fixture',
      created_at:t0
    },
    receiver_root:join(out,'relatte-receiver'),
    receiver:{world_id:'world:hypercross-local-receiver',
      receiver_particular:'particular:hypercross-local-receiver',
      contract_ref:'contract:hypercross-local-hold/v0'},
    bundle_path:join(out,'relatte-bundle.json'),
    result_path:join(out,'relatte-result.json'),
    disposition:'HOLD',transport_created_at:t1,received_at:t2,disposed_at:t3,
    route_note:'Public synthetic work kit; hold without publication or owner admission'
  };
  const v=call(process.execPath,['--experimental-strip-types',join(root,'scripts','opaque-roundtrip.ts')],{
    cwd:root,input:JSON.stringify(request),timeout:60000});
  if(v.schema!=='relatte.opaque-roundtrip-result/v0'||v.receive_receipt?.kind!=='RECEIVED'||
    v.disposition_receipt?.kind!=='R3_HOLD'||v.disposition_receipt?.semantic_effect!=='none'||
    v.crossing?.extensions?.organ_adapter?.family_ref!=='organ:graft/hypercross-001'||
    !v.receiver_snapshot?.held?.includes(v.crossing.crossing_id))
    fail('RELATTE_NATIVE_HOLD_REFUSED');
  // Test native replay/idempotence on the exact same request and receiver.
  const again=call(process.execPath,['--experimental-strip-types',
    join(root,'scripts','opaque-roundtrip.ts')],{cwd:root,input:JSON.stringify(request),timeout:60000});
  if(again.crossing?.crossing_id!==v.crossing.crossing_id||
    again.disposition_receipt?.receipt_id!==v.disposition_receipt.receipt_id)
    fail('RELATTE_REPLAY_MISMATCH');
  return {crossing_id:v.crossing.crossing_id,receive_receipt_id:v.receive_receipt.receipt_id,
    disposition_receipt_id:v.disposition_receipt.receipt_id,
    receive:'RECEIVED',receiver_decision:'HOLD',semantic_effect:'none',
    idempotent_replay:true,version:EXTRA_PINS.relatte};
}
/**
 * Execution is explicit local creation; call only for a public/synthetic
 * question. Authenticated public scout is read-only. Never use private stories
 * in public Actions logs, GRAFT branches or shared workflow artifacts.
 */
export async function hypercross(argv,{initiative=runInitiative,clock=()=>new Date().toISOString()}={}){
  const o=parseArgs(argv),extra={};
  for(const [name,flag] of Object.entries(ROOT_FLAGS))
    extra[name]=checkPin(o[flag],EXTRA_PINS[name],name.toUpperCase());
  const native=['question','cut','world','depth','graph-depth',...NATIVE_FLAGS]
    .flatMap(k=>o[k]!==undefined?['--'+k,o[k]]:[]);
  const upstream=await initiative(native);
  enforceSource(upstream);
  const planText=JSON.stringify(upstream.work_plan);
  const planHash=sha(planText);
  const loadout=loadoutFence(extra.loadout,planHash);
  const out=resolve(o.output);
  if(existsSync(out))fail('OUTPUT_ALREADY_EXISTS');
  await mkdir(out,{recursive:false,mode:0o700});
  const made=await writeWorkKit(join(out,'kit'),upstream.work_plan,upstream.fresh_public_evidence);
  const html=await readFile(join(out,'kit','field-kit.html'));
  const kitHash=sha(html);
  if(kitHash!==made.receipt.files.find(x=>x.name==='field-kit.html')?.sha256)
    fail('KIT_HASH_MISMATCH');
  const ghot=nativeHash(extra.ghot,kitHash);
  const relatte=nativeRoundTrip(extra.relatte,out,kitHash,planHash,clock());
  const schema=JSON.parse(readFileSync(join(extra.lemonpress,'schemas','work-manifest.schema.json'),'utf8'));
  const press=pressCandidate(kitHash,schema);
  const report={
    schema:'graft.hypercross/v1',
    question:upstream.question,
    mode:'PUBLIC_SYNTHETIC_LOCAL_ONLY',
    stages:[
      {name:'BLACK_STAR_MEMENTO_FREE_GRAPH',result:upstream.historical_context.graph_packet_id?'NATIVE_VALIDATED':'REFUSED'},
      {name:'JARVIS_PLANZ_CANNON',result:'NATIVE_READ_HOLD'},
      {name:'GRAFT_CURRENT_GITHUB_SCOUT',result:'PUBLIC_SOURCES_OBSERVED',
        sources:upstream.fresh_public_evidence.coverage.known_documents_read,
        source_errors:upstream.fresh_public_evidence.coverage.source_errors},
      {name:'LOADOUT_EFFECT_FENCE',result:loadout.local,public_publish:loadout.public_publish},
      {name:'GRAFT_LOCAL_PRINT',result:'CREATED',artifact_hash:kitHash},
      {name:'GHOT_NATIVE_EXECUTOR',result:'HASHED',digest:ghot.digest},
      {name:'RELATTE_NATIVE_RECEIVER',result:'HELD',crossing_id:relatte.crossing_id},
      {name:'LEMONPRESS_EDITORIAL',result:'FORMING_NOT_ADMITTED'},
      {name:'WEBZ_JARVIS_RETURN',result:'LOCAL_ONLY_NOT_DEPLOYED'},
    ],
    historical:{graph_packet_id:upstream.historical_context.graph_packet_id,
      cannon:upstream.historical_context.cannon_selection_state,
      owner_currentness:'UNVERIFIED'},
    loadout,ghot,relatte,
    kit:{sha256:kitHash,work_plan_sha256:planHash,source_observed_at:upstream.fresh_public_evidence.observed_at},
    press:{status:press.status,admission:press.admission.state},
    publication:'NONE',people_contacted:0,real_world_fulfillment:'NOT_ESTABLISHED',
    permissions:'NO_AUTOMATIC_AUTHORITY',privacy:'NO_PRIVATE_PERSON_CASES',
    output:'LOCAL_ARTIFACTS_ONLY'
  };
  await writeFile(join(out,'lemonpress-candidate.json'),JSON.stringify(press,null,2)+'\n',{flag:'wx',mode:0o600});
  await writeFile(join(out,'hypercross-receipt.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  return {report,out};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const x=await hypercross(process.argv.slice(2));
  process.stdout.write(JSON.stringify(x.report,null,2)+'\n');}
 catch(err){process.stderr.write('HYPERCROSS_REFUSED: '+String(err?.message||'UNKNOWN')+'\n');process.exitCode=1;}
}
