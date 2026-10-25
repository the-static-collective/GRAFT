#!/usr/bin/env node
/**
 * Loopback-only JAR;VIS research desk.
 * No account, external side effects or Git writes. Human-triggered requests only.
 */
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {dirname,join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {runInitiative} from "./jarvis-initiative.mjs";
import {printableHtml} from "./work-kit.mjs";

const here=dirname(fileURLToPath(import.meta.url));
const webRoot=resolve(here,"..","live");
const TEXT={"GET /": ["index.html","text/html; charset=utf-8"],
 "GET /app.js":["app.js","text/javascript; charset=utf-8"],
 "GET /style.css":["style.css","text/css; charset=utf-8"]};
const ENV={
 "blackstar-root":"GRAFT_BLACKSTAR_ROOT",
 "memento-root":"GRAFT_MEMENTO_ROOT",
 "freegraph-root":"GRAFT_FREEGRAPH_ROOT",
 "jarvis-root":"GRAFT_JARVIS_ROOT",
 "cannon-root":"GRAFT_CANNON_ROOT",
 "planz-root":"GRAFT_PLANZ_ROOT",
 "planz-garden-root":"GRAFT_PLANZ_GARDEN_ROOT",
 "planz-table-root":"GRAFT_PLANZ_TABLE_ROOT",
 "planz-abundent-root":"GRAFT_PLANZ_ABUNDENT_ROOT",
};
const security={
 "Cache-Control":"no-store",
 "X-Content-Type-Options":"nosniff",
 "Referrer-Policy":"no-referrer",
 "X-Frame-Options":"DENY",
 "Content-Security-Policy":"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'"
};
function respond(res,status,body,kind="application/json; charset=utf-8",extra={}){
 res.writeHead(status,{...security,...extra,"Content-Type":kind});res.end(body);
}
function failure(res,status,code){respond(res,status,JSON.stringify({error:code}))}
function nativeArgs(question,env){
 const args=["--cut",env.GRAFT_CUT_PATH||resolve(here,"..","fixtures","early-cut.json"),
  "--world","same-room-a0","--question",question];
 for(const [flag,key] of Object.entries(ENV)){
  if(!env[key])throw Error("MISSING_"+key);
  args.push("--"+flag,env[key]);
 }
 return args;
}
function readBody(req){
 return new Promise((resolve,reject)=>{
  let size=0,buf="";
  req.on("data",chunk=>{
   size+=chunk.length;
   if(size>2048){reject(Error("PAYLOAD_TOO_LARGE"));req.destroy();return}
   buf+=chunk;
  });
  req.on("end",()=>{try{resolve(JSON.parse(buf))}catch{reject(Error("MALFORMED_JSON"))}});
  req.on("error",reject);
 });
}
/**
 * Testable separate server. The injected question runner in tests creates no
 * network requests; production passes the actual pinned native initiative.
 */
export function makeLocalServer({runner=async q=>runInitiative(nativeArgs(q,process.env)),
 port=7791,cacheMinutes=10}={}){
 const cache=new Map();
 let busy=false;
 const server=createServer(async(req,res)=>{
  const address=server.address();
  const expectHost="127.0.0.1:"+address.port;
  if(req.headers.host!==expectHost){failure(res,403,"HOST_REFUSED");return}
  const origin="http://"+expectHost;
  const url=new URL(req.url,origin);
  if(req.method==="GET"&&TEXT["GET "+url.pathname]&&url.search===""){
   const [name,kind]=TEXT["GET "+url.pathname];
   try{respond(res,200,await readFile(join(webRoot,name)),kind)}
   catch{failure(res,500,"UI_ASSET_UNAVAILABLE")}
   return;
  }
  if(req.method==="GET"&&url.pathname==="/health"){
   respond(res,200,JSON.stringify({schema:"jarvis.local-research-health/v1",
      operation:"loopback_only",real_world_effects:false,busy}));return;
  }
  if(req.method!=="POST"||!["/api/ask","/api/kit"].includes(url.pathname)){
   failure(res,404,"NOT_FOUND");return;
  }
  if(req.headers.origin!==origin||req.headers["content-type"]?.split(";")[0]!=="application/json"){
   failure(res,403,"LOCAL_ORIGIN_REQUIRED");return;
  }
  let request;
  try{request=await readBody(req)}
  catch{failure(res,400,"INVALID_JSON_OR_SIZE");return}
  if(req.url==="/api/ask"){
   if(typeof request?.question!=="string"||!request.question.trim()||request.question.length>500){
    failure(res,400,"QUESTION_INVALID");return;
   }
   if(busy){failure(res,429,"ONE_LOCAL_QUESTION_AT_A_TIME");return}
   busy=true;
   try{
    const result=await runner(request.question);
    if(result?.schema!=="graft.jarvis-live-work/v1"||result.authority!=="none"||
       result.approval!=="HUMAN_REQUIRED_FOR_EXTERNAL_EFFECTS"||
       result.remote_writes!==0||result.canon_changes!==0||
       result.people_contacted!==0||result.work_plan?.schema!=="graft.useful-work-plan/v1"){
      throw Error("UNTRUSTED_ATTENDANT_RECEIPT");
    }
    const id=createHash("sha256").update(JSON.stringify(result)).digest("hex");
    cache.set(id,{result,at:Date.now()});
    if(cache.size>12)cache.delete(cache.keys().next().value);
    respond(res,200,JSON.stringify({id,result,local_only:true,publication:false}));
   }catch{
    failure(res,502,"CURRENT_SOURCE_READ_OR_NATIVE_INTEGRATION_FAILED");
   }finally{busy=false}
   return;
  }
  if(typeof request?.id!=="string"||!/^[0-9a-f]{64}$/.test(request.id)){
   failure(res,400,"RECEIPT_ID_REQUIRED");return;
  }
  const found=cache.get(request.id);
  if(!found||Date.now()-found.at>cacheMinutes*60000){
   failure(res,404,"RECEIPT_MISSING_OR_EXPIRED");return;
  }
  cache.delete(request.id); // one-use artifact handoff, not a persistent activity log.
  const html=printableHtml(found.result.work_plan);
  respond(res,200,html,"text/html; charset=utf-8",
    {"Content-Disposition":"attachment; filename=jarvis-community-question-kit.html"});
 });
 return new Promise((resolve,reject)=>{
  server.once("error",reject);
  server.listen(port,"127.0.0.1",()=>{
   server.removeAllListeners("error");
   resolve({server,port:server.address().port,
    close:()=>new Promise(done=>server.close(done))});
  });
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.GRAFT_LIVE_PORT||7791);
 if(!Number.isInteger(port)||port<1024||port>65535)throw Error("PORT_REFUSED");
 const v=await makeLocalServer({port});
 process.stdout.write("JAR;VIS local research desk: http://127.0.0.1:"+v.port+"/\n");
}
