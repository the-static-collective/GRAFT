/**
 * GRAFT-018 — propose a NEW-TO-017 data-dependent primitive. We retain the
 * proven 017 five-stage template and synthesize an additional computation:
 *
 *   input TEXT → segmenter candidate → COUNT → per-card data-graphemes
 *
 * Segmenters come from existing, documented JS capabilities (Intl.Segmenter
 * included). This is not invention of Unicode grapheme segmentation itself.
 * No complete correct method from 018 is prelisted as a finished renderer.
 */
import {renderProgram} from '../capability-017/primitives.mjs';
export const modes=[
 'constant-one','utf16-units','unicode-codepoints',
 'whitespace-tokens','intl-graphemes'
];
const count=(mode,text)=>{
 switch(mode){
  case 'constant-one':return 1;
  case 'utf16-units':return text.length;
  case 'unicode-codepoints':return [...text].length;
  case 'whitespace-tokens':return text.trim().split(/\s+/u).length;
  case 'intl-graphemes':
   return [...new Intl.Segmenter('en',{granularity:'grapheme'}).segment(text)].length;
  default:throw new Error('Missing source-authorized segmenter');
 }
};
export function descriptor(mode){
 if(!modes.includes(mode))throw new Error('Unapproved primitive');
 return {schema:'graft.card-computed-primitive/v1',mode,
  reduce:'length',attach:'data-graphemes'};
}
export function runPrimitive(method,story,base){
 if(!method||method.schema!=='graft.card-computed-primitive/v1'||
    !modes.includes(method.mode)||method.reduce!=='length'||
    method.attach!=='data-graphemes'||
    Object.keys(method).sort().join(',')!=='attach,mode,reduce,schema')
  throw new Error('Invalid typed primitive, no JS injection or operator spoofing');
 if(!story||!Array.isArray(story.captions)||story.captions.length<1||
    story.captions.length>5||story.captions.some(x=>typeof x!=='string'||!x.length||x.length>240))
  throw new Error('Story out of bounded research scope');
 let html=renderProgram(base,story);
 const computed=[];
 for(let i=0;i<story.captions.length;i++){
  const n=i+1,card=story.captions[i];
  const value=count(method.mode,card);
  computed.push(value);
  const anchor='<section class="card" aria-label="Story card '+n+
    '" data-index="'+n+'"><p>';
  const updated='<section class="card" aria-label="Story card '+n+
    '" data-index="'+n+'" data-graphemes="'+value+'"><p>';
  if(!html.includes(anchor)||html.indexOf(anchor)!==html.lastIndexOf(anchor))
   throw new Error('Original 017 compiler did not emit the expected card structure');
  html=html.replace(anchor,updated);
 }
 if(Buffer.byteLength(html,'utf8')>12000)throw new Error('Overflow');
 return {html,computedCounts:computed,
  outputIsInertString:true,realFinancialClaimsCreated:false};
}
export function candidatePassesExample(method,example,base){
 const result=runPrimitive(method,example.story,base);
 return JSON.stringify(result.computedCounts)===JSON.stringify(example.expectedCounts)&&
  result.html.includes('<!doctype html>')&&
  !/<(?:script|iframe|img|form|object|embed)\b/i.test(result.html);
}
