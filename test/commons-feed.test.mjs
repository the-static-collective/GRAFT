import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewQueue} from '../scripts/commons-review-queue.mjs';

const sha='aa3984d2dbdf949996639b029ca0d95ab6c290e5';
const registry={schema:'graft.donor-code-registry/v1',updated:'2026-10-25',
 adapters:[{id:'jarvis-live-work-002',graft_commit:sha},
   {id:'other-future-local-thing',graft_commit:sha}]};
const entry=id=>({id,sourceCommit:sha});
test('no new queue entries when observed source commits match the published source docs',()=>{
 const feed={schema:'graft/public-commons-feed-v1',release:'001',
  entries:[entry('GRAFT-LIVE-WORK-002'),entry('GRAFT-LIVE-SCOUT-002')]};
 const result=reviewQueue(registry,feed);
 assert.equal(result.candidates.length,0);
 assert.equal(result.publishedToCommons,0);
});
test('new or moved adapter source produces only human review candidates',()=>{
 const feed={schema:'graft/public-commons-feed-v1',release:'001',
   entries:[{id:'GRAFT-LIVE-WORK-002',sourceCommit:'a'.repeat(40)}]};
 const result=reviewQueue(registry,feed);
 assert.equal(result.candidates.length,2);
 assert.equal(result.candidates[0].reason,'DOCUMENTED_SOURCE_COMMIT_CHANGED');
 assert.equal(result.candidates[1].reason,'DOCUMENTED_ADAPTER_NOT_INDEXED');
 assert.ok(result.candidates.every(x=>x.publication==='REVIEW_PENDING'));
 assert.equal(result.publicationGate,'HUMAN_APPROVAL_AND_GRAFT_MAIN_REQUIRED');
 assert.ok(!JSON.stringify(result).includes('PUBLIC_SUMMARY_APPROVED'));
});
test('wrong input is refused, private donors are not independently harvested',()=>{
 assert.throws(()=>reviewQueue({schema:'not-registry',adapters:[]},{schema:'graft/public-commons-feed-v1',entries:[]}),/UNSUPPORTED/);
 const result=reviewQueue({...registry,adapters:[{id:'new-private-project',graft_commit:sha}]},
   {schema:'graft/public-commons-feed-v1',entries:[],release:'seed'});
 assert.equal(result.candidates.length,0);
});
