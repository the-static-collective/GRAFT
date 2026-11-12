import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {buildLocalCandidate,renderOfflineStoryCard} from '../compiler.mjs';
import {writeGraftKit} from '../cross.mjs';

const root=process.env.JUBILEE_SOURCE_ROOT;
if(!root)throw new Error('CI must checkout exact Jubilee source commit; JUBILEE_SOURCE_ROOT missing');
const path=resolve(root,'labs/penny-puddle-015/capability.mjs');
const upstream=await import(pathToFileURL(path).href);
const request=()=>upstream.makeGraftRequest();

test('the actual Jubilee source detects a missing operator, not a license or money shortage',()=>{
 const before=upstream.findMissingCapability();
 assert.equal(before.currentlyComposedRoutes,0);
 assert.ok(before.blockedOutputs.some(x=>x.requiredToken==='portable-storyboard-for:L'));
 assert.equal(before.noConsentOrFundingInvented,true);
 const r=request();
 assert.equal(r.schema,'jubilee.graft-capability-proposal/v1');
 assert.equal(r.externalActorConsentVerified,false);
 assert.equal(r.assetTitleOrMediaRightsVerified,false);
 assert.equal(r.realActionsAuthorized,false);
});
test('a synthetic current source request compiles deterministic offline HTML, with digest proof',()=>{
 const req=request();
 const a=buildLocalCandidate(req),b=buildLocalCandidate(req);
 assert.equal(a.html,b.html);
 assert.equal(a.receipt.artifactDigestSha256,b.receipt.artifactDigestSha256);
 assert.match(a.html,/<!doctype html>/);
 assert.match(a.html,/The Unspent Object/);
 assert.doesNotMatch(a.html,/<script\b|<iframe\b|<img\b|https?:\/\//i);
 assert.equal(a.receipt.testsPassed,5);
 assert.equal(a.receipt.authority,'PROPOSE_ONLY');
 assert.equal(a.receipt.graftAdmittedToProduction,false);
 assert.equal(a.receipt.realFundsMovedCents,0);
 assert.equal(a.receipt.realWorldServicePerformed,false);
 const verified=upstream.verifyGraftLocalProof(req,a);
 assert.equal(verified.status,'LOCAL_IMPLEMENTATION_PROVEN_IN_FIXTURE');
 assert.equal(verified.canProposeTechnique,true);
 assert.equal(verified.realWorldEffectAuthorized,false);
});
test('local tested technique adds ONE new conditional plan when old landlord formats are all refused',()=>{
 const req=request(),packet=buildLocalCandidate(req);
 const p=upstream.composeWithGraftProof(req,packet);
 assert.equal(p.originalRoutes,0);
 assert.equal(p.conditionalRoutes,1);
 assert.equal(p.status,'new-hypothetical-path-proposed-NOT-CONTRACT');
 assert.deepEqual(p.generatedOptions[0].operatorIds,[
  'G-image-permission','GRAFT-local-storyboard-compiler','L-considers-storyboard'
 ]);
 assert.deepEqual(p.generatedOptions[0].unknownPeopleToAsk,[
  'GRAFT-local-storyboard-compiler','L-considers-storyboard'
 ]);
 assert.equal(p.generatedOptions[0].legallyDischargedCents,0);
 assert.equal(p.realMoneyMovedCents,0);
 assert.equal(p.actualPeopleContacted,0);
 assert.equal(p.actualGraftDeployment,false);
});
test('mismatched source request or tampered bytes cannot install a candidate technique',()=>{
 const req=request(),packet=buildLocalCandidate(req);
 for(const corrupt of [
  {...packet,html:packet.html+'tamper'},
  {...packet,receipt:{...packet.receipt,testsPassed:3}},
  {...packet,receipt:{...packet.receipt,producedToken:'gold-backed-money'}},
  {...packet,receipt:{...packet.receipt,graftAdmittedToProduction:true}},
  {...packet,receipt:{...packet.receipt,realFundsMovedCents:30000}}
 ]){
  const failed=upstream.verifyGraftLocalProof(req,corrupt);
  assert.equal(failed.canProposeTechnique,false);
  assert.equal(upstream.composeWithGraftProof(req,corrupt).conditionalRoutes,0);
 }
 const editedReq=request();editedReq.syntheticStory.title='altered';
 assert.equal(upstream.verifyGraftLocalProof(editedReq,packet).canProposeTechnique,false);
});
test('HTML injection is escaped, not interpreted, while no scripts or network are generated',()=>{
 const req=request();
 req.syntheticStory.title='<script>alert(1)</script>';
 req.syntheticStory.captions[0]='<img src=x onerror="alert(1)"> & other folk';
 const html=renderOfflineStoryCard(req);
 assert.match(html,/&lt;script&gt;/);
 assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
 assert.match(html,/&amp; other folk/);
 assert.doesNotMatch(html,/<script\b|<img\b|https?:\/\//i);
});
test('reject fabricated authorization and oversized or irrelevant inputs, before any local output',()=>{
 const r=request();r.realActionsAuthorized=true;
 assert.throws(()=>buildLocalCandidate(r),/proposal-only/);
 const p=request();p.dataOrigin='real-private-family-contacts';
 assert.throws(()=>buildLocalCandidate(p),/proposal-only/);
 const q=request();q.syntheticStory.captions[0]='x'.repeat(241);
 assert.throws(()=>buildLocalCandidate(q),/No large content/);
 const z=request();z.acceptanceTests.pop();
 assert.throws(()=>buildLocalCandidate(z),/exact auditable/);
});
test('explicit local kit writes only two new files, refuses overwrites and does not contact anyone',async()=>{
 const req=request(),output=join(tmpdir(),'graft-015-'+randomUUID());
 try{
  const written=await writeGraftKit(req,output);
  assert.equal(written.status,'LOCAL_ARTIFACT_FILES_WRITTEN');
  assert.equal(written.remoteSideEffects,0);
  assert.equal(written.peopleContacted,0);
  assert.ok((await stat(join(output,'offline-story-card.html'))).size>100);
  const receipt=JSON.parse(await readFile(join(output,'capability-receipt.json'),'utf8'));
  const html=await readFile(join(output,'offline-story-card.html'),'utf8');
  assert.equal(upstream.verifyGraftLocalProof(req,{receipt,html}).canProposeTechnique,true);
  await assert.rejects(()=>writeGraftKit(req,output),/EEXIST/);
 }finally{await rm(output,{recursive:true,force:true});}
});
