// Offline UNFUTURES-002 synthetic-only reciprocity and Reality 2.0 projection.
import {createHash} from "node:crypto";
import {
  makeReactorFixture, discoverCycles, selectCycles,
  reactorJournal, toQuestBoard
} from "./reactor.mjs";

const hash = s => createHash("sha256").update(s).digest("hex");
const fixture=makeReactorFixture();
const selection=selectCycles(fixture);
const boardOnly = process.argv.includes("--board");
const complete = process.argv.includes("--completed-board");
const j=reactorJournal(selection.cycles,hash);

if (complete || !boardOnly) {
  // A fictional 3-town agreement, with consent from ALL fictional roles.
  const chosen=selection.cycles.find(c=>c.legs.length===3);
  for(const actor of chosen.requiredActors)
    j.append("CONSENT",chosen.id,actor,{decision:"YES"});
  for(const leg of chosen.legs) {
    j.append("REPORT",chosen.id,leg.provider,{
      legId:leg.id,note:"SYNTHETIC FIXTURE — no actual material was shipped"});
    j.append("CONFIRM",chosen.id,leg.requester,{
      legId:leg.id,decision:"YES"});
  }
}

const board=toQuestBoard(selection,j.snapshot());
if(boardOnly||complete) {
  process.stdout.write(JSON.stringify(board,null,2)+"\n");
} else {
  process.stdout.write(JSON.stringify({
    experiment:"UNFUTURES-002",
    label:"SYNTHETIC_ONLY",
    environment:"OFFLINE_SPECIMEN",
    claimsOfActualFulfillment:0,
    externalConnections:0,
    financialProducts:0,
    participants:fixture.towns.length,
    needs:fixture.needs.length,
    offers:fixture.offers.length,
    candidateCycles:discoverCycles(fixture).length,
    selectedCycles:selection.cycles.length,
    cycleSizes:selection.cycles.map(c=>c.legs.length),
    coveredNeeds:selection.coveredNeeds,
    openNeeds:selection.uncoveredNeeds,
    realDeliveries:0,
    imaginaryJournalEvents:j.events.length,
    simulatedCompletedCycles:Object.values(j.snapshot().states)
      .filter(s=>s.status==="CONFIRMED").length,
    fictionalWorldProjection:board.quests.map(q=>({
      id:q.id,towns:q.towns,legs:q.requirements.length,state:q.state
    })),
    journalHead:j.snapshot().head,
    caution:"In-memory fictitious actors, simulated approvals and confirmations; neither authoritative nor field-verified."
  },null,2)+"\n");
}
