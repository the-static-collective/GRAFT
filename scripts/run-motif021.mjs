import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {composeCandidate} from '../src/motif021-composer.mjs';
import {executePublicSourceReview,executeLineageCaution}
 from '../generated/motif021-source-review.mjs';

const raw=readFileSync(new URL('../inputs/MOTIF-021/alex-research-packet.json',import.meta.url));
const rawPlan=readFileSync(new URL('../inputs/MOTIF-021/planz-classical-plan.json',import.meta.url));
const c=composeCandidate(raw,rawPlan);
const packet=JSON.parse(raw),plan=JSON.parse(rawPlan);
const result={
 schema:'graft.motif021.executed-source-capability-study/v1',
 composition:{
   capability_id:c.capability_id,status:c.status,sha256:c.generated_source_sha256,
   original_planz_classical_plan_replayed:c.original_planz_classical_plan_replayed,
   original_alex_packet_git_blob:c.input_source_pins['inputs/MOTIF-021/alex-research-packet.json']
 },
 source_review:executePublicSourceReview(packet,raw,plan),
 lineage_caution:executeLineageCaution(packet,raw,plan),
 evidence_provenance:'FROZEN_PUBLIC_MARKDOWN_SEARCH_NOT_AUTHENTICATED_REAL_SOURCES',
 no_network:true,no_external_actions:true,no_deployment:true,
 no_autonomous_code_promotion:true
};
if(process.argv[1]===fileURLToPath(import.meta.url))
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
