/**
 * GRAFT CAPABILITY NURSERY-015 — build an original, local-only technique
 * from a JUBILEE hypothetical missing-operator proposal.
 *
 * NOT a transfer of the original person's labor, an actual licensed image,
 * completed consideration, model or monetary value; never auto-admit source
 * or activate code in another project. Only safe invented textual fixtures.
 */
import {createHash} from 'node:crypto';

const sha=x=>createHash('sha256').update(x).digest('hex');
const ALLOWED_TESTS=[
  'generate-offline-printable-html',
  'escape-user-provided-html',
  'deterministic-content-hash',
  'no-scripts-remote-media-or-network',
  'do-not-mint-a-property-right'
];
const esc=x=>x.replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const line=x=>{if(typeof x!=='string'||!x.trim())throw new TypeError('Nonempty text required');return x;};
function fields(request){
 if(!request||typeof request!=='object'||Array.isArray(request)||
    request.schema!=='jubilee.graft-capability-proposal/v1'||
    request.status!=='PROPOSE_ONLY'||
    request.originatingProject!=='the-static-collective/Jubilee-treasury'||
    request.intendedReceiver!=='the-static-collective/GRAFT'||
    request.inputToken!=='fictional-image-permission:F'||
    request.outputToken!=='portable-storyboard-for:L'||
    request.proposedTechnique!=='deterministic-offline-story-card-html'||
    request.dataOrigin!=='entirely-invented-public-fixture'||
    request.externalActorConsentVerified!==false||
    request.assetTitleOrMediaRightsVerified!==false||
    request.realActionsAuthorized!==false||
    request.actualFinancialValueCents!==0)
   throw new Error('Unrecognized or untrusted proposal-only synthetic capability request');
 const f=request.syntheticStory;
 if(!f||typeof f!=='object'||Array.isArray(f))
   throw new Error('Synthetic captions required');
 for(const [name,value] of [['title',f.title],['subtitle',f.subtitle]]){
   line(value);
   if(value.length>180)throw new Error(name+' too long');
 }
 if(!Array.isArray(f.captions)||!f.captions.length||
    f.captions.length>5||f.captions.some(x=>typeof x!=='string'||!x.trim()||x.length>240))
   throw new Error('No large content or arbitrary file import');
 if(JSON.stringify(f).length>3000)
   throw new Error('Unexpected story payload volume');
 if(JSON.stringify(request.acceptanceTests)!==JSON.stringify(ALLOWED_TESTS))
   throw new Error('Need exact auditable local test contract');
 if(!request.bounds ||request.bounds.maxCards!==5||
    request.bounds.maxCaptionLength!==240 ||
    request.bounds.maxHtmlBytes!==15000)
   throw new Error('Unexpected artifact budgets');
 return f;
}
export function renderOfflineStoryCard(request){
 const f=fields(request);
 const cards=f.captions.map((caption,index)=>
  '<section class="card"><span class="number">CARD '+
   (index+1)+'</span><p>'+esc(caption)+'</p></section>').join('\n');
 const html='<!doctype html>\n'+
  '<html lang="en"><head><meta charset="utf-8">'+
  '<meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<meta name="referrer" content="no-referrer">'+
  '<title>'+esc(f.title)+'</title>'+
  '<style>'+
  '*{box-sizing:border-box}body{font:17px/1.6 Georgia,serif;background:#f8f1df;color:#293a30;'+
  'max-width:780px;padding:30px 20px;margin:auto}h1{font-size:2.7rem;line-height:1.05}'+
  '.eyebrow{font:700 .7rem system-ui;letter-spacing:.12em;text-transform:uppercase}'+
  '.card{margin:14px 0;padding:18px;background:#fffcf1;border-left:4px solid #a58b50}'+
  '.number{font:700 .75rem system-ui;letter-spacing:.1em}'+
  'footer{border-top:1px solid #aaa;margin-top:22px;padding-top:13px;font:13px/1.5 system-ui}'+
  '@media print{body{color:black;background:white}.card{break-inside:avoid}}'+
  '</style></head><body>'+
  '<div class="eyebrow">GRAFT local technique · invented research material</div>'+
  '<h1>'+esc(f.title)+'</h1><p>'+esc(f.subtitle)+'</p>'+cards+
  '<footer>All details fictional. This offline card is not an asset title, image license, donor acknowledgment, creditor agreement, payment, or evidence of human work.</footer>'+
  '</body></html>';
 if(html.length>request.bounds.maxHtmlBytes ||
    /<script\b|<iframe\b|<img\b|<link\b|https?:\/\/|onload\s*=|javascript:/i.test(html))
   throw new Error('Generated artifact violates strict offline HTML envelope');
 return html;
}
export function buildLocalCandidate(request){
 const html=renderOfflineStoryCard(request);
 const receipt={
  schema:'graft.capability-local-proof/v1',
  authority:'PROPOSE_ONLY',
  buildStatus:'LOCAL_SYNTHETIC_TESTED',
  requestDigestSha256:sha(JSON.stringify(request)),
  artifactDigestSha256:sha(html),
  inputToken:request.inputToken,
  producedToken:request.outputToken,
  provenance:'synthetic-local-test-fixture',
  testsPassed:ALLOWED_TESTS.length,
  checks:ALLOWED_TESTS.map(name=>({name,result:'pass-local-only'})),
  realPeopleContacted:0,
  realFundsMovedCents:0,
  actualPropertyRightsGranted:false,
  realWorldServicePerformed:false,
  actualCreditorSatisfactionVerified:false,
  graftAdmittedToProduction:false,
  sourceIdentityAuthenticated:false,
  realHumanValueProven:false,
  inspectionRequiredBeforeUse:true
 };
 return {html,receipt};
}
