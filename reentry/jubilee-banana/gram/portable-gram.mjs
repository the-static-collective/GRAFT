// BANANAGRAM PORTABLE-001 · no network, auth, ledger writes, or public posting.
export const GRAM='bananagram.portable-proposal/v0';
export const RETURN='bananagram.local-return/v0';
export const LINKS=Object.freeze(['makes_possible','learned_from','grafted_into','left_behind','composted_into','harvested_by']);
const REFS=/^[a-z][a-z0-9:_-]{7,95}$/;
const KINDS=new Set(['need','question','offer','experiment']);
const SOURCES=new Set(['heard_from_someone','observed_by_author','document_unreviewed','local_test']);
const safe=(v,min=0,max=500)=>{
 if(typeof v!=='string')throw Error('TEXT_REQUIRED');
 const s=v.replace(/[\x00-\x1f\x7f]/g,' ').trim().replace(/\s+/g,' ');
 if(s.length<min||s.length>max)throw Error('TEXT_LENGTH');
 return s;
};
const ref=(v)=>{if(typeof v!=='string'||!REFS.test(v))throw Error('OPAQUE_REFERENCE_REQUIRED');return v;};
const copy=(v)=>JSON.parse(JSON.stringify(v));
const check=(v)=>{if(!v||v.schema!==GRAM||v.standing!=='LOCAL_PROPOSAL')throw Error('INVALID_GRAM');};
const append=(g,key,v)=>{check(g);const out=copy(g);out.previousRevision=g.revision;out.revision++;out[key].push(v);return out;};
export function createGram({sourceRef,kind='question',need,offeringBack='',ifThisSucceeds,question=''}){
 if(!KINDS.has(kind))throw Error('INVALID_KIND');
 return {schema:GRAM,standing:'LOCAL_PROPOSAL',scope:'this-device',sourceRef:ref(sourceRef),
  revision:1,previousRevision:null,kind,need:safe(need,12,500),offeringBack:safe(offeringBack,0,240),
  ifThisSucceeds:safe(ifThisSucceeds,12,300),question:safe(question,0,300),
  reciprocity:'VOLUNTARY_NOT_REQUIRED',trace:[],tensions:[],relations:[],
  authority:{actorAuthenticated:false,stewardAccepted:false,canonicalWrite:false,
    transportSent:false,delivered:false,published:false}};
}
export function addTrace(g,{statement,sourceType='heard_from_someone',sourceRef=null}){
 if(!SOURCES.has(sourceType))throw Error('INVALID_TRACE_TYPE');
 return append(g,'trace',{statement:safe(statement,12,450),sourceType,
  sourceRef:sourceRef?ref(sourceRef):null,standing:'REPORTED_NOT_CONFIRMED'});
}
export function addTension(g,{oneView,otherView,unresolvedQuestion}){
 return append(g,'tensions',{oneView:safe(oneView,10,320),otherView:safe(otherView,10,320),
   unresolvedQuestion:safe(unresolvedQuestion,10,320),standing:'OPEN_NOT_RESOLVED'});
}
export function linkNearby(g,{verb,targetRef,why}){
 if(!LINKS.includes(verb))throw Error('INVALID_BANANAGRAM_LINK');
 const target=ref(targetRef);
 if(target===g.sourceRef)throw Error('SELF_LINK_REFUSED');
 return append(g,'relations',{verb,targetRef:target,why:safe(why,12,240),
   standing:'LOCAL_CANDIDATE',freeGraphAdmitted:false});
}
export function selectFirstYes(g,{selected,prepareNow,permissionQuestion,proofOfReturn}){
 check(g);
 if(selected!==true)return {schema:'bananagram.first-yes/v0',standing:'HOLD_SELECTION_REQUIRED'};
 return {schema:'bananagram.first-yes/v0',standing:'SELECTED_PLAN_ONLY',sourceRef:g.sourceRef,
  revision:g.revision,prepareNow:safe(prepareNow,12,320),
  permissionQuestion:safe(permissionQuestion,12,320),
  proofOfReturn:safe(proofOfReturn,12,320),
  authority:{execute:false,stewardPermission:false,canonicalReceipt:false,notifications:false}};
}
export function makeReturn(g,{reviewed,fruit='',seed='',compost=''}){
 check(g);
 if(reviewed!==true)return {schema:RETURN,standing:'HOLD_HUMAN_REVIEW_REQUIRED'};
 const a=safe(fruit,0,300),b=safe(seed,0,300),c=safe(compost,0,300);
 if(!a&&!b&&!c)throw Error('EMPTY_RETURN');
 return {schema:RETURN,standing:'AUTHOR_REPORTED_LOCAL_RETURN',sourceRef:g.sourceRef,
  revision:g.revision,fruit:{text:a,evidence:'SELF_REPORT',confirmed:false},
  seed:{text:b,selectionAuthority:false,crossingAuthority:false},
  compost:{text:c,authority:false},openTensions:g.tensions.length,
  consequenceReceipt:null,successorTableInvite:null};
}
export function formatCard(g,ret=null){
 check(g);
 if(ret && (ret.schema!==RETURN||ret.sourceRef!==g.sourceRef||ret.revision!==g.revision))
   throw Error('STALE_OR_WRONG_RETURN');
 const lines=['BANANAGRAM · PRIVATE, UNSENT PROPOSAL','Revision '+g.revision,
 '', 'NEEDS',g.need,'',
 'OFFERING BACK (VOLUNTARY; NEVER OWED)',g.offeringBack||'None specified','',
 'IF THIS SUCCEEDS, WHAT BECOMES POSSIBLE NEXT?',g.ifThisSucceeds,'',
 'QUESTION',g.question||'Unknown','',
 'TRACES — NOT CONFIRMED',...g.trace.map(t=>'- '+t.statement+' ['+t.sourceType+']'),'',
 'TENSIONS — KEEP BOTH PERSPECTIVES',...g.tensions.map(t=>'- '+t.oneView+' / '+t.otherView+' · '+t.unresolvedQuestion),'',
 'POSSIBLE LINKS — NOT FREE GRAPH ADMISSIONS',...g.relations.map(x=>'- '+x.verb+' → '+x.targetRef+': '+x.why)];
 if(ret)lines.push('','RETURN — '+ret.standing,'FRUIT (AUTHOR REPORT): '+ret.fruit.text,
   'SEED (NOT SELECTED): '+ret.seed.text,'COMPOST: '+ret.compost.text);
 lines.push('','No message sent. No Jubilee receipt. No partner enrolled. No verified delivery.');
 return lines.join('\n');
}
