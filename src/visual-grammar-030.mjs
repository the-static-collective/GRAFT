// GRAFT-030 — Source-owned, bounded visual transition grammar.
// Given a typed MOTIF image-difference gap, compile three distinct executable
// local raster programs and select by labeled image transitions, including
// withheld and negative evidence. No host IO, no images fetched from networks.
// This is *finite program synthesis*, not open-ended visual understanding.
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
export const digest=o=>hash(JSON.stringify(o));
export class HOLD extends Error {}
const check=(v,msg)=>{if(!v)throw new HOLD(msg)};
export const MODES=Object.freeze(['copy','move','recolor']);
export const GRAMMAR='SMALL_PALETTE_RIGID_TRANSLATION_WITH_REMOVAL_V0';
const TEMPLATE=`// Pure GRAFT-030 generated visual operator: finite pixel-grammar program.
export function execute(request){
 const fail=(status)=>({status,frame:null});
 if(!request||typeof request!=='object'||!Array.isArray(request.rows)||
    request.rows.length<3||request.rows.length>16||
    request.rows.some(r=>typeof r!=='string'||r.length!==request.rows[0].length||
      r.length<3||r.length>16||/[^.R#]/.test(r))||
    !Array.isArray(request.delta)||request.delta.length!==2||
    request.delta.some(n=>!Number.isInteger(n))||
    Math.abs(request.delta[0])+Math.abs(request.delta[1])!==1)
   return fail('HOLD_BAD_FRAME_OR_ACTION');
 const rows=request.rows, width=rows[0].length,height=rows.length;
 const red=[];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)
   if(rows[y][x]==='R')red.push([x,y]);
 if(red.length!==4)return fail('HOLD_NOT_ONE_2X2_OBJECT');
 const left=Math.min(...red.map(x=>x[0])), top=Math.min(...red.map(x=>x[1]));
 if(!red.every(([x,y])=>x>=left&&x<=left+1&&y>=top&&y<=top+1))
   return fail('HOLD_NOT_ONE_2X2_OBJECT');
 const [dx,dy]=request.delta;
 const destination=red.map(([x,y])=>[x+dx,y+dy]);
 if(destination.some(([x,y])=>x<0||y<0||x>=width||y>=height))
   return fail('HOLD_OUTSIDE_IMAGE');
 if(destination.some(([x,y])=>rows[y][x]==='#'))
   return fail('HOLD_OBSTACLE');
 let cells=rows.map(r=>r.split(''));
 if(MODE==='move'){
   for(const [x,y] of red)cells[y][x]='.';
   for(const [x,y] of destination)cells[y][x]='R';
 }else if(MODE==='copy'){
   for(const [x,y] of destination)cells[y][x]='R';
 }else if(MODE==='recolor'){
   for(const [x,y] of red)cells[y][x]='.';
   for(const [x,y] of destination)cells[y][x]='#';
 }else return fail('HOLD_UNKNOWN_GENERATED_MODE');
 return {status:'PROPOSED_FRAME',frame:cells.map(r=>r.join(''))};
}`;

export function validateGap(g){
 check(g&&typeof g==='object'&&!Array.isArray(g),'HOLD_GAP_TYPE');
 const {content_sha256,...body}=g;
 check(typeof content_sha256==='string'&&content_sha256===digest(body),
   'HOLD_CHANGED_GAP_RECEIPT');
 check(g.schema==='motif.visual-gap.v0'&&
   g.status==='PROVED_ADD_ONLY_GRAMMAR_CANNOT_RELOCATE'&&
   g.scope==='SYNTHETIC_RASTER_ONLY'&&
   g.proof?.invariant==='ADD_ONLY_CANNOT_REMOVE_OLD_RED_PIXELS'&&
   g.proof?.old_red_pixels_must_be_cleared===4&&
   g.proof?.new_red_pixels_must_be_filled===4&&
   g.proof?.add_only_never_removes===true&&
   g.proof?.red_mass_conserved===true&&
   g.proof?.fixed_graft029_add_only_insufficient===true&&
   g.authority?.produce_held_local_source===true&&
   g.authority?.deploy===false&&g.authority?.contact_people===false&&
   g.authority?.read_private_images===false,
   'HOLD_UNSUPPORTED_VISUAL_IMPOSSIBILITY');
 check(Array.isArray(g.start_rows)&&Array.isArray(g.goal_rows)&&
   g.start_rows.length===g.goal_rows.length&&
   g.start_rows.length>=3&&g.start_rows.length<=16,
   'HOLD_BAD_VISUAL_GAP_ROWS');
 const valid=rows=>rows.every(r=>typeof r==='string'&&r.length===rows[0].length&&
   r.length>=3&&r.length<=16&&!/[^.R#]/.test(r));
 check(valid(g.start_rows)&&valid(g.goal_rows),'HOLD_BAD_RASTER_TOKENS');
 const old=g.start_rows.flatMap((r,y)=>[...r].flatMap((c,x)=>c==='R'?[[x,y]]:[]));
 const dest=g.goal_rows.flatMap((r,y)=>[...r].flatMap((c,x)=>c==='R'?[[x,y]]:[]));
 check(old.length===4&&dest.length===4&&
   old.every(p=>!dest.some(q=>q[0]===p[0]&&q[1]===p[1])),
   'HOLD_VISUAL_START_TARGET_INVALID');
 check(g.start_rows.every((r,y)=>[...r].every((v,x)=>
   (v==='#')===(g.goal_rows[y][x]==='#'))),
   'HOLD_OBSTACLES_CHANGED');
 return true;
}
export function compileVariant(gap,mode){
 validateGap(gap);
 check(MODES.includes(mode),'HOLD_UNKNOWN_VISUAL_OPERATOR');
 const source='const MODE='+JSON.stringify(mode)+';\n'+TEMPLATE+'\n';
 check(source.length<5000,'HOLD_GENERATED_PROGRAM_SIZE');
 return {schema:'graft030.generated-visual-rule.v0',
   mode,grammar:GRAMMAR,source,source_sha256:hash(source),
   implementation:'DECLARED_FINITE_IMAGE_EFFECT_TEMPLATE',
   installed:false,network_authority:'NONE'};
}
export function makeFrame(x,y,{width=9,height=8,blocks=[]}={}){
 check(Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&
   x+1<width&&y+1<height&&width<=16&&height<=16,
   'HOLD_FIXTURE_GEOMETRY');
 const rows=Array.from({length:height},()=>Array(width).fill('.'));
 for(const [bx,by] of blocks){
   check(bx>=0&&bx<width&&by>=0&&by<height,'HOLD_FIXTURE_BLOCK');
   rows[by][bx]='#';
 }
 for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
   check(rows[y+dy][x+dx]==='.','HOLD_FIXTURE_COLLISION');
   rows[y+dy][x+dx]='R';
 }
 return rows.map(r=>r.join(''));
}
export function fixtureCases(){
 const pair=(x,y,dx,dy,opts={})=>({
   before:makeFrame(x,y,opts),
   delta:[dx,dy],
   after:makeFrame(x+dx,y+dy,opts),
   expect:'PROPOSED_FRAME'
 });
 const invalid=(before,delta,status)=>({before,delta,after:null,expect:status});
 return {
   train:[pair(1,2,1,0),pair(3,3,0,-1),pair(5,3,-1,0)],
   selection:[pair(2,2,0,1),pair(4,3,-1,0),pair(0,0,1,0)],
   negative:[
     invalid(makeFrame(0,2),[-1,0],'HOLD_OUTSIDE_IMAGE'),
     invalid(makeFrame(1,2,{blocks:[[3,2]]}),[1,0],'HOLD_OBSTACLE'),
     invalid(makeFrame(1,2),[2,0],'HOLD_BAD_FRAME_OR_ACTION')
   ]
 };
}
function validateCase(c){
 check(c&&Array.isArray(c.before)&&Array.isArray(c.delta)&&
   typeof c.expect==='string'&&
   ['PROPOSED_FRAME','HOLD_OUTSIDE_IMAGE','HOLD_OBSTACLE',
    'HOLD_BAD_FRAME_OR_ACTION'].includes(c.expect),
   'HOLD_INVALID_LABELED_VISUAL_CASE');
 if(c.expect==='PROPOSED_FRAME')
   check(Array.isArray(c.after)&&c.after.length===c.before.length,
     'HOLD_MISSING_EXPECTED_FUTURE_FRAME');
 else check(c.after===null,'HOLD_NEGATIVE_CASE_HAS_FUTURE');
}
export async function evaluateSource(source,caseRow){
 const {execute}=await import('data:text/javascript;base64,'+
   Buffer.from(source).toString('base64'));
 const got=execute({rows:caseRow.before,delta:caseRow.delta});
 return {status:got.status,correct:got.status===caseRow.expect&&
   (caseRow.expect==='PROPOSED_FRAME'?
    JSON.stringify(got.frame)===JSON.stringify(caseRow.after):got.frame===null)};
}
export async function cultivate(gap,cases){
 validateGap(gap);
 check(cases&&typeof cases==='object'&&['train','selection','negative'].every(k=>
   Array.isArray(cases[k])&&cases[k].length>=1&&cases[k].length<=12),
   'HOLD_VISUAL_CASE_BUDGET');
 const inspected=[...cases.train,...cases.selection,...cases.negative];
 inspected.forEach(validateCase);
 const variants=[];
 for(const mode of MODES){
   const program=compileVariant(gap,mode);
   const perSet={};
   for(const [name,rows] of Object.entries(cases))
     perSet[name]=await Promise.all(rows.map(c=>evaluateSource(program.source,c)));
   variants.push({program,
     training_correct:perSet.train.filter(x=>x.correct).length,
     selection_correct:perSet.selection.filter(x=>x.correct).length,
     negative_correct:perSet.negative.filter(x=>x.correct).length,
     counts:[cases.train.length,cases.selection.length,cases.negative.length],
     accepted:Object.values(perSet).every(rows=>rows.every(x=>x.correct)),
     failures:Object.entries(perSet).flatMap(([name,rows])=>rows.flatMap((r,i)=>
       r.correct?[]:[name+':'+i]))});
 }
 const surviving=variants.filter(v=>v.accepted);
 const winner=surviving.length===1?surviving[0]:null;
 const body={
   schema:'graft030.visual-grammar-evaluation.v0',
   status:winner?'HELD_VISUAL_OPERATOR':'HOLD_AMBIGUOUS_OR_UNSOLVED',
   gap_sha256:gap.content_sha256,grammar:GRAMMAR,
   candidates_tried:variants.length,
   rejected:variants.filter(x=>!x.accepted).map(v=>({
      mode:v.program.mode,source_sha256:v.program.source_sha256,
      failures:v.failures
   })),
   chosen:winner?winner.program:null,
   training_count:cases.train.length,
   selection_count:cases.selection.length,
   negative_count:cases.negative.length,
   no_real_images_contacted:true,live_requests:0,external_actions:0,
   automatic_install:false,owner_signoff:false,
   fair_classical_raster_search_can_match:true
 };
 return {...body,content_sha256:digest(body)};
}
