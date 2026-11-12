/**
 * GRAFT-020 typed structural parser candidate generator and executor.
 *
 * The user-facing task's missing ingredient is an ORGANIZATION OF MEMORY,
 * not more operations on the previous run-count array. The interpreter is a
 * hand-written generic scanner and offers THREE memory organizations. It
 * does not automatically invent a new Turing-machine model or stack theory.
 */
export const primitives=[
 {slot:'memory',choices:['last-register','per-type-counters','lifo-list']},
 {slot:'match',choices:['any-closer','correct-type']},
 {slot:'end',choices:['allow-unclosed','require-empty']},
 {slot:'invalid',choices:['ignore','sticky-reject']},
 {slot:'emit',choices:['validity-only','matched-indices']}
];
export function enumerate(priority=['last-register','per-type-counters','lifo-list']){
 if(!Array.isArray(priority)||priority.length!==3||
    JSON.stringify([...priority].sort())!==
      JSON.stringify(['last-register','lifo-list','per-type-counters']))
  throw new Error('Unapproved memory structure enumeration');
 let fragments=[[]];
 for(const [index,stage] of primitives.entries()){
  const choices=index?stage.choices:priority;
  fragments=fragments.flatMap(prev=>choices.map(choice=>[
   ...prev,{slot:stage.slot,choice}
  ]));
 }
 if(fragments.length!==48)throw new Error('Wrong complete program count');
 return fragments.map(stages=>({
  schema:'graft.typed-bracket-program/v1',stages
 }));
}
export function execute(program,text){
 if(typeof text!=='string'||text.length>40||/[^()[\]]/.test(text)||
    !program||program.schema!=='graft.typed-bracket-program/v1'||
    Object.keys(program).sort().join(',')!=='schema,stages'||
    !Array.isArray(program.stages)||program.stages.length!==5)
  throw new Error('Only typed, bounded fictional brackets accepted');
 const conf={};
 for(let n=0;n<5;n++){
  const s=program.stages[n],g=primitives[n];
  if(!s||s.slot!==g.slot||!g.choices.includes(s.choice)||
      Object.keys(s).sort().join(',')!=='choice,slot')
   throw new Error('Unknown structural operator, no arbitrary source code allowed');
  conf[g.slot]=s.choice;
 }
 const isOpen=x=>x==='('||x==='[';
 const category=x=>x==='('||x===')'?0:1;
 const sameType=(o,c)=>o==='('&&c===')'||o==='['&&c===']';
 const label=o=>o==='('? '()':'[]';
 const pending=[],amount=[0,0],latest=[null,null];
 let register=null,rejected=false;
 const witnesses=[];
 for(let pos=0;pos<text.length;pos++){
  const ch=text[pos];
  if(isOpen(ch)){
   const rec={token:ch,position:pos};
   if(conf.memory==='lifo-list')pending.push(rec);
   else if(conf.memory==='last-register')register=rec;
   else{amount[category(ch)]++;latest[category(ch)]=rec;}
   continue;
  }
  let opener=null;
  if(conf.memory==='lifo-list')opener=pending.pop()??null;
  else if(conf.memory==='last-register'){opener=register;register=null;}
  else{
   let id=category(ch);
   if(conf.match==='any-closer'){
    const choices=[0,1].filter(t=>amount[t]>0);
    if(choices.length){
     choices.sort((a,b)=>latest[b].position-latest[a].position);
     id=choices[0];
    }
   }
   if(amount[id]>0){
    opener=latest[id];amount[id]--;
   }
  }
  if(!opener||(conf.match==='correct-type'&&!sameType(opener.token,ch))){
   if(conf.invalid==='sticky-reject')rejected=true;
   continue;
  }
  witnesses.push([opener.position,pos,label(opener.token)]);
 }
 const remainder=conf.memory==='lifo-list'?pending.length:
  conf.memory==='last-register'?(register===null?0:1):amount[0]+amount[1];
 if(conf.end==='require-empty'&&remainder>0)rejected=true;
 if(rejected)return {valid:false,pairs:[]};
 witnesses.sort((a,b)=>a[0]-b[0]);
 return {valid:true,pairs:conf.emit==='matched-indices'?witnesses:[]};
}
export function passesPublic(program,example){
 return JSON.stringify(execute(program,example.input))===
  JSON.stringify(example.expected);
}
