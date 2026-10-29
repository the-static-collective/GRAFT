// UNFUTURES-001: deterministic, synthetic possibility-exchange specimen.
// No accounts, real-world claims, payments, token economics, or prediction wagers.
export const RESOURCE_TYPES = ["firewood", "food", "tools", "audio"];
export const TOWNS = ["Waseca", "Mankato", "Waldorf", "New-Ulm", "Owatonna"];

export function makeFixture() {
  const needs = [], offers = [];
  TOWNS.forEach((town, i) => {
    const missing = i % RESOURCE_TYPES.length;
    const bonus = (i + 1) % RESOURCE_TYPES.length;
    RESOURCE_TYPES.forEach((resource, j) => {
      const id = "need-" + i + "-" + resource;
      needs.push({
        id, town, requester: "requester-" + id,
        requirements: [
          { resource, unit: "lot", quantity: 1 },
          { resource: "volunteer", unit: "shift", quantity: 1 }
        ]
      });
      if (j !== missing) {
        const oid = "offer-" + i + "-" + resource;
        offers.push({ id: oid, town, owner: "provider-" + oid,
          resource, unit: "lot", quantity: 1, localOnly: false });
      }
    });
    const extra = RESOURCE_TYPES[bonus];
    const extraId = "offer-" + i + "-" + extra + "-extra";
    offers.push({ id: extraId, town, owner: "provider-" + extraId,
      resource: extra, unit: "lot", quantity: 1, localOnly: false });
    offers.push({ id: "volunteer-" + i, town, owner: "helper-" + i,
      resource: "volunteer", unit: "shift", quantity: 4, localOnly: true });
    offers.push({ id: "transport-" + i, town, owner: "carrier-" + i,
      resource: "transport", unit: "trip", quantity: 4,
      destinations: TOWNS.filter(t => t !== town), localOnly: false });
  });
  return { label: "SYNTHETIC_ONLY", towns: [...TOWNS], needs, offers };
}

export function propose(fixture, { federated = true } = {}) {
  if (fixture.label !== "SYNTHETIC_ONLY") throw new Error("This specimen accepts synthetic fixtures only");
  const remaining = new Map();
  const offerIds = new Set(), needIds = new Set();
  for (const offer of fixture.offers) {
    if (offerIds.has(offer.id) || !Number.isSafeInteger(offer.quantity) || offer.quantity < 0)
      throw new Error("Invalid offer");
    offerIds.add(offer.id); remaining.set(offer.id, offer.quantity);
  }
  for (const need of fixture.needs) {
    if (needIds.has(need.id)) throw new Error("Duplicate need");
    needIds.add(need.id);
  }
  const plans = [], unmet = [];
  for (const need of fixture.needs) {
    const reserved = new Map(), allocations = [], transports = [];
    const left = id => (reserved.has(id) ? reserved.get(id) : remaining.get(id));
    const spend = (id, qty) => reserved.set(id, left(id) - qty);
    let feasible = true;
    for (const req of need.requirements) {
      if (!Number.isSafeInteger(req.quantity) || req.quantity <= 0) throw new Error("Invalid requirement");
      let missing = req.quantity;
      const candidates = fixture.offers
        .filter(o => o.resource === req.resource && o.unit === req.unit
          && (o.town === need.town || (federated && !o.localOnly)))
        .sort((a, b) => Number(a.town !== need.town) - Number(b.town !== need.town)
          || a.id.localeCompare(b.id));
      for (const offer of candidates) {
        if (missing === 0) break;
        const take = Math.min(missing, left(offer.id));
        if (take <= 0) continue;
        if (offer.town !== need.town) {
          const carrier = fixture.offers.find(t => t.resource === "transport"
            && t.town === offer.town && t.destinations?.includes(need.town)
            && t.unit === "trip" && left(t.id) >= 1);
          if (!carrier) continue; // Cross-town material without transport is HOLD.
          spend(carrier.id, 1);
          transports.push({ offerId: carrier.id, owner: carrier.owner,
            from: offer.town, to: need.town, quantity: 1, unit: "trip" });
        }
        spend(offer.id, take);
        allocations.push({ offerId: offer.id, owner: offer.owner, origin: offer.town,
          resource: req.resource, unit: req.unit, quantity: take });
        missing -= take;
      }
      if (missing !== 0) { feasible = false; break; }
    }
    if (!feasible) {
      unmet.push({ needId: need.id, town: need.town,
        reason: "No complete capacity-and-route-respecting bundle" });
      continue; // No partial plan may consume stock.
    }
    for (const [id, value] of reserved) remaining.set(id, value);
    const requiredActors = [...new Set([
      need.requester, ...allocations.map(a => a.owner), ...transports.map(t => t.owner)
    ])].sort();
    plans.push({
      id: "plan-" + need.id, needId: need.id, town: need.town, requester: need.requester,
      allocations, transports, requiredActors, disposition: "HOLD"
    });
  }
  return { label: fixture.label, mode: federated ? "FEDERATED" : "LOCAL_ONLY",
    plans, unmet, remaining: Object.fromEntries([...remaining].sort(([a], [b]) => a.localeCompare(b))) };
}

export function stable(value) {
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value && typeof value === "object") return "{"
    + Object.keys(value).sort().map(k => JSON.stringify(k) + ":" + stable(value[k])).join(",") + "}";
  return JSON.stringify(value);
}

export function replay(plans, events, hashFn) {
  if (typeof hashFn !== "function") throw new Error("Hash function required");
  const states = Object.fromEntries(plans.map(p => [p.id,
    { status: "HOLD", consents: {}, reporter: null, confirmedBy: null }]));
  let previous = "GENESIS";
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const { hash, ...body } = e;
    if (body.seq !== i + 1 || body.previous !== previous || hash !== hashFn(stable(body)))
      throw new Error("Broken journal integrity at " + (i + 1));
    const plan = plans.find(p => p.id === body.planId);
    if (!plan) throw new Error("Unknown plan");
    const state = states[body.planId];
    if (body.action === "CONSENT") {
      if (state.status !== "HOLD" || !plan.requiredActors.includes(body.actor)
        || Object.hasOwn(state.consents, body.actor)
        || !["YES", "NO"].includes(body.decision))
        throw new Error("Invalid or repeated consent");
      state.consents[body.actor] = body.decision;
      if (body.decision === "NO") state.status = "REFUSED";
      else if (plan.requiredActors.every(actor => state.consents[actor] === "YES"))
        state.status = "COMMITTED";
    } else if (body.action === "REPORT") {
      if (state.status !== "COMMITTED" || !plan.allocations.some(a => a.owner === body.actor)
        || typeof body.note !== "string" || !body.note.trim())
        throw new Error("Untrusted or premature work report");
      state.status = "REPORTED";
      state.reporter = body.actor;
    } else if (body.action === "CONFIRM") {
      if (state.status !== "REPORTED" || body.actor !== plan.requester
        || body.actor === state.reporter || body.decision !== "YES")
        throw new Error("Invalid receiver confirmation");
      state.status = "CONFIRMED";
      state.confirmedBy = body.actor;
    } else throw new Error("Unrecognized action");
    previous = hash;
  }
  return { states, head: previous, count: events.length };
}

export function journal(plans, hashFn) {
  const events = [];
  return {
    events,
    append(action, planId, actor, fields = {}) {
      const body = { seq: events.length + 1,
        previous: events.at(-1)?.hash ?? "GENESIS", action, planId, actor, ...fields };
      if (Object.keys(fields).some(k => ["seq", "previous", "action", "planId", "actor", "hash"].includes(k)))
        throw new Error("Reserved event field");
      const event = { ...body, hash: hashFn(stable(body)) };
      replay(plans, [...events, event], hashFn); // Validate before append.
      events.push(event);
      return event;
    },
    snapshot: () => replay(plans, events, hashFn)
  };
}

export function summary(local, federated, states = {}) {
  const confirmed = Object.values(states).filter(s => s.status === "CONFIRMED").length;
  return {
    syntheticNeeds: local.plans.length + local.unmet.length,
    localCompleteProposals: local.plans.length,
    federatedCompleteProposals: federated.plans.length,
    additionalProposals: federated.plans.length - local.plans.length,
    crossTownProposals: federated.plans.filter(p => p.transports.length > 0).length,
    proposedNotDelivered: federated.plans.length - confirmed,
    confirmedSyntheticDemonstrations: confirmed,
    unmetFederated: federated.unmet.map(u => u.needId)
  };
}
