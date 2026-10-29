import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {proposeCultureGraft} from '../src/culture-nursery.mjs';
const registry=JSON.parse(readFileSync(new URL('../candidate-registry.json',import.meta.url)));
const src=()=>({schema:'cannon.culture-reuse-offer/v1',identity:'sha256:'+'a'.repeat(64),
 truth:{fictional:true,humanAuthenticated:false,fieldUseVerified:false,licensedEdition:false,
  ownerCanonSelected:false,sourceSignatureIndependentlyVerified:false},
 effects:{pennyIssued:0,humanDeeds:0,externalPayments:0,nftsMinted:0,automaticActions:0},
 source:{comicSha256:'sha256:'+'b'.repeat(64),pressReceipt:'sha256:'+'c'.repeat(64),crossing:'crossing-example-ref'},
 proposal:{kind:'REUSABLE_CULTURAL_METHOD_CANDIDATE',title:'A Room That Remembers',
 candidateMethod:'A six-panel illustration can explain a neighborhood method without requiring adoption.',
 suggestedUse:'Ask a willing host to review a demonstration learning card.'}});
const triage=()=>({schema:'planz.culture-return-triage/v1',culturePacket:src().identity,
 triageId:'sha256:'+'d'.repeat(64),planId:'ATLAS-BRIDGE-002',planSource:'https://github.com/example',
 indexEdition:'ATTENTION-2026-10-28-005',selection:'OPERATOR_DEFINED_PLAN_POINTER',
 relation:'POSSIBLE_METHOD_REUSE_NOT_VERIFIED_FIT',ownerGate:'Await review',blockedBy:[],
 disposition:'HOLD_FOR_PLAN_OWNER_REVIEW',sourceOwnerApproved:false,planUpdated:false,
 fieldVerified:false,thirdPartyApproved:false,executionAllowed:false,networkSent:false,authority:'NONE'});
test('real registry policy receives independent immutable branch possibility',()=>{
 const g=proposeCultureGraft(src(),triage(),registry);
 assert.equal(g.branchCreated,false);assert.equal(g.codeImported,false);
 assert.equal(g.ownerConsent,'UNKNOWN');assert.equal(g.planId,'ATLAS-BRIDGE-002');
 assert.equal(g.status,'HELD_BRANCH_CANDIDATE_NOT_A_BRANCH');
 assert.equal(g.candidateId,proposeCultureGraft(src(),triage(),registry).candidateId);
});
test('no cross-plan substitution, false consent or fake financial event',()=>{
 const t=triage();t.culturePacket='sha256:'+'0'.repeat(64);
 assert.throws(()=>proposeCultureGraft(src(),t,registry));
 const p=src();p.truth.humanAuthenticated=true;
 assert.throws(()=>proposeCultureGraft(p,triage(),registry));
 const q=src();q.effects.pennyIssued=1;
 assert.throws(()=>proposeCultureGraft(q,triage(),registry));
 const r=structuredClone(registry);r.policy.donor_history_imported=true;
 assert.throws(()=>proposeCultureGraft(src(),triage(),r));
});
