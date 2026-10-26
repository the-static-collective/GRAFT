import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {webcrypto} from 'node:crypto';
import {createGram,addTrace,addTension,selectFirstYes,makeReturn,formatCard} from '../gram/portable-gram.mjs';
import {proposeGramCrossing} from '../bridge/gram-reentry.mjs';
import {composeForest,nextInvitation} from '../forest/forest-projection.mjs';
import {prepareFieldRequest,inspectClaimedEvidence} from '../witness/field-return.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const html=readFileSync(join(here,'../pocket/index.html'),'utf8');
const script=readFileSync(join(here,'../pocket/app.mjs'),'utf8');
function page(){
 const elements={};
 const el=id=>elements[id]??(elements[id]={
  id,style:{},value:'',checked:false,
  disabled:['fieldDownload','fieldReviewDownload','forestDownload','forestCopyInvite','downloadHandoff'].includes(id),
  hidden:id==='fieldSecondFields',textContent:'',href:'',children:[],events:{},
  reportValidity(){return true},reset(){},
  append(...xs){this.children.push(...xs)},replaceChildren(){this.children=[]},
  addEventListener(k,v){this.events[k]=v},focus(){},click(){}
 });
 for(const [,id] of html.matchAll(/\bid="([^"]+)"/g))el(id);
 // Mirror HTML default control values; fake DOM does not parse select/input markup.
 const defaults={fieldSteward:'not-asked',fieldRequirement:'One hypothetical milk need',
 fieldQuantity:'24',fieldUnit:'cartons',fieldReported:'0',fieldConfirmed:'0',
 fieldSecondConfirmed:'0'};
 for(const [id,value] of Object.entries(defaults))el(id).value=value;
 const document={getElementById:el,createElement:el,body:{append(){}}};
 const window={opener:null,print(){}},location={hash:'',origin:'https://example.test'};
 const clipboardCopies=[];
 const navigator={clipboard:{writeText:async t=>{clipboardCopies.push(t);}}};
 const code=script.replace(/^import .*?;\s*$/gm,'');
 new Function('document','window','location','navigator','crypto','confirm','setTimeout','URLSearchParams',
 'createGram','addTrace','addTension','selectFirstYes','makeReturn','formatCard',
 'proposeGramCrossing','composeForest','nextInvitation','prepareFieldRequest','inspectClaimedEvidence',code)(
  document,window,location,navigator,webcrypto,()=>true,()=>{},URLSearchParams,
  createGram,addTrace,addTension,selectFirstYes,makeReturn,formatCard,
  proposeGramCrossing,composeForest,nextInvitation,prepareFieldRequest,inspectClaimedEvidence);
 return {el,clipboardCopies,submit:id=>el(id).events.submit({preventDefault(){},target:el(id)})};
}
async function seeded(){
 const p=page();
 p.el('need').value='Does a food shelf purchaser actually need help with available milk sources?';
 p.el('possible').value='An authorized decision maker can decide whether a comparison matters.';
 p.submit('startForm');
 p.el('redaction').value='Would a willing food shelf steward want a neutral source comparison?';
 p.el('destination').value='first-yes';
 for(const id of ['authorOwn','consent','reviewed'])p.el(id).checked=true;
 p.submit('crossForm');
 p.el('forestFruit').value='An illustrative worksheet exists; no delivery is claimed.';
 p.el('forestSeed').value='Might an authorized food shelf purchaser welcome a quick check?';
 p.el('forestReviewed').checked=true;p.el('forestConsent').checked=true;
 await p.submit('forestForm');
 assert.equal(p.el('forestDownload').disabled,false,p.el('forestStatus').textContent);
 return p;
}
test('witness request remains unsent until author approval',async()=>{
 const p=await seeded();
 p.el('fieldAsk').value='Would the food shelf director like to verify available milk choices?';
 p.el('fieldProof').value='Only owner-current confirmation and a beneficiary receipt would prove a delivery.';
 p.el('fieldFog').value='No supply quantity or grant end date has been independently verified.';
 p.submit('fieldRequestForm');
 assert.equal(p.el('fieldDownload').disabled,true);
 assert.match(p.el('fieldRequestStatus').textContent,/approve/);
 p.el('fieldApproved').checked=true;
 p.submit('fieldRequestForm');
 assert.equal(p.el('fieldDownload').disabled,false,p.el('fieldRequestStatus').textContent);
 assert.match(p.el('fieldRequestPreview').textContent,/UNSENT HUMAN QUESTION/);
 assert.equal(p.el('fieldCopy').disabled,false);
 await p.el('fieldCopy').events.click();
 assert.equal(p.clipboardCopies.length,1);
 assert.match(p.clipboardCopies[0],/There is no commitment to participate/);
 assert.doesNotMatch(p.clipboardCopies[0],/sourcePacketId|receiptClaim|sourceRef/);
});
test('reported delivery without confirmation stays unresolved, and duplicate occurrences are not added',async()=>{
 const p=await seeded();
 p.el('fieldAsk').value='Would a buyer like to check the actual delivery receipt?';
 p.el('fieldProof').value='Owner-current receipt and a separate authorized recipient confirmation.';
 p.el('fieldFog').value='No independently verified delivery or occurrence ID has been supplied.';
 p.el('fieldApproved').checked=true;p.submit('fieldRequestForm');
 p.el('fieldRequirement').value='Milk cartons';
 p.el('fieldQuantity').value='50';p.el('fieldUnit').value='cartons';
 p.el('fieldReported').value='40';p.el('fieldConfirmed').value='0';
 p.submit('fieldCheckForm');
 assert.match(p.el('fieldReviewPreview').textContent,/HELPER_REPORT_HAS_NO_CONFIRMATION/,p.el('fieldCheckStatus').textContent);
 assert.match(p.el('fieldReviewPreview').textContent,/Actual physical provision verified: NO/);
 p.el('fieldConfirmed').value='20';
 p.el('fieldOccurrence').value='delivery:occ-001';
 p.el('fieldSecondEnabled').checked=true;p.el('fieldSecondEnabled').events.change({});
 p.el('fieldSecondConfirmed').value='20';p.el('fieldSecondOccurrence').value='delivery:occ-001';
 p.submit('fieldCheckForm');
 assert.match(p.el('fieldReviewPreview').textContent,/Claimed source count: 20 cartons/);
 assert.doesNotMatch(p.el('fieldReviewPreview').textContent,/Claimed source count: 40 cartons/);
 assert.match(p.el('fieldReviewPreview').textContent,/Actual physical provision verified: NO/);
 p.el('fieldFog').value='New unverified uncertainty';
 p.el('fieldFog').events.input({});
 assert.equal(p.el('fieldDownload').disabled,true);
 assert.equal(p.el('fieldReviewDownload').disabled,true);
});
test('independent human decline is respected without generating authority',async()=>{
 const p=await seeded();
 p.el('fieldAsk').value='Would a buyer be willing to review this draft?';
 p.el('fieldProof').value='A recipient would need to confirm any actual delivery.';
 p.el('fieldFog').value='Delivery, identity and source authenticity remain unknown.';
 p.el('fieldApproved').checked=true;p.submit('fieldRequestForm');
 p.el('fieldSteward').value='declined';
 p.submit('fieldCheckForm');
 assert.match(p.el('fieldReviewPreview').textContent,/STOP_OR_RETURN_TO_AUTHOR/);
 assert.match(p.el('fieldReviewPreview').textContent,/Actual physical provision verified: NO/);
});
