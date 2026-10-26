import {createGram,addTrace,addTension,selectFirstYes,makeReturn,formatCard} from '../gram/portable-gram.mjs';
import {proposeGramCrossing} from '../bridge/gram-reentry.mjs';
import {composeForest,nextInvitation} from '../forest/forest-projection.mjs';
import {prepareFieldRequest,inspectClaimedEvidence} from '../witness/field-return.mjs';

const $=(id)=>document.getElementById(id);
const value=(id)=>$(id).value.trim();
const tell=(id,msg)=>{$(id).textContent=msg;};
let gram=null,plan=null,returned=null,handoff=null,forest=null,successor=null,fieldRequest=null,fieldReview=null;
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
function clearInvitation(reason=''){
 successor=null;
 $('forestNextLink').hidden=true;
 $('forestCopyInvite').disabled=true;
 $('forestNextApproval').checked=false;
 tell('forestNextStatus',reason);
}
function clearField(reason=''){
 fieldRequest=null;fieldReview=null;
 $('fieldDownload').disabled=true;$('fieldCopy').disabled=true;$('fieldReviewDownload').disabled=true;
 tell('fieldRequestPreview','No reviewed witness question prepared. This page does not certify anybody or anything.');
 tell('fieldReviewPreview','No source status independently verified.');
 tell('fieldRequestStatus',reason);tell('fieldCheckStatus','');
}
function clearForest(reason=''){
 clearField('Forest changed. Review a new witness question to continue.');
 forest=null;
 $('forestDownload').disabled=true;
 tell('forestPacketStatus','No portable packet prepared.');
 $('forestDiagram').replaceChildren();
 const note=document.createElement('p');note.className='hint';
 note.textContent='No reviewed forest seed yet. Your private Gram is not a shared graph.';
 $('forestDiagram').append(note);
 tell('forestStatus',reason);
 clearInvitation();
}
function invalidateDownstream(){
 clearForest('Source revision changed. Review a fresh handoff before building a Forest.');
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
  clearForest('Reviewed redaction changed. Compose the forest again.');
  tell('crossStatus',handoff?'A proposal-only packet is ready. Download it deliberately if you choose. No message has been sent.':
   'HOLD: author submission, export consent and redaction review are all required.');
 }catch(err){handoff=null;$('downloadHandoff').disabled=true;syncReturnButton();clearForest('Cannot export an unreviewed question.');tell('crossStatus',err.message||'Unable to prepare redaction.');}
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
  handoff=null;$('downloadHandoff').disabled=true;syncReturnButton();clearForest('Source approval changed.');
  tell('crossStatus','Something changed. Review and prepare the redaction again.');return;
 }
 privateDownload('bananagram-reviewed-proposal.json',JSON.stringify(handoff,null,2));
 tell('crossStatus','Proposal packet downloaded locally. No message or submission was sent.');
});
for(const id of ['redaction','destination','authorOwn','consent','reviewed']){
 $(id).addEventListener('input',()=>{
  handoff=null;$('downloadHandoff').disabled=true;syncReturnButton();clearForest('Redaction changed; forest review must be repeated.');
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
function forestNode(label,value,metadata){
 const article=document.createElement('div');
 article.style.cssText='border:1px solid #c0d0ba;padding:12px;margin:9px 0;border-radius:6px;background:#fffef8';
 const h=document.createElement('strong');h.textContent=label;article.append(h);
 const body=document.createElement('p');body.textContent=value;article.append(body);
 const small=document.createElement('small');small.textContent=metadata;article.append(small);
 $('forestDiagram').append(article);
}
function renderForest(){
 $('forestDiagram').replaceChildren();
 if(!forest)return;
 forestNode('QUESTION · UNRESOLVED',forest.question,'Portable question / author reviewed / no owner adoption');
 if(forest.fruit)forestNode('FRUIT · AUTHOR REPORT',forest.fruit,'Not independently witnessed or confirmed');
 if(forest.seed)forestNode('SEED · POSSIBILITY',forest.seed,'No automatic next table or successor authority');
 $('forestDownload').disabled=false;
 tell('forestPacketStatus','Free Graph v0 seed packet: '+forest.graph.packet_id+
  ' · '+forest.graph.nodes.length+' nodes · '+forest.graph.links.length+
  ' proposed links · owner state unresolved. No remote graph was updated.');
}
$('forestForm').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!handoff){tell('forestStatus','First create the separately reviewed handoff in Step 05.');return;}
 if(!e.target.reportValidity())return;
 try{
  const output=await composeForest(handoff,{
   fruit:value('forestFruit'),seed:value('forestSeed'),
   authorReviewed:$('forestReviewed').checked,
   exportConsent:$('forestConsent').checked
  });
  if(output.standing!=='REVIEWED_PACKET_UNPUBLISHED'){
   clearForest('HOLD: review and independent export consent are required.');return;
  }
  forest=output;
  renderForest();
  if(forest.seed)$('forestNextQuestion').value=forest.seed;
  clearInvitation('Forest seed prepared. Edit the next invitation, then explicitly approve it.');
  tell('forestStatus','Private Forest View prepared from only the reviewed text. No Free Graph server updated, no aid confirmed, no invitation sent.');
 }catch(err){clearForest(err.message||'Could not compose Forest packet.');}
});
$('forestDownload').addEventListener('click',()=>{
 if(!forest)return;
 privateDownload('bananagram-free-graph-v0.json',JSON.stringify(forest.graph,null,2));
 tell('forestStatus','Free Graph seed packet downloaded locally. It has NOT been accepted by an owning project or published.');
});
for(const id of ['forestFruit','forestSeed','forestReviewed','forestConsent']){
 $(id).addEventListener('input',()=>{
  if(forest)clearForest('Forest fields changed. Compose and review a new packet before exporting.');
 });
}
$('forestNextForm').addEventListener('submit',e=>{
 e.preventDefault();
 if(!forest){tell('forestNextStatus','First compose a reviewed Forest packet with a possible next question.');return;}
 if(!e.target.reportValidity())return;
 try{
  successor=nextInvitation(forest,{title:value('forestNextTitle'),
   purpose:value('forestNextQuestion'),date:value('forestNextDate'),
   approved:$('forestNextApproval').checked});
  $('forestNextLink').href=successor.url;
  $('forestNextLink').hidden=false;
  $('forestCopyInvite').disabled=false;
  tell('forestNextStatus','A public-safe portable invitation link is ready, not sent. Opening it shares ONLY your approved new table fields.');
 }catch(err){clearInvitation(err.message||'No invitation prepared.');}
});
for(const id of ['forestNextTitle','forestNextQuestion','forestNextDate']){
 $(id).addEventListener('input',()=>clearInvitation('Changed invitation fields. Review and explicitly approve them again.'));
}
$('forestNextApproval').addEventListener('change',()=>{
 successor=null;
 $('forestNextLink').hidden=true;
 $('forestCopyInvite').disabled=true;
 tell('forestNextStatus',$('forestNextApproval').checked?
  'Fields approved. Press Prepare a voluntary invitation to build the link.':'Approval withdrawn; no invitation is available.');
});
$('forestCopyInvite').addEventListener('click',async()=>{
 if(!successor)return;
 try{
  await navigator.clipboard.writeText(successor.url);
  tell('forestNextStatus','Link copied. You still choose whether and with whom to share it.');
 }catch{
  tell('forestNextStatus','Clipboard unavailable. Open the prepared link and use the browser address bar.');
 }
});
function quantity(id){
 const v=$(id).value.trim();
 if(!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(v))throw Error('Enter a nonnegative numeric quantity for '+id);
 const n=Number(v);if(!Number.isFinite(n))throw Error('Invalid quantity.');return n;
}
function occ(id,n){
 const ref=value(id);
 if(!ref)return [];
 if(!/^[a-zA-Z0-9:_-]{4,96}$/.test(ref))throw Error('Use a non-identifying occurrence reference, no personal details.');
 if(n===0)throw Error('A zero-unit occurrence is not confirmation.');
 return [{occurrenceRef:ref,confirmedUnits:n}];
}
function fieldText(r){
 return ['FIELD RETURN 001 · UNSENT HUMAN QUESTION',
 'Source graph: '+r.sourcePacketId,'QUESTION: '+r.question,
 'ASK: '+r.request,'WHAT WOULD PROVE IT: '+r.evidenceQuestion,
 'UNKNOWN: '+r.unresolved,'STATUS: No steward/recipient authenticated.',
 'BOUNDARY: Not a receipt, consent, or authority to contact others.'].join('\n\n');
}
$('fieldRequestForm').addEventListener('submit',e=>{
 e.preventDefault();
 if(!forest){tell('fieldRequestStatus','Prepare a reviewed Forest seed in Step 06 first.');return;}
 if(!e.target.reportValidity())return;
 try{
  const output=prepareFieldRequest(forest,{reviewApproved:$('fieldApproved').checked,
   ask:value('fieldAsk'),whatWouldProveIt:value('fieldProof'),uncertainty:value('fieldFog')});
  if(output.standing!=='REQUEST_DRAFT_UNSENT'){
   clearField('HOLD: approve the exact field question before preparing it.');return;
  }
  fieldRequest=output;fieldReview=null;
  $('fieldDownload').disabled=false;$('fieldCopy').disabled=false;$('fieldReviewDownload').disabled=true;
  tell('fieldRequestPreview',fieldText(output));
  tell('fieldReviewPreview','No claimed source evidence reviewed yet.');
  tell('fieldRequestStatus','Private question prepared. You choose whether to ask anybody. No message sent.');
  tell('fieldCheckStatus','');
 }catch(err){clearField(err.message||'Cannot prepare witness request.');}
});
for(const id of ['fieldAsk','fieldProof','fieldFog']){
 $(id).addEventListener('input',()=>{if(fieldRequest)clearField('Question changed; review and approve again.');});
}
$('fieldApproved').addEventListener('change',()=>{
 if(fieldRequest)clearField('Approval changed; review again before preparing.');
});
function fieldInvitation(r){
 return [
  'A question for a willing community steward',
  '',
  r.request,
  '',
  'The particular thing we would like to verify:',
  r.evidenceQuestion,
  '',
  'What we do NOT yet know:',
  r.unresolved,
  '',
  'Would exploring this question be useful to you? There is no commitment to participate.',
  'Please say no or not yet if that is more useful.',
  '',
  'This is an independent community inquiry, not an official request or claim of completed aid.'
 ].join('\n');
}
$('fieldCopy').addEventListener('click',async()=>{
 if(!fieldRequest)return;
 try{
  await navigator.clipboard.writeText(fieldInvitation(fieldRequest));
  tell('fieldRequestStatus','Voluntary request copied. You choose whether and to whom to send it. Nothing was sent here.');
 }catch{
  tell('fieldRequestStatus','Clipboard permission unavailable. You can select the prepared question or save your private request.');
 }
});
$('fieldDownload').addEventListener('click',()=>{
 if(!fieldRequest)return;
 privateDownload('bananagram-private-witness-request.json',JSON.stringify(fieldRequest,null,2));
 tell('fieldRequestStatus','Private request saved locally; nothing was transmitted.');
});
$('fieldSecondEnabled').addEventListener('change',()=>{
 $('fieldSecondFields').hidden=!$('fieldSecondEnabled').checked;
 fieldReview=null;$('fieldReviewDownload').disabled=true;
 tell('fieldCheckStatus','Link configuration changed; inspect again.');
});
$('fieldCheckForm').addEventListener('submit',e=>{
 e.preventDefault();
 if(!fieldRequest){tell('fieldCheckStatus','Prepare a witness question first.');return;}
 if(!e.target.reportValidity())return;
 try{
  const a=quantity('fieldConfirmed'),b=quantity('fieldReported'),target=quantity('fieldQuantity');
  const links=[];
  if(a>0||value('fieldOccurrence'))links.push({
    claimedConfirmedUnits:a,occurrences:occ('fieldOccurrence',a)
  });
  if($('fieldSecondEnabled').checked){
   const n=quantity('fieldSecondConfirmed');
   links.push({claimedConfirmedUnits:n,occurrences:occ('fieldSecondOccurrence',n)});
  }
  fieldReview=inspectClaimedEvidence(fieldRequest,{
   stewardResponse:value('fieldSteward'),requirement:value('fieldRequirement'),
   requestedUnits:target,unit:value('fieldUnit'),helperReportedUnits:b,
   links,statusFresh:$('fieldStatusFresh').checked
  });
  $('fieldReviewDownload').disabled=false;
  const q=fieldReview.quantity;
  tell('fieldReviewPreview',[
   'FIELD RETURN · '+fieldReview.standing,
   'Claimed source count: '+q.claimedConfirmationLowerBound+' '+q.unit+' (unverified)',
   'Accounting basis: '+q.confirmationBasis,
   'Exact across submitted links: '+(q.confirmedUnitsExact?'yes within the claim':'NO; conservatively bounded'),
   'Helper report only: '+q.helperReported+' '+q.unit,
   'Residual: '+(q.residualUpperBound===null?'unknown':q.residualUpperBound+' '+q.unit),
   'Warnings: '+(fieldReview.warnings.length?fieldReview.warnings.join('; '):'Independent owner check still required'),
   'Actual physical provision verified: NO.',
   fieldReview.nextGate||fieldReview.humanDecision
  ].join('\n\n'));
  tell('fieldCheckStatus','Local claimed-status review prepared. Owner confirmation still required.');
 }catch(err){fieldReview=null;$('fieldReviewDownload').disabled=true;tell('fieldCheckStatus',err.message||'Could not inspect claimed evidence.');}
});
for(const id of ['fieldSteward','fieldRequirement','fieldQuantity','fieldUnit','fieldReported','fieldConfirmed',
 'fieldOccurrence','fieldSecondConfirmed','fieldSecondOccurrence','fieldStatusFresh']){
 $(id).addEventListener('input',()=>{
  if(fieldReview){fieldReview=null;$('fieldReviewDownload').disabled=true;tell('fieldCheckStatus','Claim changed; inspect it again.');}
 });
}
$('fieldReviewDownload').addEventListener('click',()=>{
 if(!fieldReview)return;
 privateDownload('bananagram-private-field-review.json',JSON.stringify(fieldReview,null,2));
 tell('fieldCheckStatus','Local review downloaded, not a confirmed Jubilee receipt.');
});
$('printPrivate').addEventListener('click',()=>window.print());
render();

