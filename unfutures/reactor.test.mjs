import {test} from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  makeReactorFixture, discoverCycles, selectCycles,
  reactorJournal, replayReactor, toQuestBoard
} from "./reactor.mjs";
import {stable} from "./engine.mjs";

const hash = str => createHash("sha256").update(str).digest("hex");
const fixture = makeReactorFixture();
const selection = selectCycles(fixture);
const triad = selection.cycles.find(c => c.legs.length === 3);
const pair = selection.cycles.find(c => c.legs.length === 2);

test("exact synthetic fixture and deterministic two complementary cycles", () => {
  assert.equal(fixture.label,"SYNTHETIC_ONLY");
  assert.equal(fixture.towns.length,5);
  assert.equal(fixture.needs.length,5);
  assert.equal(fixture.offers.length,10);
  assert.equal(selection.candidateCount,2);
  assert.deepEqual(selection.cycles.map(c=>c.legs.length),[3,2]);
  assert.equal(selection.coveredNeeds,5);
  assert.deepEqual(selection.uncoveredNeeds,[]);
  assert.deepEqual(selectCycles(makeReactorFixture()),selection);
  assert.deepEqual(discoverCycles(fixture).map(c=>c.id),
    selection.cycles.map(c=>c.id));
});

test("relabel and reorder input does not alter deterministic discovery", () => {
  const shuffled = {...fixture, towns:[...fixture.towns].reverse(),
    needs:[...fixture.needs].reverse(), offers:[...fixture.offers].reverse()};
  assert.deepEqual(discoverCycles(shuffled),discoverCycles(fixture));
  assert.deepEqual(selectCycles(shuffled).cycles,selection.cycles);
});

test("no cycle without a real closed path: missing one provider prevents triad", () => {
  const broken = {...fixture, offers:fixture.offers.filter(o=>o.id!=="material-Waldorf")};
  const result = selectCycles(broken);
  assert.deepEqual(result.cycles.map(c=>c.legs.length),[2]);
  assert.equal(result.coveredNeeds,2);
  assert.equal(result.uncoveredNeeds.length,3);
});

test("missing transport prevents remote leg and complete cycle", () => {
  const without = {...fixture, offers:fixture.offers.filter(o=>o.id!=="carrier-Waseca")};
  const result = selectCycles(without);
  assert.equal(result.coveredNeeds,2);
  assert.deepEqual(result.cycles.map(c=>c.legs.length),[2]);
});

test("material and transport capacities are separately conserved", () => {
  const used = new Map();
  for(const cycle of selection.cycles) for(const leg of cycle.legs) {
    used.set(leg.offerId,(used.get(leg.offerId)||0)+leg.quantity);
    used.set(leg.routeId,(used.get(leg.routeId)||0)+1);
    assert.notEqual(leg.from,leg.to);
  }
  assert.equal(used.size,10);
  for(const offer of fixture.offers)
    assert.ok((used.get(offer.id)||0)<=offer.quantity, offer.id);
  assert.deepEqual(Object.fromEntries([...used].sort(([a],[b])=>a.localeCompare(b))),
    selection.tentativeCapacity);
});

test("typed resources are nonfungible across units", () => {
  const altered = {...fixture, needs:fixture.needs.map(n => n.town==="Mankato"
    ? {...n,requirements:[{resource:"grain",unit:"bundle",quantity:1}]}:n)};
  assert.deepEqual(selectCycles(altered).cycles.map(c=>c.legs.length),[2]);
});

test("cyclic priority prefers a triad over an overlapping 2-cycle", () => {
  const changed = {...fixture,
    offers:[
      ...fixture.offers.map(o=>o.id==="carrier-Mankato"
        ? {...o,destinations:["Waldorf","Waseca"]}:o),
      {id:"material-Mankato-timber",town:"Mankato",owner:"provider-Mankato-timber",
        resource:"timber",unit:"bundle",quantity:1,localOnly:false}
    ]};
  const cand = discoverCycles(changed);
  assert.ok(cand.length>=3);
  const sel=selectCycles(changed);
  assert.deepEqual(sel.cycles.map(c=>c.legs.length),[3,2]);
  assert.equal(sel.coveredNeeds,5);
});

test("exclusion and cancellation never silently execute a fallback", () => {
  const excluding = selectCycles(fixture,{excludeCycleIds:[triad.id]});
  assert.deepEqual(excluding.cycles.map(c=>c.legs.length),[2]);
  assert.equal(excluding.coveredNeeds,2);
  const j = reactorJournal([triad],hash);
  j.append("WITHDRAW",triad.id,triad.requiredActors[0]);
  assert.equal(j.snapshot().states[triad.id].status,"CANCELLED");
  assert.throws(()=>j.append("CONSENT",triad.id,triad.requiredActors[1],
    {decision:"YES"}),/consent/);
});

test("rejects invalid real-world claims, duplicate IDs, impossible sizes and invalid requirement", () => {
  assert.throws(()=>selectCycles({...fixture,label:"LIVE"}),/synthetic/);
  assert.throws(()=>selectCycles({...fixture, towns:fixture.towns.slice(0,1)}),/towns/);
  assert.throws(()=>selectCycles({...fixture, offers:[...fixture.offers,fixture.offers[0]]}),/offer/);
  assert.throws(()=>selectCycles({...fixture, needs:[...fixture.needs,fixture.needs[0]]}),/need/);
  assert.throws(()=>selectCycles({...fixture, needs:fixture.needs.map(n=>({...n,
    requirements:[...n.requirements, ...n.requirements]}))}),/single-requirement/);
  assert.throws(()=>selectCycles(fixture,{maxLength:100}),/length/);
});

test("all beneficiaries, providers and drivers must opt in before COMMITTED", () => {
  const j = reactorJournal([triad],hash);
  assert.equal(j.snapshot().states[triad.id].status,"HOLD");
  assert.ok(triad.requiredActors.length>=9);
  for(const actor of triad.requiredActors.slice(0,-1))
    j.append("CONSENT",triad.id,actor,{decision:"YES"});
  assert.equal(j.snapshot().states[triad.id].status,"HOLD");
  assert.throws(()=>j.append("REPORT",triad.id,triad.legs[0].provider,
    {legId:triad.legs[0].id,note:"too soon"}),/report/);
  j.append("CONSENT",triad.id,triad.requiredActors.at(-1),{decision:"YES"});
  assert.equal(j.snapshot().states[triad.id].status,"COMMITTED");
  assert.throws(()=>j.append("CONSENT",triad.id,triad.requiredActors[0],
    {decision:"YES"}),/consent/);
});

test("refusal is terminal, not a hidden permission to spend", () => {
  const j=reactorJournal([triad],hash);
  j.append("CONSENT",triad.id,triad.requiredActors[0],{decision:"NO"});
  assert.equal(j.snapshot().states[triad.id].status,"REFUSED");
  assert.throws(()=>j.append("CONSENT",triad.id,triad.requiredActors[1],
    {decision:"YES"}),/consent/);
  assert.throws(()=>j.append("REPORT",triad.id,triad.legs[0].provider,
    {legId:triad.legs[0].id,note:"no"}),/report/);
});

test("a reported leg is not a confirmed cycle; all distinct receivers must confirm", () => {
  const j=reactorJournal([triad],hash);
  for(const actor of triad.requiredActors) j.append("CONSENT",triad.id,actor,{decision:"YES"});
  const [first,...rest] = triad.legs;
  assert.throws(()=>j.append("CONFIRM",triad.id,first.requester,
    {legId:first.id,decision:"YES"}),/confirmation/);
  assert.throws(()=>j.append("REPORT",triad.id,first.requester,
    {legId:first.id,note:"impersonation"}),/report/);
  j.append("REPORT",triad.id,first.provider,{legId:first.id,note:"SIMULATED ONLY"});
  assert.equal(j.snapshot().states[triad.id].status,"IN_PROGRESS");
  assert.throws(()=>j.append("CONFIRM",triad.id,first.provider,
    {legId:first.id,decision:"YES"}),/confirmation/);
  j.append("CONFIRM",triad.id,first.requester,{legId:first.id,decision:"YES"});
  assert.equal(j.snapshot().states[triad.id].status,"IN_PROGRESS");
  for(const leg of rest) {
    j.append("REPORT",triad.id,leg.provider,{legId:leg.id,note:"SYNTHETIC"});
    j.append("CONFIRM",triad.id,leg.requester,{legId:leg.id,decision:"YES"});
  }
  assert.equal(j.snapshot().states[triad.id].status,"CONFIRMED");
  const board=toQuestBoard({label:"SYNTHETIC_ONLY",cycles:[triad]},j.snapshot());
  assert.equal(board.quests[0].complete,true);
  assert.equal(board.quests[0].requirements.every(x=>x.recipientConfirmed),true);
  assert.equal(board.noTrading,true);
});

test("WITHDRAW before report is terminal; after reported work requires separate review", () => {
  const j = reactorJournal([pair],hash);
  for(const actor of pair.requiredActors) j.append("CONSENT",pair.id,actor,{decision:"YES"});
  j.append("WITHDRAW",pair.id,pair.requiredActors[0]);
  assert.equal(j.snapshot().states[pair.id].status,"CANCELLED");
  const j2=reactorJournal([pair],hash);
  for(const actor of pair.requiredActors) j2.append("CONSENT",pair.id,actor,{decision:"YES"});
  j2.append("REPORT",pair.id,pair.legs[0].provider,
    {legId:pair.legs[0].id,note:"SYNTHETIC"});
  assert.throws(()=>j2.append("WITHDRAW",pair.id,pair.requiredActors[0]),/withdraw/);
});

test("plan digest, event digest and sequence reject tampering and borrowed history", () => {
  const j=reactorJournal([triad],hash);
  j.append("CONSENT",triad.id,triad.requiredActors[0],{decision:"YES"});
  assert.match(j.events[0].hash,/^[0-9a-f]{64}$/);
  assert.throws(()=>replayReactor([triad],[{...j.events[0],decision:"NO"}],hash),/integrity/);
  assert.throws(()=>replayReactor([triad],[{...j.events[0],seq:9}],hash),/integrity/);
  const mutated={...triad,legs:triad.legs.map((e,i)=>
    i===0?{...e,quantity:2}:e)};
  assert.throws(()=>replayReactor([mutated],j.events,hash),/altered cycle/);
  assert.throws(()=>j.append("CONSENT",triad.id,triad.requiredActors[0],
    {previous:"fake",decision:"YES"}),/Invalid event fields/);
  assert.equal(j.events.length,1);
});

test("game board is simulated and contains no authority or real monetary reward", () => {
  const board = toQuestBoard(selection);
  assert.equal(board.schema,"reality2.unfutures-quest-board/v0");
  assert.equal(board.environment,"SYNTHETIC_ONLY");
  assert.equal(board.quests.length,2);
  assert.equal(board.quests.every(q=>q.state==="HOLD"&&!q.complete),true);
  assert.equal(board.quests[0].requirements.length,3);
  assert.equal(board.quests[1].requirements.length,2);
  assert.equal(board.quests.every(q=>q.type==="SIMULATED_QUEST_NOT_REAL_DELIVERY"),true);
  assert.equal(board.noMoney,true);
  assert.equal(hash(stable(board)).length,64);
});
