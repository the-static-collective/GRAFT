import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {digest,HOLD,makeFrame,fixtureCases,compileVariant,cultivate,
  validateGap,evaluateSource} from '../src/visual-grammar-030.mjs';
function gap(){
 const obstacles=[[4,3],[4,4],[4,5]];
 const body={
  schema:'motif.visual-gap.v0',
  status:'PROVED_ADD_ONLY_GRAMMAR_CANNOT_RELOCATE',
  scope:'SYNTHETIC_RASTER_ONLY',
  start_rows:makeFrame(1,3,{blocks:obstacles}),
  goal_rows:makeFrame(6,3,{blocks:obstacles}),
  proof:{invariant:'ADD_ONLY_CANNOT_REMOVE_OLD_RED_PIXELS',
    old_red_pixels_must_be_cleared:4,new_red_pixels_must_be_filled:4,
    add_only_never_removes:true,red_mass_conserved:true,
    fixed_graft029_add_only_insufficient:true},
  authority:{produce_held_local_source:true,deploy:false,
    contact_people:false,read_private_images:false}
 };
 return {...body,content_sha256:digest(body)};
}
test('visual deficiency is an actual before-after pixel incompatibility with add-only grammar',()=>{
 assert.equal(validateGap(gap()),true);
 assert.equal(gap().start_rows[3].includes('#'),true);
});
test('three different truly executable raster program sources are compiled by GRAFT',()=>{
 const sources=['move','copy','recolor'].map(mode=>compileVariant(gap(),mode));
 assert.equal(new Set(sources.map(x=>x.source_sha256)).size,3);
 assert.ok(sources.every(x=>!x.installed&&x.network_authority==='NONE'));
 assert.ok(sources.every(x=>x.source.includes('export function execute')));
});
test('original GRAFT synthesis chooses rigid move with remove-and-add semantics',async()=>{
 const p=await cultivate(gap(),fixtureCases());
 assert.equal(p.status,'HELD_VISUAL_OPERATOR');
 assert.equal(p.candidates_tried,3);
 assert.equal(p.chosen.mode,'move');
 assert.equal(p.rejected.length,2);
 assert.ok(p.rejected.every(x=>x.failures.length>0));
 assert.equal(p.external_actions,0);
});
test('new moving-object program works for held-out cardinal directions',async()=>{
 const source=compileVariant(gap(),'move').source;
 for(const c of fixtureCases().selection){
   const result=await evaluateSource(source,c);
   assert.equal(result.correct,true,JSON.stringify(c));
 }
});
test('new operator blocks collision, image overflow, and invalid two-step actions',async()=>{
 const source=compileVariant(gap(),'move').source;
 for(const c of fixtureCases().negative){
   const outcome=await evaluateSource(source,c);
   assert.equal(outcome.correct,true,JSON.stringify(c));
 }
});
test('copy and recolor families fail withheld image-transition correspondence',async()=>{
 const c=fixtureCases().selection[0];
 for(const mode of ['copy','recolor']){
   assert.equal((await evaluateSource(compileVariant(gap(),mode).source,c)).correct,false);
 }
});
test('visual gap cannot grant deployment permission even with recomputed digest',()=>{
 const altered=gap();altered.authority.deploy=true;
 const {content_sha256,...rest}=altered;altered.content_sha256=digest(rest);
 assert.throws(()=>validateGap(altered),HOLD);
});
test('visual gap cannot invent blue obstacles moving as red translates',()=>{
 const altered=gap();altered.goal_rows[4]=altered.goal_rows[4].replace('#','.');
 const {content_sha256,...rest}=altered;altered.content_sha256=digest(rest);
 assert.throws(()=>validateGap(altered),HOLD);
});
test('source grammar prohibits arbitrary mode and redirects',()=>{
 assert.throws(()=>compileVariant(gap(),'eval(userCode)'),HOLD);
 const p=compileVariant(gap(),'move');
 assert.ok(!p.source.includes('fetch('));
 assert.ok(!p.source.includes('child_process'));
 assert.ok(!p.source.includes('fs'));
});
test('GRAFT synthesis gives same code and receipt for repeated source-owned runs',async()=>{
 const a=await cultivate(gap(),fixtureCases());
 const b=await cultivate(gap(),fixtureCases());
 assert.deepEqual(a,b);
 const {content_sha256,...body}=a;assert.equal(digest(body),content_sha256);
});
test('tampered gap digest cannot be used to synthesize code',async()=>{
 const altered=gap();altered.proof.old_red_pixels_must_be_cleared=2;
 await assert.rejects(cultivate(altered,fixtureCases()),HOLD);
});
test('independent contradictory labeled scenario must HOLD rather than guess',async()=>{
 const cases=fixtureCases();cases.selection[0].after=cases.selection[1].after;
 const out=await cultivate(gap(),cases);
 assert.equal(out.status,'HOLD_AMBIGUOUS_OR_UNSOLVED');
 assert.equal(out.chosen,null);
});
