import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createGram,addTrace,addTension,selectFirstYes,makeReturn,formatCard} from '../gram/portable-gram.mjs';
import {proposeGramCrossing} from '../bridge/gram-reentry.mjs';

const root=dirname(fileURLToPath(import.meta.url));
const read=path=>readFileSync(join(root,'..',path),'utf8');
const html=read('pocket/index.html'),script=read('pocket/app.mjs');
const nonce='07070707070707070707070707070707';
const origin='https://kbhqacsdvjsstzyplqij.supabase.co';
function fakePage({withOpener=true,hash='#returnToTable='+nonce}={}){
 const elements={};
 const el=id=>elements[id]??(elements[id]={
  value:'',checked:false,disabled:false,hidden:id==='returnToTableBtn'||id==='forestNextLink',textContent:'',children:[],events:{},
  reportValidity(){return true},reset(){},append(...a){this.children.push(...a)},
  replaceChildren(){this.children=[]},addEventListener(k,v){this.events[k]=v},focus(){},click(){}
 });
 for(const [,id] of html.matchAll(/\bid="([^"]+)"/g))el(id);
 const document={getElementById:el,createElement:el,body:{append(){}}};
 const deliveries=[];
 const opener=withOpener?{closed:false,postMessage(data,target){deliveries.push({data,target})}}:null;
 const window={opener,print(){}};
 const location={hash,origin};
 const crypto={randomUUID:()=>'11111111-1111-4111-8111-111111111111',
  getRandomValues:a=>a.fill(1)};
 const code=script.replace(/^import .*?;\s*$/gm,'');
 new Function('document','window','location','crypto','confirm','setTimeout','URLSearchParams',
  'createGram','addTrace','addTension','selectFirstYes','makeReturn','formatCard','proposeGramCrossing',code)(
   document,window,location,crypto,()=>true,()=>{},URLSearchParams,
   createGram,addTrace,addTension,selectFirstYes,makeReturn,formatCard,proposeGramCrossing);
 const submit=id=>el(id).events.submit({preventDefault(){},target:el(id)});
 return {el,deliveries,submit};
}
test('Pocket return only appears for a trusted opened-from-seat context',()=>{
 const standalone=fakePage({withOpener:false});
 assert.equal(standalone.el('returnToTableBtn').hidden,true);
 const wrong=fakePage({hash:'#returnToTable=bad'});
 assert.equal(wrong.el('returnToTableBtn').hidden,true);
 const invited=fakePage();
 assert.equal(invited.el('returnToTableBtn').hidden,false);
 assert.equal(invited.el('returnToTableBtn').disabled,true);
});
test('reviewed redaction returns only one unsent, contact-free question',()=>{
 const p=fakePage();
 p.el('need').value='Is there a real milk-sourcing question we can clarify?';
 p.el('possible').value='A willing buyer could make a verified, independent sourcing decision.';
 p.submit('startForm');
 p.el('trace').value='Private family detail that must stay in the author device';
 p.submit('traceForm');
 p.el('redaction').value='Would a willing food-shelf steward welcome a private source comparison?';
 p.el('destination').value='first-yes';
 for(const id of ['authorOwn','consent','reviewed'])p.el(id).checked=true;
 p.submit('crossForm');
 assert.equal(p.el('returnToTableBtn').disabled,false);
 p.el('returnToTableBtn').events.click();
 assert.equal(p.deliveries.length,1);
 const result=p.deliveries[0];
 assert.equal(result.target,origin);
 assert.deepEqual(Object.keys(result.data).sort(),['nonce','standing','summary','type']);
 assert.equal(result.data.type,'bananagram.reviewed-seat-draft/v0');
 assert.equal(result.data.standing,'PROPOSE_ONLY');
 assert.equal(result.data.nonce,nonce);
 assert.ok(!JSON.stringify(result).includes('Private family detail'));
 assert.ok(!JSON.stringify(result).includes('inviteKey'));
});
test('changed or unreviewed proposal never returns',()=>{
 const p=fakePage();
 p.el('need').value='Could somebody help with a small project this week?';
 p.el('possible').value='One neighbor could decide whether to help with it.';
 p.submit('startForm');
 p.el('redaction').value='Would a willing neighbor want to discuss one small helpful act?';
 p.el('destination').value='first-yes';
 p.submit('crossForm');
 assert.equal(p.el('returnToTableBtn').disabled,true);
 assert.equal(p.deliveries.length,0);
 for(const id of ['authorOwn','consent','reviewed'])p.el(id).checked=true;
 p.submit('crossForm');
 p.el('redaction').value='Text changed after review';
 p.el('redaction').events.input({});
 assert.equal(p.el('returnToTableBtn').disabled,true);
});
