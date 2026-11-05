import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {discoverMissingProvider} from '../vendor/alex/api-discovery-026.mjs';
import {verifyAlexSource,compileCandidate,evaluateFixture}
 from '../src/discovered-adapter-026.mjs';
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const Q='Which live weather forecast API provides hourly weather data?';
const repo='public-weather/weather-openapi',commit='a'.repeat(40),tree='b'.repeat(40);
const spec=Buffer.from(JSON.stringify({openapi:'3.0.0',info:{title:'Forecast API',version:'1'},
 servers:[{url:'https://forecast.example.org'}],
 paths:{'/hourly':{get:{summary:'Hourly forecast'}}}}));
const sh=blob(spec);
function fake(){
 const calls=[];
 const ok=x=>({ok:true,status:200,redirected:false,json:async()=>x});
 const transport=async(url,opt)=>{
  const u=new URL(url); calls.push(u.href);
  assert.equal(u.hostname,'api.github.com');
  assert.equal(opt.method,'GET');
  if(u.pathname==='/search/repositories')
   return ok({items:[{private:false,visibility:'public',full_name:repo,default_branch:'main'}]});
  if(u.pathname==='/repos/'+repo)
   return ok({private:false,visibility:'public',full_name:repo,default_branch:'main'});
  if(u.pathname==='/repos/'+repo+'/branches/main')return ok({commit:{sha:commit}});
  if(u.pathname==='/repos/'+repo+'/git/commits/'+commit)
   return ok({tree:{sha:tree}});
  if(u.pathname==='/repos/'+repo+'/git/trees/'+tree)
   return ok({truncated:false,tree:[{path:'openapi.json',sha:sh,size:spec.length,type:'blob'}]});
  if(u.pathname==='/repos/'+repo+'/git/blobs/'+sh)
   return ok({size:spec.length,encoding:'base64',content:spec.toString('base64')});
  throw Error('invalid mock URL');
 };
 return {transport,calls};
}
async function packet(){
 return discoverMissingProvider({question:Q,approvedPublicGithubSearch:true},
  {transport:fake().transport});
}
test('two real original ALEX source-owner modules match exact Git blob hashes',()=>{
 const p=verifyAlexSource();
 assert.equal(Object.keys(p.exact_git_blobs).length,2);
 assert.equal(p.external_authority,false);
});
test('new unregistered discovered provider yields a distinct runnable adapter compiled from fixed program',async()=>{
 const p=await packet();
 const c=compileCandidate(p);
 assert.equal(c.source_repository,repo);
 assert.equal(c.status,'LOCAL_EXECUTABLE_FIXTURE_ADAPTER');
 assert.equal(c.live_endpoint_calls_compiled,false);
 assert.equal(c.network_authority,'NONE');
 assert.ok(!c.output_code.includes('fetch('));
 assert.ok(!c.output_code.includes('https://forecast.example.org'));
 const r=await evaluateFixture(p,0,{status:200,contentType:'application/json',
  body:{hourly:[10,11],latitude:44.1,longitude:-93.2}});
 assert.equal(r.observation.declared_operation,'GET /hourly');
 assert.deepEqual(r.observation.fixture_fields,['hourly','latitude','longitude']);
 assert.equal(r.observation.actual_service_reachable,'NOT_TESTED');
 assert.equal(r.observation.outbound_requests,0);
 assert.equal(r.compiled.deployed,false);
});
test('same candidate compiles same source deterministically',async()=>{
 const p=await packet();
 assert.deepEqual(compileCandidate(p),compileCandidate(p));
});
test('unapproved, tampered or false authority packet cannot enter compiler',async()=>{
 const no=await discoverMissingProvider({question:Q});
 assert.throws(()=>compileCandidate(no),/NO_REVIEWABLE_DISCOVERY/);
 const p=await packet();
 assert.throws(()=>compileCandidate({...p,authority:'owner'}),/INVALID_PROVIDER_DISCOVERY/);
 assert.throws(()=>compileCandidate({...p,public_provider_proposals:[]}),/TAMPERED/);
 assert.throws(()=>compileCandidate(p,3),/UNKNOWN_CANDIDATE/);
 await assert.rejects(evaluateFixture(p,0,{status:500,body:{}}),/FIXTURE_NOT_VALID/);
});
