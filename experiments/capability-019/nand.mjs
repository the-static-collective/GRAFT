/**
 * GRAFT-019: build a previously absent two-input Boolean operator using
 * only the elementary NAND gate. No XOR or complete correct circuit is
 * supplied in the primitive vocabulary. All code remains a typed AST.
 */
const pairId=p=>p.join(',');
const lexical=()=>[[0,0],[0,1],[1,1]];
export function candidateCircuits(gateCount,firstPriority=lexical()){
 if(!Number.isInteger(gateCount)||gateCount<1||gateCount>4)
  throw new Error('Only bounded 1–4 NAND-gate circuits are permitted');
 const legal=lexical().map(pairId).sort().join('|');
 if(!Array.isArray(firstPriority)||firstPriority.length!==3||
   firstPriority.map(pairId).sort().join('|')!==legal)
  throw new Error('Must include every first-gate option exactly once');
 function* step(gates){
  if(gates.length===gateCount){
   yield {schema:'graft.nand-circuit/v1',gates:gates.map(x=>[...x])};
   return;
  }
  if(!gates.length){
   for(const p of firstPriority)yield* step([...gates,p]);
  }else{
   const wireCount=2+gates.length;
   for(let a=0;a<wireCount;a++)
    for(let b=a;b<wireCount;b++)
     yield* step([...gates,[a,b]]);
  }
 }
 return step([]);
}
export function executeNandCircuit(program,inputs){
 if(!program||program.schema!=='graft.nand-circuit/v1'||
   !Array.isArray(program.gates)||program.gates.length<1||
   program.gates.length>4||
   Object.keys(program).sort().join(',')!=='gates,schema'||
   !Array.isArray(inputs)||inputs.length!==2||
   inputs.some(x=>x!==0&&x!==1))
  throw new Error('Circuit and Boolean inputs must be typed and bounded');
 const wires=[...inputs];
 for(const gate of program.gates){
  if(!Array.isArray(gate)||gate.length!==2||
    gate.some(x=>!Number.isInteger(x)||x<0||x>=wires.length)||
    gate[0]>gate[1])
   throw new Error('Only canonical NAND gates may read existing wires');
  wires.push(1-(wires[gate[0]]*wires[gate[1]]));
 }
 return wires.at(-1);
}
export function publicMatches(program,samples){
 return samples.every(s=>executeNandCircuit(program,s.inputs)===s.expected);
}
