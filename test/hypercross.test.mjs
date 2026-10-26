import test from 'node:test';
import assert from 'node:assert/strict';
import {parseArgs,pressCandidate,EXTRA_PINS} from '../src/hypercross.mjs';
const roots=[
 '--blackstar-root','donors/black-star','--memento-root','donors/memento',
 '--freegraph-root','donors/free-graph','--jarvis-root','donors/jarvis',
 '--planz-root','donors/planz','--cannon-root','donors/cannon',
 '--planz-garden-root','donors/planz-garden','--planz-table-root','donors/planz-table',
 '--planz-abundent-root','donors/planz-abundent',
 '--loadout-root','donors/loadout','--ghot-root','donors/ghot',
 '--relatte-root','donors/relatte','--lemonpress-root','donors/lemonpress'
];
function argv(q='Synthetic question: can neighbors create printable help cards?'){
 return ['--question',q,'--output','/tmp/example',
  '--cut','fixtures/early-cut.json','--world','same-room-a0',...roots];
}
test('all original pinned native roots and four newly composed roots are mandatory',()=>{
 const parsed=parseArgs(argv());
 assert.equal(parsed['cannon-root'],'donors/cannon');
 assert.equal(parsed['relatte-root'],'donors/relatte');
 assert.equal(parsed['lemonpress-root'],'donors/lemonpress');
 for(const pin of Object.values(EXTRA_PINS))assert.match(pin,/^[a-f0-9]{40}$/);
 assert.throws(()=>parseArgs(argv().filter((_,i)=>!([argv().indexOf('--ghot-root'),argv().indexOf('--ghot-root')+1].includes(i)))),/MISSING_GHOT_ROOT/);
});
test('injectable question cannot introduce command arguments, arbitrary flags or duplicates',()=>{
 assert.throws(()=>parseArgs([...argv(),'--build-kit','/tmp/other']),/ARGUMENT_NOT_ALLOWED/);
 assert.throws(()=>parseArgs([...argv(),'--output','/tmp/other']),/DUPLICATE/);
 assert.throws(()=>parseArgs(argv('a'.repeat(301))),/QUESTION_REFUSED/);
 assert.throws(()=>parseArgs(argv('hello\nother')), /QUESTION_REFUSED/);
});
test('lemonPRESS remains a candidate, not an admitted book, even after local work',()=>{
 const schema={properties:{status:{enum:['forming','admitted','published','withdrawn']},
  admission:{properties:{state:{enum:['pending','admitted']}}}}};
 const r=pressCandidate('sha256:'+'f'.repeat(64),schema);
 assert.equal(r.status,'forming');assert.equal(r.admission.state,'pending');
 assert.equal(r.publication,false);
 assert.equal(r.admission.receipt,null);
 assert.equal(r.rights,'REQUIRES_HUMAN_REVIEW');
 assert.deepEqual(r.lanes,['digital','physical']);
 assert.throws(()=>pressCandidate('sha256:foo',{properties:{}}),/LEMONPRESS_SCHEMA_CHANGED/);
});
