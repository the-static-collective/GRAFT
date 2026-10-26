import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createGram,addTrace,addTension,selectFirstYes,makeReturn,formatCard} from '../gram/portable-gram.mjs';
import {proposeGramCrossing} from '../bridge/gram-reentry.mjs';

const root=dirname(fileURLToPath(import.meta.url));
const read=f=>readFileSync(join(root,'..',f),'utf8');
const html=read('pocket/index.html'),app=read('pocket/app.mjs');
test('pocket uses real original modules, all UI IDs exist, no automatic network',()=>{
 assert.match(app,/from '\.\.\/gram\/portable-gram\.mjs'/);
 assert.match(app,/from '\.\.\/bridge\/gram-reentry\.mjs'/);
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
 for(const match of app.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.has(match[1]),'Missing #'+match[1]);
 assert.doesNotMatch(app,/\bfetch\s*\(|\bXMLHttpRequest\b|localStorage|sendBeacon\s*\(/);
});
function mock(){
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]),els={};
 const node=id=>({id,value:'',checked:false,disabled:false,textContent:'',
 children:[],events:{},reportValidity(){return true},reset(){},append(...a){this.children.push(...a)},
 replaceChildren(){this.children=[]},addEventListener(k,v){this.events[k]=v},click(){}});
 ids.forEach(id=>els[id]=node(id));
 const document={getElementById:id=>els[id],createElement:node,body:{append(){}}};
 const crypto={randomUUID:()=>'11111111-1111-4111-8111-111111111111',
 getRandomValues:a=>a.fill(1)};
 const script=app.replace(/^import .*?;\s*$/gm,'');
 new Function('document','crypto','window','location','confirm','setTimeout',
 'createGram','addTrace','addTension','selectFirstYes','makeReturn','formatCard','proposeGramCrossing',script)(
 document,crypto,{opener:null,print(){}},{hash:'',origin:'https://example.local'},()=>true,()=>{},
 createGram,addTrace,addTension,selectFirstYes,makeReturn,formatCard,proposeGramCrossing);
 return {els,submit:id=>els[id].events.submit({preventDefault(){},target:els[id]})};
}
test('one particular completes private Gram -> tension -> plan -> return -> reviewed inert crossing',()=>{
 const {els,submit}=mock();
 els.need.value='Is there a real milk sourcing gap worth researching?';
 els.possible.value='A willing buyer can understand which sources are available.';
 submit('startForm');assert.match(els.gramPreview.textContent,/milk sourcing gap/);
 els.trace.value='An attendee reported that milk sourcing may change.';
 els.traceType.value='heard_from_someone';
 submit('traceForm');assert.equal(els.traceList.children.length,1);
 els.oneView.value='The grant may soon expire';
 els.otherView.value='A program might remain available';
 els.unresolved.value='What does the authorized buyer know?';
 submit('tensionForm');assert.equal(els.tensionList.children.length,1);
 els.prepare.value='Draft a neutral, empty milk sourcing comparison worksheet';
 els.permission.value='Ask the authorized steward whether assistance is wanted';
 els.proof.value='Record whether the draft was reviewed, declined, or unneeded';
 submit('firstYesForm');assert.match(els.firstYesPreview.textContent,/"execute": false/);
 els.fruit.value='Only a hypothetical draft worksheet was prepared';
 els.seed.value='Ask the buyer whether more research would help';
 els.compost.value='The grant status has not been independently verified';
 submit('returnForm');assert.match(els.returnPreview.textContent,/AUTHOR_REPORTED_LOCAL_RETURN/);
 els.redaction.value='Would a willing steward benefit from a private comparison?';
 els.destination.value='first-yes';
 els.authorOwn.checked=true;els.consent.checked=true;els.reviewed.checked=true;
 submit('crossForm');
 assert.equal(els.downloadHandoff.disabled,false);
 assert.match(els.crossPreview.textContent,/"standing": "PROPOSE_ONLY"/);
 assert.match(els.crossPreview.textContent,/"canonicalWrite": false/);
 assert.doesNotMatch(els.crossPreview.textContent,/grant status/);
 els.redaction.value='Changed after review';els.redaction.events.input({});
 assert.equal(els.downloadHandoff.disabled,true);
});
test('unconsented crossing can only HOLD',()=>{
 const {els,submit}=mock();
 els.need.value='I would like a simple neighbor help coordination tool';
 els.possible.value='A person may elect to volunteer without obligation';
 submit('startForm');
 els.redaction.value='Could this be a question for a willing volunteer?';
 els.destination.value='first-yes';els.authorOwn.checked=true;
 submit('crossForm');
 assert.equal(els.downloadHandoff.disabled,true);
 assert.match(els.crossPreview.textContent,/HOLD_LOCAL/);
});
