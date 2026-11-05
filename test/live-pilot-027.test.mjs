import test from 'node:test';
import assert from 'node:assert/strict';
import {probePublicExample,PILOT} from '../src/live-pilot-027.mjs';
const raw={latitude:52.52,longitude:13.41,current:{temperature_2m:17,time:'2026-11-05T12:00'},
 current_units:{temperature_2m:'°C'}};
const response=body=>new Response(JSON.stringify(body),{status:200,
 headers:{'content-type':'application/json'}});
test('explicit approval required before any third-party HTTP read',async()=>{
 let attempts=0;
 const p=await probePublicExample({},{
  transport:async()=>{attempts++;throw Error('DO NOT CONTACT')}
 });
 assert.equal(p.status,'HOLD_LIVE_CONTACT_NOT_APPROVED');
 assert.equal(p.requests,0);
 assert.equal(attempts,0);
});
test('approved public GET is pinned to one fixed hostname and source, no user location',async()=>{
 const urls=[];
 const x=await probePublicExample({approvedPublicPilot:true},{
  transport:async(url,options)=>{
   urls.push(url);
   assert.equal(options.method,'GET');
   assert.equal(options.redirect,'error');
   assert.equal(options.headers.Accept,'application/json');
   assert.ok(!options.headers.Authorization);
   return response(raw);
  }
 });
 assert.equal(x.status,'READ_ONLY_THIRD_PARTY_RESPONSE_OBSERVED');
 assert.deepEqual(urls,[
  'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m']);
 assert.equal(x.observation.temperature_2m,17);
 assert.equal(x.requests,1);
 assert.equal(x.redirects_followed,0);
 assert.equal(x.private_identity_used,false);
 assert.equal(x.code_installed,false);
});
test('redirect, wrong content type, alien location and absurd response are rejected',async()=>{
 await assert.rejects(probePublicExample({approvedPublicPilot:true},{
  transport:async()=>({status:302,redirected:true})
 }),/PUBLIC_PILOT_HTTP_RESPONSE/);
 await assert.rejects(probePublicExample({approvedPublicPilot:true},{
  transport:async()=>new Response('not-json',{status:200,headers:{'content-type':'text/html'}})
 }),/PUBLIC_PILOT_NOT_JSON/);
 await assert.rejects(probePublicExample({approvedPublicPilot:true},{
  transport:async()=>response({...raw,latitude:0})
 }),/LOCATION_MISMATCH/);
 await assert.rejects(probePublicExample({approvedPublicPilot:true},{
  transport:async()=>response({...raw,current:{temperature_2m:999999}})
 }),/TEMPERATURE_SHAPE/);
});
test('host override, token injection and query override cannot reach network',async()=>{
 let requested=0;
 const transport=async()=>{requested++;return response(raw)};
 for(const [i,o] of [
  [{approvedPublicPilot:true,host:'internal'},{}],
  [{approvedPublicPilot:true},{url:'http://169.254.169.254/latest'}],
  [{approvedPublicPilot:true},{token:'a-credential'}]
 ])await assert.rejects(probePublicExample(i,{...o,transport}),/UNSUPPORTED_LIVE_API_ARGUMENTS/);
 assert.equal(requested,0);
 assert.equal(PILOT.requests_per_explicit_approval,1);
});
