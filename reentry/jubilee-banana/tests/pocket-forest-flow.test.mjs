import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createGram,addTrace,addTension,selectFirstYes,makeReturn,formatCard} from '../gram/portable-gram.mjs';
import {proposeGramCrossing} from '../bridge/gram-reentry.mjs';
import {composeForest,nextInvitation} from '../forest/forest-projection.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const html=readFileSync(join(here,'../pocket/index.html'),'utf8');
const script=readFileSync(join(here,'../pocket/app.mjs'),'utf8');
function page(){
 const els={};
 const mk=id=>els[id]??(els[id]={
  id,style:{},value:'',checked:false,disabled:['returnToTableBtn','forestDownload','forestCopyInvite','downloadHandoff'].includes(id),hidden:id==='returnToTableBtn'||id==='forestNextLink',textContent:'',href:'',
  children:[],events:{},reportValidity(){return true},reset(){},append(...x){this.children.push(...x)},
  replaceChildren(){this.children=[]},addEventListener(k,v){this.events[k]=v},focus(){},click(){}
 });
 for(const [,id] of html.matchAll(/\bid="([^"]+)"/g))mk(id);
 const document={getElementById:mk,createElement:mk,body:{append(){}}};
 const location={hash:'',origin:'https://local.example'};
 const window={opener:null,print(){}};
 const code=script.replace(/^import .*?;\s*$/gm,'');
 new Function('document','window','location','crypto','confirm','setTimeout','URLSearchParams',
 'createGram','addTrace','addTension','selectFirstYes','makeReturn','formatCard',
 'proposeGramCrossing','composeForest','nextInvitation',code)(
 document,window,location,webcrypto,()=>true,()=>{},URLSearchParams,
 createGram,addTrace,addTension,selectFirstYes,makeReturn,formatCard,
 proposeGramCrossing,composeForest,nextInvitation);
 return {el:mk,submit:id=>mk(id).events.submit({preventDefault(){},target:mk(id)})};
}
test('complete Pocket → reviewed Free Graph → fresh independent invitation has no automatic actions',async()=>{
 const p=page();
 p.el('need').value='Could a willing steward benefit from a neutral food sourcing comparison?';
 p.el('possible').value='A buyer might have enough information to make their own independent decision.';
 p.submit('startForm');
 p.el('redaction').value='Would a willing steward like to inspect a neutral sourcing worksheet?';
 p.el('destination').value='first-yes';
 for(const id of ['authorOwn','consent','reviewed'])p.el(id).checked=true;
 p.submit('crossForm');
 assert.equal(p.el('downloadHandoff').disabled,false);
 p.el('forestFruit').value='A fictional worksheet was drafted, with no purchasing claim.';
 p.el('forestSeed').value='Would an authorized buyer like to review one unknown at a time?';
 p.el('forestReviewed').checked=true;
 p.el('forestConsent').checked=true;
 await p.submit('forestForm');
 assert.equal(p.el('forestDownload').disabled,false,p.el('forestStatus').textContent);
 assert.match(p.el('forestPacketStatus').textContent,/fgp:sha256/);
 assert.equal(p.el('forestDiagram').children.length,3);
 p.el('forestNextTitle').value='A Next Table · One Open Question';
 p.el('forestNextQuestion').value='Would a willing steward like to review one unknown at a time?';
 p.el('forestNextDate').value='2026-11-03';
 p.el('forestNextApproval').checked=true;
 p.submit('forestNextForm');
 assert.equal(p.el('forestCopyInvite').disabled,false);
 assert.match(p.el('forestNextLink').href,/https:\/\/abundent\.org\/tables\/#invite=/);
 const payload=JSON.parse(Buffer.from(p.el('forestNextLink').href.split('#invite=')[1],'base64url').toString('utf8'));
 assert.equal(payload.host,'');
 assert.equal(payload.parent,'');
 assert.deepEqual(payload.chain,[]);
 assert.match(p.el('forestNextStatus').textContent,/not sent/);
 p.el('forestSeed').value='Edited question after review';
 p.el('forestSeed').events.input({});
 assert.equal(p.el('forestDownload').disabled,true);
 assert.equal(p.el('forestCopyInvite').disabled,true);
 assert.equal(p.el('forestNextLink').hidden,true);
});
test('no reviewed handoff means forest submission cannot proceed',async()=>{
 const p=page();
 p.el('forestFruit').value='A hypothetical worksheet was prepared for review';
 p.el('forestReviewed').checked=true;p.el('forestConsent').checked=true;
 await p.submit('forestForm');
 assert.match(p.el('forestStatus').textContent,/First create the separately reviewed handoff/);
 assert.equal(p.el('forestDownload').disabled,true);
});
