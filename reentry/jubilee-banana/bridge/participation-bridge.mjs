/** Illustrative, PURE boundary; no network, no database, no Telegram or authority writes. */
export const VERSION = 'graft/participation-bridge-candidate-v0';
const TOKEN = /(?:^|[^\w])(?:[A-Za-z0-9_-]{43})(?:$|[^\w])/;
const CONTACT = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}|https?:\/\/|www\./i;
const DESTINATIONS = new Set(['campfire-review','telegram-porch-draft','first-yes']);
const KINDS = new Set(['question','need','offer','experiment']);
function clean(t, max){
 if(typeof t !== 'string') throw new TypeError('TEXT_REQUIRED');
 const v=t.replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim();
 if(v.length<12||v.length>max) throw new TypeError('TEXT_LENGTH');
 if(CONTACT.test(v)||TOKEN.test(v)) throw new TypeError('PRIVATE_CONTENT_REFUSED');
 return v;
}
/**
 * input: {sourceRef, status, kind, destination, redactedSummary,
 *         consentToExport, reviewedByHuman, sourceVisibility}
 * The source record is NEVER copied; passed redactedSummary must be separately
 * consented and reviewed. No source invite URLs or secret tokens are accepted.
 */
export function prepareCandidate(input) {
 if(!input || typeof input !== 'object' || Array.isArray(input))throw new TypeError('OBJECT_REQUIRED');
 if(typeof input.sourceRef!=='string' || !/^[a-z0-9:-]{8,96}$/.test(input.sourceRef))throw new TypeError('OPAQUE_REFERENCE_REQUIRED');
 if(input.status!=='participating')return Object.freeze({schema:VERSION,standing:'HOLD_LOCAL',why:'NOT_AN_ACTIVE_CONTRIBUTION'});
 if(input.consentToExport!==true)return Object.freeze({schema:VERSION,standing:'HOLD_LOCAL',why:'NO_EXPORT_CONSENT'});
 if(input.reviewedByHuman!==true)return Object.freeze({schema:VERSION,standing:'HOLD_LOCAL',why:'NEEDS_HUMAN_REVIEW'});
 if(input.sourceVisibility!=='eligible-for-explicit-export')return Object.freeze({schema:VERSION,standing:'HOLD_LOCAL',why:'SOURCE_SCOPE_REFUSES_EXPORT'});
 if(!DESTINATIONS.has(input.destination)||!KINDS.has(input.kind))throw new TypeError('UNSUPPORTED_SEAM');
 const summary=clean(input.redactedSummary,240);
 return Object.freeze({
  schema:VERSION,
  standing:'PROPOSE_ONLY',
  source:{opaqueRef:input.sourceRef,veracity:'UNVERIFIED_SELF_REPORT',scope:'REVIEWED_REDACTION'},
  target:input.destination,
  candidate:{kind:input.kind,summary},
  authority:{actorAuthenticated:false,circleMembership:false,consentToPerform:false,
    canonicalWrite:false,transportDispatched:false,partnerCommitted:false,
    provisionConfirmed:false,publicationApproved:false},
  nextGate:'A separately authenticated, authorized human must choose whether and where to submit this proposal.'
 });
}
