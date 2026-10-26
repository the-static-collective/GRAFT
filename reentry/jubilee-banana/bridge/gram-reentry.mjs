import {GRAM} from '../gram/portable-gram.mjs';
import {prepareCandidate,VERSION} from './participation-bridge.mjs';
/** Explicit consented, human-reviewed Gram -> inert proposal crossing. */
export function proposeGramCrossing(gram,{
 participationConfirmedByAuthor=false,consentToExport=false,
 reviewedByHuman=false,redactedSummary='',kind='question',destination='first-yes'
}={}){
 if(!gram||gram.schema!==GRAM||gram.scope!=='this-device'||gram.standing!=='LOCAL_PROPOSAL')
   throw Error('INVALID_SOURCE_GRAM');
 if(!Number.isInteger(gram.revision)||gram.revision<1)throw Error('INVALID_GRAM_REVISION');
 if(!participationConfirmedByAuthor||!consentToExport||!reviewedByHuman)
  return Object.freeze({schema:VERSION,standing:'HOLD_LOCAL',why:
    !participationConfirmedByAuthor?'NO_AUTHOR_SUBMISSION':
    !consentToExport?'NO_EXPORT_CONSENT':'NEEDS_HUMAN_REVIEW'});
 const sourceRef=gram.sourceRef+':r'+gram.revision;
 // IMPORTANT: no automatic copying of need, offeringBack, trace, tension,
 // relation, personal history, or link token. A new redaction is required.
 return prepareCandidate({sourceRef,status:'participating',consentToExport:true,
  reviewedByHuman:true,sourceVisibility:'eligible-for-explicit-export',
  redactedSummary,kind,destination});
}
