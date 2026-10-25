import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewCrossing, compileContextPack, resurface } from '../src/membrane.mjs';

const proposal = { id: 'proposal-1', source_refs: ['synthetic/source-1'] };
test('MEMENTO gate refuses silent admission', () => {
  assert.throws(() => reviewCrossing({proposal, decision: {id:'d1',route:'ADMIT'}}), /requires explicit/);
  const receipt = reviewCrossing({ proposal, decision: {id:'d2',route:'FOG'} });
  assert.equal(receipt.admissible, false);
  assert.equal(receipt.local_write, 'not_performed');
});
test('even ADMIT is a review receipt, not a side effect', () => {
  const receipt = reviewCrossing({proposal,decision:{id:'d3',route:'ADMIT',basis:['synthetic review'],authorizer:'fixture-steward'}});
  assert.equal(receipt.admissible, true);
  assert.equal(receipt.authority, 'review_only');
  assert.equal(receipt.local_write, 'not_performed');
});
test('context pack traverses only admitted edges and never adopts', () => {
  const graph = {worlds:[{id:'garden'},{id:'porch'},{id:'vault'}],edges:[
    {id:'e1',from:'garden',to:'porch',status:'admitted',decision_ref:'fixture-decision'},
    {id:'e2',from:'porch',to:'vault',status:'proposed'},
  ]};
  const pack = compileContextPack(graph,'garden',3);
  assert.deepEqual(pack.worlds.map(w=>w.id), ['garden','porch']);
  assert.equal(pack.relations.length, 1);
  assert.equal(pack.admission, 'none');
  assert.throws(()=>compileContextPack({...graph,edges:[{...graph.edges[0], decision_ref:null}]},'garden'),/lacks admission/);
});
test('resurfacing leaves old trace intact and noncanonical', () => {
  const trace = {id:'trace-1', claim:'unknown'};
  const old = structuredClone(trace);
  const a = resurface(trace,{id:'trigger-2',at:'2026-10-25T11:00:00Z'});
  assert.deepEqual(trace,old);
  assert.equal(a.old_trace_id,old.id);
  assert.equal(a.admission,'none');
});
