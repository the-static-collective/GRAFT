/**
 * IMPACT-WEAVE-001 — finite, hypothetical *role* crossings.
 *
 * No real participant, beneficiary, organization, invitation, case, location,
 * household data, contact information or permission can be passed as input.
 * The only result is an operator-review proposal about generic capacities.
 * Receiving assistance NEVER creates a duty to volunteer.
 */
export const WEAVE_SCHEMA = "graft.impact-weave/v0";
export const WEAVE_DISPOSITION = "HOLD_FOR_SEPARATE_STEWARD_PERMISSIONS";
export const INTENT = "HYPOTHETICAL_ROLE_TOPOLOGY_ONLY";
export const ACK = "NO_REAL_PARTNER_OR_PERSON_CONSENT_CLAIMED";

const VOCAB = Object.freeze({
  food_supply: "Food sourcing and access",
  cold_storage: "Food storage and cold chain",
  transport: "Adult-to-adult logistics and transport planning",
  printing: "Printing and public-safe materials",
  welcoming: "Adult welcome and introductions",
  peer_listening: "Adult peer listening",
  digital_help: "General digital accessibility and support",
  practical_repair: "Small repairs and equipment care",
  volunteer_coordination: "Voluntary event setup and coordination",
  creative_gathering: "Music and creative gatherings"
});

const LANES = Object.freeze({
  table: Object.freeze({
    label: "The Table",
    field: "Community food access",
    current_partner_status: "NOT_ESTABLISHED",
    capacities: Object.freeze(["food_supply","cold_storage","transport","printing","welcoming"])
  }),
  porch: Object.freeze({
    label: "The Porch",
    field: "Private adult peer support and everyday stability",
    current_partner_status: "NOT_ESTABLISHED",
    capacities: Object.freeze(["peer_listening","transport","printing","welcoming","digital_help","practical_repair"])
  }),
  stage: Object.freeze({
    label: "The Stage",
    field: "Art, music, and gathering",
    current_partner_status: "NOT_ESTABLISHED",
    capacities: Object.freeze(["creative_gathering","volunteer_coordination","printing","welcoming","digital_help"])
  }),
  bench: Object.freeze({
    label: "The Bench",
    field: "Technology, repair, and technical volunteers",
    current_partner_status: "NOT_ESTABLISHED",
    capacities: Object.freeze(["practical_repair","digital_help","volunteer_coordination","transport","printing"])
  })
});
const PRIORITY = Object.freeze([
  "transport","digital_help","practical_repair",
  "volunteer_coordination","welcoming","printing",
  "food_supply","cold_storage","peer_listening","creative_gathering"
]);

function rejected(reason){
  return {schema:WEAVE_SCHEMA,status:"REFUSED",reason,
    routes:[], authority:"none",external_calls:0,
    people_contacted:0,real_partners_confirmed:0};
}
const isPlain = value => value!==null && typeof value==="object" &&
  !Array.isArray(value) && Object.getPrototypeOf(value)===Object.prototype;

export function buildImpactWeave(input){
  if(!isPlain(input) || Object.keys(input).some(x=>!["purpose","acknowledgement","lanes"].includes(x)))
    return rejected("INVALID_OR_UNDECLARED_FIELDS");
  if(input.purpose!==INTENT || input.acknowledgement!==ACK)
    return rejected("EXPLICIT_NONCONSENT_ACKNOWLEDGEMENT_REQUIRED");
  if(!Array.isArray(input.lanes) || input.lanes.length<2 || input.lanes.length>4)
    return rejected("TWO_TO_FOUR_ROLE_LANES_REQUIRED");
  if(new Set(input.lanes).size!==input.lanes.length ||
     input.lanes.some(name=>typeof name!=="string"||!Object.hasOwn(LANES,name)))
    return rejected("UNKNOWN_OR_DUPLICATE_LANE");
  // Invariant input ordering makes output deterministic. No hidden random seeds.
  const chosen=[...input.lanes].sort();
  const routes=[];
  for(let i=0;i<chosen.length;i++){
    for(let j=i+1;j<chosen.length;j++){
      const a=chosen[i],b=chosen[j];
      const overlap=PRIORITY.filter(s=>LANES[a].capacities.includes(s)&&LANES[b].capacities.includes(s)).slice(0,3);
      if(overlap.length)routes.push({
        source_lane:a,receiving_lane:b,
        shared_possible_capacities:overlap.map(code=>({code,label:VOCAB[code]})),
        evidence:"STATIC_HYPOTHETICAL_ROLE_OVERLAP_NOT_HUMAN_AVAILABILITY",
        next_permission:"Ask each lane's actual steward independently whether a general, non-personal collaboration question is welcome.",
        standing:"PROPOSAL_ONLY",
        accepted_by_source:false,accepted_by_receiver:false,
        can_contact:false,can_dispatch:false,can_publish:false
      });
    }
  }
  return {
    schema:WEAVE_SCHEMA,status:WEAVE_DISPOSITION,
    lanes:chosen.map(id=>({id,label:LANES[id].label,field:LANES[id].field,
      partner_status:LANES[id].current_partner_status,
      hypothetical_capacities:LANES[id].capacities.map(code=>({code,label:VOCAB[code]}))
    })),
    routes,route_count:routes.length,
    selection_basis:"STATIC_VOCABULARY_ONLY_NO_PARTNER_OR_PERSON_EVIDENCE",
    first_small_move:"Privately ask TWO independent adult stewards if they want to consider ONE general task. A refusal ends the route; no case data crosses.",
    field_goal:"One freely approved, bounded act, confirmed by the actual source recipient. An independent future offer is OPTIONAL and never owed.",
    gates:{
      public_safety_review:false,source_steward_permission:false,
      receiving_steward_permission:false,contact_permission:false,
      independent_identity_and_safeguarding:false,actual_work_witnessed:false
    },
    not_claimed:[
      "No named organization has committed to this network.",
      "No person has been enrolled, matched, contacted, or assigned.",
      "No private survivor or child history is accepted or routed.",
      "No successful delivery, public deployment, endorsement, or public intake is claimed.",
      "No beneficiary ever owes labor or testimony in exchange for support."
    ],
    authority:"none",external_calls:0,people_contacted:0,
    real_partners_confirmed:0,physical_actions:0,publication_permission:false
  };
}
function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
}
export function renderImpactTable(plan){
  if(plan?.schema!==WEAVE_SCHEMA || plan?.status!==WEAVE_DISPOSITION)
    throw Error("HELD_WEAVE_PLAN_REQUIRED");
  const cards=plan.routes.map(route=>{
    const source=plan.lanes.find(x=>x.id===route.source_lane)?.label;
    const target=plan.lanes.find(x=>x.id===route.receiving_lane)?.label;
    const skills=route.shared_possible_capacities.map(x=>escapeHtml(x.label)).join(" · ");
    return '<section class="card"><h2>'+escapeHtml(source)+' × '+escapeHtml(target)+'</h2>'+
      '<p><strong>Possible common capacity:</strong> '+skills+'</p>'+
      '<p><strong>First action:</strong> Ask each actual steward separately. No introductions or data transfers have occurred.</p>'+
      '<p class="small">Proposed only · no recipient identified · both permissions absent</p></section>';
  }).join("");
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>Inheritance Interrupt — The Right Hands</title><style>'+
    'body{font:15px/1.45 system-ui,sans-serif;max-width:900px;margin:0 auto;padding:22px;color:#19241b}'+
    'h1{font:30px Georgia,serif}.card{border:1px solid #708474;padding:15px;margin:10px 0;break-inside:avoid}'+
    '.small{font-size:12px}.warning{padding:12px;border:3px solid #19241b;font-weight:bold}'+
    '@page{size:letter;margin:.55in}@media print{body{padding:0}.card{margin:6px 0}}</style></head><body>'+
    '<h1>THE RIGHT HANDS / INHERITANCE INTERRUPT</h1>'+
    '<p class="warning">FICTIONAL CAPACITY MAP — HUMAN APPROVAL REQUIRED — NOT A PARTNERSHIP, REFERRAL OR REQUEST FOR PRIVATE STORIES</p>'+
    '<p>We are looking for small ways adult stewards could freely cooperate. All roles below are possibilities, not people or organizations who signed up.</p>'+
    cards+'<h2>The single first move</h2><p>'+escapeHtml(plan.first_small_move)+'</p>'+
    '<p><strong>No debt:</strong> receiving help never obligates anyone to volunteer. No child-specific or survivor details should be entered here.</p>'+
    '<p><strong>Return:</strong> after authorized action, let the actual source recipient confirm what helped. Keep unresolved outcomes visible.</p>'+
    '<p class="small">Source: local static, non-authoritative role vocabulary. No current live needs or partner permissions observed.</p></body></html>';
}
export const availableImpactLanes = () => Object.freeze(Object.keys(LANES));
