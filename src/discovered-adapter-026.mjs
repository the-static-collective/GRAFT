// GRAFT-026: source-owned adapter composition from independently pinned ALEX
// OpenAPI candidate. Executes ONLY a canned in-memory JSON fixture analysis.
// No arbitrary user source in executable code, no network, no install.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {verifyDiscovery} from '../vendor/alex/api-discovery-026.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const gitBlob=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const PINS=Object.freeze({
 'api-discovery-026.mjs':'67b851c9ea58d4aa92ca159000e982c312cd2335',
 'eagle-eye-providers-025.mjs':'5c095be409d2ace0d39765c4316471702d88acb5'
});
export function verifyAlexSource(){
 for(const [path,expected] of Object.entries(PINS)){
  const bytes=readFileSync(new URL('../vendor/alex/'+path,import.meta.url));
  if(gitBlob(bytes)!==expected)throw Error('HOLD_CHANGED_ORIGINAL_ALEX_SOURCE');
 }
 return {source:'the-static-collective/ALEX.2',
  exact_git_blobs:PINS,external_authority:false};
}
const TEMPLATE=String.raw