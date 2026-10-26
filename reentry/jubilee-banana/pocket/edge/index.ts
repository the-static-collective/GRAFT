// BananaGram Pocket public static read-only field shell; no database access.
import {HTML, APP, GRAM, PARTICIPATION, REENTRY, FOREST} from './assets.ts';
const resources:Record<string,[string,string]>={
  '': [HTML,'text/html; charset=utf-8'],
  'app':[APP,'text/javascript; charset=utf-8'],
  'gram':[GRAM,'text/javascript; charset=utf-8'],
  'participation':[PARTICIPATION,'text/javascript; charset=utf-8'],
  'reentry':[REENTRY,'text/javascript; charset=utf-8'],
  'forest':[FOREST,'text/javascript; charset=utf-8'],
};
const POLICY=[
 "default-src 'none'","base-uri 'none'","object-src 'none'",
 "form-action 'none'","frame-ancestors 'none'",
 "script-src 'self'","style-src 'unsafe-inline'","img-src data:","connect-src 'none'",
].join('; ');
Deno.serve((req:Request)=>{
 const url=new URL(req.url);
 const q=url.searchParams.get('asset')||'';
 const headers={
  'cache-control':'no-store, max-age=0',
  'x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer',
  'content-security-policy':POLICY,
  'cross-origin-resource-policy':'same-origin',
 };
 if(req.method!=='GET' && req.method!=='HEAD')
  return new Response('Read-only page: GET only.',{status:405,headers:{...headers,allow:'GET, HEAD'}});
 const item=resources[q];
 if(!item)return new Response('Not found.',{status:404,headers});
 return new Response(req.method==='HEAD'?null:item[0],{status:200,headers:{...headers,'content-type':item[1]}});
});
