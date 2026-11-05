// GRAFT-027 — capability gardener: grow finite JSON extractors from NEW examples,
// test on withheld data, retain failures, reject unsafe or overfit variants.
// Original GRAFT-026 still verifies the ALEX source pins and origin receipt.
import {createHash} from 'node:crypto';
import {verifyDiscovery} from '../vendor/alex/api-discovery-026.mjs';
import {verifyAlexSource} from './discovered-adapter-026.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const sourceHash=x=>createHash('sha256').update(x).digest('hex');
const BAD=new Set(['__proto__','constructor','prototype','then','toString']);
const MAX={train:12,validation:12,negative:12,paths:80,depth:4,variants:8,source:5000};
function validateCases(cases,max,label){
 if(!Array.isArray(cases)||!cases.length||cases.length>max)throw Error('HOLD_'+label+'_BUDGET');
 for(const f of cases){
  if(!f||typeof f!=='object'||Array.isArray(f)||
    !f.response||typeof f.response!=='object'||!Number.isSafeInteger(f.response.status)||
    !f.response.body||typeof f.response.body!=='object'||
    typeof f.expected!=='number'&&!f.reject)
    throw Error('HOLD_INVALID_'+label+'_FIXTURE');
  if(JSON.stringify(f).length>14000)throw Error('HOLD_OVERSIZE_'+label+'_FIXTURE');
 }
}
function paths(value,maxDepth=MAX.depth){
 const all=[];
 const walk=(o,parts)=>{
  if(parts.length>=maxDepth||o===null||typeof o!=='object'||Array.isArray(o))return;
  for(const key of Object.keys(o).slice(0,35)){
   if(!/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(key)||BAD.has(key))continue;
   const here=[...parts,key],v=o[key];
   if(typeof v==='number'&&Number.isFinite(v))all.push(here);
   else if(v&&typeof v==='object'&&!Array.isArray(v))walk(v,here);
  }
 };
 walk(value,[]);
 return all.slice(0,MAX.paths);
}
const TEMPLATE=String.raw