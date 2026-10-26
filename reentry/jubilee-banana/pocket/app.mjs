import {createGram,addTrace,addTension,selectFirstYes,makeReturn,formatCard} from '../gram/portable-gram.mjs';
import {proposeGramCrossing} from '../bridge/gram-reentry.mjs';

const $=(id)=>document.getElementById(id);
const value=(id)=>$(id).value.trim();
const tell=(id,msg)=>{$(id).textContent=msg;};
let gram=null,plan=null,returned=null,handoff=null;
const tableNonce=new URLSearchParams(location.hash.slice(1)).get('returnToTable');
const tableReturnMode=!!(window.opener&&tableNonce&&/^[a-f0-9]{32}$/.test(tableNonce));
const TABLE_MESSAGE='bananagram.reviewed-seat-draft/v0';
if(tableReturnMode){
 $('returnToTableBtn').hidden=false;
 $('tableReturnHint').hidden=false;
}
function syncReturnButton(){
 $('returnToTableBtn').disabled=!tableReturnMode||!handoff;
}
const newRef=()=>{
 const u=crypto.randomUUID?.();
 if(u) return 'gram:'+u;
 const bytes=crypto.getRandomValues(new Uint8Array(16));
 return 'gram:'+Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
};
function privateDownload(filename,body){
 const blob=new Blob([body],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function invalidateDownstream(){
 plan=null;returned=null;handoff=null;
 tell('firstYesPreview','This Gram has changed. Select a fresh First Yes plan if useful.');
 tell('returnPreview','This Gram has changed. A return must reference the latest revision.');
 tell('crossPreview','The Gram has changed. Review and prepare another redaction if you want to export it.');
 $('downloadHandoff').disabled=true;syncReturnButton();
 tell('crossStatus','');
}
function updateList(id,items,formatter){
 const root=$(id);
 root.replaceChildren();
 if(!items.length){const p=document.createElement('p');p.className='hint';p.textContent='None recorded yet.';root.append(p);return;}
 items.forEach((v,i)=>{
 const div=document.createElement('div');div.textContent=(i+1)+'. '+formatter(v);root.append(div);
 });
}
function render(){
 $('savePrivate').disabled=!gram;
 if(!gram){tell('gramPreview','Start by planting a question. The Gram stays in this page until you explicitly download it.');updateList('traceList',[],()=> '');updateList('tensionList',[],()=> '');return;}
 tell('gramPreview',formatCard(gram,returned));
 updateList('traceList',gram.trace,x=>x.statement+' — '+x.sourceType.replaceAll('_',' '));
 updateList('tensionList',gram.tensions,x=>x.oneView+' / '+x.otherView+' · OPEN: '+x.unresolvedQuestion);
}
function grow(fn){
 if(!gram){tell('observeStatus','Plant your Gram first.');return;}
 try{gram=fn(gram);invalidateDownstream();render();tell('observeStatus','Preserved a new local revision ('+gram.revision+'). Your earlier snapshot was not silently overwritten.');}
 catch(err){tell('observeStatus',err.message||'Could not update Gram.');}
}
$('startForm').addEventListener('submit',e=>{
 e.preventDefault();
 if(!$('startForm').reportValidity())return;
 try{
  const first=createGram({sourceRef:newRef(),kind:'question',
   need:value('need'),offeringBack:value('offering'),ifThisSucceeds:value('possible'),question:value('question')});
  if(gram&&!confirm('Replace your current unsaved Gram with a new one? Download it privately first if you want to keep it.'))return;
  gram=first;invalidateDownstream();render();
  tell('startStatus','Gram planted on this device. Revision 1. No contact, promise, or outside record created.');
 }catch(err){tell('startStatus',err.message||'Could not create Gram.');}
});
$('starter').addEventListener('click',()=>{
 $('need').value='Could a willing food shelf buyer benefit from a verified comparison of milk sourcing options?';
 $('offering').value='If helpful, share a public-safe research method with other communities, subject to consent.';
 $('possible').value='An authorized buyer can choose a suitable option without relying on rumors or guessed prices.';
 $('question').value='Which program, quantities, conditions and dates are currently verified?';
 tell('startStatus','Fictional research starter loaded. It is not a claim about an actual food shelf.');
});
$('fresh').addEventListener('click',()=>{
 if(gram&&!confirm('Start fresh? Unsaved work in this browser page will be lost.'))return;
 gram=null;plan=null;returned=null;handoff=null;
 for(const form of ['startForm','traceForm','tensionForm','firstYesForm','returnForm','crossForm'])$(form).reset();
 $('downloadHandoff').disabled=true;syncReturnButton();
 for(const id of ['startStatus','observeStatus','firstYesStatus','returnStatus','crossStatus'])tell(id,'');
 tell('firstYesPreview','Your chosen plan will appear here. Selecting is not executing, purchasing, scheduling, enrolling, or confirming anything.');
 tell('returnPreview','A return does not create another task or transfer authority.');
 tell('crossPreview','Nothing crosses automatically. An authorized person would still need to accept the proposal.');
 render();
});
$('traceForm').addEventListener('submit',e=>{
 e.preventDefault();if(!e.target.reportValidity())return;
 grow(g=>addTrace(g,{statement:value('trace'),sourceType:value('traceType')}));
 e.target.reset();
});
$('tensionForm').addEventListener('submit',e=>{
 e.preventDefault();if(!e.target.reportValidity())return;
 grow(g=>addTension(g,{oneView:value('oneView'),otherView:value('otherView'),unresolvedQuestion:value('unresolved')}));
 e.target.reset();
});
$('firstYesForm').addEventListener('submit',e=>{
 e.preventDefault();if(!gram){tell('firstYesStatus','Plant a Gram first.');return;}
 if(!e.target.reportValidity())return;
 try{
  plan=selectFirstYes(gram,{selected:true,prepareNow:value('prepare'),
   permissionQuestion:value('permission'),proofOfReturn:value('proof')});
  tell('firstYesPreview',JSON.stringify(plan,null,2));
  tell('firstYesStatus','Plan selected locally. No task assigned, message sent, or authorization granted.');
 }catch(err){tell('firstYesStatus',err.message);}
});
$('returnForm').addEventListener('submit',e=>{
 e.preventDefault();if(!gram){tell('returnStatus','Plant a Gram first.');return;}
 try{
  returned=makeReturn(gram,{reviewed:true,fruit:value('fruit'),seed:value('seed'),compost:value('compost')});
  tell('returnPreview',JSON.stringify(returned,null,2));
  tell('returnStatus','Your local account of fruit, seed and compost is saved in this page. No claim of independent verification.');
  render();
 }catch(err){tell('returnStatus',err.message);}
});
$('crossForm').addEventListener('submit',e=>{
 e.preventDefault();
 if(!gram){tell('crossStatus','Plant your Gram first.');return;}
 if(!e.target.reportValidity())return;
 try{
  const result=proposeGramCrossing(gram,{
   participationConfirmedByAuthor:$('authorOwn').checked,
   consentToExport:$('consent').checked,
   reviewedByHuman:$('reviewed').checked,
   redactedSummary:value('redaction'),kind:'question',destination:value('destination')
  });
  handoff=result.standing==='PROPOSE_ONLY'?result:null;
  tell('crossPreview',JSON.stringify(result,null,2));
  $('downloadHandoff').disabled=!handoff;syncReturnButton();
  tell('crossStatus',handoff?'A proposal-only packet is ready. Download it deliberately if you choose. No message has been sent.':
   'HOLD: author submission, export consent and redaction review are all required.');
 }catch(err){handoff=null;$('downloadHandoff').disabled=true;syncReturnButton();tell('crossStatus',err.message||'Unable to prepare redaction.');}
});
$('savePrivate').addEventListener('click',()=>{
 if(!gram)return;
 if(!confirm('Download the COMPLETE PRIVATE Gram? It may include unverified statements or personal notes. Do not publish or forward this raw file.'))return;
 const out={schema:'bananagram.private-local-export/v0',
  warning:'PRIVATE DEVICE EXPORT; not a public proposal or independently verified Jubilee receipt',
  gram,firstYesPlan:plan,localReturn:returned};
 privateDownload('bananagram-private-'+gram.sourceRef.replace(/[^a-z0-9-]/gi,'-')+'.json',JSON.stringify(out,null,2));
 tell('startStatus','Private draft downloaded to your device; it was not uploaded or sent.');
});
$('downloadHandoff').addEventListener('click',()=>{
 if(!handoff)return;
 // Re-check that this remains the particular reviewed redaction.
 const current=proposeGramCrossing(gram,{participationConfirmedByAuthor:$('authorOwn').checked,
   consentToExport:$('consent').checked,reviewedByHuman:$('reviewed').checked,
   redactedSummary:value('redaction'),kind:'question',destination:value('destination')});
 if(current.standing!=='PROPOSE_ONLY'||JSON.stringify(current)!==JSON.stringify(handoff)){
  handoff=null;$('downloadHandoff').disabled=true;syncReturnButton();
  tell('crossStatus','Something changed. Review and prepare the redaction again.');return;
 }
 privateDownload('bananagram-reviewed-proposal.json',JSON.stringify(handoff,null,2));
 tell('crossStatus','Proposal packet downloaded locally. No message or submission was sent.');
});
for(const id of ['redaction','destination','authorOwn','consent','reviewed']){
 $(id).addEventListener('input',()=>{
  handoff=null;$('downloadHandoff').disabled=true;syncReturnButton();
  tell('crossStatus','Draft changed; prepare and review again before exporting.');
 });
}
$('returnToTableBtn').addEventListener('click',()=>{
 if(!tableReturnMode||!handoff||!window.opener||window.opener.closed){
  tell('crossStatus','Your original Table tab is not available. Keep this private draft and use its separate download if you want.');
  return;
 }
 try{
  const current=proposeGramCrossing(gram,{
   participationConfirmedByAuthor:$('authorOwn').checked,
   consentToExport:$('consent').checked,
   reviewedByHuman:$('reviewed').checked,
   redactedSummary:value('redaction'),kind:'question',destination:value('destination')
  });
  if(current.standing!=='PROPOSE_ONLY'||JSON.stringify(current)!==JSON.stringify(handoff))
   throw Error('The reviewed draft changed. Prepare it again first.');
  const summary=current.candidate?.summary;
  if(typeof summary!=='string'||summary.length<12||summary.length>240)
   throw Error('Only a short reviewed question can return to the Table.');
  window.opener.postMessage({type:TABLE_MESSAGE,nonce:tableNonce,
    standing:'PROPOSE_ONLY',summary},location.origin);
  tell('crossStatus','The reviewed question was offered to your original Table tab as an editable draft. No contribution was saved or shared.');
 }catch(err){tell('crossStatus',err.message||'Unable to return the draft.');}
});
$('printPrivate').addEventListener('click',()=>window.print());
render();
