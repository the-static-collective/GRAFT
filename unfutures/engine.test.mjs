import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { makeFixture, propose, stable, replay, journal, summary } from "./engine.mjs";

const digest = value => createHash("sha256").update(value).digest("hex");
const fixture = makeFixture();
const local = propose(fixture, { federated: false });
const federated = propose(fixture, { federated: true });
const remote = federated.plans.find(p => p.transports.length);

test("fixture has exactly 5 towns, 20 needs, 30 offers and is synthetic-only", () => {
  assert.equal(fixture.label, "SYNTHETIC_ONLY");
  assert.equal(fixture.towns.length, 5);
  assert.equal(fixture.needs.length, 20);
  assert.equal(fixture.offers.length, 30);
  assert.equal(new Set(fixture.needs.map(n => n.id)).size, 20);
  assert.equal(new Set(fixture.offers.map(o => o.id)).size, 30);
  assert.throws(() => propose({ ...fixture, label: "LIVE" }), /synthetic/i);
});

test("federated compositions improve coverage without displacing local plans", () => {
  assert.equal(local.plans.length, 15);
  assert.equal(federated.plans.length, 19);
  assert.equal(federated.unmet.length, 1);
  assert.equal(federated.plans.filter(p => p.transports.length).length, 4);
  const fedIds = new Set(federated.plans.map(p => p.needId));
  for (const p of local.plans) assert.ok(fedIds.has(p.needId));
  assert.deepEqual(propose(makeFixture()), federated);
});

test("no material, volunteer shift or transport trip is allocated twice", () => {
  const used = new Map();
  for (const p of federated.plans) {
    for (const a of [...p.allocations, ...p.transports]) {
      used.set(a.offerId, (used.get(a.offerId) ?? 0) + a.quantity);
    }
  }
  for (const offer of fixture.offers) {
    assert.ok((used.get(offer.id) ?? 0) <= offer.quantity, offer.id);
    assert.equal(federated.remaining[offer.id], offer.quantity - (used.get(offer.id) ?? 0));
  }
});

test("transport is a required capacity, not a pretend delivery", () => {
  assert.ok(remote.transports.length > 0);
  const withoutTransport = {
    ...fixture, offers: fixture.offers.filter(o => o.resource !== "transport")
  };
  assert.equal(propose(withoutTransport).plans.length, local.plans.length);
  for (const p of federated.plans) {
    for (const a of p.allocations.filter(x => x.origin !== p.town)) {
      assert.ok(p.transports.some(t => t.from === a.origin && t.to === p.town));
    }
  }
});

test("an infeasible bundle consumes no stock, even if its first requirement is satisfied", () => {
  const f = { label: "SYNTHETIC_ONLY", needs: [
    { id:"n0", town:"A", requester:"r0", requirements:[
      { resource:"food", unit:"lot", quantity:1 },
      { resource:"absent", unit:"lot", quantity:1 }
    ] },
    { id:"n1", town:"A", requester:"r1", requirements:[
      { resource:"food", unit:"lot", quantity:1 }
    ] }
  ], offers:[{ id:"o0", town:"A", owner:"d0", resource:"food", unit:"lot", quantity:1 }] };
  const result = propose(f, { federated:false });
  assert.deepEqual(result.plans.map(x=>x.needId), ["n1"]);
  assert.deepEqual(result.unmet.map(x=>x.needId), ["n0"]);
});

test("a proposal remains HOLD without every synthetic participant consent", () => {
  const j = journal(federated.plans, digest);
  const required = remote.requiredActors;
  assert.ok(required.includes(remote.requester));
  assert.ok(required.some(a => a.startsWith("carrier-")));
  for (const actor of required.slice(0, -1))
    j.append("CONSENT", remote.id, actor, { decision:"YES" });
  assert.equal(j.snapshot().states[remote.id].status, "HOLD");
  assert.throws(() => j.append("REPORT", remote.id, remote.allocations[0].owner,
    { note:"unverified" }), /premature/);
  j.append("CONSENT", remote.id, required.at(-1), { decision:"YES" });
  assert.equal(j.snapshot().states[remote.id].status, "COMMITTED");
  assert.throws(() => j.append("CONSENT", remote.id, required[0], { decision:"YES" }),
    /consent/);
});

test("one REFUSE is terminal; no work may be reported", () => {
  const j = journal(federated.plans, digest);
  j.append("CONSENT", remote.id, remote.requiredActors[0], { decision:"NO" });
  assert.equal(j.snapshot().states[remote.id].status, "REFUSED");
  assert.throws(() => j.append("CONSENT", remote.id, remote.requiredActors[1],
    { decision:"YES" }), /consent/);
  assert.throws(() => j.append("REPORT", remote.id, remote.allocations[0].owner,
    { note:"no" }), /premature/);
});

test("report is not receiver confirmation; independent receiver confirms", () => {
  const j = journal(federated.plans, digest);
  for (const actor of remote.requiredActors) j.append("CONSENT", remote.id, actor, { decision:"YES" });
  const provider = remote.allocations[0].owner;
  assert.throws(() => j.append("CONFIRM", remote.id, remote.requester,
    { decision:"YES" }), /confirmation/);
  assert.throws(() => j.append("REPORT", remote.id, remote.requester,
    { note:"not provider" }), /report/);
  j.append("REPORT", remote.id, provider, { note:"SYNTHETIC DEMO: reported" });
  assert.equal(j.snapshot().states[remote.id].status, "REPORTED");
  assert.throws(() => j.append("CONFIRM", remote.id, provider,
    { decision:"YES" }), /confirmation/);
  j.append("CONFIRM", remote.id, remote.requester, { decision:"YES" });
  assert.equal(j.snapshot().states[remote.id].status, "CONFIRMED");
  assert.equal(summary(local, federated, j.snapshot().states).confirmedSyntheticDemonstrations, 1);
});

test("event journal rejects altered history and forged sequence", () => {
  const j = journal(federated.plans, digest);
  j.append("CONSENT", remote.id, remote.requiredActors[0], { decision:"YES" });
  assert.match(j.events[0].hash, /^[a-f0-9]{64}$/);
  assert.equal(replay(federated.plans, j.events, digest).count, 1);
  assert.throws(() => replay(federated.plans,
    [{ ...j.events[0], decision:"NO" }], digest), /integrity/);
  assert.throws(() => replay(federated.plans,
    [{ ...j.events[0], seq:3 }], digest), /integrity/);
  assert.throws(() => j.append("CONSENT", remote.id, remote.requiredActors[0],
    { decision:"YES", seq:999 }), /Reserved/);
  assert.equal(j.events.length, 1);
});

test("canonical byte ordering does not depend on object key insertion order", () => {
  assert.equal(stable({ a:1, b:{ z:3, x:2 } }),
    stable({ b:{ x:2, z:3 }, a:1 }));
  assert.equal(summary(local, federated).additionalProposals, 4);
  assert.equal(summary(local, federated).confirmedSyntheticDemonstrations, 0);
});
