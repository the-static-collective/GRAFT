/**
 * FOREST-001 · from a reviewed BananaGram proposal to a portable
 * Free Graph v0 SEED packet and an optional independent Seventh Table invite.
 * NO database, messaging, membership, authority or publication side effects.
 */
export const FOREST_SCHEMA='bananagram.forest-projection/v0';
export const GRAPH_SCHEMA='free-graph.packet/v0';
const CONTACT=/[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}|https?:\/\/|www\.|(?:^|[^\w])[a-z0-9_-]{43}(?:[^\w]|$)/i;
function reviewed(t,max=240,min=12){
 if(typeof t!=='string')throw Error('TEXT_REQUIRED');
 const s=t.replace(/\s+/g,' ').trim();
 if(s.length<min||s.length>max||/[\u0000-\u001f\u007f]/.test(t))throw Error('TEXT_LENGTH');
 if(CONTACT.test(s))throw Error('PRIVATE_CONTENT_REFUSED');
 return s;
}
function canonical(o){
 if(Array.isArray(o))return '['+o.map(canonical).join(',')+']';
 if(o&&typeof o==='object')return '{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+canonical(o[k])).join(',')+'}';
 return JSON.stringify(o);
}
function assertCrypto(cryptoProvider){
 if(!cryptoProvider?.subtle?.digest || !cryptoProvider?.getRandomValues)throw Error('CRYPTO_REQUIRED');
}
async function digest(value,cryptoProvider){
 const data=new TextEncoder().encode(value);
 const bytes=new Uint8Array(await cryptoProvider.subtle.digest('SHA-256',data));
 return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
async function record(prefix,body,c){
 return {...body,id:prefix+':sha256:'+await digest(canonical(body),c)};
}
function assertCandidate(candidate){
 if(candidate?.standing!=='PROPOSE_ONLY'||candidate.schema!=='graft/participation-bridge-candidate-v0')
   throw Error('REVIEWED_GRAM_PROPOSAL_REQUIRED');
 if(candidate.source?.scope!=='REVIEWED_REDACTION' || candidate.source.veracity!=='UNVERIFIED_SELF_REPORT')
   throw Error('UNTRUSTED_SOURCE');
 if(candidate.authority?.canonicalWrite!==false || candidate.authority?.publicationApproved!==false)
   throw Error('CANNOT_IMPORT_AUTHORITY');
 const summary=reviewed(candidate.candidate?.summary,240);
 return summary;
}
/**
 * Forest is scoped to author-selected, explicitly reviewed PUBLIC-SAFE text.
 * The private Gram, local traces, tensions, and original credentials never enter.
 *
 * fruit is a SELF-REPORT, not independent human witness or confirmed consequence.
 * A separate owning-world receipt would be required to claim verified fruit.
 */
export async function composeForest(candidate,{fruit='',seed='',authorReviewed=false,exportConsent=false}={},cryptoProvider=globalThis.crypto){
 assertCrypto(cryptoProvider);
 const question=assertCandidate(candidate);
 if(!authorReviewed||!exportConsent)return {schema:FOREST_SCHEMA,standing:'HOLD_LOCAL',why:!authorReviewed?'HUMAN_REVIEW_REQUIRED':'NO_GRAPH_EXPORT_CONSENT'};
 const fruitText=fruit.trim()?reviewed(fruit,240):'';
 const seedText=seed.trim()?reviewed(seed,240):'';
 if(!fruitText&&!seedText)throw Error('FRUIT_OR_SEED_REQUIRED');
 const excerpt=[question,...(fruitText?['AUTHOR REPORT (unconfirmed): '+fruitText]:[]),
   ...(seedText?['POSSIBLE NEXT QUESTION (unapproved): '+seedText]:[])].join('\n');
 const src=await record('fgs',{
  source_class:'conversation-witness',authority:'none',
  access:'public',export:'portable',acquisition:'voluntary reviewed Pocket text only',
  digest:'sha256:'+await digest(excerpt,cryptoProvider),excerpt,
  locator:{system:'BananaGram Pocket',coordinate:'separate reviewed redaction only',
    revision:'author-reviewed portable seed v0',resolution:'locally assembled public-safe text'}
 },cryptoProvider);
 const base={source_ids:[src.id]};
 const questionNode=await record('fgn',{kind:'question',label:question,status:'unresolved',...base},cryptoProvider);
 const nodes=[questionNode],links=[];
 if(fruitText){
  const n=await record('fgn',{kind:'testimony',label:fruitText,status:'proposed',
   extensions:{evidence:'author-self-report-only',confirmed:false},...base},cryptoProvider);
  nodes.push(n);
  links.push(await record('fgl',{from:questionNode.id,to:n.id,verb:'connects',
   qualifier:'author-reported-fruit-not-independent-witness',status:'proposed',
   authority:'none',...base},cryptoProvider));
 }
 if(seedText){
  const n=await record('fgn',{kind:'question',label:seedText,status:'proposed',
   extensions:{selection_authority:false,invitation_created:false},...base},cryptoProvider);
  nodes.push(n);
  links.push(await record('fgl',{from:questionNode.id,to:n.id,verb:'connects',
   qualifier:'proposes-next-question-no-successor-authority',status:'proposed',
   authority:'none',...base},cryptoProvider));
 }
 const packet={
  schema:GRAPH_SCHEMA,
  purpose:'Carry one explicitly reviewed question, author-reported result, and possible next question without claim promotion.',
  modes:['re-enter','seed'],
  scope:{task:'Inspect a consented portable question and choose whether to ask another',
   worlds:['BananaGram Pocket','Free Graph proposal substrate'],as_of:'local author review; no authoritative owner head'},
  sources:[src],nodes,links,
  task_world_cut:{
   status:'unresolved',selected_ids:[src.id,...nodes.map(x=>x.id),...links.map(x=>x.id)],
   owner_head_source_ids:[],
   omitted:[{door:'Independent human/owning-institution confirmation',
    reason:'No source-owner gate or actual completed aid receipt was inspected.'}],
   rationale:'Public-safe self-report is sufficient for seeding a question, not for testing, adopting or confirming its factual claims.'
  },
  residual_fog:['No independent witness or owning-world receipt supplied.',
   'No one has accepted the possible successor question.'],
  non_imports:['No private Gram, personal identity, invitation credential, household story or participant contact was transferred.',
   'No institutional acceptance, actual aid delivery or public publishing decision can be inferred.'],
  extensions:{projection:FOREST_SCHEMA,authority:'none',next_invitation_automated:false}
 };
 packet.packet_id='fgp:sha256:'+await digest(canonical(packet),cryptoProvider);
 return {
  schema:FOREST_SCHEMA,standing:'REVIEWED_PACKET_UNPUBLISHED',
  question,fruit:fruitText,seed:seedText,
  evidence:fruitText?'AUTHOR_REPORTED_UNCONFIRMED':'NONE',
  graph:packet,
  authority:{ownerAdopted:false,verifiedFulfillment:false,published:false,
   invitationCreated:false,peopleContacted:false,sourceCredentialTransferred:false}
 };
}
/**
 * Reuse the native Seventh Table v:1 card from the existing /tables/ flow.
 * This creates only a URL representing an invitation PROPOSAL, never a hosted table.
 */
export function nextInvitation(forest,{title,purpose,date,approved=false}={},cryptoProvider=globalThis.crypto){
 assertCrypto(cryptoProvider);
 if(forest?.standing!=='REVIEWED_PACKET_UNPUBLISHED'||forest?.graph?.schema!==GRAPH_SCHEMA)
   throw Error('REVIEWED_FOREST_REQUIRED');
 if(!forest.seed)throw Error('NO_SEED_NO_SUCCESSOR');
 if(approved!==true)throw Error('INVITATION_REVIEW_REQUIRED');
 const t=reviewed(title,84,3),p=reviewed(purpose,270,5);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T12:00:00Z'))||
    new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)
   throw Error('INVALID_CALENDAR_DATE');
 const bytes=cryptoProvider.getRandomValues(new Uint8Array(8));
 const id=Array.from(bytes,b=>b.toString(36).padStart(2,'0')).join('').slice(0,10).toUpperCase();
 const card={v:1,id,title:t,purpose:p,date,time:'',venue:'',host:'',parent:'',chain:[]};
 const encoded=new TextEncoder().encode(JSON.stringify(card));
 const base64=btoa(String.fromCharCode(...encoded)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 if(base64.length>5000)throw Error('INVITATION_TOO_LARGE');
 return {schema:'bananagram.seventh-table-proposal/v0',standing:'LINK_PREPARED_NOT_SENT',
  url:'https://abundent.org/tables/#invite='+base64,card,
  authority:{tableCreated:false,contactSent:false,participantsInherited:false,
   ownerEndorsement:false,fruitVerified:false}};
}
