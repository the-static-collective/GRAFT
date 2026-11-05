import {readFileSync,writeFileSync} from 'node:fs';
import {cultivate,casesForSyntheticGraph,HOLD} from '../src/missing-operator-forge-029.mjs';
const args=process.argv.slice(2);
if(args.length!==4||args[0]!=='--gap'||args[2]!=='--output')
  throw Error('Usage: node scripts/run-forge-029.mjs --gap FILE --output FILE');
try{
 const gap=JSON.parse(readFileSync(args[1],'utf8'));
 const result=await cultivate(gap,casesForSyntheticGraph());
 if(result.status!=='HELD_GENERATED_OPERATOR_FAMILY')throw new HOLD('No unique exact guarded-edit family fit');
 writeFileSync(args[3],JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({status:result.status,generated:result.variants_generated,
   selected_guards:result.selected.guard_contract,
   generated_source_sha256:result.selected.source_sha256,
   evidence_sha256:result.content_sha256}));
}catch(e){console.error(JSON.stringify({stage:'HOLD',reason:e.message}));process.exitCode=1;}
