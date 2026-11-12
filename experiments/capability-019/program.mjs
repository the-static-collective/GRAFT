/**
 * GRAFT-019 — Typed state-machine compiler / interpreter.
 *
 * No complete RLE method is a prelisted library entry. The synthesized
 * program chooses each of five independently meaningful stages. The small
 * generic fold is existing runtime machinery; learning is limited to
 * selecting these stages, not inventing arbitrary control flow or Unicode.
 */
export const grammar=[
 {slot:'segment',choices:['utf16','codepoint','grapheme']},
 {slot:'identity',choices:['casefold','exact']},
 {slot:'ifSame',choices:['append','increment']},
 {slot:'ifDifferent',choices:['increment','append']},
 {slot:'emit',choices:['lengths-only','ordered-pairs']}
];
export function enumeratePrograms(priority=['utf16','codepoint','grapheme']){
 if(JSON.stringify([...priority].sort())!==
   JSON.stringify(['codepoint','grapheme','utf16']))
  throw new Error('Only bounded source-authorized segmentation orders allowed');
 let partial=[[]];
 for(let i=0;i<grammar.length;i++){
  const group=grammar[i],opts=i===0?priority:group.choices;
  partial=partial.flatMap(steps=>opts.map(choice=>[
   ...steps,{slot:group.slot,choice}
  ]));
 }
 if(partial.length!==48)throw new Error('Incorrect synthesis language extent');
 return partial.map(stages=>({schema:'graft.typed-rle-program/v1',stages}));
}
export function runCandidate(program,input){
 if(!program||program.schema!=='graft.typed-rle-program/v1'||
   Object.keys(program).sort().join(',')!=='schema,stages'||
   !Array.isArray(program.stages)||program.stages.length!==5||
   typeof input!=='string'||input.length<1||input.length>240)
  throw new Error('Only bounded typed RLE AST and invented text allowed');
 const d={};
 for(let k=0;k<grammar.length;k++){
  const row=program.stages[k],g=grammar[k];
  if(!row||row.slot!==g.slot||!g.choices.includes(row.choice)||
    Object.keys(row).sort().join(',')!=='choice,slot')
   throw new Error('Unknown or unauthorized reducer operator');
  d[row.slot]=row.choice;
 }
 let chars;
 if(d.segment==='utf16')chars=input.split('');
 else if(d.segment==='codepoint')chars=[...input];
 else chars=Array.from(new Intl.Segmenter('en',
   {granularity:'grapheme'}).segment(input),s=>s.segment);
 const state=[];
 for(const next of chars){
  if(!state.length){state.push([next,1]);continue;}
  const previous=state[state.length-1];
  const match=d.identity==='casefold'?
   previous[0].toLowerCase()===next.toLowerCase():
   previous[0]===next;
  const transition=match?d.ifSame:d.ifDifferent;
  if(transition==='append')state.push([next,1]);
  else previous[1]+=1;
 }
 return d.emit==='ordered-pairs'?state:state.map(pair=>pair[1]);
}
export function candidatePasses(program,c){
 const actual=runCandidate(program,c.input);
 const match=JSON.stringify(actual)===JSON.stringify(c.expected);
 const pairs=Array.isArray(actual)&&actual.every(row=>
  Array.isArray(row)&&row.length===2&&typeof row[0]==='string'&&
  Number.isSafeInteger(row[1])&&row[1]>0);
 const restored=pairs&&actual.map(([x,n])=>x.repeat(n)).join('')===c.input;
 const maximal=pairs&&actual.every((row,i)=>i===0||row[0]!==actual[i-1][0]);
 const count=pairs&&actual.reduce((s,row)=>s+row[1],0)===
  Array.from(new Intl.Segmenter('en',{granularity:'grapheme'}).segment(c.input)).length;
 return match&&restored&&maximal&&count;
}
