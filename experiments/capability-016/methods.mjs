/**
 * GRAFT-016 — three independently implemented, hand-authored local methods.
 *
 * The deliberately defective interpolation method is a RED-TEAM TEST ONLY.
 * Its outputs must NEVER be written or opened as HTML. Only the JSON witness
 * may contain its raw text. Neither original source code nor tool generation
 * is credited as a new scientific algorithm.
 */
import {createHash} from 'node:crypto';
import {renderOfflineStoryCard} from '../capability-015/compiler.mjs';

const sha=x=>createHash('sha256').update(x).digest('hex');
const escaping=x=>x.replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
function unsafeInterpolation(request){
 const s=request.syntheticStory;
 return '<!doctype html><html lang="en"><head><title>'+s.title+
  '</title></head><body><h1>'+s.title+'</h1><p>'+s.subtitle+'</p>'+
  s.captions.map(x=>'<p>'+x+'</p>').join('')+'</body></html>';
}
function escapedCompact(request){
 const s=request.syntheticStory;
 return '<!doctype html><html lang="en"><head><meta charset="utf-8">'+
  '<title>'+escaping(s.title)+'</title>'+
  '<style>@media print{body{color:black;background:white}}</style>'+
  '</head><body><h1>'+escaping(s.title)+'</h1><p>'+escaping(s.subtitle)+'</p>'+
  s.captions.map(x=>'<p>'+escaping(x)+'</p>').join('')+
  '<footer>Invented exhibit. No legal rights or money.</footer>'+
  '</body></html>';
}
const renderers={
 'unsafe-interpolation':unsafeInterpolation,
 'escaped-compact':escapedCompact,
 'accessible-print':renderOfflineStoryCard
};
export function sourceMethods(){
 return Object.keys(renderers);
}
export function proposalForCase(spec,name){
 if(!spec||spec.schema!=='jubilee.capability-method-lab/v1'||
    spec.authority!=='PROPOSE_ONLY'||
    spec.receiver!=='the-static-collective/GRAFT'||
    spec.baseRequest?.dataOrigin!=='entirely-invented-public-fixture'||
    spec.actualHumanData!==false||spec.realRightsCreated!==false||
    spec.moneyMovedCents!==0 ||
    JSON.stringify(spec.methods)!==JSON.stringify(sourceMethods())||
    !spec.caseStories||!Object.hasOwn(spec.caseStories,name))
   throw new Error('Unsupported or unverified fictional method experiment');
 const story=spec.caseStories[name];
 if(!story||!Array.isArray(story.captions)||!story.captions.length||
    story.captions.length>5||story.captions.some(x=>typeof x!=='string'||x.length>240))
   throw new Error('Rejected unbounded story content');
 return {...spec.baseRequest,syntheticStory:JSON.parse(JSON.stringify(story))};
}
export function runCandidate(spec,methodId){
 if(!Object.hasOwn(renderers,methodId))throw new Error('Unknown source-owned method');
 const render=renderers[methodId];
 const outputs={};
 for(const name of ['ordinary','hostile-markup','multilingual']){
  const request=proposalForCase(spec,name);
  const html=render(request),replayHtml=render(request);
  outputs[name]={
   html,replayHtml,sha256:sha(html),replaySha256:sha(replayHtml)
  };
 }
 return {methodId,
  outputs,claims:{
   realActionsAuthorized:false,moneyMovedCents:0,
   productionAdmitted:false
  }};
}
/**
 * Two controlled renderer ports for independent MOTIF-010 active diagnosis.
 * Four cases are all actually rendered; an independent evaluator reveals
 * only the selected one after native Scientist requests that intervention.
 * Test-only intentionally unsafe HTML is stored as DATA inside JSON.
 */
export function controlledDiagnostics(spec){
 const scenario=proposalForCase(spec,'hostile-markup');
 const out=[];
 for(const escaped of [false,true])for(const printable of [false,true]){
  const s=scenario.syntheticStory;
  const maybe=x=>escaped?escaping(x):x;
  const html='<!doctype html><html lang="en"><head><meta charset="utf-8">'+
   (printable?'<style>@media print{body{color:black}}</style>':'')+
   '</head><body><h1>'+maybe(s.title)+'</h1>'+
   '<p>'+maybe(s.subtitle)+'</p>'+
   s.captions.map(x=>'<p>'+maybe(x)+'</p>').join('')+
   '</body></html>';
  out.push({escaped,printable,html,sha256:sha(html),synthetic:true});
 }
 return out;
}
export function runAllCandidates(spec){
 if(!spec||!Array.isArray(spec.methods)||spec.methods.length!==3)
   throw new Error('Explicit source-controlled candidate list required');
 return {
  schema:'graft.capability-method-lab/v1',
  authority:'PROPOSE_ONLY',
  contractFingerprintSha256:sha(JSON.stringify(spec)),
  sourceMethodScope:'hand-authored-local-methods-not-new-mathematics',
  candidates:spec.methods.map(id=>runCandidate(spec,id)),
  diagnosticRenders:controlledDiagnostics(spec),
  realHumanContactCount:0,
  actualFundsMovedCents:0,
  externalActionAuthorization:false,
  productionAdmitted:false,
  noActualRealWorldValidation:true
 };
}
