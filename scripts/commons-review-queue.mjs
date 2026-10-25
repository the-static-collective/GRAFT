// GRAFT PUBLICATION CANDIDATES — inspect only public registry adapter *metadata*.
// It does not fetch donor repositories, publish summaries, merge PRs, or set
// admission/canon. Run from a checked-out reviewed GRAFT directory.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const SHA=/^[0-9a-f]{40}$/;
const KNOWN=Object.freeze({
 'jarvis-live-work-002':[
  ['GRAFT-LIVE-WORK-002','docs/LIVE-WORK-002.md'],
  ['GRAFT-LIVE-SCOUT-002','docs/LIVE-SCOUT-002.md']
 ],
 'jarvis-cannon-planz-001':[['GRAFT-ATTEND-001','docs/ATTEND-001.md']],
 'free-graph-reconstruction-001':[['GRAFT-FREE-GRAPH-001','docs/FREE-GRAPH-CONTRACT.md']],
 'reconstruction-001':[['GRAFT-RECONSTRUCTION-001','docs/RECONSTRUCTION-CONTRACT.md']]
});
export function reviewQueue(registry,feed){
 if(registry?.schema!=='graft.donor-code-registry/v1'
   ||feed?.schema!=='graft/public-commons-feed-v1'
   ||!Array.isArray(registry.adapters)||!Array.isArray(feed.entries))
   throw Error('UNSUPPORTED_REGISTRY_OR_FEED');
 const published=new Map(feed.entries.map(x=>[x.id,x]));
 const candidates=[];
 for(const adapter of registry.adapters){
  if(!adapter||typeof adapter.id!=='string'
    ||typeof adapter.graft_commit!=='string'||!SHA.test(adapter.graft_commit))continue;
  const paths=KNOWN[adapter.id]||[];
  for(const [id,path]of paths){
   const prior=published.get(id);
   if(!prior||prior.sourceCommit!==adapter.graft_commit){
    candidates.push({id,adapterId:adapter.id,
     documentPath:path,observedGraftCommit:adapter.graft_commit,
     previousSourceCommit:prior?.sourceCommit||null,
     reason:prior?'DOCUMENTED_SOURCE_COMMIT_CHANGED':'DOCUMENTED_ADAPTER_NOT_INDEXED',
     publication:'REVIEW_PENDING',
     requiredReview:['Inspect exact-commit source docs and any linked CI',
      'Verify factual limits, privacy, licensing and independent owner permission',
      'Write or revise the specific editorial summary without inventing effects',
      'Human decides whether to mark PUBLIC_SUMMARY_APPROVED in GRAFT main']});
   }
  }
 }
 return {schema:'graft/commons-review-queue-v1',registryUpdated:registry.updated||'UNKNOWN',
  comparedToRelease:feed.release,candidates,
  authority:'NONE',publishedToCommons:0,
  publicationGate:'HUMAN_APPROVAL_AND_GRAFT_MAIN_REQUIRED'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try {
  const cwd=process.cwd();
  const registry=JSON.parse(readFileSync(resolve(cwd,'candidate-registry.json'),'utf8'));
  const feed=JSON.parse(readFileSync(resolve(cwd,'commons-feed.json'),'utf8'));
  process.stdout.write(JSON.stringify(reviewQueue(registry,feed),null,2)+'\n');
 }catch(err){
  process.stderr.write('HOLD: '+(err?.message||'UNKNOWN')+'\n');
  process.exitCode=1;
 }
}
