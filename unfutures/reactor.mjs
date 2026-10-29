// UNFUTURES-002 — Reciprocity Reactor; synthetic, deterministic, nonfinancial.
// The only imported organ is UNFUTURES-001 canonical test-byte projection.
// No account, real market, transfer, partner, wallet or actual authority exists.
import { stable } from "./engine.mjs";

const validQuantity = n => Number.isSafeInteger(n) && n > 0;
const textId = s => typeof s === "string" && s.length > 0;
const byId = (a,b) => a.id.localeCompare(b.id);
const consumed = (m, id, q = 1) => m.set(id, (m.get(id) ?? 0) + q);

export function makeReactorFixture() {
  const towns = ["Waseca", "Mankato", "Waldorf", "New-Ulm", "Owatonna"];
  const rows = [
    // A→B→C→A and D↔E; all participants and contributions are fictional.
    ["Waseca", "timber", "bundle", "grain", "crate", "Mankato"],
    ["Mankato", "grain", "crate", "solar", "kit", "Waldorf"],
    ["Waldorf", "solar", "kit", "timber", "bundle", "Waseca"],
    ["New-Ulm", "tools", "kit", "fuel", "can", "Owatonna"],
    ["Owatonna", "fuel", "can", "tools", "kit", "New-Ulm"]
  ];
  return {
    label: "SYNTHETIC_ONLY", towns,
    needs: rows.map(([town, resource, unit]) => ({
      id: "need-" + town, town, requester: "receiver-" + town,
      requirements: [{resource, unit, quantity:1}]
    })),
    offers: rows.flatMap(([town, , , resource, unit, destination]) => [
      { id:"material-" + town, town, owner:"provider-" + town,
        resource, unit, quantity:1, localOnly:false },
      { id:"carrier-" + town, town, owner:"driver-" + town,
        resource:"transport", unit:"trip", quantity:1,
        destinations:[destination], localOnly:false }
    ])
  };
}

function validated(fixture) {
  if (fixture?.label !== "SYNTHETIC_ONLY") throw Error("Reactor accepts synthetic fixtures only");
  if (!Array.isArray(fixture.towns) || fixture.towns.length < 2 || fixture.towns.length > 8
    || new Set(fixture.towns).size !== fixture.towns.length
    || fixture.towns.some(t => !textId(t))) throw Error("Invalid bounded towns");
  if (!Array.isArray(fixture.needs) || !Array.isArray(fixture.offers)
    || fixture.needs.length > 60 || fixture.offers.length > 100) throw Error("Invalid bounded inventory");
  const towns = new Set(fixture.towns), ids = new Set();
  for (const need of fixture.needs) {
    if (!textId(need.id) || ids.has(need.id) || !towns.has(need.town)
      || !textId(need.requester) || !Array.isArray(need.requirements)
      || need.requirements.length !== 1) throw Error("Invalid single-requirement need");
    ids.add(need.id);
    const r = need.requirements[0];
    if (!textId(r.resource) || !textId(r.unit) || !validQuantity(r.quantity)
      || r.resource === "transport") throw Error("Invalid typed requirement");
  }
  ids.clear();
  for (const offer of fixture.offers) {
    if (!textId(offer.id) || ids.has(offer.id) || !towns.has(offer.town)
      || !textId(offer.owner) || !textId(offer.resource)
      || !textId(offer.unit) || !validQuantity(offer.quantity)) throw Error("Invalid typed offer");
    ids.add(offer.id);
    if (offer.resource === "transport") {
      if (offer.unit !== "trip" || !Array.isArray(offer.destinations)
        || offer.destinations.some(t => !towns.has(t) || t === offer.town))
        throw Error("Invalid transport route");
    }
  }
}

function candidatesFor(fixture) {
  const needs = [...fixture.needs].sort(byId), offers = [...fixture.offers].sort(byId);
  const transport = offers.filter(o => o.resource === "transport");
  const edges = [];
  for (const need of needs) {
    const req = need.requirements[0];
    for (const offer of offers) {
      if (offer.town === need.town || offer.localOnly !== false
        || offer.resource !== req.resource || offer.unit !== req.unit
        || offer.quantity < req.quantity || offer.owner === need.requester) continue;
      for (const route of transport) {
        if (route.town !== offer.town || !route.destinations.includes(need.town)) continue;
        edges.push({
          id: offer.id + "=>" + need.id + "@" + route.id,
          from:offer.town, to:need.town,
          needId:need.id, requester:need.requester,
          offerId:offer.id, provider:offer.owner,
          routeId:route.id, driver:route.owner,
          resource:req.resource, unit:req.unit, quantity:req.quantity
        });
      }
    }
  }
  return edges.sort(byId);
}

function countUse(legs) {
  const uses = new Map();
  for (const e of legs) {
    consumed(uses, e.offerId, e.quantity);
    consumed(uses, e.routeId, 1);
  }
  return uses;
}

function fits(legs, offers, already = new Map()) {
  const use = countUse(legs);
  return [...use].every(([id, qty]) =>
    (already.get(id) ?? 0) + qty <= offers.get(id)?.quantity);
}

export function discoverCycles(fixture, {maxLength = 5} = {}) {
  validated(fixture);
  if (!Number.isSafeInteger(maxLength) || maxLength < 2 || maxLength > 8)
    throw Error("Invalid cycle length");
  const offerIndex = new Map(fixture.offers.map(o => [o.id, o]));
  const edges = candidatesFor(fixture);
  const outgoing = new Map(fixture.towns.map(t => [t, edges.filter(e => e.from === t)]));
  const discovered = new Map();
  const limit = Math.min(maxLength, fixture.towns.length);
  const maxFound = 2500; // No unbounded search or runaway combinatorics.
  function walk(start, towns, legs) {
    const at = towns.at(-1);
    for (const edge of outgoing.get(at) || []) {
      const next = edge.to;
      if (next === start) {
        if (towns.length < 2 || !fits([...legs, edge], offerIndex)) continue;
        const full = [...legs, edge];
        if (new Set(full.map(e => e.needId)).size !== full.length) continue;
        const id = "cycle:" + full.map(e => e.id).join("|");
        const requiredActors = [...new Set(full.flatMap(e =>
          [e.requester, e.provider, e.driver]))].sort();
        discovered.set(id, {
          id, towns:[...towns], legs:full, requiredActors,
          status:"HOLD", reservation:"PROPOSAL_ONLY"
        });
        if (discovered.size > maxFound) throw Error("Candidate bound exceeded");
      } else if (towns.length < limit && next > start && !towns.includes(next)) {
        walk(start, [...towns, next], [...legs, edge]);
      }
    }
  }
  for (const start of [...fixture.towns].sort()) walk(start, [start], []);
  return [...discovered.values()].sort((a, b) =>
    b.legs.length - a.legs.length || a.id.localeCompare(b.id));
}

export function selectCycles(fixture, {maxLength = 5, excludeCycleIds = []} = {}) {
  if (!Array.isArray(excludeCycleIds) || excludeCycleIds.some(id => !textId(id)))
    throw Error("Invalid excluded cycles");
  const candidates = discoverCycles(fixture, {maxLength});
  const excluded = new Set(excludeCycleIds);
  const offers = new Map(fixture.offers.map(o => [o.id, o]));
  const used = new Map(), needs = new Set(), selected = [];
  for (const c of candidates) {
    if (excluded.has(c.id) || c.legs.some(e => needs.has(e.needId))
      || !fits(c.legs, offers, used)) continue;
    for (const [id, qty] of countUse(c.legs)) consumed(used, id, qty);
    c.legs.forEach(e => needs.add(e.needId));
    selected.push(c);
  }
  return {
    label:"SYNTHETIC_ONLY", mode:"CYCLE_PROPOSAL_ONLY",
    candidateCount:candidates.length, cycles:selected,
    coveredNeeds:needs.size,
    uncoveredNeeds:fixture.needs.map(n=>n.id).filter(id=>!needs.has(id)).sort(),
    tentativeCapacity:Object.fromEntries([...used].sort(([a],[b])=>a.localeCompare(b))),
    excluded:[...excluded].sort()
  };
}

function fingerprint(c, hashFn) {
  return hashFn(stable({id:c.id, towns:c.towns, legs:c.legs, requiredActors:c.requiredActors}));
}

export function replayReactor(cycles, events, hashFn) {
  if (!Array.isArray(cycles) || typeof hashFn !== "function") throw Error("Invalid replay input");
  const index = new Map(cycles.map(c => [c.id, c]));
  if (index.size !== cycles.length) throw Error("Duplicate cycle");
  const states = Object.fromEntries(cycles.map(c => [c.id, {
    status:"HOLD", consents:{}, reports:{}, confirmations:{}, withdrawnBy:null
  }]));
  let head = "GENESIS";
  for (let i = 0; i < events.length; i++) {
    const e = events[i], {hash, ...body} = e;
    const cycle = index.get(body.cycleId);
    if (!cycle) throw Error("Unknown cycle");
    if (body.seq !== i + 1 || body.previous !== head
      || body.cycleFingerprint !== fingerprint(cycle, hashFn)
      || hash !== hashFn(stable(body)))
      throw Error("Broken journal integrity or altered cycle definition");
    const state = states[cycle.id];
    if (body.action === "CONSENT") {
      if (state.status !== "HOLD" || !cycle.requiredActors.includes(body.actor)
        || Object.hasOwn(state.consents, body.actor)
        || !["YES", "NO"].includes(body.decision))
        throw Error("Invalid cycle consent");
      state.consents[body.actor] = body.decision;
      if (body.decision === "NO") state.status = "REFUSED";
      else if (cycle.requiredActors.every(a => state.consents[a] === "YES"))
        state.status = "COMMITTED";
    } else if (body.action === "WITHDRAW") {
      if (!["HOLD", "COMMITTED"].includes(state.status)
        || !cycle.requiredActors.includes(body.actor)
        || Object.keys(state.reports).length) throw Error("Cannot auto-withdraw after work report");
      state.status = "CANCELLED";
      state.withdrawnBy = body.actor;
    } else if (body.action === "REPORT") {
      const leg = cycle.legs.find(l => l.id === body.legId);
      if (!leg || body.actor !== leg.provider
        || !["COMMITTED", "IN_PROGRESS"].includes(state.status)
        || Object.hasOwn(state.reports, leg.id)
        || typeof body.note !== "string" || !body.note.trim())
        throw Error("Invalid leg report");
      state.reports[leg.id] = {actor:body.actor, note:body.note};
      state.status = "IN_PROGRESS";
    } else if (body.action === "CONFIRM") {
      const leg = cycle.legs.find(l => l.id === body.legId);
      if (!leg || state.status !== "IN_PROGRESS"
        || !Object.hasOwn(state.reports, leg.id)
        || Object.hasOwn(state.confirmations, leg.id)
        || body.actor !== leg.requester || body.actor === leg.provider
        || body.decision !== "YES") throw Error("Invalid independent leg confirmation");
      state.confirmations[leg.id] = body.actor;
      if (cycle.legs.every(l => Object.hasOwn(state.confirmations, l.id)))
        state.status = "CONFIRMED";
    } else throw Error("Unknown reactor action");
    head = hash;
  }
  return {states, head, count:events.length};
}

export function reactorJournal(cycles, hashFn) {
  const events = [];
  const index = new Map(cycles.map(c => [c.id, c]));
  return {
    events,
    append(action, cycleId, actor, fields = {}) {
      const cycle = index.get(cycleId);
      if (!cycle || !textId(actor) || !fields || typeof fields !== "object"
        || Object.keys(fields).some(k =>
          ["action", "cycleId", "actor", "seq", "previous",
           "cycleFingerprint", "hash"].includes(k))) throw Error("Invalid event fields");
      const body = {
        seq:events.length + 1, previous:events.at(-1)?.hash || "GENESIS",
        cycleId, cycleFingerprint:fingerprint(cycle, hashFn),
        action, actor, ...fields
      };
      const event = {...body, hash:hashFn(stable(body))};
      replayReactor(cycles, [...events, event], hashFn); // Reject before writing.
      events.push(event);
      return event;
    },
    snapshot: () => replayReactor(cycles, events, hashFn)
  };
}

export function toQuestBoard(selection, snapshot = {states:{}}) {
  if (selection.label !== "SYNTHETIC_ONLY") throw Error("Cannot project live worlds");
  return {
    schema:"reality2.unfutures-quest-board/v0",
    environment:"SYNTHETIC_ONLY",
    mode:"FICTIONAL_COOPERATIVE_PLAY",
    noMoney:true, noTrading:true, publicPartnerClaims:false,
    quests:selection.cycles.map((cycle, i) => {
      const state = snapshot.states[cycle.id] || {status:"HOLD", consents:{}, reports:{}, confirmations:{}};
      return {
        id:"quest-" + (i+1), cycleId:cycle.id, title:"Circuit " + (i+1) + " · " +
          cycle.towns.join(" ↔ "),
        state:state.status,
        towns:cycle.towns,
        requirements:cycle.legs.map(leg=>({
          legId:leg.id, from:leg.from, to:leg.to, resource:leg.resource,
          unit:leg.unit, quantity:leg.quantity, transport:leg.routeId,
          report:!!state.reports[leg.id],
          recipientConfirmed:!!state.confirmations[leg.id]
        })),
        approvals:{received:Object.values(state.consents).filter(x=>x==="YES").length,
          required:cycle.requiredActors.length},
        complete:state.status==="CONFIRMED",
        type:"SIMULATED_QUEST_NOT_REAL_DELIVERY"
      };
    }),
    note:"Game projection only. No player receives ownership, payment, real-world authority or permissions."
  };
}
