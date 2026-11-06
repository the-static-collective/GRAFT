// GRAFT-031: source-owned finite environmental model generation from synthetic
// before/after PNG-cell observations. It is NOT a device/gate controller.
import {createHash} from 'node:crypto';
export const digest=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
export class HOLD extends Error {}
const need=(x,why)=>{if(!x)throw new HOLD(why)};
export const MODES=['unchanged','open_observed_pair','erase_all_blue'];
export const EVENT='SIMULATED_ENVIRONMENT_GATE_OPEN';
export const GRAMMAR='FINITE_TWO_CELL_ENVIRONMENT_TRANSITION_V0';
export const valid=rows=>Array.isArray(rows)&&rows.length>=3&&rows.length<=16&&
 rows.every(r=>typeof r==='string'&&r.length===rows[0].length&&
  r.length>=3&&r.length<=16&&!/[^.R#]/.test(r));
const find=(rows,token)=>rows.flatMap((r,y)=>[...r].flatMap((c,x)=>c===token?[[x,y]]:[]));
const key=p=>p.join(',');
export function inferOpening(before,after){
 need(valid(before)&&valid(after)&&before.length===after.length&&
   before[0].length===after[0].length,'HOLD_BAD_PAIRED_FRAME');
 const a=find(before,'R'),b=find(after,'R');
 need(a.length===4&&JSON.stringify(a)===JSON.stringify(b),
   'HOLD_RED_CHANGE_OR_NOT_2X2');
 const lx=Math.min(...a.map(p=>p[0])),ty=Math.min(...a.map(p=>p[1]));
 need(a.every(([x,y])=>x>=lx&&x<=lx+1&&y>=ty&&y<=ty+1),
   'HOLD_NOT_ONE_SQUARE_RED_OBJECT');
 const changed=[];
 for(let y=0;y<before.length;y++)for(let x=0;x<before[0].length;x++){
  if(before[y][x]===after[y][x])continue;
  need(before[y][x]==='#'&&after[y][x]==='.',
   'HOLD_DIFFERENT_PALETTE_TRANSITION');
  changed.push([x,y]);
 }
 need(changed.length===2&&changed[0][0]===changed[1][0]&&
    changed[0][1]+1===changed[1][1],
   'HOLD_NOT_TWO_CONTIGUOUS_GATE_CELLS');
 return changed;
}
export function makeTicket(before,after){
 const opened=inferOpening(before,after);
 const core={schema:'graft031.missing-world-question.v0',
  status:'OLD_GRAMMAR_CANNOT_LOSE_BLUE_OBSTACLES',
  source:'SYNTHETIC_PAIRED_PNG_CELLS_NOT_PHYSICAL_OBSERVATION',
  before_rows:before,after_rows:after,
  blue_before:find(before,'#').length,blue_after:find(after,'#').length,
  opened_cells:opened,
  proof:'PREVIOUS_MOVE_COPY_RECOLOR_NEVER_REMOVE_BLUE',
  proposed_transition_kind:'SYNTHETIC_EXTERNAL_ENVIRONMENT_EVENT',
  authority:{physical_actions:0,live_observations:0,
    network_calls:0,deploy:false,install:false,auto_admit:false}};
 return {...core,content_sha256:digest(core)};
}
export function verifyTicket(packet){
 need(packet&&typeof packet==='object'&&typeof packet.content_sha256==='string',
   'HOLD_NO_GAP_TICKET');
 const {content_sha256,...body}=packet;
 need(digest(body)===content_sha256,'HOLD_CHANGED_GAP_DIGEST');
 need(JSON.stringify(packet)===JSON.stringify(
   makeTicket(packet.before_rows,packet.after_rows)),
   'HOLD_GAP_CONTENT_NOT_FROM_PAIR');
 return packet.opened_cells;
}
// Runtime is compiled as new standalone ES module source via execute.toString().
// These references are resolved in generated source, never invoked here.
function execute(request){
 const fail=status=>({status,frame:null});
 if(!request||typeof request!=='object'||!Array.isArray(request.rows)||
    request.rows.length<3||request.rows.length>16||
    request.rows.some(r=>typeof r!=='string'||r.length!==request.rows[0].length||
      r.length<3||r.length>16||/[^.R#]/.test(r)))
   return fail('HOLD_INVALID_FRAME');
 if(request.event!=='SIMULATED_ENVIRONMENT_GATE_OPEN')
   return fail('HOLD_EVENT_NOT_SIMULATED');
 const rows=request.rows,cells=rows.map(r=>r.split('')),red=[];
 for(let y=0;y<rows.length;y++)for(let x=0;x<rows[0].length;x++)
   if(rows[y][x]==='R')red.push([x,y]);
 if(red.length!==4)return fail('HOLD_INVALID_RED_OBJECT');
 const lx=Math.min(...red.map(p=>p[0])),ty=Math.min(...red.map(p=>p[1]));
 if(!red.every(([x,y])=>x>=lx&&x<=lx+1&&y>=ty&&y<=ty+1))
   return fail('HOLD_INVALID_RED_OBJECT');
 if(MODE==='unchanged')
   return {status:'PROPOSED_ENVIRONMENT_FRAME',frame:rows.slice()};
 if(MODE==='erase_all_blue'){
   for(let y=0;y<rows.length;y++)for(let x=0;x<rows[0].length;x++)
     if(cells[y][x]==='#')cells[y][x]='.';
 } else if(MODE==='open_observed_pair'){
   for(const [x,y] of GATE){
     if(y>=rows.length||x>=rows[0].length||cells[y][x]!=='#')
       return fail('HOLD_GATE_ANCHOR_NOT_CLOSED');
     cells[y][x]='.';
   }
 } else return fail('HOLD_BAD_GENERATED_MODEL_MODE');
 return {status:'PROPOSED_ENVIRONMENT_FRAME',
   frame:cells.map(row=>row.join(''))};
}
export function compileVariant(packet,mode){
 const cells=verifyTicket(packet);
 need(MODES.includes(mode),'HOLD_UNSUPPORTED_MODEL_FAMILY');
 const source='const MODE='+JSON.stringify(mode)+';\n'+
   'const GATE='+JSON.stringify(cells)+';\nexport '+execute.toString()+'\n';
 need(source.length<4500,'HOLD_GENERATED_SOURCE_BUDGET');
 return {schema:'graft031.generated-world-model.v0',mode,grammar:GRAMMAR,
  source,source_sha256:createHash('sha256').update(source).digest('hex'),
  opened_cells:cells,synthetic_external_event_only:true,
  permission_to_operate_a_physical_gate:false,
  live_service_access:false,installed:false};
}
export async function evaluate(program,c){
 const module=await import('data:text/javascript;base64,'+
   Buffer.from(program.source).toString('base64'));
 const got=module.execute({rows:c.before,event:c.event});
 return {correct:got.status===c.expect&&
   (c.expect==='PROPOSED_ENVIRONMENT_FRAME'?
    JSON.stringify(got.frame)===JSON.stringify(c.after):got.frame===null),
   status:got.status};
}
export function fixture(x=1,y=3){
 const rows=Array.from({length:8},()=>Array(9).fill('.'));
 for(let k=0;k<8;k++)rows[k][4]='#';
 for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
   need(rows[y+dy][x+dx]==='.','HOLD_FIXTURE_OBJECT_WALL_COLLISION');
   rows[y+dy][x+dx]='R';
 }
 const before=rows.map(r=>r.join(''));
 const after=before.map((row,ry)=>[...row].map((c,rx)=>
   rx===4&&(ry===3||ry===4)?'.':c).join(''));
 return {before,after,event:EVENT,expect:'PROPOSED_ENVIRONMENT_FRAME'};
}
export function fixtureSets(){
 const baseline=fixture();
 return {train:[fixture(1,3),fixture(6,3)],
  selection:[fixture(0,0),fixture(6,5)],
  negative:[
   {before:baseline.before,after:null,
     event:'REAL_PHYSICAL_GATE_COMMAND',expect:'HOLD_EVENT_NOT_SIMULATED'},
   {before:baseline.after,after:null,
     event:EVENT,expect:'HOLD_GATE_ANCHOR_NOT_CLOSED'}]};
}
export async function cultivate(packet,cases){
 verifyTicket(packet);
 need(cases&&['train','selection','negative'].every(k=>
  Array.isArray(cases[k])&&cases[k].length>0&&cases[k].length<=10),
  'HOLD_SOURCE_TRAIN_AND_FALSIFICATION_REQUIRED');
 const all=[...cases.train,...cases.selection,...cases.negative];
 need(all.every(c=>c&&valid(c.before)&&typeof c.event==='string'&&
  ['PROPOSED_ENVIRONMENT_FRAME','HOLD_EVENT_NOT_SIMULATED',
   'HOLD_GATE_ANCHOR_NOT_CLOSED'].includes(c.expect)&&
  (c.expect==='PROPOSED_ENVIRONMENT_FRAME'?valid(c.after):c.after===null)),
  'HOLD_MALFORMED_EXPERIMENT');
 for(const row of cases.train)
  need(JSON.stringify(inferOpening(row.before,row.after))===
    JSON.stringify(packet.opened_cells),'HOLD_TRAINING_GATE_GEOMETRY_DIFFERS');
 const variants=[];
 for(const mode of MODES){
  const program=compileVariant(packet,mode);
  const results={};
  for(const [name,rows] of Object.entries(cases))
    results[name]=await Promise.all(rows.map(r=>evaluate(program,r)));
  variants.push({program,passed:Object.values(results).every(x=>x.every(y=>y.correct)),
    train_correct:results.train.filter(x=>x.correct).length,
    selection_correct:results.selection.filter(x=>x.correct).length,
    negative_correct:results.negative.filter(x=>x.correct).length});
 }
 const candidates=variants.filter(v=>v.passed);
 const chosen=candidates.length===1?candidates[0].program:null;
 const core={schema:'graft031.world-model-induction.v0',
  status:chosen?'HELD_NEW_EXTERNAL_EVENT_MODEL':'HOLD_UNSOLVED_OR_MULTIPLE',
  question_sha256:packet.content_sha256,
  candidate_count:MODES.length,
  considered:variants.map(v=>({mode:v.program.mode,
    source_sha256:v.program.source_sha256,accepted:v.passed,
    train_correct:v.train_correct,selection_correct:v.selection_correct,
    negative_correct:v.negative_correct})),
  chosen,
  training_cases:cases.train.length,selection_cases:cases.selection.length,
  negative_cases:cases.negative.length,
  boundary:'SYNTHETIC_OBSERVATION_MODEL_NOT_A_GATE_ACTUATOR',
  actual_environment_observed:false,network_calls:0,
  auto_install:false,auto_admit:false,
  classical_equal_information_baseline_can_match:true};
 return {...core,content_sha256:digest(core)};
}
